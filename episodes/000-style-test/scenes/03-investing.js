// 投资 · 数据叙事（L40 + F1 图表生长）
// 目的：验证奶油纸卡、柱状图生长、红色数字与复利曲线。
import {
  drawPaperCard,
  drawBarChart,
  drawCounter,
  drawTag,
  drawLabel,
  drawInfoBar,
} from '../../../engine/components.js';
import {
  clamp,
  easeInOutCubic,
  easeOutCubic,
} from '../../../engine/math.js';

// 以 30 天为一个月，按 1.01^天数 计算；最后一天回到 365 天，
// 所以最后一根柱正好是 1.01^365 ≈ 37.78。
const DAYS = [0, 30, 61, 91, 122, 152, 183, 213, 244, 274, 305, 335, 365];
const VALUES = DAYS.map((d) => Math.pow(1.01, d));
const LABELS = ['0月', '', '2月', '', '4月', '', '6月', '', '8月', '', '10月', '', '12月'];

export default {
  draw(ctx, t, env) {
    const { width, height, palette } = env;
    const p = clamp(t / 4);

    // 纸卡与图表整体轻微推近
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.scale(1.008 + 0.018 * easeInOutCubic(p), 1.008 + 0.018 * easeInOutCubic(p));
    ctx.translate(-width / 2, -height / 2);

    drawPaperCard(ctx, {
      x: 200,
      y: 158,
      w: 1520,
      h: 500,
      fill: palette.paper,
      radius: 22,
      border: 'rgba(31,41,51,0.12)',
    });

    // 卡片标题
    ctx.save();
    ctx.fillStyle = palette.ink;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.font = '800 46px "Noto Serif SC", serif';
    ctx.fillText('每天进步 1%', 292, 246);
    const titleW = ctx.measureText('每天进步 1%').width;
    ctx.strokeStyle = palette.accent2;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(292, 264);
    ctx.lineTo(292 + titleW, 264);
    ctx.stroke();

    ctx.font = '400 25px "Noto Sans SC", sans-serif';
    ctx.fillStyle = 'rgba(31,41,51,0.55)';
    ctx.fillText('按 365 天计算：1.01 的 365 次方', 292, 304);
    ctx.restore();

    // 右上角大数字
    ctx.save();
    ctx.font = '500 24px "Noto Sans SC", sans-serif';
    ctx.fillStyle = 'rgba(31,41,51,0.5)';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText('一年后', 1608, 190);
    ctx.restore();
    drawCounter(ctx, {
      x: 1608,
      y: 250,
      t,
      start: 0.35,
      duration: 2.5,
      from: 1,
      to: 37.78,
      decimals: 1,
      suffix: '×',
      font: '900 100px "Noto Serif SC", serif',
      color: palette.accent2,
      align: 'right',
      bounce: true,
    });

    // 图表
    const chart = drawBarChart(ctx, {
      x: 300,
      y: 365,
      w: 1320,
      h: 235,
      values: VALUES,
      labels: LABELS,
      t,
      start: 0.2,
      duration: 3.3,
      barColor: palette.accent3,
      highlightColor: palette.accent,
      lineColor: palette.accent2,
      textColor: palette.ink,
      mutedColor: 'rgba(31,41,51,0.45)',
      showValues: false,
      showLine: true,
    });

    // 指向最后一根柱子的注释
    const last = chart.tops[chart.tops.length - 1];
    drawLabel(ctx, {
      x: 1190,
      y: 330,
      text: '不是线性增长',
      target: { x: last.x, y: last.y },
      color: palette.accent2,
      font: '600 26px "Noto Sans SC", sans-serif',
      align: 'left',
      leaderColor: palette.accent2,
    });

    ctx.restore();

    // 角标与底部信息条（不跟随推镜头）
    drawTag(ctx, {
      x: 120,
      y: 92,
      text: '投资 · 数据叙事',
      color: palette.accent,
      bg: 'rgba(0,0,0,0.3)',
      border: 'rgba(224,177,92,0.34)',
    });
    drawInfoBar(ctx, env, {
      left: '1.01^365 ≈ 37.78',
      right: '复利 = 时间 × 耐心',
      progress: easeOutCubic(clamp(t / 3.6)),
    });
  },
};
