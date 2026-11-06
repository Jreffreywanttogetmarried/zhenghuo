// 07 · 回收与升华：回到老日历，准备好水、手电、伞、收音机
import {
  drawPaperCard,
  drawTag,
} from '../../../engine/components.js';
import {
  clamp,
  easeInOutCubic,
  easeOutCubic,
  easeOutBack,
  seeded,
  seededRange,
  TAU,
  roundRect,
} from '../../../engine/math.js';

const W = 1920;
const H = 1080;
const TABLE_TOP = 748;

function drawRoom(ctx, p, t) {
  const wall = ctx.createLinearGradient(0, 0, 0, H);
  wall.addColorStop(0, p.bg1);
  wall.addColorStop(0.58, p.bg0);
  wall.addColorStop(1, '#0B0705');
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, W, H);

  const warm = ctx.createRadialGradient(760, 140, 0, 760, 140, 1250);
  warm.addColorStop(0, 'rgba(255,214,150,0.2)');
  warm.addColorStop(0.5, 'rgba(216,168,78,0.08)');
  warm.addColorStop(1, 'rgba(216,168,78,0)');
  ctx.fillStyle = warm;
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  ctx.globalAlpha = 0.035;
  ctx.strokeStyle = p.paper;
  ctx.lineWidth = 2;
  for (let x = 40; x < W; x += 84) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, TABLE_TOP);
    ctx.stroke();
  }
  ctx.restore();
}

