// 04 · 旱涝并重：左边暴雨积水，右边土地龟裂
import {
  drawTag,
  drawRing,
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
const MID = 960;

function drawFlood(ctx, p, t) {
  const x0 = 0;
  const x1 = MID;

  // 天空
  const sky = ctx.createLinearGradient(0, 0, 0, 720);
  sky.addColorStop(0, '#04101E');
  sky.addColorStop(0.55, '#0A2436');
  sky.addColorStop(1, '#12384C');
  ctx.fillStyle = sky;
  ctx.fillRect(x0, 0, x1, 720);

  // 乌云
  ctx.save();
  ctx.fillStyle = 'rgba(20,45,65,0.75)';
  for (let i = 0; i < 4; i++) {
    const cx = 120 + i * 230;
    const cy = 80 + Math.sin(t * 0.3 + i) * 10;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 170, 60, 0, 0, TAU);
    ctx.fill();
  }
  ctx.restore();

  // 雨
  const rng = seeded(4801);
  ctx.save();
  ctx.strokeStyle = 'rgba(160,225,255,0.6)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 95; i++) {
    const x = seededRange(rng, 20, MID - 20);
    const phase = seededRange(rng, 0, 1);
    const speed = seededRange(rng, 520, 820);
    const len = seededRange(rng, 18, 42);
    const y = ((t * speed + phase * 900) % 820) - 40;
    ctx.globalAlpha = seededRange(rng, 0.18, 0.55);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 7, y + len);
    ctx.stroke();
  }
  ctx.restore();

  // 城市剪影
  const buildings = [
    [60, 470, 110, 250], [190, 520, 90, 200], [300, 430, 130, 290],
    [450, 500, 100, 220], [570, 450, 120, 270], [710, 510, 110, 210],
    [840, 470, 90, 250],
  ];
  ctx.save();
  const lit = seeded(1994);
  for (const [bx, by, bw, bh] of buildings) {
    ctx.fillStyle = 'rgba(4,14,24,0.92)';
    ctx.fillRect(bx, by, bw, bh);
    for (let wy = by + 22; wy < by + bh - 16; wy += 34) {
      for (let wx = bx + 16; wx < bx + bw - 14; wx += 28) {
        if (seededRange(lit, 0, 1) > 0.55) {
          ctx.fillStyle = 'rgba(255,193,94,0.3)';
          ctx.fillRect(wx, wy, 10, 14);
        }
      }
    }
  }
  ctx.restore();

  // 路面
  const road = ctx.createLinearGradient(0, 680, 0, H);
  road.addColorStop(0, '#1A2A34');
  road.addColorStop(1, '#071018');
  ctx.fillStyle = road;
  ctx.fillRect(x0, 680, x1, H - 680);

  // 水位上涨
  const level = 930 - 210 * easeInOutCubic(clamp((t - 0.6) / 11));
  const water = ctx.createLinearGradient(0, level, 0, H);
  water.addColorStop(0, 'rgba(80,180,215,0.62)');
  water.addColorStop(0.25, 'rgba(30,110,150,0.8)');
  water.addColorStop(1, 'rgba(4,30,50,0.96)');
  ctx.fillStyle = water;
  ctx.fillRect(x0, level, x1, H - level);

  // 水线
  ctx.save();
  ctx.strokeStyle = 'rgba(190,240,255,0.8)';
  ctx.lineWidth = 2.5;
  ctx.shadowColor = 'rgba(127,208,255,0.65)';
  ctx.shadowBlur = 16;
  ctx.beginPath();
  ctx.moveTo(x0, level);
  ctx.lineTo(x1, level);
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.restore();

  // 水面倒影
  ctx.save();
  ctx.strokeStyle = 'rgba(255,193,94,0.22)';
  ctx.lineWidth = 3;
  for (let i = 0; i < 7; i++) {
    const rx = 80 + i * 125;
    const rh = 30 + 40 * (0.5 + 0.5 * Math.sin(t * 1.3 + i));
    ctx.beginPath();
    ctx.moveTo(rx, level + 8);
    ctx.lineTo(rx + Math.sin(t * 1.1 + i) * 6, level + 8 + rh);
    ctx.stroke();
  }
  ctx.restore();

  // 水面波纹
  ctx.save();
  ctx.strokeStyle = 'rgba(180,235,255,0.5)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 9; i++) {
    const phase = (t * 0.45 + i * 0.17) % 1;
    const cx = 90 + i * 105;
    ctx.globalAlpha = 0.22 * (1 - phase);
    ctx.beginPath();
    ctx.ellipse(cx, level + 18 + (i % 3) * 22, 50 + phase * 70, 7 + phase * 8, 0, 0, TAU);
    ctx.stroke();
  }
  ctx.restore();

  // 被淹的车
  const carY = level - 18;
  ctx.save();
  ctx.fillStyle = 'rgba(8,18,26,0.9)';
  roundRect(ctx, 250, carY - 54, 190, 52, 12);
  ctx.fill();
  roundRect(ctx, 290, carY - 86, 110, 40, 10);
  ctx.fill();
  ctx.fillStyle = 'rgba(127,208,255,0.22)';
  roundRect(ctx, 302, carY - 78, 40, 24, 4);
  ctx.fill();
  roundRect(ctx, 350, carY - 78, 38, 24, 4);
  ctx.fill();
  ctx.fillStyle = 'rgba(4,12,18,0.95)';
  for (const wx of [285, 400]) {
    ctx.beginPath();
    ctx.arc(wx, carY, 20, 0, TAU);
    ctx.fill();
  }
  ctx.restore();

  // 排水口漩涡
  const dx = 780;
  const dy = level + 8;
  ctx.save();
  ctx.strokeStyle = 'rgba(180,235,255,0.5)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    const rr = 10 + i * 13 + 3 * Math.sin(t * 4 + i);
    ctx.globalAlpha = 0.4 - i * 0.07;
    ctx.beginPath();
    ctx.arc(dx, dy, rr, t * 2 + i, t * 2 + i + Math.PI * 1.2);
    ctx.stroke();
  }
  ctx.restore();

  // 标签
  drawRing(ctx, { x: 118, y: 246, r: 34, color: p.accent2, width: 2, alpha: 0.6 });
  ctx.save();
  ctx.font = '900 44px "Noto Serif SC", serif';
  ctx.fillStyle = p.accent2;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('涝', 118, 248);
  ctx.restore();

  drawTag(ctx, {
    x: 96,
    y: 588,
    text: '暴雨更集中',
    color: p.accent2,
    bg: 'rgba(2,10,18,0.55)',
    border: 'rgba(127,208,255,0.3)',
    font: '600 24px "Noto Sans SC", sans-serif',
  });

}

