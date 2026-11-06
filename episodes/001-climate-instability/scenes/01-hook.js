// 01 · 钩子：家里的老日历，天气越来越没准
// 画面只由 t 决定；不读真实时间、不用随机数。
// 本场景用 history 暖色（episode.json 里单独覆盖 palette），形成“家里 → 地球”的对照。
import { drawPaperCard } from '../../../engine/components.js';
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
const TABLE_TOP = 762;

const FLIPS = [1.6, 4.2, 6.8, 9.4, 12.0];
const MONTHS = ['十一月', '十二月', '三月', '六月', '?'];

/* ------------------------------------------------------------------ */
/* 房间底色 / 桌面                                                      */
/* ------------------------------------------------------------------ */

function drawRoom(ctx, p, t) {
  const wall = ctx.createLinearGradient(0, 0, 0, H);
  wall.addColorStop(0, p.bg1);
  wall.addColorStop(0.62, p.bg0);
  wall.addColorStop(1, '#0C0805');
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, W, H);

  // 左上暖光，像午后从窗缝里照进来
  const warm = ctx.createRadialGradient(380, 90, 0, 380, 90, 1350);
  warm.addColorStop(0, 'rgba(255, 214, 150, 0.18)');
  warm.addColorStop(0.45, 'rgba(216, 168, 78, 0.07)');
  warm.addColorStop(1, 'rgba(216, 168, 78, 0)');
  ctx.fillStyle = warm;
  ctx.fillRect(0, 0, W, H);

  // 很淡的墙纸竖纹
  ctx.save();
  ctx.globalAlpha = 0.035;
  ctx.strokeStyle = p.paper;
  ctx.lineWidth = 2;
  for (let x = 40; x < W; x += 78) {
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
  wood.addColorStop(0.18, '#3A2214');
  wood.addColorStop(1, '#1A100A');
  ctx.fillStyle = wood;
  ctx.fillRect(0, TABLE_TOP, W, H - TABLE_TOP);

  // 桌沿高光
  ctx.save();
  ctx.strokeStyle = 'rgba(232, 214, 179, 0.22)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, TABLE_TOP);
  ctx.lineTo(W, TABLE_TOP);
  ctx.stroke();
  ctx.restore();

  // 木纹
  const rng = seeded(110601);
  ctx.save();
  for (let i = 0; i < 34; i++) {
    const y = TABLE_TOP + seededRange(rng, 6, H - TABLE_TOP - 10);
    const x0 = seededRange(rng, -80, W * 0.65);
    const len = seededRange(rng, 160, 760);
    const amp = seededRange(rng, 2, 10);
    ctx.globalAlpha = seededRange(rng, 0.035, 0.11);
    ctx.strokeStyle = i % 4 === 0 ? p.accent : p.paper;
    ctx.lineWidth = seededRange(rng, 0.6, 1.8);
    ctx.beginPath();
    ctx.moveTo(x0, y);
    ctx.bezierCurveTo(x0 + len * 0.35, y - amp, x0 + len * 0.7, y + amp, x0 + len, y);
    ctx.stroke();
  }
  ctx.restore();

  // 桌面上一块暖色反光
  const sheen = ctx.createRadialGradient(760, 820, 0, 760, 820, 700);
  sheen.addColorStop(0, 'rgba(255, 214, 150, 0.10)');
  sheen.addColorStop(1, 'rgba(255, 214, 150, 0)');
  ctx.fillStyle = sheen;
  ctx.fillRect(0, TABLE_TOP, W, H - TABLE_TOP);
}

/* ------------------------------------------------------------------ */
/* 日历                                                                */
/* ------------------------------------------------------------------ */

