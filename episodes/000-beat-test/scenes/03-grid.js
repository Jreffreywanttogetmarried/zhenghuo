// 第 3 幕：16 个拍点绕成一圈；下方 24 拍时间尺对应 12 秒。
import {
  drawTag,
  drawDot,
  drawRing,
  drawLabel,
  drawInfoBar,
} from '../../../engine/components.js';
import { clamp, TAU } from '../../../engine/math.js';

export default {
  draw(ctx, t, env) {
    const { width, height, palette, beat, globalT } = env;
    const pulse = beat ? beat.pulse(globalT, { power: 2 }) : 0;
    const rawIndex = beat ? beat.beatIndex(globalT) : 0;
    const beatIndex = Math.max(0, Math.floor(rawIndex + 1e-6));
    const dotIndex = ((beatIndex % 16) + 16) % 16;

    const cx = width / 2;
    const cy = height * 0.37;
    const radius = 235;
    const phase = beat ? beat.phase(globalT) : 0;

    // 外圈
    drawRing(ctx, {
      x: cx,
      y: cy,
      r: radius,
      color: palette.accent2,
      width: 1.5,
      alpha: 0.2 + 0.3 * pulse,
    });
    drawRing(ctx, {
      x: cx,
      y: cy,
      r: radius + 18,
      color: palette.accent,
      width: 1,
      alpha: 0.08,
      dash: [4, 12],
    });

    // 一道持续旋转的弧，保证画面不会静止
    ctx.save();
    ctx.strokeStyle = palette.accent2;
    ctx.globalAlpha = 0.22;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 8, globalT * 0.35, globalT * 0.35 + 0.7);
    ctx.stroke();
    ctx.restore();

    // 16 个拍点
    for (let i = 0; i < 16; i++) {
      const a = -Math.PI / 2 + (i / 16) * TAU;
      const x = cx + Math.cos(a) * radius;
      const y = cy + Math.sin(a) * radius;
      const active = i === dotIndex;
      const near = (i - dotIndex + 16) % 16;
      const alpha = active ? 1 : near <= 3 ? 0.55 - near * 0.12 : 0.22;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = active ? palette.accent : palette.accent2;
      if (active) {
        ctx.shadowColor = palette.accent;
        ctx.shadowBlur = 28;
      }
      ctx.beginPath();
      ctx.arc(x, y, active ? 9 + 4 * pulse : 4, 0, TAU);
      ctx.fill();
      ctx.restore();

      if (active) {
        drawRing(ctx, {
          x,
          y,
          r: 12 + 48 * phase,
          color: palette.accent,
          width: 2,
          alpha: (1 - phase) * 0.55,
        });
      }
    }

    // 中央标题
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '900 88px "Noto Serif SC", serif';
    ctx.fillStyle = palette.titleColor;
    ctx.shadowColor = palette.titleGlow;
    ctx.shadowBlur = 36;
    ctx.fillText('BGM + 卡点', cx, cy - 12);
    ctx.shadowBlur = 0;
    ctx.font = '500 30px "Noto Sans SC", sans-serif';
    ctx.fillStyle = palette.muted;
    ctx.fillText('卡的是背景音乐的拍子', cx, cy + 66);
    ctx.restore();

    // 24 拍时间尺（12 秒 x 120 BPM = 24 拍）
    const rulerX0 = 160;
    const rulerX1 = width - 160;
    const rulerY = 860;
    const totalBeats = 24;
    ctx.save();
    for (let i = 0; i < totalBeats; i++) {
      const x = rulerX0 + (i / (totalBeats - 1)) * (rulerX1 - rulerX0);
      const active = i === beatIndex;
      ctx.strokeStyle = active ? palette.accent : palette.muted;
      ctx.globalAlpha = active ? 1 : 0.25;
      ctx.lineWidth = active ? 3 : 1.5;
      ctx.beginPath();
      ctx.moveTo(x, rulerY - (i % 4 === 0 ? 18 : 10));
      ctx.lineTo(x, rulerY + (i % 4 === 0 ? 18 : 10));
      ctx.stroke();
      if (active) {
        ctx.fillStyle = palette.accent;
        ctx.shadowColor = palette.accent;
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.arc(x, rulerY, 5, 0, TAU);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }
    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = palette.muted;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(rulerX0, rulerY);
    ctx.lineTo(rulerX1, rulerY);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.font = '400 20px "Noto Sans SC", sans-serif';
    ctx.fillStyle = palette.muted;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('0s', rulerX0, rulerY + 26);
    ctx.textAlign = 'right';
    ctx.fillText('12s', rulerX1, rulerY + 26);
    ctx.restore();

    drawTag(ctx, {
      x: 120,
      y: 92,
      text: 'BGM + 卡点 · 无配音',
      color: palette.accent,
      bg: 'rgba(0,0,0,0.26)',
      border: 'rgba(255,193,94,0.3)',
    });

    drawLabel(ctx, {
      x: cx,
      y: 650,
      text: `第 ${beatIndex + 1} 拍 / 24`,
      color: palette.accent,
      font: '600 28px "Noto Sans SC", sans-serif',
      align: 'center',
    });

    drawInfoBar(ctx, env, {
      left: '24 拍 = 12 秒',
      right: '120 BPM · 0.5s / 拍',
      progress: clamp(rawIndex / 24),
    });
  },
};
