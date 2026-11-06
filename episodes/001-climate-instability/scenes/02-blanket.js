// 02 · 地球的被子：温室气体、1.4℃、中国 0.31℃/10 年
// 画面只由 t 决定；地球与大陆是示意图，不是精确地图。
import {
  drawTag,
  drawLabel,
  drawCounter,
  drawDot,
  drawRing,
  drawGlowLine,
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
const CX = 700;
const CY = 420;
const R = 260;

function quadPoint(a, b, c, u) {
  const k = 1 - u;
  return {
    x: k * k * a.x + 2 * k * u * b.x + u * u * c.x,
    y: k * k * a.y + 2 * k * u * b.y + u * u * c.y,
  };
}

function drawStarHaze(ctx, p, t) {
  const rng = seeded(202611);
  ctx.save();
  for (let i = 0; i < 90; i++) {
    const x = seededRange(rng, 0, W);
    const y = seededRange(rng, 0, H * 0.9);
    const r = seededRange(rng, 0.6, 1.8);
    const phase = seededRange(rng, 0, TAU);
    ctx.globalAlpha = 0.08 + 0.16 * (0.5 + 0.5 * Math.sin(t * 0.6 + phase));
    ctx.fillStyle = i % 7 === 0 ? p.accent : '#C9E6FF';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
  }
  ctx.restore();

  const nebula = ctx.createRadialGradient(1480, 240, 0, 1480, 240, 700);
  nebula.addColorStop(0, 'rgba(127,208,255,0.08)');
  nebula.addColorStop(1, 'rgba(127,208,255,0)');
  ctx.fillStyle = nebula;
  ctx.fillRect(0, 0, W, H);
}

function drawSun(ctx, p, t) {
  const x = 150;
  const y = 250;
  const pulse = 1 + 0.02 * Math.sin(t * 1.8);
  const glow = ctx.createRadialGradient(x, y, 0, x, y, 150 * pulse);
  glow.addColorStop(0, 'rgba(255,248,220,1)');
  glow.addColorStop(0.2, 'rgba(255,220,150,0.92)');
  glow.addColorStop(0.55, 'rgba(255,193,94,0.35)');
  glow.addColorStop(1, 'rgba(255,193,94,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, 150 * pulse, 0, TAU);
  ctx.fill();

  ctx.save();
  ctx.fillStyle = '#FFF0C8';
  ctx.shadowColor = p.accent;
  ctx.shadowBlur = 40;
  ctx.beginPath();
  ctx.arc(x, y, 42, 0, TAU);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = p.accent;
  ctx.lineWidth = 2;
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * TAU + t * 0.04;
    const r0 = 58 + 4 * Math.sin(t * 1.2 + i);
    const r1 = 74 + 10 * (0.5 + 0.5 * Math.sin(t * 0.9 + i * 2.1));
    ctx.globalAlpha = 0.18 + 0.18 * (0.5 + 0.5 * Math.sin(t * 1.4 + i));
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(a) * r0, y + Math.sin(a) * r0);
    ctx.lineTo(x + Math.cos(a) * r1, y + Math.sin(a) * r1);
    ctx.stroke();
  }
  ctx.restore();

  drawLabel(ctx, {
    x, y: y + 102,
    text: '太阳',
    color: p.muted,
    font: '500 24px "Noto Sans SC", sans-serif',
    align: 'center',
  });
}