function drawCalendar(ctx, p, t) {
  const x = 238;
  const y = 116;
  const w = 724;
  const h = 526;

  // 挂绳和钉子
  ctx.save();
  ctx.strokeStyle = 'rgba(232, 214, 179, 0.34)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.3, y);
  ctx.lineTo(x + w * 0.5, 54);
  ctx.lineTo(x + w * 0.7, y);
  ctx.stroke();
  ctx.fillStyle = 'rgba(232, 214, 179, 0.6)';
  ctx.beginPath();
  ctx.arc(x + w * 0.5, 52, 5, 0, TAU);
  ctx.fill();
  ctx.restore();

  // 纸张
  drawPaperCard(ctx, {
    x, y, w, h,
    fill: p.paper,
    radius: 10,
    border: 'rgba(43, 33, 24, 0.22)',
  });

  // 顶部红色横条
  ctx.save();
  ctx.beginPath();
  roundRect(ctx, x + 18, y + 18, w - 36, 76, 4);
  ctx.fillStyle = 'rgba(155, 74, 50, 0.92)';
  ctx.fill();
  ctx.fillStyle = p.paper;
  ctx.font = '700 30px "Noto Sans SC", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('2026', x + 42, y + 57);
  ctx.textAlign = 'right';
  ctx.font = '500 26px "Noto Sans SC", sans-serif';
  ctx.fillText('老日历', x + w - 42, y + 57);
  ctx.restore();

  // 月份和日期
  const flipIndex = FLIPS.reduce((sum, time) => sum + (t >= time ? 1 : 0), 0);
  const month = MONTHS[Math.min(flipIndex, MONTHS.length - 1)];
  const isLost = t >= 12.0;

  ctx.save();
  ctx.fillStyle = p.ink;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.font = '900 86px "Noto Serif SC", serif';
  ctx.fillText(month, x + 44, y + 196);

  ctx.font = '500 26px "Noto Sans SC", sans-serif';
  ctx.fillStyle = 'rgba(43, 33, 24, 0.56)';
  ctx.fillText(isLost ? '今天，星期几？' : '星期五 · 今日', x + 48, y + 230);

  // 大日期
  ctx.fillStyle = isLost ? 'rgba(155, 74, 50, 0.55)' : p.ink;
  ctx.font = '900 180px "Noto Serif SC", serif';
  ctx.textAlign = 'center';
  ctx.fillText(isLost ? '?' : '6', x + 228, y + 392);
  ctx.restore();

  // 红圈：圈住“今天”；乱了以后变成虚线
  ctx.save();
  ctx.translate(x + 228, y + 336);
  ctx.rotate(-0.045);
  ctx.strokeStyle = 'rgba(155, 74, 50, 0.86)';
  ctx.lineWidth = 6;
  if (isLost) ctx.setLineDash([12, 14]);
  ctx.beginPath();
  ctx.ellipse(0, 0, 118, 96, 0, 0, TAU);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // 右侧日期格
  const gridX = x + 428;
  const gridY = y + 132;
  const cellW = 38;
  const cellH = 42;
  const rng = seeded(20261106);
  ctx.save();
  ctx.font = '500 21px "Noto Sans SC", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let i = 0; i < 30; i++) {
    const col = i % 7;
    const row = Math.floor(i / 7);
    const gx = gridX + col * cellW + cellW / 2;
    const gy = gridY + row * cellH + cellH / 2;
    const isToday = i === 5;
    const jitter = isLost ? seededRange(rng, -3, 3) : 0;
    ctx.fillStyle = isToday
      ? 'rgba(155, 74, 50, 0.9)'
      : `rgba(43, 33, 24, ${isLost ? 0.22 : 0.5})`;
    ctx.fillText(String(i + 1), gx + jitter, gy + jitter);
    if (isToday) {
      ctx.strokeStyle = 'rgba(155, 74, 50, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(gx, gy, 15, 0, TAU);
      ctx.stroke();
    }
  }
  ctx.restore();

  // 11 年小柱状图：2015 → 2025
  drawYearBars(ctx, p, t, x + 44, y + 452, w - 88, 48);

  // 翻页动效
  for (const flip of FLIPS) {
    const prog = clamp((t - flip) / 0.52);
    if (prog > 0 && prog < 1) {
      drawPageFlip(ctx, p, x, y, w, h, prog);
    }
  }

  // 纸张右下角的卷边
  ctx.save();
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = p.ink;
  ctx.beginPath();
  ctx.moveTo(x + w - 54, y + h);
  ctx.lineTo(x + w, y + h - 54);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawYearBars(ctx, p, t, x, y, w, h) {
  if (t < 5.4) return;

  const n = 11;
  const gap = 5;
  const barW = (w - gap * (n - 1)) / n;
  const start = 5.6;
  const lit = clamp((t - start) / 3.2);
  const labelAlpha = clamp((t - 5.4) / 0.8);

  ctx.save();

  // 年份标签与小标题：跟着字幕一起出现，避免第一帧信息过载
  ctx.globalAlpha = labelAlpha;
  ctx.font = '500 19px "Noto Sans SC", sans-serif';
  ctx.fillStyle = 'rgba(43, 33, 24, 0.5)';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('2015', x, y - 16);
  ctx.textAlign = 'right';
  ctx.fillText('2025', x + w, y - 16);

  ctx.textAlign = 'right';
  ctx.font = '600 19px "Noto Sans SC", sans-serif';
  ctx.fillStyle = 'rgba(155, 74, 50, 0.78)';
  ctx.fillText('最近 11 年', x + w, y - 52);

  ctx.globalAlpha = 1;

  for (let i = 0; i < n; i++) {
    const local = easeOutCubic(clamp((lit - i * 0.075) / 0.42));
    if (local <= 0.001) continue;
    const bh = Math.max(2, h * (0.4 + 0.6 * (i / (n - 1))) * local);
    const bx = x + i * (barW + gap);
    const by = y + h - bh;
    ctx.globalAlpha = 0.45 + 0.55 * local;
    ctx.fillStyle = i === n - 1
      ? 'rgba(155, 74, 50, 0.92)'
      : `rgba(216, 168, 78, ${0.34 + 0.5 * (i / (n - 1))})`;
    roundRect(ctx, bx, by, barW, bh, 2.5);
    ctx.fill();
  }

  ctx.globalAlpha = 1;
  if (lit > 0.96) {
    ctx.strokeStyle = 'rgba(155, 74, 50, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y + h + 8);
    ctx.lineTo(x + w, y + h + 8);
    ctx.stroke();
  }
  ctx.restore();
}

