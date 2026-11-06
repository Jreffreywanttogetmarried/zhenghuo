// 3D 场景测试：Three.js 渲染到离屏 WebGL canvas，再叠到引擎的 2D canvas 上。
// 所有运动由 t 决定；没有随机数、没有计时器。
import * as THREE from '../../../engine/vendor/three/three.module.js';
import {
  drawTag,
  drawInfoBar,
  drawRing,
  drawDot,
} from '../../../engine/components.js';
import { clamp, easeInOutCubic, TAU } from '../../../engine/math.js';

let renderer = null;
let scene = null;
let camera = null;
let world = null;
let pulse = null;
let curve = null;
let failed = false;
let initialized = false;

function makeGlowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const g = canvas.getContext('2d');
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.2, 'rgba(255,243,196,0.95)');
  grad.addColorStop(0.55, 'rgba(255,193,94,0.45)');
  grad.addColorStop(1, 'rgba(255,193,94,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function latLonToVec3(lat, lon, r) {
  const phi = THREE.MathUtils.degToRad(90 - lat);
  const theta = THREE.MathUtils.degToRad(lon + 180);
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  );
}

function greatArc(a, b, segments = 96) {
  const v0 = a.clone().normalize();
  const v1 = b.clone().normalize();
  const points = [];
  for (let i = 0; i <= segments; i++) {
    const u = i / segments;
    const v = new THREE.Vector3().copy(v0).lerp(v1, u).normalize();
    const lift = 1 + 0.22 * Math.sin(Math.PI * u);
    points.push(v.multiplyScalar(1.62 * lift));
  }
  return points;
}

function init3d(env) {
  const glow = makeGlowTexture();
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(1);
  renderer.setSize(env.width, env.height, false);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(36, env.width / env.height, 0.1, 100);

  scene.add(new THREE.AmbientLight(0x335577, 1.1));
  const key = new THREE.DirectionalLight(0xffe0b0, 2.6);
  key.position.set(4, 3, 5);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x7fd0ff, 1.8);
  rim.position.set(-4, -1, -5);
  scene.add(rim);

  world = new THREE.Group();
  scene.add(world);

  const globe = new THREE.Mesh(
    new THREE.SphereGeometry(1.6, 64, 48),
    new THREE.MeshPhysicalMaterial({
      color: 0x0a2238,
      roughness: 0.52,
      metalness: 0.14,
      clearcoat: 0.7,
      clearcoatRoughness: 0.25,
    }),
  );
  world.add(globe);

  const wire = new THREE.Mesh(
    new THREE.SphereGeometry(1.605, 32, 24),
    new THREE.MeshBasicMaterial({
      color: 0x7fd0ff,
      wireframe: true,
      transparent: true,
      opacity: 0.07,
      depthWrite: false,
    }),
  );
  world.add(wire);

  // 经线 / 纬线
  const gridMaterial = new THREE.LineBasicMaterial({
    color: 0x7fd0ff,
    transparent: true,
    opacity: 0.1,
  });
  for (let lat = -60; lat <= 60; lat += 30) {
    const pts = [];
    for (let lon = -180; lon <= 180; lon += 5) pts.push(latLonToVec3(lat, lon, 1.61));
    world.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), gridMaterial));
  }
  for (let lon = 0; lon < 180; lon += 30) {
    const pts = [];
    for (let lat = -90; lat <= 90; lat += 5) pts.push(latLonToVec3(lat, lon, 1.61));
    world.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), gridMaterial));
  }

  // 表面光点（黄金角分布，固定）
  const positions = [];
  const count = 1100;
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const radius = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = i * 2.399963229728653;
    positions.push(
      Math.cos(theta) * radius * 1.615,
      y * 1.615,
      Math.sin(theta) * radius * 1.615,
    );
  }
  const dotGeo = new THREE.BufferGeometry();
  dotGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  world.add(new THREE.Points(dotGeo, new THREE.PointsMaterial({
    color: 0x7fd0ff,
    size: 0.018,
    transparent: true,
    opacity: 0.72,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  })));

  // 上海 → 洛杉矶 光弧
  const shanghai = latLonToVec3(31.2, 121.5, 1.6);
  const losAngeles = latLonToVec3(34.0, -118.2, 1.6);
  const arcPoints = greatArc(shanghai, losAngeles, 120);
  curve = new THREE.CatmullRomCurve3(arcPoints);

  const tube = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 96, 0.012, 8, false),
    new THREE.MeshBasicMaterial({
      color: 0xffc15e,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  world.add(tube);

  world.add(new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(arcPoints),
    new THREE.LineBasicMaterial({ color: 0xffe3a0, transparent: true, opacity: 0.9 }),
  ));

  for (const p of [shanghai, losAngeles]) {
    const dot = new THREE.Mesh(
      new THREE.SphereGeometry(0.028, 16, 12),
      new THREE.MeshBasicMaterial({ color: 0xfff0c0 }),
    );
    dot.position.copy(p);
    world.add(dot);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glow,
      color: 0xffc15e,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }));
    halo.position.copy(p);
    halo.scale.set(0.28, 0.28, 1);
    world.add(halo);
  }

  pulse = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glow,
    color: 0xfff0c0,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }));
  pulse.scale.set(0.36, 0.36, 1);
  world.add(pulse);

  initialized = true;
}

