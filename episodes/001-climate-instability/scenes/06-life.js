// 06 · 落到生活：城市积水 / 农田旱涝 / 菜价用电出行 / 老人与预报
// 四张卡片排成一条长卷，镜头横向平移。
import {
  drawTag,
  drawLabel,
  drawDot,
} from '../../../engine/components.js';
import {
  clamp,
  lerp,
  easeInOutCubic,
  seeded,
  seededRange,
  TAU,
  roundRect,
} from '../../../engine/math.js';

const W = 1920;
const H = 1080;
const CARD_W = 900;
const CARD_H = 560;
const CARD_Y = 150;
const CARD_X = [60, 1020, 1980, 2940];

const STOPS = [
  { t: 0.0, x: 0 },
  { t: 6.6, x: 0 },
  { t: 7.4, x: 510 },
  { t: 10.0, x: 510 },
  { t: 10.8, x: 1470 },
  { t: 24.2, x: 1470 },
  { t: 25.2, x: 2430 },
  { t: 29.0, x: 2430 },
];

function cameraX(t) {
  for (let i = 0; i < STOPS.length - 1; i++) {
    const a = STOPS[i];
    const b = STOPS[i + 1];
    if (t >= a.t && t <= b.t) {
      const u = (t - a.t) / Math.max(b.t - a.t, 1e-6);
      return lerp(a.x, b.x, easeInOutCubic(u));
    }
  }
  return STOPS[STOPS.length - 1].x;
}

function drawStage(ctx, p, t) {
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#02040A');
  bg.addColorStop(0.6, '#061321');
  bg.addColorStop(1, '#02070D');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  ctx.strokeStyle = 'rgba(127,208,255,0.045)';
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 80) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let y = 0; y < H; y += 80) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  ctx.restore();

  // 长卷基线
  ctx.save();
  ctx.strokeStyle = 'rgba(255,193,94,0.22)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, CARD_Y + CARD_H + 46);
  ctx.lineTo(4000, CARD_Y + CARD_H + 46);
  ctx.stroke();
  for (let i = 0; i < CARD_X.length; i++) {
    drawDot(ctx, {
      x: CARD_X[i] + CARD_W / 2,
      y: CARD_Y + CARD_H + 46,
      r: 4,
      color: p.accent,
      glow: 12,
    });
  }
  ctx.restore();
}

function drawCardBase(ctx, p, x) {
  const y = CARD_Y;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.55)';
  ctx.shadowBlur = 60;
  ctx.shadowOffsetY = 22;
  const card = ctx.createLinearGradient(x, y, x + CARD_W, y + CARD_H);
  card.addColorStop(0, 'rgba(11,28,44,0.96)');
  card.addColorStop(0.55, 'rgba(7,19,31,0.96)');
  card.addColorStop(1, 'rgba(4,12,21,0.96)');
  ctx.fillStyle = card;
  roundRect(ctx, x, y, CARD_W, CARD_H, 20);
  ctx.fill();
  ctx.restore();
}

function drawCardOverlay(ctx, p, x, index, title) {
  const y = CARD_Y;
  ctx.save();
  ctx.strokeStyle = 'rgba(127,208,255,0.2)';
  ctx.lineWidth = 1.5;
  roundRect(ctx, x, y, CARD_W, CARD_H, 20);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255,193,94,0.5)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x + 40, y + 2);
  ctx.lineTo(x + 240, y + 2);
  ctx.stroke();

  ctx.font = '700 30px "Noto Sans SC", sans-serif';
  ctx.fillStyle = p.text;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(title, x + 42, y + 54);

  ctx.font = '500 18px "Noto Sans SC", sans-serif';
  ctx.fillStyle = 'rgba(244,247,251,0.35)';
  ctx.textAlign = 'right';
  ctx.fillText(`0${index + 1} / 04`, x + CARD_W - 42, y + 54);
  ctx.restore();
}

/* ------------------------------------------------------------------ */
/* 01 城市积水                                                          */
/* ------------------------------------------------------------------ */