function drawPageFlip(ctx, p, x, y, w, h, prog) {
  const fold = x + w * (1 - 0.72 * easeOutCubic(prog));
  ctx.save();
  const grad = ctx.createLinearGradient(fold, y, x + w, y + h);
  grad.addColorStop(0, 'rgba(255, 248, 232, 0.98)');
  grad.addColorStop(0.45, 'rgba(232, 214, 179, 0.94)');
  grad.addColorStop(1, 'rgba(120, 92, 58, 0.58)');
  ctx.fillStyle = grad;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
  ctx.shadowBlur = 30;
  ctx.shadowOffsetX = -10;
  ctx.beginPath();
  ctx.moveTo(fold, y + 8);
  ctx.quadraticCurveTo(fold + 100 * (1 - prog), y + h * 0.5, fold, y + h - 8);
  ctx.lineTo(x + w - 8, y + h - 8);
  ctx.lineTo(x + w - 8, y + 8);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(fold, y + 8);
  ctx.quadraticCurveTo(fold + 100 * (1 - prog), y + h * 0.5, fold, y + h - 8);
  ctx.stroke();
  ctx.restore();
}

/* ------------------------------------------------------------------ */
/* 挂钟 / 温度计 / 架子                                                  */
/* ------------------------------------------------------------------ */

function drawClock(ctx, p, t) {
  const cx = 1328;
  const cy = 196;
  const r = 82;

  // 挂绳
  ctx.save();
  ctx.strokeStyle = 'rgba(232, 214, 179, 0.28)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 36, cy - r + 6);
  ctx.lineTo(cx, 62);
  ctx.lineTo(cx + 36, cy - r + 6);
  ctx.stroke();
  ctx.restore();

  // 表盘
  ctx.save();
  ctx.fillStyle = p.paper;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 10;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, TAU);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(43, 33, 24, 0.25)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, TAU);
  ctx.stroke();

  // 刻度
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU - Math.PI / 2;
    const inner = i % 3 === 0 ? r - 22 : r - 13;
    ctx.strokeStyle = i % 3 === 0 ? 'rgba(43, 33, 24, 0.72)' : 'rgba(43, 33, 24, 0.35)';
    ctx.lineWidth = i % 3 === 0 ? 3 : 1.5;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner);
    ctx.lineTo(cx + Math.cos(a) * (r - 6), cy + Math.sin(a) * (r - 6));
    ctx.stroke();
  }

  // 指针：乱了以后会抖
  const jitter = t < 9.2
    ? 0.04 * Math.sin(t * 1.1)
    : 0.16 * Math.sin(t * 15.7) + 0.09 * Math.sin(t * 6.3);
  const secA = (t % 60) / 60 * TAU - Math.PI / 2 + jitter;
  const minA = (t / 60) * TAU - Math.PI / 2 + jitter * 0.55;
  const hourA = ((t / 3600) * TAU) - Math.PI / 2 + jitter * 0.22;

  drawHand(ctx, cx, cy, r * 0.5, hourA, 6, p.ink);
  drawHand(ctx, cx, cy, r * 0.72, minA, 4, p.ink);
  drawHand(ctx, cx, cy, r * 0.8, secA, 2, p.accent2);

  ctx.fillStyle = p.ink;
  ctx.beginPath();
  ctx.arc(cx, cy, 5, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function drawHand(ctx, cx, cy, len, angle, width, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(angle) * len, cy + Math.sin(angle) * len);
  ctx.stroke();
  ctx.restore();
}

