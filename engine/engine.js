// 浏览器动画引擎：window.renderAt(t) 是唯一时间接口。
// 画面完全由 t（秒）决定；同一 t 重复渲染结果一致。
import { clamp } from './math.js';
import { getPalette } from './palettes.js';
import { createBeat } from './beat.js';
import { drawBackground, drawSubtitle, drawTitleCard } from './components.js';

export async function startEpisode(episodeUrl) {
  let resolveReady;
  let rejectReady;
  window.__episodeError = null;
  window.__episodeReady = new Promise((resolve, reject) => {
    resolveReady = resolve;
    rejectReady = reject;
  });
  // 先放一个占位 renderAt，避免渲染器在场景模块加载完成前找不到函数。
  window.renderAt = async (t) => {
    await window.__episodeReady;
    if (window.__drawAt) window.__drawAt(t);
  };

  try {
    await boot(episodeUrl, { resolveReady, rejectReady });
  } catch (err) {
    window.__episodeError = String(err && err.stack ? err.stack : err);
    rejectReady(err);
    drawError(err);
    throw err;
  }
}

async function boot(episodeUrl, { resolveReady }) {
  const url = new URL(episodeUrl, location.href);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`无法读取 episode.json：HTTP ${response.status}`);
  const episode = await response.json();

  const canvas = document.getElementById('stage');
  if (!canvas) throw new Error('缺少 <canvas id="stage">');
  const ctx = canvas.getContext('2d', { alpha: false });
  const width = episode.width || 1920;
  const height = episode.height || 1080;
  canvas.width = width;
  canvas.height = height;
  canvas.style.width = '100%';
  canvas.style.height = '100%';

  const duration = Number(episode.duration) || 12;
  const fps = Number(episode.fps) || 30;
  const palette = getPalette(episode.palette);
  const audioConfig = episode.audio && typeof episode.audio === 'object' ? episode.audio : null;
  const beat = audioConfig && audioConfig.bpm
    ? createBeat({
        bpm: audioConfig.bpm,
        offset: audioConfig.offset || 0,
        fps,
      })
    : null;

  const scenes = [];
  for (const [index, def] of (episode.scenes || []).entries()) {
    const moduleUrl = new URL(def.module, url);
    const mod = await import(moduleUrl.href);
    const draw = mod.default && mod.default.draw ? mod.default.draw : mod.draw;
    if (typeof draw !== 'function') {
      throw new Error(`场景 ${def.id || index} 未导出 draw(ctx, t, env)`);
    }
    const start = def.start !== undefined
      ? Number(def.start)
      : scenes.reduce((sum, scene) => sum + scene.duration, 0);
    scenes.push({
      id: def.id || `scene-${index + 1}`,
      start,
      duration: Number(def.duration) || 0,
      paletteId: def.palette || null,
      draw,
    });
  }
  if (!scenes.length) throw new Error('episode.json 里没有 scenes');
  scenes.sort((a, b) => a.start - b.start);

  const env = {
    width,
    height,
    duration,
    fps,
    palette,
    episode,
    scenes,
    beat,
  };

  const subtitles = normalizeCues(episode.subtitles);
  const titles = normalizeCues(episode.titles);

  let readyResolved = false;
  const ready = (async () => {
    await loadFonts();
    readyResolved = true;
    resolveReady();
  })();
  window.__episodeMeta = {
    slug: episode.slug || '',
    title: episode.title || '',
    width,
    height,
    fps,
    duration,
    audio: audioConfig,
    beat: beat ? { bpm: beat.bpm, offset: beat.offset, secondsPerBeat: beat.secondsPerBeat } : null,
  };
  window.__episodeError = null;

  const params = new URLSearchParams(location.search);
  const debug = params.get('debug') === '1';

  function sceneAt(t) {
    let active = scenes[0];
    for (const scene of scenes) {
      if (t >= scene.start && t < scene.start + scene.duration) return scene;
      if (t >= scene.start) active = scene;
    }
    return active;
  }

  function drawFrame(t) {
    const time = clamp(Number(t) || 0, 0, Math.max(0, duration - 0.0001));
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';

    const scene = sceneAt(time);
    const activePalette = scene && scene.paletteId ? getPalette(scene.paletteId) : palette;
    const activeEnv = {
      ...env,
      palette: activePalette,
      globalT: time,
      sceneStart: scene ? scene.start : 0,
    };
    drawBackground(ctx, activePalette, time, width, height);

    if (scene) {
      ctx.save();
      scene.draw(ctx, time - scene.start, activeEnv);
      ctx.restore();
    }

    for (const cue of titles) drawTitleCard(ctx, cue, time, activeEnv);
    for (const cue of subtitles) drawSubtitle(ctx, cue, time, activeEnv);
    if (debug) drawDebug(ctx, time, scene, activeEnv);
  }

  // 字体就绪前 renderAt 也可被调用：先等 ready，再画。
  window.__drawAt = (t) => drawFrame(t);
  window.renderAt = async (t) => {
    await ready;
    drawFrame(t);
  };

  await ready;

  if (params.has('t')) {
    drawFrame(Number(params.get('t')) || 0);
  } else if (params.has('export')) {
    drawFrame(0);
  } else {
    const startedAt = performance.now();
    const loop = (now) => {
      if (!readyResolved) return;
      drawFrame(((now - startedAt) / 1000) % duration);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  // 便于在控制台做逐秒检查
}

function normalizeCues(cues) {
  return (cues || [])
    .map((cue) => ({
      ...cue,
      start: Number(cue.start) || 0,
      end: Number(cue.end) || 0,
      text: String(cue.text || ''),
    }))
    .filter((cue) => cue.text && cue.end > cue.start)
    .sort((a, b) => a.start - b.start);
}

async function loadFonts() {
  if (!document.fonts) return;
  const loads = [
    document.fonts.load('700 64px "Noto Sans SC"'),
    document.fonts.load('800 64px "Noto Sans SC"'),
    document.fonts.load('900 120px "Noto Serif SC"'),
    document.fonts.load('500 24px "Noto Sans SC"'),
  ];
  try {
    await Promise.all(loads);
    await document.fonts.ready;
  } catch (err) {
    console.warn('字体加载失败，将使用系统字体回退：', err);
  }
}

function drawDebug(ctx, t, scene, env) {
  const { width, height } = env;
  ctx.save();
  ctx.strokeStyle = 'rgba(0,255,200,0.32)';
  ctx.lineWidth = 1;
  ctx.setLineDash([8, 8]);
  ctx.strokeRect(64, 48, width - 128, height - 96);
  ctx.strokeStyle = 'rgba(255,80,80,0.18)';
  ctx.strokeRect(120, 110, width - 240, height - 220);
  ctx.setLineDash([]);
  ctx.font = '500 22px monospace';
  ctx.fillStyle = 'rgba(0,255,200,0.9)';
  const label = `t=${t.toFixed(3)}s  scene=${scene ? scene.id : '-'}  local=${scene ? (t - scene.start).toFixed(3) : '-'}`;
  ctx.fillText(label, 72, 32);
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fillText(`${env.width}x${env.height} @ ${env.fps}fps`, width - 320, 32);
  ctx.restore();
}

function drawError(err) {
  const canvas = document.getElementById('stage');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width || 1920;
  const h = canvas.height || 1080;
  ctx.fillStyle = '#12060a';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#ff6b6b';
  ctx.font = '700 40px monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('渲染初始化失败', 80, 100);
  ctx.fillStyle = '#ffd7d7';
  ctx.font = '500 26px monospace';
  const lines = String(err && err.message ? err.message : err).split('\n');
  lines.slice(0, 16).forEach((line, i) => ctx.fillText(line.slice(0, 100), 80, 180 + i * 36));
  ctx.fillStyle = '#ffb0b0';
  ctx.font = '500 24px monospace';
  ctx.fillText('检查 episode.json、场景模块路径和浏览器控制台。', 80, h - 100);
}
