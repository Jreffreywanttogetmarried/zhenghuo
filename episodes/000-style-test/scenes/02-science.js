// 科学 · 原理拆解（M18/M21 + 深蓝实验室）
// 目的：验证发光主体、贝塞尔轨迹、数字滚动与深色舞台。
import {
  drawTag,
  drawLabel,
  drawCounter,
  drawRing,
  drawDot,
} from '../../../engine/components.js';
import {
  clamp,
  easeInOutCubic,
  easeOutCubic,
  lerp,
  TAU,
} from '../../../engine/math.js';

const SUN = { x: 400, y: 470 };
const EARTH = { x: 1540, y: 470 };
const CONTROL = { x: 970, y: 205 };

function bezierPoint(u) {
  const a = 1 - u;
  return {
    x: a * a * SUN.x + 2 * a * u * CONTROL.x + u * u * EARTH.x,
    y: a * a * SUN.y + 2 * a * u * CONTROL.y + u * u * EARTH.y,
  };
}

export default {
  draw(ctx, t, env) {
    const { width, height, palette } = env;
    const p = easeInOutCubic(clamp((t - 0.1) / 3.6));

    // 很慢的推镜头
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.scale(1.01 + 0.025 * easeOutCubic(clamp(t / 4)), 1.01 + 0.025 * easeOutCubic(clamp(t / 4)));
    ctx.translate(-width / 2, -height / 2);

    // 轨迹：先画一条很淡的虚线
    ctx.save();
    ctx.strokeStyle = palette.accent2;
    ctx.globalAlpha = 0.16;
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 12]);
    ctx.beginPath();
    for (let i = 0; i <= 80; i++) {
      const pt = bezierPoint(i / 80);
      if (i === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // 已经走过的光迹
    if (p > 0.01) {
      const trailStart = Math.max(0, p - 0.22);
      ctx.save();
      ctx.lineCap = 'round';
      ctx.strokeStyle = palette.accent;
      ctx.shadowColor = palette.accent;
      ctx.shadowBlur = 18;
      const steps = 28;
      for (let i = 0; i < steps; i++) {
        const u0 = lerp(trailStart, p, i / steps);
        const u1 = lerp(trailStart, p, (i + 1) / steps);
        const a = bezierPoint(u0);
        const b = bezierPoint(u1);
        ctx.globalAlpha = 0.08 + 0.7 * (i / steps);
        ctx.lineWidth = 2 + 5 * (i / steps);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 太阳
    const sunPulse = 1 + 0.025 * Math.sin(t * 2.1);
    const glow = ctx.createRadialGradient(SUN.x, SUN.y, 0, SUN.x, SUN.y, 230 * sunPulse);
    glow.addColorStop(0, 'rgba(255,250,235,1)');
    glow.addColorStop(0.18, 'rgba(255,224,160,0.95)');
    glow.addColorStop(0.45, 'rgba(255,193,94,0.42)');
    glow.addColorStop(1, 'rgba(255,193,94,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(SUN.x, SUN.y, 230 * sunPulse, 0, TAU);
    ctx.fill();

    ctx.save();
    ctx.fillStyle = '#FFEFC4';
    ctx.shadowColor = palette.accent;
    ctx.shadowBlur = 40;
    ctx.beginPath();
    ctx.arc(SUN.x, SUN.y, 82, 0, TAU);
    ctx.fill();
    ctx.restore();

    // 日冕
    ctx.save();
    ctx.strokeStyle = palette.accent;
    ctx.lineWidth = 2;
    for (let i = 0; i < 36; i++) {
      const a = (i / 36) * TAU + t * 0.06;
      const r0 = 96 + 5 * Math.sin(t * 1.4 + i);
      const r1 = 118 + 14 * (0.5 + 0.5 * Math.sin(t * 1.1 + i * 2.3));
      ctx.globalAlpha = 0.18 + 0.22 * (0.5 + 0.5 * Math.sin(t * 1.7 + i));
      ctx.beginPath();
      ctx.moveTo(SUN.x + Math.cos(a) * r0, SUN.y + Math.sin(a) * r0);
      ctx.lineTo(SUN.x + Math.cos(a) * r1, SUN.y + Math.sin(a) * r1);
      ctx.stroke();
    }
    ctx.restore();

    drawLabel(ctx, {
      x: SUN.x,
      y: SUN.y + 150,
      text: '太阳',
      color: palette.text,
      font: '600 28px "Noto Sans SC", sans-serif',
      align: 'center',
    });

    // 地球
    ctx.save();
    const earthGrad = ctx.createRadialGradient(
      EARTH.x - 18, EARTH.y - 18, 4,
      EARTH.x, EARTH.y, 64,
    );
    earthGrad.addColorStop(0, '#8FD3FF');
    earthGrad.addColorStop(0.55, '#2E6FA8');
    earthGrad.addColorStop(1, '#0A2038');
    ctx.fillStyle = earthGrad;
    ctx.shadowColor = palette.accent2;
    ctx.shadowBlur = 24;
    ctx.beginPath();
    ctx.arc(EARTH.x, EARTH.y, 54, 0, TAU);
    ctx.fill();
    ctx.shadowBlur = 0;

    // 地球的轨道环
    ctx.strokeStyle = palette.accent2;
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(EARTH.x, EARTH.y, 92, 30, -0.28, 0, TAU);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // 地球上的一点高光
    ctx.fillStyle = 'rgba(220,245,255,0.55)';
    ctx.beginPath();
    ctx.ellipse(EARTH.x - 16, EARTH.y - 20, 16, 9, -0.6, 0, TAU);
    ctx.fill();
    ctx.restore();

    drawLabel(ctx, {
      x: EARTH.x,
      y: EARTH.y + 118,
      text: '地球',
      color: palette.text,
      font: '600 28px "Noto Sans SC", sans-serif',
      align: 'center',
    });

    // 光脉冲
    if (p > 0.005 && p < 1.005) {
      const head = bezierPoint(p);
      const core = ctx.createRadialGradient(head.x, head.y, 0, head.x, head.y, 46);
      core.addColorStop(0, '#FFFFFF');
      core.addColorStop(0.2, '#FFF3C4');
      core.addColorStop(0.55, 'rgba(255,193,94,0.75)');
      core.addColorStop(1, 'rgba(255,193,94,0)');
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(head.x, head.y, 46, 0, TAU);
      ctx.fill();
      drawDot(ctx, { x: head.x, y: head.y, r: 8, color: '#FFF8E0', glow: 30 });
      drawRing(ctx, { x: head.x, y: head.y, r: 22 + 10 * Math.sin(t * 5), color: palette.accent, width: 1.2, alpha: 0.5 });
    }

    // 轨迹说明
    drawLabel(ctx, {
      x: 965,
      y: 250,
      text: '约 8 分 20 秒',
      target: { x: 965, y: 340 },
      color: palette.accent2,
      font: '600 28px "Noto Sans SC", sans-serif',
      align: 'center',
      leaderColor: palette.accent2,
    });

    // 角标
    drawTag(ctx, {
      x: 120,
      y: 92,
      text: '科学 · 原理拆解',
      color: palette.accent2,
      bg: 'rgba(0,0,0,0.26)',
      border: 'rgba(127,208,255,0.3)',
    });

    // 光速计数
    ctx.save();
    ctx.font = '500 24px "Noto Sans SC", sans-serif';
    ctx.fillStyle = palette.muted;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText('真空中的光速', 1800, 140);
    ctx.restore();
    drawCounter(ctx, {
      x: 1800,
      y: 202,
      t,
      start: 0.3,
      duration: 1.5,
      from: 0,
      to: 299792458,
      decimals: 0,
      suffix: ' m/s',
      font: '800 54px "Noto Sans SC", sans-serif',
      color: palette.accent,
      align: 'right',
      glow: 'rgba(255,193,94,0.35)',
    });

    ctx.restore();
  },
};
