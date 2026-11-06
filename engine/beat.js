// 音乐节拍工具：把 BPM、第一拍偏移、帧率变成可复用的时间函数。
// 只做数学，不读音频；BPM 和 offset 由 episode.json 的 audio 配置提供。
import { clamp } from './math.js';

export function createBeat({ bpm = 120, offset = 0, fps = 30 } = {}) {
  const safeBpm = Math.max(1, Number(bpm) || 120);
  const secondsPerBeat = 60 / safeBpm;
  const framesPerBeat = secondsPerBeat * fps;
  const firstBeat = Number(offset) || 0;

  // 第 n 拍（n 可以是小数）的秒数 / 帧号
  const beatTime = (n) => firstBeat + n * secondsPerBeat;
  const beatFrame = (n) => Math.round(beatTime(n) * fps);

  // t 处于第几拍（可以是小数；t < offset 时为负）
  const beatIndex = (t) => (Number(t) - firstBeat) / secondsPerBeat;

  // t 在某一拍内的相位：0 = 正拍，1 = 下一拍前
  const phase = (t, subdivision = 1) => {
    const period = secondsPerBeat / Math.max(1, subdivision);
    const x = (Number(t) - firstBeat) % period;
    return (x + period) % period / period;
  };

  // 节拍脉冲：正拍为 1，逐渐衰减到 0。power 越大，衰减越快。
  const pulse = (t, { subdivision = 1, power = 2 } = {}) => {
    const p = phase(t, subdivision);
    return Math.pow(1 - p, power);
  };

  // 把任意时间吸附到最近的拍/细分拍
  const snap = (t, subdivision = 1) => {
    const period = secondsPerBeat / Math.max(1, subdivision);
    return firstBeat + Math.round((Number(t) - firstBeat) / period) * period;
  };

  // 生成 [fromBeat, toBeat) 的拍点表，方便写分镜
  const grid = (fromBeat, toBeat, subdivision = 1) => {
    const step = 1 / Math.max(1, subdivision);
    const points = [];
    for (let n = fromBeat; n < toBeat; n += step) {
      const b = Math.round(n * 1000) / 1000;
      points.push({
        beat: b,
        time: beatTime(b),
        frame: beatFrame(b),
      });
    }
    return points;
  };

  return {
    bpm: safeBpm,
    fps,
    offset: firstBeat,
    secondsPerBeat,
    framesPerBeat,
    beatTime,
    beatFrame,
    beatIndex,
    phase,
    pulse,
    snap,
    grid,
    // 常用换算
    beatsForSeconds: (seconds) => seconds / secondsPerBeat,
    secondsForBeats: (beats) => beats * secondsPerBeat,
    // 节拍强度：每 4 拍一个重音，返回 1（重拍）或 0（弱拍）
    isDownbeat: (t, every = 4) => {
      const idx = Math.round(beatIndex(t));
      return ((idx % every) + every) % every === 0;
    },
    clampPhase: (t, subdivision = 1) => clamp(phase(t, subdivision)),
  };
}
