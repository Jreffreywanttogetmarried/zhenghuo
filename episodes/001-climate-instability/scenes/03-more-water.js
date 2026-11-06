// 03 · 空气装更多水：1℃ → 约 7% 水汽 → 暴雨的原料
import {
  drawTag,
  drawLabel,
  drawCounter,
} from '../../../engine/components.js';
import {
  clamp,
  easeInOutCubic,
  easeOutCubic,
  seeded,
  seededRange,
  TAU,
  roundRect,
} from '../../../engine/math.js';

const W = 1920;
const H = 1080;
const SPONGE = { x: 600, y: 470, w: 380, h: 260 };
const CLOUD = { x: 930, y: 238 };
const GAUGE = { x: 1352, y: 250, w: 38, h: 320 };

function drawPool(ctx, p, t) {
  const top = 812;
  const water = ctx.createLinearGradient(0, top, 0, H);
  water.addColorStop(0, 'rgba(20,62,86,0.9)');
  water.addColorStop(0.18, 'rgba(10,38,58,0.95)');
  water.addColorStop(1, 'rgba(2,10,18,0.98)');
  ctx.fillStyle = water;
  ctx.fillRect(0, top, W, H - top);

  // 水面
  ctx.save();
  ctx.strokeStyle = 'rgba(127,208,255,0.42)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let x = 0; x <= W; x += 12) {
    const y = top + Math.sin(x * 0.008 + t * 1.2) * 4;
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // 波纹
  for (let i = 0; i < 5; i++) {
    const cx = 180 + i * 170;
    const phase = (t * 0.35 + i * 0.23) % 1;
    ctx.globalAlpha = 0.18 * (1 - phase);
    ctx.beginPath();
    ctx.ellipse(cx, top + 22 + i * 8, 90 * phase + 20, 10 * phase + 3, 0, 0, TAU);
    ctx.stroke();
  }
  ctx.restore();

  drawLabel(ctx, {
    x: 120,
    y: top + 52,
    text: '水面蒸发',
    color: 'rgba(127,208,255,0.6)',
    font: '500 22px "Noto Sans SC", sans-serif',
    align: 'left',
  });
}

