// 第 1 幕：每一拍，圆环脉冲一次；8 拍一圈。
import {
  drawTag,
  drawRing,
  drawDot,
  drawLabel,
  drawInfoBar,
} from '../../../engine/components.js';
import { clamp, TAU } from '../../../engine/math.js';

export default {
  draw(ctx, t, env) {
    const { width, height, palette, beat, globalT } = env;
    const cx = width / 2;
    const cy = height * 0.42;

    const pulse = beat ? beat.pulse(globalT, { power: 2 }) : 0;
    const rawIndex = beat ? beat.beatIndex(globalT) : 0;
    const beatIndex = Math.max(0, Math.floor(rawIndex + 1e-6));
    const step = ((beatIndex % 8) + 8) % 8;
    const ringScale = 1 + 0.06 * pulse;

    // 背景同心圆
    ctx.save();
    for (const r of [250, 320, 390]) {
      ctx.strokeStyle = palette.accent2;
      ctx.globalAlpha = 0.07 + 0.03 * pulse;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();

    // 主环
    drawRing(ctx, {
      x: cx,
      y: cy,
      r: 190 * ringScale,
      color: palette.accent,
      width: 3,
      alpha: 0.35 + 0.45 * pulse,
    });
    drawRing(ctx, {
      x: cx,
      y: cy,
      r: 148 * ringScale,
      color: palette.accent2,
      width: 1.5,
      alpha: 0.2 + 0.2 * pulse,
      dash: [6, 10],
    });

    // 8 个拍点
    for (let i = 0; i < 8; i++) {
      const a = -Math.PI / 2 + (i / 8) * TAU;
      const x = cx + Math.cos(a) * 260;
      const y = cy + Math.sin(a) * 260;
      const active = i === step;
      if (active) {
        drawDot(ctx, { x, y, r: 9, color: palette.accent, glow: 26 });
      } else {
        ctx.save();
        ctx.fillStyle = palette.muted;
        ctx.globalAlpha = 0.45;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, TAU);
        ctx.fill();
        ctx.restore();
      }
      ctx.save();
      ctx.font = `${active ? 700 : 500} 24px "Noto Sans SC", sans-serif`;
      ctx.fillStyle = active ? palette.accent : palette.muted;
      ctx.globalAlpha = active ? 1 : 0.55;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(i + 1), cx + Math.cos(a) * 302, cy + Math.sin(a) * 302);
      ctx.restore();
    }

    // 中央拍号
    ctx.save();
    ctx.font = '900 190px "Noto Serif SC", serif';
    ctx.fillStyle = palette.titleColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = palette.accent;
    ctx.shadowBlur = 34;
    ctx.fillText(String(step + 1), cx, cy + 6);
    ctx.shadowBlur = 0;
    ctx.font = '500 28px "Noto Sans SC", sans-serif';
    ctx.fillStyle = palette.muted;
    ctx.fillText('120 BPM', cx, cy + 110);
    ctx.restore();

    drawTag(ctx, {
      x: 120,
      y: 92,
      text: 'BGM 卡点 · 120 BPM',
      color: palette.accent,
      bg: 'rgba(0,0,0,0.26)',
      border: 'rgba(255,193,94,0.3)',
    });

    drawLabel(ctx, {
      x: cx,
      y: 600,
      text: '每一拍，脉冲一次',
      color: palette.muted,
      font: '500 26px "Noto Sans SC", sans-serif',
      align: 'center',
    });

    drawInfoBar(ctx, env, {
      left: `第 ${beatIndex + 1} 拍`,
      right: '0.5s / 拍',
      progress: clamp(rawIndex / 8 - Math.floor(rawIndex / 8)),
    });
  },
};
