// 确定性数学工具：所有动画只能依赖 t（秒）与固定种子。
export const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const invLerp = (a, b, v) => (b === a ? 0 : (v - a) / (b - a));
export const smoothstep = (t) => {
  const x = clamp(t);
  return x * x * (3 - 2 * x);
};

export const easeLinear = (t) => clamp(t);
export const easeInOutQuad = (t) => {
  const x = clamp(t);
  return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
};
export const easeInOutCubic = (t) => {
  const x = clamp(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
export const easeOutCubic = (t) => 1 - Math.pow(1 - clamp(t), 3);
export const easeOutQuart = (t) => 1 - Math.pow(1 - clamp(t), 4);
export const easeOutExpo = (t) => (clamp(t) === 1 ? 1 : 1 - Math.pow(2, -10 * clamp(t)));
export const easeInOutSine = (t) => -(Math.cos(Math.PI * clamp(t)) - 1) / 2;
export const easeOutBack = (t, s = 1.70158) => {
  const x = clamp(t) - 1;
  return 1 + (s + 1) * x * x * x + s * x * x;
};

// 0→1 的分段进度
export const progress = (t, start, duration) =>
  clamp((t - start) / Math.max(duration, 1e-6));

// 固定种子伪随机（mulberry32），同一 seed 每次渲染完全一致
export function seeded(seed = 1) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seededRange(rng, min, max) {
  return min + (max - min) * rng();
}

export function formatNumber(value, decimals = 0) {
  const fixed = Number(value).toFixed(decimals);
  const [intPart, decPart] = fixed.split('.');
  const withComma = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return decPart ? `${withComma}.${decPart}` : withComma;
}

export const TAU = Math.PI * 2;

export function roundRect(ctx, x, y, w, h, r = 0) {
  const radius = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}
