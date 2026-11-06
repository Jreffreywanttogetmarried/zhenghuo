// 历史 · 时间线（M20 + K35 旧学院风）
// 目的：验证时间轴生长、节点弹入、暗色羊皮纸舞台与金色字幕。
import {
  drawTimeline,
  drawTag,
  drawLabel,
} from '../../../engine/components.js';
import {
  clamp,
  easeInOutCubic,
  TAU,
} from '../../../engine/math.js';

export default {
  draw(ctx, t, env) {
    const { width, height, palette } = env;
    const p = clamp(t / 4);

    // 很慢的推镜头
    const scale = 1.015 + 0.03 * easeInOutCubic(p);
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.scale(scale, scale);
    ctx.translate(-width / 2, -height / 2);

    // 背景里一枚很淡的罗盘/地图环
    ctx.save();
    ctx.translate(1480, 430);
    ctx.strokeStyle = palette.accent;
    ctx.globalAlpha = 0.1;
    ctx.lineWidth = 1.5;
    for (const r of [300, 230, 160]) {
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, TAU);
      ctx.stroke();
    }
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU + t * 0.015;
      const inner = i % 3 === 0 ? 268 : 284;
      ctx.globalAlpha = i % 3 === 0 ? 0.22 : 0.1;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * inner, Math.sin(a) * inner);
      ctx.lineTo(Math.cos(a) * 300, Math.sin(a) * 300);
      ctx.stroke();
    }
    ctx.globalAlpha = 0.14;
    ctx.beginPath();
    ctx.moveTo(-320, 0);
    ctx.lineTo(320, 0);
    ctx.moveTo(0, -320);
    ctx.lineTo(0, 320);
    ctx.stroke();
    ctx.restore();

    // 背景大字
    ctx.save();
    ctx.globalAlpha = 0.045;
    ctx.font = '900 460px "Noto Serif SC", serif';
    ctx.fillStyle = palette.accent;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText('史', width - 96, 420);
    ctx.restore();

    // 角标
    drawTag(ctx, {
      x: 120,
      y: 92,
      text: '历史 · 时间线',
      color: palette.accent,
      bg: 'rgba(0,0,0,0.26)',
      border: 'rgba(216,168,78,0.35)',
    });

    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.font = '500 22px "Noto Sans SC", sans-serif';
    ctx.fillStyle = palette.muted;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.letterSpacing = '6px';
    ctx.fillText('CAUSE  →  EFFECT', width - 120, 118);
    ctx.restore();

    // 时间轴
    drawTimeline(ctx, {
      x: 210,
      y: 500,
      width: 1500,
      progress: easeInOutCubic(clamp((t - 0.15) / 3.5)),
      nodes: [
        { label: '公元前 3 世纪', sub: '道路与帝国' },
        { label: '7 世纪', sub: '丝路与港口' },
        { label: '10 世纪', sub: '纸张与市场' },
        { label: '15 世纪', sub: '远洋与地图' },
        { label: '19 世纪', sub: '蒸汽与工厂' },
        { label: '21 世纪', sub: '芯片与网络' },
      ],
      color: palette.accent,
      muted: 'rgba(216,168,78,0.24)',
      textColor: palette.text,
    });

    // 时间轴两端的小注释
    drawLabel(ctx, {
      x: 210,
      y: 620,
      text: '过去',
      color: palette.muted,
      font: '400 22px "Noto Sans SC", sans-serif',
      align: 'left',
    });
    drawLabel(ctx, {
      x: 1710,
      y: 620,
      text: '今天',
      color: palette.accent,
      font: '500 22px "Noto Sans SC", sans-serif',
      align: 'right',
    });

    ctx.restore();
  },
};