function drawThermometer(ctx, p, t) {
  const x = 1140;
  const y = 300;
  const w = 34;
  const h = 326;
  const bulbR = 27;

  // 玻璃管
  ctx.save();
  ctx.fillStyle = 'rgba(232, 214, 179, 0.10)';
  ctx.strokeStyle = 'rgba(232, 214, 179, 0.42)';
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, w, h, w / 2);
  ctx.fill();
  ctx.stroke();

  // 水银：平时慢慢晃，乱了以后大幅摆动
  const wobble = t < 9.2
    ? 0.055 * Math.sin(t * 1.15)
    : 0.22 * Math.sin(t * 2.8) + 0.08 * Math.sin(t * 6.1);
  const level = clamp(0.52 + wobble, 0.14, 0.95);
  const mercuryTop = y + h - 20 - (h - 56) * level;
  const mercury = ctx.createLinearGradient(x, mercuryTop, x + w, y + h);
  mercury.addColorStop(0, '#FFD98A');
  mercury.addColorStop(1, '#C46A3A');
  ctx.fillStyle = mercury;
  ctx.shadowColor = 'rgba(255, 193, 94, 0.5)';
  ctx.shadowBlur = 18;
  roundRect(ctx, x + 7, mercuryTop, w - 14, y + h - mercuryTop - 7, (w - 14) / 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // 球泡
  ctx.beginPath();
  ctx.arc(x + w / 2, y + h + bulbR - 7, bulbR, 0, TAU);
  ctx.fillStyle = '#D9854A';
  ctx.shadowColor = 'rgba(255, 193, 94, 0.45)';
  ctx.shadowBlur = 24;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(232, 214, 179, 0.42)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x + w / 2, y + h + bulbR - 7, bulbR, 0, TAU);
  ctx.stroke();

  // 刻度
  ctx.strokeStyle = 'rgba(232, 214, 179, 0.28)';
  ctx.lineWidth = 1.2;
  for (let i = 0; i <= 8; i++) {
    const ty = y + 26 + (h - 52) * (i / 8);
    const len = i % 2 === 0 ? 12 : 7;
    ctx.beginPath();
    ctx.moveTo(x + w + 6, ty);
    ctx.lineTo(x + w + 6 + len, ty);
    ctx.stroke();
  }

  ctx.font = '500 20px "Noto Sans SC", sans-serif';
  ctx.fillStyle = 'rgba(232, 214, 179, 0.58)';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('热', x + w + 24, y + 20);
  ctx.fillText('冷', x + w + 24, y + h - 4);
  ctx.restore();
}

function drawShelf(ctx, p, t) {
  const x = 1392;
  const y = 430;
  const w = 390;

  // 架子
  ctx.save();
  ctx.fillStyle = 'rgba(74, 44, 25, 0.95)';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 10;
  roundRect(ctx, x, y, w, 18, 4);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(232, 214, 179, 0.16)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y + 2);
  ctx.lineTo(x + w, y + 2);
  ctx.stroke();
  ctx.restore();

  // 搪瓷杯
  drawCup(ctx, p, t, x + 128, y - 2);

  // 小盆栽
  drawPlant(ctx, p, t, x + 292, y - 2);
}

