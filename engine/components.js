// 可复用的画面组件：背景、字幕、标题卡、数字、图表、时间线、信息条。
// 所有组件只接收 t（秒），不读取真实时间、不使用随机数。
import {
  clamp,
  lerp,
  easeOutCubic,
  easeInOutCubic,
  easeOutBack,
  formatNumber,
  roundRect,
  seeded,
  seededRange,
  TAU,
} from './math.js';

const NO_START = new Set('，。！？、；：）》」』】…,.!?;:)]}');
const NO_END = new Set('（《「『【([{');

/* ------------------------------------------------------------------ */
/* 背景                                                                 */
/* ------------------------------------------------------------------ */

export function drawBackground(ctx, palette, t, w, h) {
  const grad = ctx.createLinearGradient(0, 0, w * 0.25, h);
  grad.addColorStop(0, palette.bg0);
  grad.addColorStop(1, palette.bg1);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  if (palette.bgType === 'paper') drawPaperTexture(ctx, palette, t, w, h);
  else if (palette.bgType === 'grid') drawGridTexture(ctx, palette, t, w, h);
  else drawStarfield(ctx, t, w, h);

  drawVignette(ctx, palette, w, h);
}

function drawStarfield(ctx, t, w, h) {
  const rng = seeded(20260401);
  ctx.save();
  for (let i = 0; i < 170; i++) {
    const baseX = seededRange(rng, 0, w);
    const y = seededRange(rng, 0, h * 0.92);
    const r = seededRange(rng, 0.5, 2.1);
    const period = seededRange(rng, 2.4, 6.5);
    const phase = seededRange(rng, 0, TAU);
    const x = (baseX + t * (4 + (i % 5))) % w;
    const alpha = 0.12 + 0.42 * (0.5 + 0.5 * Math.sin(t * (TAU / period) + phase));
    ctx.globalAlpha = alpha;
    ctx.fillStyle = i % 11 === 0 ? '#FFE3B0' : '#C9E6FF';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
  }
  // 两团很淡的星云光
  ctx.globalAlpha = 0.1;
  const nebula = ctx.createRadialGradient(w * 0.22, h * 0.22, 0, w * 0.22, h * 0.22, w * 0.45);
  nebula.addColorStop(0, 'rgba(127,208,255,0.5)');
  nebula.addColorStop(1, 'rgba(127,208,255,0)');
  ctx.fillStyle = nebula;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

function drawPaperTexture(ctx, palette, t, w, h) {
  const rng = seeded(19940601);
  ctx.save();
  // 纸张纤维
  for (let i = 0; i < 110; i++) {
    const y = seededRange(rng, 0, h);
    const x = seededRange(rng, 0, w);
    const len = seededRange(rng, 20, 180);
    ctx.globalAlpha = seededRange(rng, 0.015, 0.05);
    ctx.strokeStyle = i % 3 === 0 ? palette.accent : '#F2E7D3';
    ctx.lineWidth = seededRange(rng, 0.5, 1.2);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + len, y + seededRange(rng, -2, 2));
    ctx.stroke();
  }
  // 淡淡的点阵，像旧纸上的坐标格
  ctx.globalAlpha = 0.05;
  ctx.fillStyle = palette.accent;
  for (let x = 60; x < w; x += 64) {
    for (let y = 56; y < h; y += 64) {
      ctx.beginPath();
      ctx.arc(x, y, 0.8, 0, TAU);
      ctx.fill();
    }
  }
  // 左上暖光
  ctx.globalAlpha = 0.16;
  const warm = ctx.createRadialGradient(w * 0.18, h * 0.12, 0, w * 0.18, h * 0.12, w * 0.75);
  warm.addColorStop(0, 'rgba(216,168,78,0.55)');
  warm.addColorStop(1, 'rgba(216,168,78,0)');
  ctx.fillStyle = warm;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

function drawGridTexture(ctx, palette, t, w, h) {
  ctx.save();
  ctx.strokeStyle = palette.grid;
  ctx.lineWidth = 1;
  const gap = 72;
  const drift = (t * 5) % gap;
  for (let x = -gap + drift; x < w + gap; x += gap) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = -gap + drift * 0.5; y < h + gap; y += gap) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  const glow = ctx.createRadialGradient(w * 0.72, h * 0.28, 0, w * 0.72, h * 0.28, w * 0.62);
  glow.addColorStop(0, 'rgba(224,177,92,0.09)');
  glow.addColorStop(1, 'rgba(224,177,92,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

function drawVignette(ctx, palette, w, h) {
  const vignette = ctx.createRadialGradient(
    w / 2, h * 0.48, Math.min(w, h) * 0.36,
    w / 2, h * 0.48, Math.max(w, h) * 0.78,
  );
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, `rgba(0,0,0,${palette.vignette})`);
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);
}