function drawDrought(ctx, p, t) {
  const x0 = MID;
  const x1 = W;

  // 天空：上面深蓝，下面一层热霾
  const sky = ctx.createLinearGradient(0, 0, 0, 760);
  sky.addColorStop(0, '#07101E');
  sky.addColorStop(0.55, '#1B1A20');
  sky.addColorStop(1, '#3A2416');
  ctx.fillStyle = sky;
  ctx.fillRect(x0, 0, x1 - x0, 760);

  const haze = ctx.createLinearGradient(0, 420, 0, 760);
  haze.addColorStop(0, 'rgba(255,193,94,0)');
  haze.addColorStop(1, 'rgba(255,150,70,0.22)');
  ctx.fillStyle = haze;
  ctx.fillRect(x0, 420, x1 - x0, 340);

  // 太阳
  const sx = 1650;
  const sy = 170;
  const sun = ctx.createRadialGradient(sx, sy, 0, sx, sy, 150);
  sun.addColorStop(0, 'rgba(255,246,220,1)');
  sun.addColorStop(0.2, 'rgba(255,210,130,0.9)');
  sun.addColorStop(0.55, 'rgba(255,160,80,0.28)');
  sun.addColorStop(1, 'rgba(255,160,80,0)');
  ctx.fillStyle = sun;
  ctx.beginPath();
  ctx.arc(sx, sy, 150, 0, TAU);
  ctx.fill();

  ctx.save();
  ctx.strokeStyle = 'rgba(255,214,150,0.6)';
  ctx.lineWidth = 2.2;
  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * TAU + t * 0.06;
    const r0 = 56;
    const r1 = 76 + 12 * (0.5 + 0.5 * Math.sin(t * 1.1 + i));
    ctx.globalAlpha = 0.22 + 0.18 * (0.5 + 0.5 * Math.sin(t * 1.5 + i));
    ctx.beginPath();
    ctx.moveTo(sx + Math.cos(a) * r0, sy + Math.sin(a) * r0);
    ctx.lineTo(sx + Math.cos(a) * r1, sy + Math.sin(a) * r1);
    ctx.stroke();
  }
  ctx.restore();

  // 干裂土地
  const ground = ctx.createLinearGradient(0, 660, 0, H);
  ground.addColorStop(0, '#7A5230');
  ground.addColorStop(0.4, '#4E3320');
  ground.addColorStop(1, '#2A1A10');
  ctx.fillStyle = ground;
  ctx.fillRect(x0, 660, x1 - x0, H - 660);

  // 裂纹
  const grow = easeOutCubic(clamp((t - 3.6) / 6.5));
  const rng = seeded(5801);
  ctx.save();
  ctx.lineCap = 'round';
  for (let i = 0; i < 16; i++) {
    const startX = seededRange(rng, x0 + 70, x1 - 70);
    const startY = seededRange(rng, 720, 950);
    const segs = 4 + (i % 3);
    let x = startX;
    let y = startY;
    ctx.globalAlpha = 0.78;
    ctx.strokeStyle = 'rgba(18,10,6,0.9)';
    ctx.lineWidth = 4.2 - (i % 3) * 0.7;
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let k = 0; k < segs; k++) {
      x += seededRange(rng, -52, 52);
      y += seededRange(rng, 24, 62) * grow;
      ctx.lineTo(x, y);
    }
    ctx.stroke();

    // 裂缝边缘的浅色高光，避免在深色土地上糊成一片
    ctx.globalAlpha = 0.16;
    ctx.strokeStyle = 'rgba(255,214,150,0.8)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }
  ctx.restore();

  // 枯黄的庄稼（放在右侧，避开字幕中线）
  const plantX = 1790;
  const plantY = 700;
  ctx.save();
  ctx.strokeStyle = 'rgba(50,32,16,0.55)';
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(plantX + 4, plantY + 100);
  ctx.quadraticCurveTo(plantX - 4, plantY + 24, plantX + 8, plantY - 46);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(210,170,90,0.92)';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(plantX, plantY + 94);
  ctx.quadraticCurveTo(plantX - 8, plantY + 20, plantX + 4, plantY - 46);
  ctx.stroke();

  const droop = 0.35 + 0.4 * clamp((t - 4) / 8);
  for (let i = 0; i < 5; i++) {
    const side = i % 2 === 0 ? 1 : -1;
    const baseY = plantY - 34 + i * 26;
    const len = 78 - i * 8;
    ctx.strokeStyle = i % 2 === 0 ? 'rgba(215,175,95,0.9)' : 'rgba(170,135,70,0.9)';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(plantX + 4, baseY);
    ctx.quadraticCurveTo(
      plantX + side * len * 0.55,
      baseY - 14,
      plantX + side * len,
      baseY + len * droop,
    );
    ctx.stroke();
  }
  ctx.restore();

  // 热浪
  ctx.save();
  ctx.strokeStyle = 'rgba(255,210,150,0.26)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 7; i++) {
    const yy = 700 + i * 24;
    ctx.beginPath();
    for (let x = x0 + 40; x <= x1 - 20; x += 14) {
      const y = yy + Math.sin(x * 0.018 + t * 1.6 + i) * 4;
      if (x === x0 + 40) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.restore();

  // 标签
  drawRing(ctx, { x: 1788, y: 152, r: 34, color: p.accent, width: 2, alpha: 0.6 });
  ctx.save();
  ctx.font = '900 44px "Noto Serif SC", serif';
  ctx.fillStyle = p.accent;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('旱', 1788, 154);
  ctx.restore();

  drawTag(ctx, {
    x: 1490,
    y: 588,
    text: '雨更少',
    color: p.accent,
    bg: 'rgba(2,10,18,0.55)',
    border: 'rgba(255,193,94,0.3)',
    font: '600 24px "Noto Sans SC", sans-serif',
  });

}

