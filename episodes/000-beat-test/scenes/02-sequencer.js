// 第 2 幕：8 拍网格；每一拍，播放头跳一格，整列亮起。
import {
  drawTag,
  drawLabel,
  drawInfoBar,
} from '../../../engine/components.js';
import { clamp, roundRect, TAU } from '../../../engine/math.js';

const ROWS = [
  { label: '低鼓', color: '#FFC15E' },
  { label: '贝斯', color: '#7FD0FF' },
  { label: '和弦', color: '#8EE3B0' },
  { label: '主音', color: '#C9A8FF' },
];

export default {
  draw(ctx, t, env) {
    const { width, height, palette, beat, globalT } = env;
    const pulse = beat ? beat.pulse(globalT, { power: 2 }) : 0;
    const rawIndex = beat ? beat.beatIndex(globalT) : 0;
    const beatIndex = Math.max(0, Math.floor(rawIndex + 1e-6));
    const step = ((beatIndex % 8) + 8) % 8;
    const bar = Math.floor(beatIndex / 8) + 1;

    const x0 = 380;
    const y0 = 270;
    const cellW = 128;
    const cellH = 64;
    const gapX = 20;
    const gapY = 24;

    // 列号
    ctx.save();
    for (let c = 0; c < 8; c++) {
      const cx = x0 + c * (cellW + gapX) + cellW / 2;
      ctx.font = `${c === step ? 700 : 500} 24px "Noto Sans SC", sans-serif`;
      ctx.fillStyle = c === step ? palette.accent : palette.muted;
      ctx.globalAlpha = c === step ? 1 : 0.5;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(c + 1), cx, 230);
    }
    ctx.restore();

    // 4 行 x 8 列
    ROWS.forEach((row, r) => {
      const y = y0 + r * (cellH + gapY);
      ctx.save();
      ctx.font = '600 24px "Noto Sans SC", sans-serif';
      ctx.fillStyle = palette.muted;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(row.label, x0 - 28, y + cellH / 2);
      ctx.restore();

      for (let c = 0; c < 8; c++) {
        const x = x0 + c * (cellW + gapX);
        const active = c === step;
        const activePulse = active ? 1 - 0.12 * pulse : 0;
        const inset = active ? 4 + 2 * pulse : 6;
        roundRect(ctx, x + inset, y + inset, cellW - inset * 2, cellH - inset * 2, 10);
        ctx.fillStyle = row.color;
        ctx.globalAlpha = active ? 0.28 + 0.38 * activePulse : 0.07;
        ctx.fill();
        if (active) {
          ctx.globalAlpha = 0.9;
          ctx.strokeStyle = row.color;
          ctx.lineWidth = 2;
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }
    });

    // 播放头
    const headX = x0 + step * (cellW + gapX) + cellW / 2;
    ctx.save();
    ctx.strokeStyle = palette.accent;
    ctx.globalAlpha = 0.65;
    ctx.lineWidth = 2;
    ctx.shadowColor = palette.accent;
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.moveTo(headX, 250);
    ctx.lineTo(headX, y0 + ROWS.length * (cellH + gapY) - gapY + 6);
    ctx.stroke();
    ctx.restore();

    drawTag(ctx, {
      x: 120,
      y: 92,
      text: '节拍网格 · 8 拍一循环',
      color: palette.accent2,
      bg: 'rgba(0,0,0,0.26)',
      border: 'rgba(127,208,255,0.3)',
    });

    drawLabel(ctx, {
      x: width / 2,
      y: 610,
      text: '每 8 拍，切一次场景',
      color: palette.muted,
      font: '500 26px "Noto Sans SC", sans-serif',
      align: 'center',
    });

    drawInfoBar(ctx, env, {
      left: `STEP ${step + 1} / 8`,
      right: `BAR ${bar} · 120 BPM`,
      progress: clamp((rawIndex % 8) / 8),
    });
  },
};