function drawCup(ctx, p, t, cx, baseY) {
  ctx.save();
  // 杯身
  const body = ctx.createLinearGradient(cx - 46, baseY - 96, cx + 46, baseY);
  body.addColorStop(0, '#F3E6CC');
  body.addColorStop(1, '#C9AE84');
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(cx - 42, baseY - 98);
  ctx.lineTo(cx + 42, baseY - 98);
  ctx.lineTo(cx + 34, baseY);
  ctx.lineTo(cx - 34, baseY);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(43, 33, 24, 0.2)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // 杯口和蓝边（用铁锈红代替）
  ctx.fillStyle = 'rgba(155, 74, 50, 0.9)';
  roundRect(ctx, cx - 44, baseY - 102, 88, 8, 4);
  ctx.fill();

  // 把手
  ctx.strokeStyle = 'rgba(232, 214, 179, 0.75)';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.arc(cx + 46, baseY - 52, 22, -1.2, 1.2);
  ctx.stroke();

  // 热气
  for (let i = 0; i < 3; i++) {
    const phase = t * 0.9 + i * 2.1;
    ctx.strokeStyle = `rgba(255, 246, 230, ${0.10 + 0.06 * Math.sin(phase)})`;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    const sx = cx - 18 + i * 18;
    ctx.moveTo(sx, baseY - 112);
    ctx.bezierCurveTo(
      sx - 12, baseY - 150,
      sx + 14, baseY - 178,
      sx - 4, baseY - 220,
    );
    ctx.stroke();
  }
  ctx.restore();
}

function drawPlant(ctx, p, t, cx, baseY) {
  ctx.save();
  // 花盆
  ctx.fillStyle = 'rgba(155, 74, 50, 0.88)';
  ctx.beginPath();
  ctx.moveTo(cx - 28, baseY - 48);
  ctx.lineTo(cx + 28, baseY - 48);
  ctx.lineTo(cx + 20, baseY);
  ctx.lineTo(cx - 20, baseY);
  ctx.closePath();
  ctx.fill();

  // 叶子
  const sway = 0.06 * Math.sin(t * 0.8);
  ctx.translate(cx, baseY - 48);
  ctx.rotate(sway);
  for (let i = 0; i < 5; i++) {
    const a = -1.9 + i * 0.45;
    ctx.save();
    ctx.rotate(a);
    ctx.fillStyle = i % 2 === 0
      ? 'rgba(120, 138, 92, 0.85)'
      : 'rgba(92, 110, 70, 0.8)';
    ctx.beginPath();
    ctx.ellipse(0, -34, 11, 34, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

/* ------------------------------------------------------------------ */
/* 扇子 / 天气图标 / 灰尘                                                */
/* ------------------------------------------------------------------ */

function drawFan(ctx, p, t) {
  const cx = 128;
  const cy = 906;
  const r = 176;
  const sway = 0.055 * Math.sin(t * 0.75);

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.22 + sway);

  // 扇面
  const fan = ctx.createLinearGradient(-r, -r, r, 20);
  fan.addColorStop(0, 'rgba(232, 214, 179, 0.9)');
  fan.addColorStop(1, 'rgba(184, 150, 100, 0.78)');
  ctx.fillStyle = fan;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(0, 0, r, -1.24, 1.24);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(92, 62, 36, 0.55)';
  ctx.lineWidth = 3;
  ctx.stroke();

  // 扇骨
  ctx.strokeStyle = 'rgba(92, 62, 36, 0.45)';
  ctx.lineWidth = 2;
  for (let i = -4; i <= 4; i++) {
    const a = (i / 4) * 1.18;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a) * r * 0.94, Math.sin(a) * r * 0.94);
    ctx.stroke();
  }

  // 扇柄
  ctx.strokeStyle = 'rgba(92, 62, 36, 0.85)';
  ctx.lineWidth = 13;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, 96);
  ctx.stroke();
  ctx.restore();
}

function drawWeatherIcons(ctx, p, t) {
  const chaos = t < 9.2 ? 0 : clamp((t - 9.2) / 2.6);
  const orbit = 18 + 46 * chaos;
  const speed = 0.35 + 1.3 * chaos;

  const a1 = -0.7 + t * 0.08 * speed;
  const a2 = 2.1 + t * 0.07 * speed;
  const a3 = 4.4 + t * 0.06 * speed;

  drawSun(ctx, p, 1048 + Math.cos(a1) * orbit, 176 + Math.sin(a1) * orbit * 0.7, 34, 0.85);
  drawRain(ctx, p, 1090 + Math.cos(a2) * orbit * 0.65, 512 + Math.sin(a2) * orbit * 0.55, 86, 0.85);
  drawSnow(ctx, p, 1048 + Math.cos(a3) * orbit, 646 + Math.sin(a3) * orbit * 0.6, 31, 0.72);
}