export default {
  draw(ctx, t, env) {
    const p = env.palette;

    const zoom = 1.0 + 0.025 * easeInOutCubic(t / 14);
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-W / 2, -H / 2);

    drawFlood(ctx, p, t);
    drawDrought(ctx, p, t);

    // 中缝
    ctx.save();
    const pulse = 0.28 + 0.12 * Math.sin(t * 1.6);
    ctx.strokeStyle = `rgba(255,193,94,${pulse})`;
    ctx.lineWidth = 2;
    ctx.shadowColor = 'rgba(255,193,94,0.5)';
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.moveTo(MID, 70);
    ctx.lineTo(MID, 1010);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // 中间的小菱形
    ctx.fillStyle = 'rgba(255,193,94,0.35)';
    ctx.beginPath();
    ctx.moveTo(MID, 500);
    ctx.lineTo(MID + 12, 512);
    ctx.lineTo(MID, 524);
    ctx.lineTo(MID - 12, 512);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 底部的小结标签
    const show = clamp((t - 10.0) / 1.2);
    if (show > 0.01) {
      ctx.save();
      ctx.globalAlpha = show;
      drawTag(ctx, {
        x: MID - 76,
        y: 548,
        text: '旱涝并重',
        color: p.accent,
        bg: 'rgba(2,10,18,0.72)',
        border: 'rgba(255,193,94,0.42)',
        font: '700 28px "Noto Sans SC", sans-serif',
      });
      ctx.restore();
    }

    // 角标
    drawTag(ctx, {
      x: 120,
      y: 92,
      text: '04 · 旱涝并重',
      color: p.accent2,
      bg: 'rgba(0,0,0,0.26)',
      border: 'rgba(127,208,255,0.3)',
    });

    // 来源
    ctx.save();
    ctx.font = '500 20px "Noto Sans SC", sans-serif';
    ctx.fillStyle = 'rgba(244,247,251,0.36)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('数据：中国气象局《中国气候变化蓝皮书（2026）》 · 画面为示意', 120, 1026);
    ctx.restore();

    ctx.restore();
  },
};