function update3d(t, env) {
  const angle = -0.8 + t * 0.13;
  camera.position.set(
    Math.sin(angle) * 4.35,
    1.05 + 0.2 * Math.sin(t * 0.25),
    Math.cos(angle) * 4.35,
  );
  camera.lookAt(0, 0, 0);
  world.rotation.y = 0.18 + t * 0.04;

  if (pulse && curve) {
    const u = (t * 0.28) % 1;
    pulse.position.copy(curve.getPointAt(u));
    pulse.material.opacity = 0.7 + 0.3 * Math.sin(t * 6);
    const s = 0.32 + 0.06 * Math.sin(t * 6);
    pulse.scale.set(s, s, 1);
  }
}

function drawFallback(ctx, t, env) {
  const { width, height, palette } = env;
  const cx = width / 2;
  const cy = height * 0.42;
  const r = 240;
  drawRing(ctx, { x: cx, y: cy, r, color: palette.accent2, width: 2, alpha: 0.5 });
  drawRing(ctx, { x: cx, y: cy, r: r * 0.72, color: palette.accent, width: 1.5, alpha: 0.3, dash: [6, 12] });
  for (let i = 0; i < 40; i++) {
    const a = (i / 40) * TAU + t * 0.1;
    drawDot(ctx, {
      x: cx + Math.cos(a) * r,
      y: cy + Math.sin(a) * r * 0.55,
      r: 2.5,
      color: palette.accent2,
      glow: 8,
    });
  }
  ctx.save();
  ctx.font = '500 26px "Noto Sans SC", sans-serif';
  ctx.fillStyle = palette.muted;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('WebGL 不可用，已回退 2D 预览', cx, cy + r + 60);
  ctx.restore();
}

export default {
  draw(ctx, t, env) {
    if (!initialized && !failed) {
      try {
        init3d(env);
      } catch (err) {
        failed = true;
        console.warn('Three.js 初始化失败，回退 2D：', err);
      }
    }

    if (failed) {
      drawFallback(ctx, t, env);
    } else {
      try {
        update3d(t, env);
        renderer.render(scene, camera);
        ctx.drawImage(renderer.domElement, 0, 0, env.width, env.height);
      } catch (err) {
        failed = true;
        console.warn('Three.js 渲染失败，回退 2D：', err);
        drawFallback(ctx, t, env);
      }
    }

    drawTag(ctx, {
      x: 120,
      y: 92,
      text: '3D · Three.js 测试',
      color: env.palette.accent,
      bg: 'rgba(0,0,0,0.26)',
      border: 'rgba(255,193,94,0.3)',
    });
    drawInfoBar(ctx, env, {
      left: 'Three.js r187 · WebGL',
      right: 'renderAt(t) 驱动',
      progress: easeInOutCubic(clamp(t / 8)),
    });
  },
};