/* ------------------------------------------------------------------ */
/* 富文本：用【】标出金色关键词                                          */
/* ------------------------------------------------------------------ */

function tokenizeRich(text) {
  const tokens = [];
  let highlight = false;
  for (const ch of String(text)) {
    if (ch === '【') { highlight = true; continue; }
    if (ch === '】') { highlight = false; continue; }
    if (ch === '\n') { tokens.push({ br: true }); continue; }
    tokens.push({ ch, highlight });
  }
  return tokens;
}

function layoutRich(ctx, text, { fontNormal, fontHighlight, maxWidth, letterSpacing = 0 }) {
  const tokens = tokenizeRich(text);
  const lines = [[]];
  let width = 0;
  for (const token of tokens) {
    if (token.br) {
      lines.push([]);
      width = 0;
      continue;
    }
    ctx.font = token.highlight ? fontHighlight : fontNormal;
    const w = ctx.measureText(token.ch).width + letterSpacing;
    if (width + w > maxWidth && lines[lines.length - 1].length > 0) {
      if (!NO_START.has(token.ch)) {
        const prev = lines[lines.length - 1];
        const carry = [];
        while (prev.length && NO_END.has(prev[prev.length - 1].ch)) {
          carry.unshift(prev.pop());
        }
        const newLine = carry.map((c) => ({ ...c }));
        lines.push(newLine);
        width = newLine.reduce((sum, c) => sum + c.w, 0);
      }
    }
    lines[lines.length - 1].push({ ...token, w });
    width += w;
  }
  return lines;
}

function drawRichLines(ctx, lines, {
  x,
  y,
  lineHeight,
  fontNormal,
  fontHighlight,
  color,
  highlightColor,
  align = 'center',
  shadow = null,
}) {
  lines.forEach((line, i) => {
    const total = line.reduce((sum, token) => sum + token.w, 0);
    let cx = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
    const cy = y + lineHeight * (i + 0.5);
    for (const token of line) {
      ctx.font = token.highlight ? fontHighlight : fontNormal;
      ctx.fillStyle = token.highlight ? highlightColor : color;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      if (shadow) {
        ctx.shadowColor = shadow.color;
        ctx.shadowBlur = shadow.blur;
        ctx.shadowOffsetY = shadow.offsetY || 0;
      } else {
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;
      }
      ctx.fillText(token.ch, cx, cy);
      cx += token.w;
    }
  });
}

/* ------------------------------------------------------------------ */
/* 字幕                                                                 */
/* ------------------------------------------------------------------ */

export function drawSubtitle(ctx, cue, t, env) {
  if (t < cue.start || t > cue.end) return;
  const { width, palette } = env;
  const fade = 0.233; // 7 帧 @30fps
  const inP = easeOutCubic(clamp((t - cue.start) / fade));
  const outP = easeOutCubic(clamp((cue.end - t) / fade));
  const alpha = Math.min(inP, outP);
  if (alpha <= 0.001) return;

  const fontSize = cue.fontSize || env.episode?.subtitleFontSize || 64;
  const lineHeight = fontSize * 1.34;
  const maxWidth = cue.maxWidth || 1640;
  const fontNormal = `700 ${fontSize}px ${palette.fontBody}`;
  const fontHighlight = `800 ${fontSize}px ${palette.fontBody}`;
  const lines = layoutRich(ctx, cue.text, { fontNormal, fontHighlight, maxWidth, letterSpacing: 2 });

  const blockTop = cue.position === 'top' ? (cue.y ?? 110) : (cue.y ?? 690);
  const anchorX = cue.alignX ?? width / 2;
  const dy = (1 - inP) * 12;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(0, dy);
  // 先画一层更大的柔光阴影，再画清晰的一层，保证任何背景都读得清
  drawRichLines(ctx, lines, {
    x: anchorX, y: blockTop, lineHeight, fontNormal, fontHighlight,
    color: palette.subtitleColor, highlightColor: palette.subtitleHighlight,
    align: cue.align || 'center',
    shadow: { color: 'rgba(0,0,0,0.8)', blur: 30, offsetY: 0 },
  });
  drawRichLines(ctx, lines, {
    x: anchorX, y: blockTop, lineHeight, fontNormal, fontHighlight,
    color: palette.subtitleColor, highlightColor: palette.subtitleHighlight,
    align: cue.align || 'center',
    shadow: { color: palette.subtitleShadow, blur: 8, offsetY: 2 },
  });
  ctx.restore();

  if (lines.length > 2) {
    console.warn(`[subtitle] ${lines.length} 行，超过规范的两行：`, cue.text);
  }
}