function drawTable(ctx, p, t) {
  const wood = ctx.createLinearGradient(0, TABLE_TOP, 0, H);
  wood.addColorStop(0, '#4A2C19');
  wood.addColorStop(0.2, '#3A2214');
  wood.addColorStop(1, '#190F09');
  ctx.fillStyle = wood;
  ctx.fillRect(0, TABLE_TOP, W, H - TABLE_TOP);

  ctx.save();
  ctx.strokeStyle = 'rgba(232,214,179,0.2)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, TABLE_TOP);
  ctx.lineTo(W, TABLE_TOP);
  ctx.stroke();

  const rng = seeded(110701);
  for (let i = 0; i < 30; i++) {
    const y = TABLE_TOP + seededRange(rng, 8, H - TABLE_TOP - 12);
    const x0 = seededRange(rng, -80, W * 0.6);
    const len = seededRange(rng, 180, 720);
    ctx.globalAlpha = seededRange(rng, 0.035, 0.1);
    ctx.strokeStyle = i % 4 === 0 ? p.accent : p.paper;
    ctx.lineWidth = seededRange(rng, 0.6, 1.6);
    ctx.beginPath();
    ctx.moveTo(x0, y);
    ctx.bezierCurveTo(x0 + len * 0.3, y - 6, x0 + len * 0.7, y + 6, x0 + len, y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawCalendar(ctx, p, t) {
  const x = 120;
  const y = 400;
  const w = 430;
  const h = 330;

  // 桌面上的小支架
  ctx.save();
  ctx.fillStyle = 'rgba(42,28,18,0.95)';
  ctx.fillRect(x + 186, y + h - 8, 58, 38);
  ctx.restore();

  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 16;
  drawPaperCard(ctx, {
    x, y, w, h,
    fill: p.paper,
    radius: 8,
    border: 'rgba(43,33,24,0.22)',
  });
  ctx.restore();

  // 顶部红条
  ctx.save();
  roundRect(ctx, x + 16, y + 16, w - 32, 54, 3);
  ctx.fillStyle = 'rgba(155,74,50,0.92)';
  ctx.fill();
  ctx.fillStyle = p.paper;
  ctx.font = '700 23px "Noto Sans SC", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('十一月', x + 34, y + 43);
  ctx.textAlign = 'right';
  ctx.font = '500 21px "Noto Sans SC", sans-serif';
  ctx.fillText('明天', x + w - 34, y + 43);
  ctx.restore();

  // 大日期
  ctx.save();
  ctx.fillStyle = p.ink;
  ctx.font = '900 150px "Noto Serif SC", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('7', x + 150, y + 248);

  ctx.strokeStyle = 'rgba(155,74,50,0.82)';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.ellipse(x + 150, y + 198, 82, 66, -0.04, 0, TAU);
  ctx.stroke();

  ctx.font = '500 22px "Noto Sans SC", sans-serif';
  ctx.fillStyle = 'rgba(43,33,24,0.58)';
  ctx.textAlign = 'left';
  ctx.fillText('星期六', x + 42, y + 284);
  ctx.restore();

  // 小天气图标：晴间多云
  const sx = x + 300;
  const sy = y + 156;
  ctx.save();
  ctx.strokeStyle = p.accent2;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(sx, sy, 26, 0, TAU);
  ctx.stroke();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU;
    ctx.beginPath();
    ctx.moveTo(sx + Math.cos(a) * 36, sy + Math.sin(a) * 36);
    ctx.lineTo(sx + Math.cos(a) * 48, sy + Math.sin(a) * 48);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(120,100,70,0.3)';
  for (const [bx, by, rx] of [[sx + 42, sy + 24, 30], [sx + 66, sy + 16, 24], [sx + 28, sy + 14, 22]]) {
    ctx.beginPath();
    ctx.ellipse(bx, by, rx, 18, 0, 0, TAU);
    ctx.fill();
  }
  ctx.strokeStyle = 'rgba(127,208,255,0.45)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(sx + 44, sy + 28, 34, Math.PI * 0.8, Math.PI * 1.9);
  ctx.stroke();
  ctx.restore();

  // 一行小字
  ctx.save();
  ctx.font = '500 20px "Noto Sans SC", sans-serif';
  ctx.fillStyle = 'rgba(43,33,24,0.45)';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('出门前，再看一眼', x + 42, y + 312);
  ctx.restore();
}

function drawWater(ctx, p, t) {
  const cx = 860;
  const baseY = 744;
  ctx.save();
  // 杯垫
  ctx.fillStyle = 'rgba(80,52,32,0.8)';
  ctx.beginPath();
  ctx.ellipse(cx, baseY + 8, 74, 16, 0, 0, TAU);
  ctx.fill();

  // 杯身
  const glass = ctx.createLinearGradient(cx - 52, baseY - 120, cx + 52, baseY);
  glass.addColorStop(0, 'rgba(220,245,255,0.3)');
  glass.addColorStop(1, 'rgba(120,170,190,0.16)');
  ctx.fillStyle = glass;
  ctx.strokeStyle = 'rgba(200,240,255,0.55)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 46, baseY - 128);
  ctx.lineTo(cx + 46, baseY - 128);
  ctx.lineTo(cx + 38, baseY);
  ctx.lineTo(cx - 38, baseY);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 水
  const water = ctx.createLinearGradient(cx, baseY - 78, cx, baseY);
  water.addColorStop(0, 'rgba(127,208,255,0.5)');
  water.addColorStop(1, 'rgba(60,130,170,0.55)');
  ctx.fillStyle = water;
  ctx.beginPath();
  ctx.moveTo(cx - 42, baseY - 86);
  ctx.lineTo(cx + 42, baseY - 86);
  ctx.lineTo(cx + 38, baseY - 2);
  ctx.lineTo(cx - 38, baseY - 2);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = 'rgba(220,250,255,0.65)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 42, baseY - 86);
  ctx.quadraticCurveTo(cx - 10, baseY - 90 + Math.sin(t * 1.5) * 2, cx + 42, baseY - 86);
  ctx.stroke();

  // 高光
  ctx.fillStyle = 'rgba(255,255,255,0.28)';
  roundRect(ctx, cx - 34, baseY - 116, 8, 96, 4);
  ctx.fill();
  ctx.restore();
}

function drawFlashlight(ctx, p, t) {
  const x = 1010;
  const y = 704;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.18);

  // 筒身
  const body = ctx.createLinearGradient(0, -26, 0, 26);
  body.addColorStop(0, '#6A6258');
  body.addColorStop(0.5, '#2A241E');
  body.addColorStop(1, '#15110D');
  ctx.fillStyle = body;
  roundRect(ctx, -70, -24, 150, 48, 14);
  ctx.fill();
  ctx.strokeStyle = 'rgba(232,214,179,0.28)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // 灯头
  ctx.fillStyle = 'rgba(216,168,78,0.85)';
  roundRect(ctx, 66, -30, 28, 60, 10);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,246,220,0.9)';
  ctx.beginPath();
  ctx.ellipse(94, 0, 10, 28, 0, 0, TAU);
  ctx.fill();

  // 防滑纹
  ctx.strokeStyle = 'rgba(232,214,179,0.22)';
  ctx.lineWidth = 2;
  for (let i = -40; i <= 30; i += 18) {
    ctx.beginPath();
    ctx.moveTo(i, -20);
    ctx.lineTo(i, 20);
    ctx.stroke();
  }
  ctx.restore();
}

function drawUmbrella(ctx, p, t) {
  const x = 1262;
  const y = 730;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(0.12);

  // 伞身
  const cloth = ctx.createLinearGradient(0, -270, 0, 0);
  cloth.addColorStop(0, 'rgba(155,74,50,0.95)');
  cloth.addColorStop(1, 'rgba(70,34,26,0.95)');
  ctx.fillStyle = cloth;
  ctx.beginPath();
  ctx.moveTo(-30, 0);
  ctx.quadraticCurveTo(-18, -250, 0, -290);
  ctx.quadraticCurveTo(18, -250, 30, 0);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(232,214,179,0.3)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // 绑带
  ctx.fillStyle = 'rgba(216,168,78,0.9)';
  roundRect(ctx, -30, -120, 60, 12, 4);
  ctx.fill();

  // 伞柄
  ctx.strokeStyle = 'rgba(216,168,78,0.9)';
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, -290);
  ctx.lineTo(0, -330);
  ctx.quadraticCurveTo(0, -352, 22, -352);
  ctx.stroke();
  ctx.restore();
}