function drawCityCard(ctx, p, x, t) {
  const y = CARD_Y;
  ctx.save();
  roundRect(ctx, x, y, CARD_W, CARD_H, 20);
  ctx.clip();

  // 天空
  const sky = ctx.createLinearGradient(x, y, x, y + 300);
  sky.addColorStop(0, '#081522');
  sky.addColorStop(1, '#14384A');
  ctx.fillStyle = sky;
  ctx.fillRect(x, y, CARD_W, 300);

  // 雨
  const rng = seeded(8101);
  ctx.strokeStyle = 'rgba(160,225,255,0.55)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 58; i++) {
    const rx = seededRange(rng, x + 20, x + CARD_W - 20);
    const phase = seededRange(rng, 0, 1);
    const speed = seededRange(rng, 280, 480);
    const len = seededRange(rng, 12, 28);
    const ry = y + ((t * speed + phase * 300) % 300);
    ctx.globalAlpha = seededRange(rng, 0.16, 0.5);
    ctx.beginPath();
    ctx.moveTo(rx, ry);
    ctx.lineTo(rx - 4, ry + len);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // 楼
  const buildings = [
    [x + 500, y + 196, 90, 150], [x + 596, y + 160, 72, 186],
    [x + 676, y + 206, 96, 140], [x + 780, y + 178, 74, 168],
  ];
  const lit = seeded(8102);
  for (const [bx, by, bw, bh] of buildings) {
    ctx.fillStyle = 'rgba(4,12,20,0.95)';
    ctx.fillRect(bx, by, bw, bh);
    for (let wy = by + 18; wy < by + bh - 12; wy += 30) {
      for (let wx = bx + 12; wx < bx + bw - 10; wx += 24) {
        if (seededRange(lit, 0, 1) > 0.55) {
          ctx.fillStyle = 'rgba(255,193,94,0.28)';
          ctx.fillRect(wx, wy, 7, 10);
        }
      }
    }
  }

  // 路面
  const road = ctx.createLinearGradient(x, y + 330, x, y + CARD_H);
  road.addColorStop(0, '#1A2830');
  road.addColorStop(1, '#081018');
  ctx.fillStyle = road;
  ctx.fillRect(x, y + 330, CARD_W, CARD_H - 330);

  // 积水
  const level = y + 446 - 34 * easeInOutCubic(clamp(t / 5));
  const water = ctx.createLinearGradient(x, level, x, y + CARD_H);
  water.addColorStop(0, 'rgba(75,170,205,0.6)');
  water.addColorStop(1, 'rgba(8,40,60,0.9)');
  ctx.fillStyle = water;
  ctx.fillRect(x + 30, level, CARD_W - 60, y + CARD_H - level);

  ctx.strokeStyle = 'rgba(190,240,255,0.75)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + 30, level);
  ctx.lineTo(x + CARD_W - 30, level);
  ctx.stroke();

  // 排水口
  const dx = x + 742;
  const dy = level + 22;
  ctx.strokeStyle = 'rgba(180,235,255,0.5)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    ctx.globalAlpha = 0.4 - i * 0.07;
    ctx.beginPath();
    ctx.arc(dx, dy, 10 + i * 10, t * 2 + i, t * 2 + i + Math.PI * 1.2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // 剖面：路面 vs 泥土
  const sx = x + 46;
  const sy = y + 336;
  const sw = 360;
  const pavementH = 54;

  // 剖面底板，和街道分开
  ctx.fillStyle = 'rgba(2,8,14,0.94)';
  ctx.strokeStyle = 'rgba(127,208,255,0.24)';
  ctx.lineWidth = 1.5;
  roundRect(ctx, sx - 14, sy - 44, sw + 28, 286, 10);
  ctx.fill();
  ctx.stroke();
  ctx.font = '600 18px "Noto Sans SC", sans-serif';
  ctx.fillStyle = 'rgba(244,247,251,0.45)';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('剖面', sx + 4, sy - 24);

  ctx.fillStyle = 'rgba(160,172,180,0.52)';
  ctx.fillRect(sx, sy, sw, pavementH);
  ctx.strokeStyle = 'rgba(220,235,245,0.7)';
  ctx.lineWidth = 2;
  ctx.strokeRect(sx, sy, sw, pavementH);

  const soil = ctx.createLinearGradient(sx, sy + pavementH, sx, sy + 226);
  soil.addColorStop(0, 'rgba(120,84,50,0.7)');
  soil.addColorStop(1, 'rgba(62,40,24,0.75)');
  ctx.fillStyle = soil;
  ctx.fillRect(sx, sy + pavementH, sw, 226);

  // 被挡住的下渗箭头
  ctx.save();
  ctx.strokeStyle = 'rgba(255,140,90,0.9)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(sx + 180, sy - 26);
  ctx.lineTo(sx + 180, sy + pavementH + 8);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(sx + 166, sy + pavementH - 6);
  ctx.lineTo(sx + 180, sy + pavementH + 12);
  ctx.lineTo(sx + 194, sy + pavementH - 6);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(sx + 150, sy + pavementH + 30);
  ctx.lineTo(sx + 210, sy + pavementH + 74);
  ctx.moveTo(sx + 210, sy + pavementH + 30);
  ctx.lineTo(sx + 150, sy + pavementH + 74);
  ctx.stroke();
  ctx.restore();

  drawLabel(ctx, {
    x: sx + 20,
    y: sy + 28,
    text: '路面硬',
    color: 'rgba(244,247,251,0.8)',
    font: '600 20px "Noto Sans SC", sans-serif',
    align: 'left',
  });
  drawLabel(ctx, {
    x: sx + 20,
    y: sy + pavementH + 64,
    text: '水渗不下去',
    color: 'rgba(255,170,120,0.85)',
    font: '600 20px "Noto Sans SC", sans-serif',
    align: 'left',
  });

  // 流向低处
  ctx.strokeStyle = 'rgba(160,225,255,0.5)';
  ctx.lineWidth = 2;
  ctx.setLineDash([7, 8]);
  ctx.beginPath();
  ctx.moveTo(x + 280, level + 70);
  ctx.quadraticCurveTo(x + 520, level + 96, dx - 20, dy);
  ctx.stroke();
  ctx.setLineDash([]);

  drawTag(ctx, {
    x: x + 42,
    y: y + 122,
    text: '同样的雨，更容易积水',
    color: p.accent2,
    bg: 'rgba(2,10,18,0.62)',
    border: 'rgba(127,208,255,0.32)',
    font: '600 23px "Noto Sans SC", sans-serif',
  });

  ctx.restore();
}

/* ------------------------------------------------------------------ */
/* 02 农田                                                              */
/* ------------------------------------------------------------------ */

function drawFarmCard(ctx, p, x, t) {
  const y = CARD_Y;
  ctx.save();
  roundRect(ctx, x, y, CARD_W, CARD_H, 20);
  ctx.clip();

  // 天空
  const sky = ctx.createLinearGradient(x, y, x, y + 340);
  sky.addColorStop(0, '#081522');
  sky.addColorStop(0.55, '#2A2018');
  sky.addColorStop(1, '#5A3218');
  ctx.fillStyle = sky;
  ctx.fillRect(x, y, CARD_W, 340);

  // 左边太阳
  const sx = x + 140;
  const sy = y + 126;
  const sun = ctx.createRadialGradient(sx, sy, 0, sx, sy, 100);
  sun.addColorStop(0, 'rgba(255,246,220,1)');
  sun.addColorStop(0.25, 'rgba(255,200,110,0.85)');
  sun.addColorStop(0.6, 'rgba(255,150,70,0.2)');
  sun.addColorStop(1, 'rgba(255,150,70,0)');
  ctx.fillStyle = sun;
  ctx.beginPath();
  ctx.arc(sx, sy, 100, 0, TAU);
  ctx.fill();

  // 右边雨云
  ctx.fillStyle = 'rgba(30,50,62,0.85)';
  for (const [bx, by, rx, ry] of [[640, 100, 90, 46], [710, 78, 110, 56], [790, 104, 80, 42]]) {
    ctx.beginPath();
    ctx.ellipse(x + bx, y + by, rx, ry, 0, 0, TAU);
    ctx.fill();
  }
  const rng = seeded(8201);
  ctx.strokeStyle = 'rgba(160,225,255,0.55)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 40; i++) {
    const rx = seededRange(rng, x + 590, x + 870);
    const phase = seededRange(rng, 0, 1);
    const ry = y + 140 + ((t * 260 + phase * 240) % 240);
    ctx.globalAlpha = seededRange(rng, 0.12, 0.4);
    ctx.beginPath();
    ctx.moveTo(rx, ry);
    ctx.lineTo(rx - 4, ry + 18);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // 左干右湿的土地
  ctx.fillStyle = '#6B4A2C';
  ctx.fillRect(x, y + 330, 430, 230);
  const wet = ctx.createLinearGradient(x + 430, y + 330, x + 430, y + CARD_H);
  wet.addColorStop(0, '#3E5A32');
  wet.addColorStop(1, '#1E3018');
  ctx.fillStyle = wet;
  ctx.fillRect(x + 430, y + 330, CARD_W - 430, 230);

  // 左边裂纹
  ctx.strokeStyle = 'rgba(30,18,10,0.85)';
  ctx.lineWidth = 3;
  for (let i = 0; i < 7; i++) {
    const bx = x + 40 + i * 54;
    ctx.beginPath();
    ctx.moveTo(bx, y + 360);
    ctx.lineTo(bx + 30, y + 410);
    ctx.lineTo(bx + 6, y + 458);
    ctx.lineTo(bx + 40, y + 510);
    ctx.stroke();
  }

  // 左边枯苗
  ctx.strokeStyle = 'rgba(200,165,90,0.9)';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(x + 318, y + 520);
  ctx.quadraticCurveTo(x + 310, y + 420, x + 326, y + 354);
  ctx.stroke();
  ctx.lineWidth = 3;
  for (let i = 0; i < 4; i++) {
    const side = i % 2 === 0 ? 1 : -1;
    const by = y + 390 + i * 28;
    ctx.beginPath();
    ctx.moveTo(x + 320, by);
    ctx.quadraticCurveTo(x + 320 + side * 40, by - 10, x + 320 + side * 66, by + 34);
    ctx.stroke();
  }

  // 右边稻苗
  ctx.strokeStyle = 'rgba(120,180,90,0.85)';
  for (let i = 0; i < 6; i++) {
    const bx = x + 560 + i * 48;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(bx, y + 530);
    ctx.quadraticCurveTo(bx - 4, y + 440, bx + 2, y + 382);
    ctx.stroke();
  }

  // 农民剪影
  const fx = x + 450;
  const fy = y + 344;
  ctx.fillStyle = 'rgba(8,14,18,0.96)';
  ctx.beginPath();
  ctx.arc(fx, fy - 24, 24, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(fx - 34, fy + 94);
  ctx.quadraticCurveTo(fx - 28, fy - 8, fx, fy - 4);
  ctx.quadraticCurveTo(fx + 30, fy - 8, fx + 34, fy + 94);
  ctx.closePath();
  ctx.fill();
  // 斗笠
  ctx.fillStyle = 'rgba(180,145,80,0.95)';
  ctx.beginPath();
  ctx.ellipse(fx, fy - 44, 52, 14, -0.05, Math.PI, TAU);
  ctx.fill();
  ctx.strokeStyle = 'rgba(90,62,30,0.9)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(fx - 50, fy - 44);
  ctx.lineTo(fx + 50, fy - 44);
  ctx.stroke();

  drawTag(ctx, {
    x: x + 42,
    y: y + 88,
    text: '该下不下，不该下猛下',
    color: p.accent,
    bg: 'rgba(2,10,18,0.62)',
    border: 'rgba(255,193,94,0.32)',
    font: '600 23px "Noto Sans SC", sans-serif',
  });

  drawTag(ctx, {
    x: x + 84,
    y: y + 268,
    text: '旱',
    color: p.accent,
    bg: 'rgba(2,10,18,0.55)',
    border: 'rgba(255,193,94,0.3)',
    font: '700 24px "Noto Sans SC", sans-serif',
  });
  drawTag(ctx, {
    x: x + 732,
    y: y + 268,
    text: '涝',
    color: p.accent2,
    bg: 'rgba(2,10,18,0.55)',
    border: 'rgba(127,208,255,0.3)',
    font: '700 24px "Noto Sans SC", sans-serif',
  });

  ctx.restore();
}

/* ------------------------------------------------------------------ */
/* 03 日子：菜价 / 用电 / 出行 / 老人                                    */
/* ------------------------------------------------------------------ */

function drawLifeCard(ctx, p, x, t) {
  const y = CARD_Y;
  ctx.save();
  roundRect(ctx, x, y, CARD_W, CARD_H, 20);
  ctx.clip();

  // 左暖右冷的底
  const bg = ctx.createLinearGradient(x, y, x + CARD_W, y + CARD_H);
  bg.addColorStop(0, 'rgba(80,40,22,0.5)');
  bg.addColorStop(0.48, 'rgba(14,26,38,0.6)');
  bg.addColorStop(1, 'rgba(16,40,54,0.5)');
  ctx.fillStyle = bg;
  ctx.fillRect(x, y, CARD_W, CARD_H);

  // 三个小盒子
  const boxes = [
    { bx: x + 56, label: '菜价', icon: 'price', at: 10.8 },
    { bx: x + 328, label: '用电', icon: 'power', at: 12.0 },
    { bx: x + 600, label: '出行', icon: 'bus', at: 13.2 },
  ];
  boxes.forEach((box, i) => {
    const active = clamp((t - box.at) / 0.6);
    ctx.save();
    ctx.globalAlpha = 0.55 + 0.45 * active;
    ctx.fillStyle = 'rgba(4,12,20,0.62)';
    ctx.strokeStyle = active > 0.5 ? 'rgba(255,193,94,0.65)' : 'rgba(127,208,255,0.25)';
    ctx.lineWidth = active > 0.5 ? 2.5 : 1.5;
    roundRect(ctx, box.bx, y + 92, 216, 104, 12);
    ctx.fill();
    ctx.stroke();

    ctx.font = '700 24px "Noto Sans SC", sans-serif';
    ctx.fillStyle = active > 0.5 ? p.accent : p.text;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(box.label, box.bx + 70, y + 144);

    // 小图标
    ctx.save();
    ctx.translate(box.bx + 38, y + 144);
    ctx.strokeStyle = active > 0.5 ? p.accent : p.accent2;
    ctx.fillStyle = ctx.strokeStyle;
    ctx.lineWidth = 2.5;
    if (box.icon === 'price') {
      ctx.strokeRect(-14, -16, 28, 32);
      ctx.beginPath();
      ctx.arc(0, -4, 5, 0, TAU);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, 1);
      ctx.lineTo(0, 11);
      ctx.stroke();
    } else if (box.icon === 'power') {
      ctx.beginPath();
      ctx.moveTo(-6, -18);
      ctx.lineTo(-6, -2);
      ctx.moveTo(6, -18);
      ctx.lineTo(6, -2);
      ctx.moveTo(-12, -2);
      ctx.lineTo(12, -2);
      ctx.lineTo(12, 16);
      ctx.lineTo(-12, 16);
      ctx.closePath();
      ctx.stroke();
    } else {
      ctx.strokeRect(-16, -12, 32, 20);
      ctx.beginPath();
      ctx.arc(-8, 12, 4, 0, TAU);
      ctx.arc(8, 12, 4, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
    ctx.restore();
  });

  // 菜摊
  ctx.save();
  ctx.fillStyle = 'rgba(4,12,20,0.55)';
  roundRect(ctx, x + 52, y + 246, 250, 170, 10);
  ctx.fill();
  ctx.fillStyle = 'rgba(155,74,50,0.75)';
  ctx.beginPath();
  ctx.moveTo(x + 44, y + 246);
  ctx.lineTo(x + 310, y + 246);
  ctx.lineTo(x + 288, y + 220);
  ctx.lineTo(x + 66, y + 220);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,214,150,0.35)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 5; i++) {
    const lx = x + 70 + i * 48;
    ctx.beginPath();
    ctx.moveTo(lx, y + 222);
    ctx.lineTo(lx + 10, y + 246);
    ctx.stroke();
  }
  ctx.font = '700 22px "Noto Sans SC", sans-serif';
  ctx.fillStyle = p.text;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('今日菜价', x + 76, y + 276);
  // 涨跌箭头
  ctx.strokeStyle = 'rgba(255,140,90,0.9)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x + 196, y + 306);
  ctx.lineTo(x + 240, y + 282);
  ctx.lineTo(x + 236, y + 306);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(127,208,255,0.9)';
  ctx.beginPath();
  ctx.moveTo(x + 196, y + 342);
  ctx.lineTo(x + 240, y + 366);
  ctx.lineTo(x + 236, y + 342);
  ctx.stroke();
  ctx.restore();

  // 公交站
  ctx.save();
  ctx.strokeStyle = 'rgba(160,170,175,0.6)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x + 700, y + 470);
  ctx.lineTo(x + 700, y + 300);
  ctx.stroke();
  ctx.fillStyle = 'rgba(10,24,38,0.9)';
  roundRect(ctx, x + 662, y + 262, 120, 54, 8);
  ctx.fill();
  ctx.strokeStyle = 'rgba(127,208,255,0.4)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.font = '700 21px "Noto Sans SC", sans-serif';
  ctx.fillStyle = p.accent2;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('公交站', x + 722, y + 289);
  ctx.restore();

  // 中间的老人剪影：左边扇子，右边围巾
  const ex = x + 478;
  const ey = y + 470;
  const heat = clamp((t - 14.0) / 1.2) * (1 - clamp((t - 21.2) / 1.2));
  const cold = clamp((t - 21.2) / 1.2);

  // 老人身后的柔光，避免剪影糊进背景
  const halo = ctx.createRadialGradient(ex, ey - 40, 0, ex, ey - 40, 230);
  halo.addColorStop(0, cold > 0.5
    ? 'rgba(127,208,255,0.2)'
    : 'rgba(255,170,90,0.2)');
  halo.addColorStop(1, 'rgba(255,170,90,0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(ex, ey - 40, 230, 0, TAU);
  ctx.fill();

  ctx.save();
  // 椅子
  ctx.strokeStyle = 'rgba(40,26,18,0.95)';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(ex - 34, ey + 34);
  ctx.lineTo(ex - 34, ey - 26);
  ctx.lineTo(ex + 40, ey - 26);
  ctx.lineTo(ex + 40, ey + 34);
  ctx.moveTo(ex - 34, ey + 34);
  ctx.lineTo(ex - 46, ey + 78);
  ctx.moveTo(ex + 40, ey + 34);
  ctx.lineTo(ex + 52, ey + 78);
  ctx.stroke();

  // 身体
  ctx.fillStyle = 'rgba(8,14,20,0.98)';
  ctx.beginPath();
  ctx.moveTo(ex - 28, ey + 24);
  ctx.quadraticCurveTo(ex - 38, ey - 62, ex - 4, ey - 78);
  ctx.quadraticCurveTo(ex + 30, ey - 88, ex + 36, ey - 44);
  ctx.quadraticCurveTo(ex + 40, ey - 4, ex + 24, ey + 24);
  ctx.closePath();
  ctx.fill();

  // 头
  ctx.beginPath();
  ctx.arc(ex - 2, ey - 110, 30, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(ex + 20, ey - 128, 13, 0, TAU);
  ctx.fill();

  // 轮廓光：热金 / 冷青
  const rim = cold > 0.5 ? p.accent2 : p.accent;
  ctx.strokeStyle = rim;
  ctx.globalAlpha = 0.35 + 0.3 * Math.max(heat, cold);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(ex - 2, ey - 110, 30, Math.PI * 0.85, Math.PI * 1.6);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // 扇子（热）
  if (cold < 0.7) {
    const sway = Math.sin(t * 2.1) * 0.08;
    ctx.save();
    ctx.globalAlpha = 1 - cold;
    ctx.translate(ex + 50, ey - 54);
    ctx.rotate(-0.25 + sway);
    ctx.fillStyle = 'rgba(212,176,112,0.9)';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, 28, -1.1, 1.1);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // 围巾（冷）
  if (cold > 0.01) {
    ctx.save();
    ctx.globalAlpha = cold;
    ctx.strokeStyle = p.accent2;
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(ex - 22, ey - 84);
    ctx.quadraticCurveTo(ex, ey - 72, ex + 24, ey - 84);
    ctx.stroke();
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(ex + 22, ey - 82);
    ctx.quadraticCurveTo(ex + 34, ey - 40, ex + 20, ey - 10);
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();

  // 热 / 冷 图标
  const sunPulse = 1 + 0.06 * Math.sin(t * 2.4);
  ctx.save();
  ctx.globalAlpha = 0.35 + 0.55 * heat;
  ctx.strokeStyle = p.accent;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x + 300, y + 300, 22 * sunPulse, 0, TAU);
  ctx.stroke();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU;
    ctx.beginPath();
    ctx.moveTo(x + 300 + Math.cos(a) * 30, y + 300 + Math.sin(a) * 30);
    ctx.lineTo(x + 300 + Math.cos(a) * 40, y + 300 + Math.sin(a) * 40);
    ctx.stroke();
  }
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = 0.25 + 0.6 * cold;
  ctx.strokeStyle = p.accent2;
  ctx.lineWidth = 3;
  const sx2 = x + 660;
  const sy2 = y + 300;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU;
    ctx.beginPath();
    ctx.moveTo(sx2, sy2);
    ctx.lineTo(sx2 + Math.cos(a) * 30, sy2 + Math.sin(a) * 30);
    ctx.stroke();
  }
  ctx.restore();

  // 温度提示
  ctx.font = '600 22px "Noto Sans SC", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = `rgba(255,193,94,${0.3 + 0.6 * heat})`;
  ctx.fillText('高温', x + 300, y + 356);
  ctx.fillStyle = `rgba(127,208,255,${0.2 + 0.65 * cold})`;
  ctx.fillText('寒潮', x + 660, y + 356);

  ctx.restore();
}

/* ------------------------------------------------------------------ */
/* 04 准备：预报 + 清单                                                 */
/* ------------------------------------------------------------------ */

function drawPrepCard(ctx, p, x, t) {
  const y = CARD_Y;
  ctx.save();
  roundRect(ctx, x, y, CARD_W, CARD_H, 20);
  ctx.clip();

  const bg = ctx.createLinearGradient(x, y, x + CARD_W, y + CARD_H);
  bg.addColorStop(0, 'rgba(14,30,44,0.85)');
  bg.addColorStop(1, 'rgba(6,14,24,0.9)');
  ctx.fillStyle = bg;
  ctx.fillRect(x, y, CARD_W, CARD_H);

  // 手机 / 预报屏
  ctx.save();
  ctx.fillStyle = 'rgba(4,10,18,0.95)';
  ctx.strokeStyle = 'rgba(127,208,255,0.28)';
  ctx.lineWidth = 2;
  roundRect(ctx, x + 66, y + 74, 420, 430, 26);
  ctx.fill();
  ctx.stroke();

  ctx.font = '600 22px "Noto Sans SC", sans-serif';
  ctx.fillStyle = 'rgba(244,247,251,0.6)';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('天气预报', x + 98, y + 112);

  // 预警铃
  const bellX = x + 430;
  const bellY = y + 112;
  ctx.strokeStyle = p.accent;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(bellX, bellY + 8, 15, Math.PI, TAU);
  ctx.lineTo(bellX + 20, bellY + 24);
  ctx.lineTo(bellX - 20, bellY + 24);
  ctx.closePath();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(bellX, bellY + 28, 4, 0, TAU);
  ctx.stroke();
  ctx.font = '700 20px "Noto Sans SC", sans-serif';
  ctx.fillStyle = p.accent;
  ctx.textAlign = 'center';
  ctx.fillText('预警', bellX, bellY + 54);

  // 温度曲线
  const chartX = x + 100;
  const chartY = y + 190;
  const chartW = 350;
  const chartH = 150;
  ctx.strokeStyle = 'rgba(127,208,255,0.22)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i <= 3; i++) {
    const gy = chartY + (chartH * i) / 3;
    ctx.beginPath();
    ctx.moveTo(chartX, gy);
    ctx.lineTo(chartX + chartW, gy);
    ctx.stroke();
  }

  const drop = clamp((t - 25.0) / 2.2);
  ctx.save();
  ctx.globalAlpha = 0.3 + 0.7 * drop;
  ctx.strokeStyle = p.accent2;
  ctx.lineWidth = 4;
  ctx.shadowColor = 'rgba(127,208,255,0.5)';
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.moveTo(chartX, chartY + 30);
  ctx.lineTo(chartX + 70, chartY + 24);
  ctx.lineTo(chartX + 140, chartY + 56);
  ctx.lineTo(chartX + 210, chartY + 52);
  ctx.lineTo(chartX + 280, chartY + 96);
  ctx.lineTo(chartX + 350, chartY + 138);
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.restore();

  ctx.font = '600 22px "Noto Sans SC", sans-serif';
  ctx.fillStyle = 'rgba(244,247,251,0.65)';
  ctx.textAlign = 'left';
  ctx.fillText('明天：降温、大风、有雨', x + 100, y + 390);

  ctx.restore();

  // 清单
  const items = ['看预警', '备好水', '备手电', '高温少出门'];
  const startTimes = [25.4, 25.8, 26.2, 26.6];
  items.forEach((text, i) => {
    const on = clamp((t - startTimes[i]) / 0.45);
    const iy = y + 112 + i * 78;
    ctx.save();
    ctx.globalAlpha = 0.35 + 0.65 * on;
    ctx.strokeStyle = on > 0.5 ? p.accent : 'rgba(244,247,251,0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x + 566, iy, 15, 0, TAU);
    ctx.stroke();

    if (on > 0.5) {
      ctx.strokeStyle = p.accent;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(x + 557, iy);
      ctx.lineTo(x + 564, iy + 8);
      ctx.lineTo(x + 576, iy - 8);
      ctx.stroke();
    }

    ctx.font = '600 27px "Noto Sans SC", sans-serif';
    ctx.fillStyle = on > 0.5 ? p.text : 'rgba(244,247,251,0.4)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + 596, iy);
    ctx.restore();
  });

  // 印章
  ctx.save();
  ctx.translate(x + 760, y + 470);
  ctx.rotate(-0.12);
  ctx.strokeStyle = 'rgba(255,193,94,0.55)';
  ctx.lineWidth = 3;
  roundRect(ctx, -64, -30, 128, 60, 8);
  ctx.stroke();
  ctx.font = '900 30px "Noto Serif SC", serif';
  ctx.fillStyle = 'rgba(255,193,94,0.8)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('有准备', 0, 2);
  ctx.restore();

  ctx.restore();
}