/* ------------------------------------------------------------------ */
/* 标题卡 / 金句                                                        */
/* ------------------------------------------------------------------ */

export function drawTitleCard(ctx, cue, t, env) {
  if (t < cue.start || t > cue.end) return;
  const { width, palette } = env;
  const inP = easeOutCubic(clamp((t - cue.start) / 0.35));
  const outP = easeOutCubic(clamp((cue.end - t) / 0.3));
  const alpha = Math.min(inP, outP);
  if (alpha <= 0.001) return;

  const fontSize = cue.fontSize || 120;
  const lineHeight = fontSize * 1.22;
  const maxWidth = cue.maxWidth || 1580;
  const fontNormal = `900 ${fontSize}px ${palette.fontTitle}`;
  const fontHighlight = `900 ${fontSize}px ${palette.fontTitle}`;
  const lines = layoutRich(ctx, cue.text, { fontNormal, fontHighlight, maxWidth, letterSpacing: 4 });
  const blockHeight = lineHeight * lines.length;
  const scale = 1.1 - 0.1 * inP;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(width / 2, cue.y ?? 430);
  ctx.scale(scale, scale);
  drawRichLines(ctx, lines, {
    x: 0, y: -blockHeight / 2, lineHeight, fontNormal, fontHighlight,
    color: palette.titleColor, highlightColor: palette.accent, align: 'center',
    shadow: { color: palette.titleGlow, blur: 40, offsetY: 0 },
  });
  if (cue.subtext) {
    ctx.font = `500 32px ${palette.fontBody}`;
    ctx.fillStyle = palette.muted;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.fillText(cue.subtext, 0, blockHeight / 2 + 46);
  }
  ctx.restore();
}

/* ------------------------------------------------------------------ */
/* 信息条 / 标签                                                        */
/* ------------------------------------------------------------------ */

export function drawInfoBar(ctx, env, { left = '', right = '', progress = null, y = null } = {}) {
  const { width, height, palette } = env;
  const x0 = 120;
  const x1 = width - 120;
  const lineY = y ?? height - 78;
  ctx.save();
  ctx.strokeStyle = palette.muted;
  ctx.globalAlpha = 0.28;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x0, lineY);
  ctx.lineTo(x1, lineY);
  ctx.stroke();

  if (progress !== null) {
    ctx.globalAlpha = 1;
    ctx.strokeStyle = palette.accent;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = palette.accent;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(x0, lineY);
    ctx.lineTo(x0 + (x1 - x0) * clamp(progress), lineY);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  ctx.globalAlpha = 1;
  ctx.font = `500 24px ${palette.fontBody}`;
  ctx.textBaseline = 'middle';
  if (left) {
    ctx.fillStyle = palette.muted;
    ctx.textAlign = 'left';
    ctx.fillText(left, x0, lineY + 30);
  }
  if (right) {
    ctx.fillStyle = palette.accent;
    ctx.textAlign = 'right';
    ctx.fillText(right, x1, lineY + 30);
  }
  ctx.restore();
}

export function drawTag(ctx, { x, y, text, color, bg = 'rgba(0,0,0,0.28)', border = null, font = null, paddingX = 20, paddingY = 10 }) {
  ctx.save();
  ctx.font = font || `600 26px "Noto Sans SC", sans-serif`;
  const w = ctx.measureText(text).width + paddingX * 2;
  const h = 52;
  roundRect(ctx, x, y, w, h, 10);
  ctx.fillStyle = bg;
  ctx.fill();
  if (border) {
    ctx.strokeStyle = border;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  ctx.fillStyle = color;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + paddingX, y + h / 2);
  ctx.restore();
  return w;
}