function spongePath(ctx, cx, cy, rx, ry, t) {
  ctx.beginPath();
  const steps = 72;
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * TAU;
    const wob = 1 + 0.035 * Math.sin(a * 5 + t * 0.7) + 0.018 * Math.sin(a * 9 - t * 0.5);
    const x = cx + Math.cos(a) * rx * wob;
    const y = cy + Math.sin(a) * ry * wob;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function drawSponge(ctx, p, t) {
  const grow = 0.78 + 0.26 * easeOutCubic(clamp((t - 2.8) / 4.2));
  const w = SPONGE.w * grow;
  const h = SPONGE.h * grow;
  const cx = SPONGE.x;
  const cy = SPONGE.y;
  const rx = w / 2;
  const ry = h / 2;

  ctx.save();
  const body = ctx.createLinearGradient(cx - rx, cy - ry, cx + rx, cy + ry);
  body.addColorStop(0, '#2B5E73');
  body.addColorStop(0.42, '#173B4F');
  body.addColorStop(1, '#081724');
  ctx.fillStyle = body;
  ctx.shadowColor = 'rgba(127,208,255,0.28)';
  ctx.shadowBlur = 44;
  spongePath(ctx, cx, cy, rx, ry, t);
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.strokeStyle = 'rgba(160,225,255,0.42)';
  ctx.lineWidth = 2;
  spongePath(ctx, cx, cy, rx, ry, t);
  ctx.stroke();

  // 大孔洞
  const rng = seeded(7007);
  for (let i = 0; i < 26; i++) {
    const a = seededRange(rng, 0, TAU);
    const rr = Math.sqrt(seededRange(rng, 0, 0.82));
    const px = cx + Math.cos(a) * rx * rr;
    const py = cy + Math.sin(a) * ry * rr;
    const prx = seededRange(rng, 8, 23) * grow;
    const pry = prx * seededRange(rng, 0.55, 0.9);
    ctx.globalAlpha = seededRange(rng, 0.45, 0.82);
    ctx.fillStyle = '#020A12';
    ctx.beginPath();
    ctx.ellipse(px, py, prx, pry, seededRange(rng, -0.7, 0.7), 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 0.2;
    ctx.strokeStyle = 'rgba(127,208,255,0.55)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(px, py, prx, pry, 0, 0, TAU);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // 顶部高光
  ctx.fillStyle = 'rgba(255,255,255,0.09)';
  ctx.beginPath();
  ctx.ellipse(cx - rx * 0.16, cy - ry * 0.58, rx * 0.3, ry * 0.09, -0.18, 0, TAU);
  ctx.fill();
  ctx.restore();

  drawTag(ctx, {
    x: cx - 100,
    y: cy - ry - 74,
    text: '空气 · 海绵比喻',
    color: p.accent2,
    bg: 'rgba(2,10,18,0.55)',
    border: 'rgba(127,208,255,0.28)',
    font: '600 24px "Noto Sans SC", sans-serif',
  });
}

function drawVapor(ctx, p, t) {
  const rng = seeded(3503);
  ctx.save();
  ctx.lineCap = 'round';

  // 上升的水汽丝
  for (let i = 0; i < 18; i++) {
    const baseX = seededRange(rng, 100, 720);
    const phase = seededRange(rng, 0, 1);
    const u = (t * 0.16 + phase) % 1;
    const y = 800 + (360 - 800) * u;
    const targetX = SPONGE.x + seededRange(rng, -70, 70);
    const x = baseX + (targetX - baseX) * u * 0.55 + Math.sin(u * 7 + i) * 14;
    ctx.globalAlpha = 0.1 + 0.22 * (1 - u);
    ctx.strokeStyle = p.accent2;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + 14, y - 22, x - 6, y - 44);
    ctx.stroke();
  }

  // 细小水汽点
  for (let i = 0; i < 26; i++) {
    const baseX = seededRange(rng, 90, 720);
    const phase = seededRange(rng, 0, 1);
    const u = (t * 0.2 + phase) % 1;
    const y = 800 + (350 - 800) * u;
    const x = baseX + Math.sin(u * 8 + i * 1.7) * 18;
    ctx.globalAlpha = 0.08 + 0.2 * (1 - u);
    ctx.fillStyle = p.accent2;
    ctx.beginPath();
    ctx.arc(x, y, 1.5 + (i % 3) * 0.8, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

function drawCloud(ctx, p, t) {
  const form = easeOutCubic(clamp((t - 6.0) / 2.4));
  if (form <= 0.001) return;
  const dark = clamp((t - 9.4) / 1.6);
  const scale = 0.6 + 0.4 * form;
  const cx = CLOUD.x;
  const cy = CLOUD.y;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  ctx.globalAlpha = form;

  const grad = ctx.createLinearGradient(0, -80, 0, 90);
  grad.addColorStop(0, `rgba(${Math.round(190 - 40 * dark)}, 220, 240, ${0.24 + 0.12 * dark})`);
  grad.addColorStop(0.55, `rgba(${Math.round(140 - 50 * dark)}, ${Math.round(175 - 50 * dark)}, ${Math.round(200 - 45 * dark)}, ${0.3 + 0.16 * dark})`);
  grad.addColorStop(1, `rgba(${Math.round(80 - 30 * dark)}, ${Math.round(110 - 35 * dark)}, ${Math.round(135 - 35 * dark)}, ${0.42 + 0.18 * dark})`);

  const blobs = [
    [-96, 10, 72, 44],
    [-34, -20, 86, 58],
    [46, -6, 92, 60],
    [118, 16, 66, 42],
    [10, 30, 120, 40],
  ];
  ctx.beginPath();
  for (const [bx, by, rx, ry] of blobs) {
    ctx.moveTo(bx + rx, by);
    ctx.ellipse(bx, by, rx, ry, 0, 0, TAU);
  }
  ctx.shadowColor = 'rgba(127,208,255,0.22)';
  ctx.shadowBlur = 46;
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.shadowBlur = 0;

  // 底部阴影和内部高光
  ctx.fillStyle = 'rgba(0,0,0,0.16)';
  ctx.beginPath();
  ctx.ellipse(10, 66, 150, 18, 0, 0, TAU);
  ctx.fill();

  ctx.fillStyle = 'rgba(255,255,255,0.07)';
  for (const [bx, by, rx, ry] of [[-60, -22, 52, 30], [18, -32, 58, 32], [92, -10, 40, 24]]) {
    ctx.beginPath();
    ctx.ellipse(bx, by, rx, ry, -0.1, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

function drawRain(ctx, p, t) {
  const start = 9.8;
  if (t < start) return;
  const intensity = clamp((t - start) / 1.6);
  const rng = seeded(4517);
  ctx.save();
  ctx.strokeStyle = 'rgba(160,225,255,0.68)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 70; i++) {
    const x = seededRange(rng, CLOUD.x - 170, CLOUD.x + 190);
    const phase = seededRange(rng, 0, 1);
    const speed = seededRange(rng, 260, 420);
    const len = seededRange(rng, 14, 30) * intensity;
    const y = 300 + ((t * speed + phase * 300) % 330);
    if (y > 790) continue;
    ctx.globalAlpha = 0.18 + 0.5 * intensity;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 5, y + len);
    ctx.stroke();
  }
  ctx.restore();

  drawTag(ctx, {
    x: CLOUD.x + 170,
    y: 470,
    text: '暴雨的原料',
    color: p.accent,
    bg: 'rgba(2,10,18,0.55)',
    border: 'rgba(255,193,94,0.35)',
    font: '600 24px "Noto Sans SC", sans-serif',
  });
}

function drawGauge(ctx, p, t) {
  const level = clamp((t - 3.0) / 3.4);
  const x = GAUGE.x;
  const y = GAUGE.y;
  const w = GAUGE.w;
  const h = GAUGE.h;

  ctx.save();
  // 玻璃管
  ctx.fillStyle = 'rgba(232,246,255,0.06)';
  ctx.strokeStyle = 'rgba(160,225,255,0.35)';
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, w, h, w / 2);
  ctx.fill();
  ctx.stroke();

  // 填充
  const fillH = (h - 18) * level;
  const grad = ctx.createLinearGradient(x, y + h - fillH, x + w, y + h);
  grad.addColorStop(0, '#7FD0FF');
  grad.addColorStop(1, '#FFC15E');
  ctx.fillStyle = grad;
  ctx.shadowColor = 'rgba(127,208,255,0.45)';
  ctx.shadowBlur = 18;
  roundRect(ctx, x + 6, y + h - fillH - 6, w - 12, fillH, (w - 12) / 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // 刻度
  ctx.strokeStyle = 'rgba(160,225,255,0.28)';
  ctx.lineWidth = 1.2;
  for (let i = 0; i <= 8; i++) {
    const ty = y + 18 + (h - 36) * (i / 8);
    ctx.beginPath();
    ctx.moveTo(x + w + 8, ty);
    ctx.lineTo(x + w + 8 + (i % 2 === 0 ? 14 : 8), ty);
    ctx.stroke();
  }
  ctx.restore();

  drawLabel(ctx, {
    x: x + w + 34,
    y: y - 18,
    text: '空气持水能力',
    color: p.muted,
    font: '500 24px "Noto Sans SC", sans-serif',
    align: 'left',
  });
}

export default {
  draw(ctx, t, env) {
    const p = env.palette;

    const zoom = 1.0 + 0.035 * easeInOutCubic(t / 13);
    ctx.save();
    ctx.translate(W / 2, H * 0.46);
    ctx.scale(zoom, zoom);
    ctx.translate(-W / 2, -H * 0.46);

    drawPool(ctx, p, t);
    drawVapor(ctx, p, t);
    drawSponge(ctx, p, t);
    drawCloud(ctx, p, t);
    drawRain(ctx, p, t);
    drawGauge(ctx, p, t);

    // 7% 读数
    ctx.save();
    ctx.font = '500 24px "Noto Sans SC", sans-serif';
    ctx.fillStyle = p.muted;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('每升温 1℃', 1580, 300);
    ctx.restore();

    drawCounter(ctx, {
      x: 1580,
      y: 390,
      t,
      start: 3.4,
      duration: 1.7,
      from: 0,
      to: 7,
      decimals: 0,
      suffix: '%',
      font: '900 132px "Noto Sans SC", sans-serif',
      color: p.accent,
      align: 'center',
      glow: 'rgba(255,193,94,0.42)',
    });

    ctx.save();
    ctx.font = '500 23px "Noto Sans SC", sans-serif';
    ctx.fillStyle = 'rgba(244,247,251,0.6)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('空气能多装的水汽', 1580, 468);
    ctx.restore();

    // 水汽说明
    drawLabel(ctx, {
      x: 808,
      y: 342,
      text: '水汽 = 空气里的水蒸气',
      target: { x: CLOUD.x - 40, y: CLOUD.y + 26 },
      color: p.accent2,
      font: '600 24px "Noto Sans SC", sans-serif',
      align: 'left',
      leaderColor: 'rgba(127,208,255,0.55)',
    });

    // 顶部角标
    drawTag(ctx, {
      x: 120,
      y: 92,
      text: '03 · 空气装水',
      color: p.accent2,
      bg: 'rgba(0,0,0,0.26)',
      border: 'rgba(127,208,255,0.3)',
    });

    // 1℃ → 7% 小公式
    ctx.save();
    ctx.font = '600 26px "Noto Sans SC", sans-serif';
    ctx.fillStyle = 'rgba(244,247,251,0.55)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('1℃', 1290, 610);
    ctx.fillStyle = p.accent;
    ctx.fillText('→', 1360, 610);
    ctx.fillStyle = 'rgba(244,247,251,0.75)';
    ctx.fillText('约 7% 水汽', 1400, 610);
    ctx.restore();

    // 底部来源
    ctx.save();
    ctx.font = '500 20px "Noto Sans SC", sans-serif';
    ctx.fillStyle = 'rgba(244,247,251,0.36)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('数据：NOAA / Clausius–Clapeyron 关系 · 水汽为示意', 120, 1026);
    ctx.restore();

    ctx.restore();
  },
};