function drawRadio(ctx, p, t) {
  const x = 1450;
  const y = 620;
  ctx.save();
  // 机身
  ctx.fillStyle = 'rgba(34,26,20,0.96)';
  ctx.strokeStyle = 'rgba(232,214,179,0.28)';
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, 180, 116, 12);
  ctx.fill();
  ctx.stroke();

  // 喇叭格
  ctx.strokeStyle = 'rgba(232,214,179,0.28)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(x + 18, y + 22 + i * 14);
    ctx.lineTo(x + 98, y + 22 + i * 14);
    ctx.stroke();
  }

  // 刻度
  ctx.fillStyle = 'rgba(216,168,78,0.85)';
  roundRect(ctx, x + 112, y + 22, 50, 42, 4);
  ctx.fill();
  ctx.strokeStyle = 'rgba(43,33,24,0.75)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x + 122, y + 54);
  ctx.lineTo(x + 154, y + 34);
  ctx.stroke();

  // 旋钮
  ctx.fillStyle = 'rgba(216,168,78,0.85)';
  ctx.beginPath();
  ctx.arc(x + 128, y + 90, 10, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + 156, y + 90, 8, 0, TAU);
  ctx.fill();

  // 天线
  ctx.strokeStyle = 'rgba(200,200,190,0.7)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + 34, y);
  ctx.lineTo(x + 18, y - 58);
  ctx.stroke();

  // 小绿灯
  ctx.fillStyle = 'rgba(127,208,255,0.85)';
  ctx.beginPath();
  ctx.arc(x + 166, y + 18, 3.5, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function drawClock(ctx, p, t) {
  const cx = 1560;
  const cy = 206;
  const r = 74;

  ctx.save();
  ctx.fillStyle = p.paper;
  ctx.shadowColor = 'rgba(0,0,0,0.4)';
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 8;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, TAU);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(43,33,24,0.25)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, TAU);
  ctx.stroke();

  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU - Math.PI / 2;
    const inner = i % 3 === 0 ? r - 20 : r - 12;
    ctx.strokeStyle = i % 3 === 0 ? 'rgba(43,33,24,0.7)' : 'rgba(43,33,24,0.32)';
    ctx.lineWidth = i % 3 === 0 ? 3 : 1.5;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner);
    ctx.lineTo(cx + Math.cos(a) * (r - 6), cy + Math.sin(a) * (r - 6));
    ctx.stroke();
  }

  // 稳定的 6:30 左右
  const hourA = (6.5 / 12) * TAU - Math.PI / 2;
  const minA = (30 / 60) * TAU - Math.PI / 2;
  ctx.strokeStyle = p.ink;
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(hourA) * r * 0.48, cy + Math.sin(hourA) * r * 0.48);
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(minA) * r * 0.74, cy + Math.sin(minA) * r * 0.74);
  ctx.stroke();
  ctx.fillStyle = p.ink;
  ctx.beginPath();
  ctx.arc(cx, cy, 4, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function drawCheck(ctx, x, y, on) {
  if (on <= 0.001) return;
  const pop = easeOutBack(on);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(pop, pop);
  ctx.strokeStyle = 'rgba(216,168,78,0.95)';
  ctx.fillStyle = 'rgba(18,14,10,0.72)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(0, 0, 17, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = '#FFE9B0';
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-7, 0);
  ctx.lineTo(-1, 7);
  ctx.lineTo(9, -7);
  ctx.stroke();
  ctx.restore();
}