function drawSun(ctx, p, x, y, r, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = p.accent;
  ctx.fillStyle = 'rgba(255, 214, 150, 0.2)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y, r * 0.52, 0, TAU);
  ctx.fill();
  ctx.stroke();
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * TAU;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(a) * r * 0.72, y + Math.sin(a) * r * 0.72);
    ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    ctx.stroke();
  }
  ctx.restore();
}

function drawRain(ctx, p, x, y, s, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = p.text;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x - s * 0.22, y, s * 0.22, Math.PI * 0.85, Math.PI * 2.1);
  ctx.arc(x + s * 0.05, y - s * 0.1, s * 0.28, Math.PI * 0.8, Math.PI * 2.1);
  ctx.arc(x + s * 0.3, y, s * 0.2, Math.PI * 0.9, Math.PI * 2.1);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - s * 0.42, y + s * 0.2);
  ctx.lineTo(x + s * 0.42, y + s * 0.2);
  ctx.stroke();
  for (let i = 0; i < 3; i++) {
    const dx = x - s * 0.3 + i * s * 0.3;
    ctx.strokeStyle = p.accent2;
    ctx.beginPath();
    ctx.moveTo(dx, y + s * 0.36);
    ctx.lineTo(dx - s * 0.08, y + s * 0.62);
    ctx.stroke();
  }
  ctx.restore();
}

function drawSnow(ctx, p, x, y, r, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = p.paper;
  ctx.lineWidth = 2.5;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55);
    ctx.lineTo(
      x + Math.cos(a + 0.45) * r * 0.78,
      y + Math.sin(a + 0.45) * r * 0.78,
    );
    ctx.moveTo(x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55);
    ctx.lineTo(
      x + Math.cos(a - 0.45) * r * 0.78,
      y + Math.sin(a - 0.45) * r * 0.78,
    );
    ctx.stroke();
  }
  ctx.restore();
}

function drawDust(ctx, p, t) {
  const rng = seeded(70117);
  ctx.save();
  for (let i = 0; i < 46; i++) {
    const baseX = seededRange(rng, 0, W);
    const baseY = seededRange(rng, 80, H - 80);
    const r = seededRange(rng, 0.7, 2.4);
    const speed = seededRange(rng, 3, 12);
    const phase = seededRange(rng, 0, TAU);
    const x = (baseX + Math.sin(t * 0.25 + phase) * 26 + t * speed * 0.18) % W;
    const y = baseY + Math.cos(t * 0.2 + phase) * 18 - t * speed * 0.08;
    ctx.globalAlpha = 0.05 + 0.08 * (0.5 + 0.5 * Math.sin(t * 1.2 + phase));
    ctx.fillStyle = p.paper;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

/* ------------------------------------------------------------------ */
/* 场景入口                                                            */
/* ------------------------------------------------------------------ */

export default {
  draw(ctx, t, env) {
    const p = env.palette;

    // 很慢的推镜头；最后 2.6 秒再轻轻加速
    const push = easeInOutCubic(clamp(t / 15));
    const last = easeOutCubic(clamp((t - 12.4) / 2.6));
    const zoom = 1.0 + 0.042 * push + 0.018 * last;

    ctx.save();
    ctx.translate(W / 2, H * 0.52);
    ctx.scale(zoom, zoom);
    ctx.translate(-W / 2, -H * 0.52);

    drawRoom(ctx, p, t);
    drawTable(ctx, p, t);
    drawDust(ctx, p, t);
    drawClock(ctx, p, t);
    drawThermometer(ctx, p, t);
    drawShelf(ctx, p, t);
    drawWeatherIcons(ctx, p, t);
    drawCalendar(ctx, p, t);
    drawFan(ctx, p, t);

    // 暖色暗角，压住四角
    const vig = ctx.createRadialGradient(W / 2, H * 0.46, H * 0.36, W / 2, H * 0.46, H * 0.92);
    vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vig.addColorStop(1, 'rgba(0, 0, 0, 0.48)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);

    ctx.restore();
  },
};