export function drawLabel(ctx, { x, y, text, target = null, color = '#F4F7FB', font = null, align = 'left', leaderColor = null }) {
  ctx.save();
  if (target) {
    ctx.strokeStyle = leaderColor || color;
    ctx.globalAlpha = 0.55;
    ctx.lineWidth = 1.2;
    ctx.setLineDash([3, 6]);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(target.x, target.y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
    ctx.fillStyle = leaderColor || color;
    ctx.beginPath();
    ctx.arc(target.x, target.y, 3.5, 0, TAU);
    ctx.fill();
  }
  ctx.font = font || `500 26px "Noto Sans SC", sans-serif`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
  ctx.restore();
}

/* ------------------------------------------------------------------ */
/* 数字 / 图表 / 时间线                                                  */
/* ------------------------------------------------------------------ */

export function drawCounter(ctx, {
  x, y, t, start, duration, from = 0, to = 100,
  font = null, color = '#FFC15E', decimals = 0, prefix = '', suffix = '',
  align = 'center', glow = null, bounce = true,
}) {
  const p = clamp((t - start) / Math.max(duration, 1e-6));
  const eased = easeOutCubic(p);
  const value = from + (to - from) * eased;
  const bump = bounce ? 1 + 0.055 * Math.sin(Math.PI * clamp((p - 0.78) / 0.22)) : 1;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(bump, bump);
  ctx.font = font || `800 120px "Noto Sans SC", sans-serif`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  if (glow) {
    ctx.shadowColor = glow;
    ctx.shadowBlur = 34;
  }
  ctx.fillText(prefix + formatNumber(value, decimals) + suffix, 0, 0);
  ctx.restore();
  return value;
}

export function drawBarChart(ctx, {
  x, y, w, h, values, labels = [], t, start = 0, duration = 1,
  barColor = '#5B8FD6', highlightColor = '#FFC15E', lineColor = '#E0B15C',
  textColor = '#1F2933', mutedColor = 'rgba(31,41,51,0.55)', font = null,
  showValues = true, showLine = true, valueDecimals = 0,
}) {
  const n = values.length;
  if (!n) return;
  const p = clamp((t - start) / Math.max(duration, 1e-6));
  const maxV = Math.max(...values) * 1.16;
  const baseline = y + h;
  const gap = w / n;
  const barW = gap * 0.54;
  const fontBody = font || `500 22px "Noto Sans SC", sans-serif`;

  ctx.save();
  // 网格
  ctx.strokeStyle = mutedColor;
  ctx.globalAlpha = 0.22;
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const gy = lerp(y, baseline, i / 4);
    ctx.beginPath();
    ctx.moveTo(x, gy);
    ctx.lineTo(x + w, gy);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  const tops = [];
  const stagger = 0.6 / n;
  for (let i = 0; i < n; i++) {
    const local = easeOutCubic(clamp((p - i * stagger) / 0.38));
    const bh = Math.max(2, (values[i] / maxV) * h * local);
    const bx = x + gap * i + (gap - barW) / 2;
    const by = baseline - bh;
    ctx.fillStyle = i === n - 1 ? highlightColor : barColor;
    ctx.globalAlpha = 0.94;
    roundRect(ctx, bx, by, barW, bh, Math.min(5, barW / 4));
    ctx.fill();
    ctx.globalAlpha = 1;
    tops.push({ x: bx + barW / 2, y: by, value: values[i], local });

    if (showValues && local > 0.92 && (i % Math.max(1, Math.floor(n / 6)) === 0 || i === n - 1)) {
      ctx.font = `600 20px "Noto Sans SC", sans-serif`;
      ctx.fillStyle = i === n - 1 ? highlightColor : textColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(formatNumber(values[i], valueDecimals), bx + barW / 2, by - 10);
    }
    if (labels[i]) {
      ctx.font = `400 19px "Noto Sans SC", sans-serif`;
      ctx.fillStyle = mutedColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(labels[i], bx + barW / 2, baseline + 14);
    }
  }

  if (showLine && p > 0.55) {
    const lp = clamp((p - 0.55) / 0.4);
    const count = Math.max(2, Math.floor(lp * (n - 1)) + 1);
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = lineColor;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(tops[0].x, tops[0].y);
    for (let i = 1; i < count; i++) {
      const prev = tops[i - 1];
      const cur = tops[i];
      const mx = (prev.x + cur.x) / 2;
      ctx.bezierCurveTo(mx, prev.y, mx, cur.y, cur.x, cur.y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
    for (let i = 0; i < count; i++) {
      ctx.fillStyle = lineColor;
      ctx.beginPath();
      ctx.arc(tops[i].x, tops[i].y, 3.2, 0, TAU);
      ctx.fill();
    }
  }
  ctx.restore();
  return { tops, baseline, gap, barW };
}

export function drawTimeline(ctx, {
  x, y, width, progress: p, nodes, t,
  color = '#D8A84E', muted = 'rgba(176,154,122,0.35)', textColor = '#F2E7D3',
  lineColor = null, font = null,
}) {
  const n = nodes.length;
  if (!n) return;
  const prog = clamp(p);
  const line = lineColor || color;
  ctx.save();
  // 底层轨道
  ctx.strokeStyle = muted;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + width, y);
  ctx.stroke();

  // 生长的主线
  ctx.strokeStyle = line;
  ctx.lineWidth = 3;
  ctx.shadowColor = line;
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + width * easeInOutCubic(prog), y);
  ctx.stroke();
  ctx.shadowBlur = 0;

  for (let i = 0; i < n; i++) {
    const pos = n === 1 ? 0 : i / (n - 1);
    const local = clamp((prog - pos * 0.92) / 0.08);
    if (local <= 0) continue;
    const nx = x + width * pos;
    const pop = easeOutBack(local);
    ctx.globalAlpha = clamp(local * 1.4);
    // 竖线与节点
    ctx.strokeStyle = line;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(nx, y - 12 * pop);
    ctx.lineTo(nx, y + 12 * pop);
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(nx, y, 5.5 * pop, 0, TAU);
    ctx.fill();
    ctx.shadowBlur = 0;

    const above = i % 2 === 0;
    const labelY = above ? y - 54 : y + 58;
    ctx.font = font || `700 30px "Noto Serif SC", serif`;
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(nodes[i].label, nx, labelY);
    if (nodes[i].sub) {
      ctx.font = `400 20px "Noto Sans SC", sans-serif`;
      ctx.fillStyle = 'rgba(242,231,211,0.6)';
      ctx.fillText(nodes[i].sub, nx, labelY + (above ? -32 : 30));
    }
  }
  ctx.restore();
}

/* ------------------------------------------------------------------ */
/* 纸卡 / 光效                                                          */
/* ------------------------------------------------------------------ */

export function drawPaperCard(ctx, { x, y, w, h, fill = '#F4EBDD', radius = 18, shadow = true, border = null }) {
  ctx.save();
  if (shadow) {
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 44;
    ctx.shadowOffsetY = 18;
  }
  ctx.fillStyle = fill;
  roundRect(ctx, x, y, w, h, radius);
  ctx.fill();
  ctx.restore();

  ctx.save();
  if (border) {
    ctx.strokeStyle = border;
    ctx.lineWidth = 2;
    roundRect(ctx, x, y, w, h, radius);
    ctx.stroke();
  }
  // 顶部一道很淡的高光，让纸卡有厚度
  const sheen = ctx.createLinearGradient(x, y, x, y + 12);
  sheen.addColorStop(0, 'rgba(255,255,255,0.5)');
  sheen.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = sheen;
  roundRect(ctx, x + 2, y + 2, w - 4, 10, radius);
  ctx.fill();
  ctx.restore();
}

export function drawGlowLine(ctx, { points, color = '#FFC15E', width = 2.5, blur = 14, alpha = 1 }) {
  if (!points || points.length < 2) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
  ctx.stroke();
  ctx.restore();
}

export function drawDot(ctx, { x, y, r = 4, color = '#FFC15E', glow = 12 }) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = glow;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
  ctx.restore();
}

export function drawRing(ctx, { x, y, r, color = '#7FD0FF', width = 1.5, alpha = 1, dash = [] }) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.setLineDash(dash);
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.stroke();
  ctx.restore();
}
