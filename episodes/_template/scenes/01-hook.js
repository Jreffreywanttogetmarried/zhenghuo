// 模板场景：复制后替换成你的第一幕。
// 规则：画面只由 t（本幕内秒数）决定；不要用 Math.random / setTimeout / rAF。
import {
  drawTag,
  drawDot,
  drawRing,
  drawLabel,
} from '../../../engine/components.js';
import { clamp, easeOutCubic, TAU } from '../../../engine/math.js';

export default {
  draw(ctx, t, env) {
    const { width, height, palette } = env;
    const p = easeOutCubic(clamp(t / 2.2));

    // 一个随 t 展开的光环：替换成你的主体
    const cx = width / 2;
    const cy = height * 0.42;
    const radius = 60 + 120 * p;

    drawRing(ctx, {
      x: cx,
      y: cy,
      r: radius,
      color: palette.accent2,
      width: 2,
      alpha: 0.35 + 0.25 * Math.sin(t * 1.8),
    });
    drawRing(ctx, {
      x: cx,
      y: cy,
      r: radius * 0.72,
      color: palette.accent,
      width: 1.5,
      alpha: 0.22,
      dash: [6, 12],
    });
    drawDot(ctx, { x: cx, y: cy, r: 6, color: palette.accent, glow: 24 });

    // 三个绕行的小点
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * TAU + t * 0.7;
      drawDot(ctx, {
        x: cx + Math.cos(a) * radius,
        y: cy + Math.sin(a) * radius,
        r: 3.5,
        color: palette.accent2,
        glow: 10,
      });
    }

    drawTag(ctx, {
      x: 120,
      y: 92,
      text: '第 01 幕 · 钩子',
      color: palette.accent,
      bg: 'rgba(0,0,0,0.26)',
      border: 'rgba(255,193,94,0.3)',
    });

    drawLabel(ctx, {
      x: cx,
      y: cy + 260,
      text: '把这里替换成你的画面',
      color: palette.muted,
      font: '500 28px "Noto Sans SC", sans-serif',
      align: 'center',
    });
  },
};