export default {
  draw(ctx, t, env) {
    const p = env.palette;

    // 缓慢拉远
    const zoom = 1.06 - 0.06 * easeInOutCubic(clamp(t / 6.6));
    ctx.save();
    ctx.translate(W / 2, H * 0.54);
    ctx.scale(zoom, zoom);
    ctx.translate(-W / 2, -H * 0.54);

    drawRoom(ctx, p, t);
    drawTable(ctx, p, t);
    drawClock(ctx, p, t);
    drawCalendar(ctx, p, t);
    drawWater(ctx, p, t);
    drawFlashlight(ctx, p, t);
    drawUmbrella(ctx, p, t);
    drawRadio(ctx, p, t);

    // 打勾：水、手电、伞、收音机
    drawCheck(ctx, 980, 620, clamp((t - 3.6) / 0.45));
    drawCheck(ctx, 1180, 660, clamp((t - 4.2) / 0.45));
    drawCheck(ctx, 1360, 480, clamp((t - 4.8) / 0.45));
    drawCheck(ctx, 1650, 650, clamp((t - 5.4) / 0.45));

    ctx.restore();

    // 结束前的暖色压暗，不是黑场
    const dim = easeOutCubic(clamp((t - 6.6) / 0.9));
    if (dim > 0.001) {
      const over = ctx.createRadialGradient(W / 2, 420, 120, W / 2, 420, 1100);
      over.addColorStop(0, `rgba(10,7,5,${0.74 * dim})`);
      over.addColorStop(0.6, `rgba(10,7,5,${0.86 * dim})`);
      over.addColorStop(1, `rgba(6,4,3,${0.94 * dim})`);
      ctx.fillStyle = over;
      ctx.fillRect(0, 0, W, H);
    }

    // 金句背后的呼吸光，避免最后几秒完全静止
    const pulse = 0.5 + 0.5 * Math.sin(t * 1.35);
    const halo = ctx.createRadialGradient(W / 2, 430, 0, W / 2, 430, 760);
    halo.addColorStop(0, `rgba(255,200,120,${0.035 + 0.045 * pulse * dim})`);
    halo.addColorStop(1, 'rgba(255,200,120,0)');
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, W, H);

    // 顶部角标
    drawTag(ctx, {
      x: 120,
      y: 92,
      text: '07 · 准备',
      color: p.accent,
      bg: 'rgba(0,0,0,0.26)',
      border: 'rgba(216,168,78,0.32)',
    });

    // 片尾来源
    ctx.save();
    ctx.globalAlpha = 0.55 + 0.3 * dim;
    ctx.font = '500 21px "Noto Sans SC", sans-serif';
    ctx.fillStyle = 'rgba(242,231,211,0.5)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('数据：WMO 2025 / 中国气象局 2026 · 画面为代码绘制', W / 2, 1004);
    ctx.restore();
  },
};