function drawGlobe(ctx, p, t) {
  const pulse = 1 + 0.012 * Math.sin(t * 1.1);
  const r = R * pulse;

  // 大气辉光
  const atmos = ctx.createRadialGradient(CX, CY, r * 0.8, CX, CY, r * 1.45);
  atmos.addColorStop(0, 'rgba(127,208,255,0.18)');
  atmos.addColorStop(0.5, 'rgba(127,208,255,0.07)');
  atmos.addColorStop(1, 'rgba(127,208,255,0)');
  ctx.fillStyle = atmos;
  ctx.beginPath();
  ctx.arc(CX, CY, r * 1.45, 0, TAU);
  ctx.fill();

  // 球体
  const sphere = ctx.createRadialGradient(CX - r * 0.32, CY - r * 0.36, r * 0.08, CX, CY, r);
  sphere.addColorStop(0, '#2C6E96');
  sphere.addColorStop(0.42, '#123C5C');
  sphere.addColorStop(0.78, '#082238');
  sphere.addColorStop(1, '#03101C');
  ctx.fillStyle = sphere;
  ctx.beginPath();
  ctx.arc(CX, CY, r, 0, TAU);
  ctx.fill();

  // 大陆示意色块 + 经纬网，全部裁在球内
  ctx.save();
  ctx.beginPath();
  ctx.arc(CX, CY, r - 1, 0, TAU);
  ctx.clip();

  const rng = seeded(1405);
  const drift = Math.sin(t * 0.05) * 18;
  for (let i = 0; i < 7; i++) {
    const bx = CX + seededRange(rng, -r * 0.72, r * 0.72) + drift;
    const by = CY + seededRange(rng, -r * 0.62, r * 0.62);
    const rx = seededRange(rng, r * 0.12, r * 0.3);
    const ry = seededRange(rng, r * 0.08, r * 0.2);
    ctx.globalAlpha = seededRange(rng, 0.1, 0.2);
    ctx.fillStyle = i % 3 === 0 ? '#6FAE9A' : '#4F8C83';
    ctx.beginPath();
    ctx.ellipse(bx, by, rx, ry, seededRange(rng, -0.8, 0.8), 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // 纬线
  ctx.strokeStyle = 'rgba(127,208,255,0.16)';
  ctx.lineWidth = 1;
  for (let lat = -60; lat <= 60; lat += 30) {
    const ry = Math.cos((lat * Math.PI) / 180) * r * 0.28;
    const rx = Math.cos((lat * Math.PI) / 180) * r;
    const y = CY - Math.sin((lat * Math.PI) / 180) * r;
    ctx.beginPath();
    ctx.ellipse(CX, y, rx, ry, 0, 0, TAU);
    ctx.stroke();
  }

  // 经线
  for (let lon = -75; lon <= 75; lon += 25) {
    const rx = Math.abs(Math.sin((lon * Math.PI) / 180)) * r;
    ctx.beginPath();
    ctx.ellipse(CX, CY, rx, r, 0, 0, TAU);
    ctx.stroke();
  }

  // 城市灯光
  const lights = seeded(2025);
  for (let i = 0; i < 46; i++) {
    const a = seededRange(lights, 0, TAU);
    const rr = Math.sqrt(seededRange(lights, 0, 0.92)) * r;
    const x = CX + Math.cos(a) * rr + drift;
    const y = CY + Math.sin(a) * rr * 0.92;
    if ((x - CX) ** 2 + (y - CY) ** 2 > r * r * 0.94) continue;
    ctx.globalAlpha = 0.35 + 0.3 * (0.5 + 0.5 * Math.sin(t * 1.7 + i));
    ctx.fillStyle = p.accent;
    ctx.beginPath();
    ctx.arc(x, y, 1.4 + (i % 3) * 0.5, 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  // 轮廓光
  ctx.save();
  ctx.strokeStyle = 'rgba(160,225,255,0.85)';
  ctx.lineWidth = 2;
  ctx.shadowColor = 'rgba(127,208,255,0.8)';
  ctx.shadowBlur = 22;
  ctx.beginPath();
  ctx.arc(CX, CY, r - 1, Math.PI * 0.86, Math.PI * 1.62);
  ctx.stroke();
  ctx.restore();

  // 中国示意点
  const china = { x: CX + r * 0.5, y: CY - r * 0.2 };
  const chinaPulse = 0.5 + 0.5 * Math.sin(t * 2.2);
  drawRing(ctx, {
    x: china.x, y: china.y, r: 12 + chinaPulse * 8,
    color: p.accent, width: 1.4, alpha: 0.55,
  });
  drawDot(ctx, { x: china.x, y: china.y, r: 4.2, color: p.accent, glow: 18 });
  drawLabel(ctx, {
    x: china.x + 58, y: china.y - 16,
    text: '中国（示意）',
    target: china,
    color: p.accent,
    font: '600 24px "Noto Sans SC", sans-serif',
    align: 'left',
    leaderColor: p.accent,
  });
}

function drawBlanket(ctx, p, t) {
  const alpha = 0.16 + 0.14 * easeOutCubic(clamp((t - 3.2) / 2.4));
  const r = R + 38;

  ctx.save();
  const layer = ctx.createRadialGradient(CX, CY, R * 0.92, CX, CY, r + 66);
  layer.addColorStop(0, 'rgba(255,193,94,0)');
  layer.addColorStop(0.55, `rgba(255,193,94,${alpha * 0.55})`);
  layer.addColorStop(0.82, `rgba(255,193,94,${alpha})`);
  layer.addColorStop(1, 'rgba(255,193,94,0)');
  ctx.fillStyle = layer;
  ctx.beginPath();
  ctx.arc(CX, CY, r + 66, 0, TAU);
  ctx.fill();

  // 波动边缘
  ctx.strokeStyle = `rgba(255,214,150,${0.28 + alpha * 0.5})`;
  ctx.lineWidth = 1.6;
  for (let k = 0; k < 3; k++) {
    ctx.beginPath();
    for (let i = 0; i <= 120; i++) {
      const a = (i / 120) * TAU;
      const wob = 4 * Math.sin(a * 7 + t * (0.7 + k * 0.2) + k * 1.7);
      const rx = r + 12 + k * 16 + wob;
      const x = CX + Math.cos(a) * rx;
      const y = CY + Math.sin(a) * rx * 0.98;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
  }
  ctx.restore();

  drawLabel(ctx, {
    x: CX + R + 96,
    y: CY - R - 22,
    text: '温室气体（示意）',
    target: { x: CX + R * 0.82, y: CY - R * 0.62 },
    color: p.accent,
    font: '600 26px "Noto Sans SC", sans-serif',
    align: 'left',
    leaderColor: 'rgba(255,193,94,0.65)',
  });
}

function drawHeatFlow(ctx, p, t) {
  const rng = seeded(777);
  const phase = (t * 0.22) % 1;

  // 进来的热：从太阳方向射向地球
  for (let i = 0; i < 5; i++) {
    const start = {
      x: seededRange(rng, 190, 300),
      y: seededRange(rng, 160, 520),
    };
    const end = {
      x: CX - R * seededRange(rng, 0.55, 0.9),
      y: CY + seededRange(rng, -R * 0.55, R * 0.55),
    };
    const mid = {
      x: (start.x + end.x) / 2 + seededRange(rng, -40, 40),
      y: (start.y + end.y) / 2 + seededRange(rng, -60, 60),
    };
    const u = (phase + i * 0.19) % 1;
    const head = quadPoint(start, mid, end, easeOutCubic(u));
    const tail = quadPoint(start, mid, end, easeOutCubic(Math.max(0, u - 0.12)));

    ctx.save();
    ctx.strokeStyle = 'rgba(255,193,94,0.45)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let k = 0; k <= 18; k++) {
      const q = quadPoint(start, mid, end, (k / 18) * u);
      if (k === 0) ctx.moveTo(q.x, q.y);
      else ctx.lineTo(q.x, q.y);
    }
    ctx.stroke();
    ctx.restore();

    drawGlowLine(ctx, {
      points: [tail, head],
      color: p.accent,
      width: 3,
      blur: 14,
      alpha: 0.8,
    });
    drawDot(ctx, { x: head.x, y: head.y, r: 3.6, color: '#FFF3C4', glow: 18 });
  }

  // 出去的热：一部分被“被子”挡回来
  for (let i = 0; i < 4; i++) {
    const start = {
      x: CX + seededRange(rng, -R * 0.4, R * 0.4),
      y: CY + seededRange(rng, -R * 0.5, R * 0.2),
    };
    const bounce = i % 2 === 0;
    const end = bounce
      ? {
          x: CX + seededRange(rng, -R * 0.2, R * 0.9),
          y: CY - R - seededRange(rng, 50, 150),
        }
      : {
          x: CX + seededRange(rng, 80, 260),
          y: CY - R - seededRange(rng, 180, 260),
        };
    const mid = {
      x: start.x + (bounce ? 70 : 30),
      y: start.y - (bounce ? 80 : 160),
    };
    const u = (phase + i * 0.23 + 0.35) % 1;
    const head = quadPoint(start, mid, end, easeOutCubic(u));
    const tail = quadPoint(start, mid, end, easeOutCubic(Math.max(0, u - 0.1)));
    const color = bounce ? p.accent2 : p.accent;

    drawGlowLine(ctx, {
      points: [tail, head],
      color,
      width: 2.4,
      blur: 12,
      alpha: bounce ? 0.55 : 0.4,
    });
    drawDot(ctx, { x: head.x, y: head.y, r: 2.8, color, glow: 14 });
  }
}

function drawReadout(ctx, p, t) {
  // 右侧数据卡
  const x = 1290;
  const y = 170;
  const w = 500;
  const h = 520;
  ctx.save();
  const card = ctx.createLinearGradient(x, y, x + w, y + h);
  card.addColorStop(0, 'rgba(11,27,42,0.82)');
  card.addColorStop(1, 'rgba(4,12,22,0.62)');
  ctx.fillStyle = card;
  ctx.strokeStyle = 'rgba(127,208,255,0.16)';
  ctx.lineWidth = 1.5;
  roundRect(ctx, x, y, w, h, 18);
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255,193,94,0.18)';
  ctx.beginPath();
  ctx.moveTo(x + 36, y + 268);
  ctx.lineTo(x + w - 36, y + 268);
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.font = '500 24px "Noto Sans SC", sans-serif';
  ctx.fillStyle = p.muted;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('2025 · 全球平均', x + 40, y + 54);
  ctx.fillStyle = p.accent;
  ctx.font = '600 22px "Noto Sans SC", sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('比工业化前', x + w - 40, y + 54);
  ctx.restore();

  drawCounter(ctx, {
    x: x + w / 2,
    y: y + 150,
    t,
    start: 5.8,
    duration: 1.2,
    from: 0,
    to: 1.4,
    decimals: 1,
    suffix: '℃',
    font: '900 132px "Noto Sans SC", sans-serif',
    color: p.accent,
    align: 'center',
    glow: 'rgba(255,193,94,0.4)',
  });

  ctx.save();
  ctx.font = '500 24px "Noto Sans SC", sans-serif';
  ctx.fillStyle = 'rgba(244,247,251,0.6)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('这是整个地球的平均，不是每个地方', x + w / 2, y + 240);
  ctx.fillStyle = p.muted;
  ctx.fillText('中国 · 每 10 年', x + 40, y + 312);
  ctx.restore();

  drawCounter(ctx, {
    x: x + w / 2,
    y: y + 404,
    t,
    start: 15.7,
    duration: 1.5,
    from: 0,
    to: 0.31,
    decimals: 2,
    suffix: '℃',
    font: '900 96px "Noto Sans SC", sans-serif',
    color: p.accent2,
    align: 'center',
    glow: 'rgba(127,208,255,0.35)',
  });

  ctx.save();
  ctx.font = '500 23px "Noto Sans SC", sans-serif';
  ctx.fillStyle = 'rgba(244,247,251,0.58)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('升温速度高于全球平均', x + w / 2, y + 470);
  ctx.restore();
}

export default {
  draw(ctx, t, env) {
    const p = env.palette;

    drawStarHaze(ctx, p, t);

    const zoom = 1.0 + 0.045 * easeInOutCubic(t / 20);
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-W / 2, -H / 2);

    drawSun(ctx, p, t);
    drawGlobe(ctx, p, t);
    drawBlanket(ctx, p, t);
    drawHeatFlow(ctx, p, t);
    drawReadout(ctx, p, t);

    // 示意图标注
    ctx.save();
    ctx.font = '500 21px "Noto Sans SC", sans-serif';
    ctx.fillStyle = 'rgba(244,247,251,0.4)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('地球与大陆为示意图 · 数据：WMO 2025 / 中国气象局 2026', 120, 1016);
    ctx.restore();

    ctx.restore();

    drawTag(ctx, {
      x: 120,
      y: 92,
      text: '02 · 地球的被子',
      color: p.accent,
      bg: 'rgba(0,0,0,0.26)',
      border: 'rgba(255,193,94,0.3)',
    });
  },
};