export default {
  draw(ctx, t, env) {
    const p = env.palette;

    drawStage(ctx, p, t);

    const cx = cameraX(t);
    const bob = Math.sin(t * 0.7) * 6;
    ctx.save();
    ctx.translate(-cx, bob);

    drawCardBase(ctx, p, CARD_X[0]);
    drawCityCard(ctx, p, CARD_X[0], t);
    drawCardOverlay(ctx, p, CARD_X[0], 0, '城市');

    drawCardBase(ctx, p, CARD_X[1]);
    drawFarmCard(ctx, p, CARD_X[1], t);
    drawCardOverlay(ctx, p, CARD_X[1], 1, '农田');

    drawCardBase(ctx, p, CARD_X[2]);
    drawLifeCard(ctx, p, CARD_X[2], t);
    drawCardOverlay(ctx, p, CARD_X[2], 2, '日子');

    drawCardBase(ctx, p, CARD_X[3]);
    drawPrepCard(ctx, p, CARD_X[3], t);
    drawCardOverlay(ctx, p, CARD_X[3], 3, '准备');

    ctx.restore();

    // 角标
    drawTag(ctx, {
      x: 120,
      y: 92,
      text: '06 · 落到生活',
      color: p.accent,
      bg: 'rgba(0,0,0,0.26)',
      border: 'rgba(255,193,94,0.3)',
    });

    // 来源
    ctx.save();
    ctx.font = '500 20px "Noto Sans SC", sans-serif';
    ctx.fillStyle = 'rgba(244,247,251,0.36)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('生活场景为示意 · 数据：中国气象局《中国气候变化蓝皮书（2026）》', 120, 1026);
    ctx.restore();
  },
};
