# 09 · 引擎 API

## 1. 渲染契约

页面必须暴露：

```js
window.renderAt = async function (t) {
  // t 是秒；把所有画面定位到这个时刻
};
```

渲染器 `tools/render_video.py` 会：

1. 用本地 HTTP 服务加载 `index.html?export=1`；
2. 等 `document.fonts.ready` 与 `window.__episodeReady`；
3. 按 `t = frame / fps` 逐帧调用 `renderAt(t)`；
4. 截图并交给 FFmpeg。

引擎已经实现这个契约，只需写场景。

## 2. episode.json

```json
{
  "slug": "001-sky-blue",
  "title": "天空为什么是蓝的",
  "genre": "science",
  "palette": "science",
  "width": 1920,
  "height": 1080,
  "fps": 30,
  "duration": 24,
  "audio": {
    "src": "assets/audio/bgm.mp3",
    "bpm": 120,
    "offset": 0,
    "loop": true,
    "volume": 0.9,
    "fadeOut": 1.5
  },
  "styleRefs": {
    "motion": "M21 原理拆解",
    "art": "E1 极简几何",
    "layout": "F1 图表生长"
  },
  "scenes": [
    { "id": "hook", "module": "scenes/01-hook.js", "start": 0, "duration": 8, "palette": "science" },
    { "id": "mechanism", "module": "scenes/02-mechanism.js", "start": 8, "duration": 16, "palette": "science" }
  ],
  "titles": [
    { "start": 1.0, "end": 3.0, "text": "天空为什么是【蓝】的？", "y": 360 }
  ],
  "subtitles": [
    { "start": 0.4, "end": 3.2, "text": "你每天抬头看到的【蓝色】", "position": "bottom" }
  ],
  "sources": "sources.md",
  "notes": "notes.md"
}
```

- `scenes[].start` 必须连续；`start + duration` 之和等于 `duration`。
- 场景可以覆盖 `palette`（`history` / `science` / `investing`）。
- `titles` 是全局标题卡；`subtitles` 是全局字幕。
- `【】` 包住的是金色关键词。
- `audio` 可选；填了 `bpm` 后，场景里会得到 `env.beat`（见第 4 节）。`src` 相对项目根目录或 episode 目录。

## 3. 场景模块

```js
import { drawTag, drawDot, drawRing } from '../../../engine/components.js';
import { clamp, easeOutCubic } from '../../../engine/math.js';

export default {
  draw(ctx, t, env) {
    // t 是本场景内的秒数（0 到 scene.duration）
    // env.width / env.height / env.palette / env.duration / env.episode / env.scenes
    // env.beat（配置了 audio.bpm 时存在）/ env.globalT（全片秒数）/ env.sceneStart
  },
};
```

规则：

- 只依赖 `t` 和固定种子；不要读真实时间。
- 一个场景文件只负责一个段落。
- 不要在场景里改全局 `episode.json` 的时间轴。
- 需要随机时用 `seeded(seed)`，不要 `Math.random()`。

## 4. env

| 字段 | 说明 |
|---|---|
| `width`, `height` | 1920 × 1080 |
| `duration` | 全片时长（秒） |
| `fps` | 30 |
| `palette` | 当前场景的调色板（场景可覆盖） |
| `episode` | 完整 episode.json |
| `scenes` | 场景数组（含 start/duration/id） |
| `beat` | 节拍工具；配置了 `audio.bpm` 时存在，否则为 `null` |
| `globalT` | 当前全片时间（秒） |
| `sceneStart` | 当前场景在全局时间轴上的起点（秒） |

### 4.1 beat

```js
const pulse = env.beat.pulse(env.globalT, { power: 2 }); // 正拍 1 → 下一拍 0
const idx = env.beat.beatIndex(env.globalT);              // 第几拍（小数）
const tBeat = env.beat.beatTime(8);                       // 第 8 拍的秒数
const fBeat = env.beat.beatFrame(8);                      // 第 8 拍的帧号
const snapped = env.beat.snap(env.globalT, 2);            // 吸附到半拍
```

常用属性：`bpm`、`offset`、`secondsPerBeat`、`framesPerBeat`。
常用方法：`beatTime(n)`、`beatFrame(n)`、`beatIndex(t)`、`phase(t, subdivision)`、`pulse(t, opts)`、`snap(t, subdivision)`、`grid(fromBeat, toBeat, subdivision)`。

> 注意：`t` 是场景内时间，`env.globalT` 才是全片时间；卡点用 `env.globalT`。

## 5. 组件

从 `engine/components.js` 导入：

### 背景

```js
drawBackground(ctx, palette, t, width, height)
```

引擎已经每帧调用；场景一般不需要再画全屏背景。如果要局部覆盖，直接画。

### 字幕 / 标题卡

```js
drawSubtitle(ctx, cue, t, env)
drawTitleCard(ctx, cue, t, env)
```

引擎自动处理 `episode.json` 里的 `subtitles` / `titles`；一般不需要手动调用。

### 标签 / 注释

```js
drawTag(ctx, { x, y, text, color, bg, border, font, paddingX, paddingY });
drawLabel(ctx, { x, y, text, target, color, font, align, leaderColor });
```

- `drawTag` 返回标签宽度。
- `drawLabel` 的 `target` 是 `{x, y}`，会画虚线引导线和小圆点。

### 数字

```js
drawCounter(ctx, {
  x, y, t, start, duration, from, to,
  font, color, decimals, prefix, suffix, align, glow, bounce
});
```

- 滚动 20–40 帧；`bounce` 默认开启。
- 返回当前值。

### 图表

```js
const chart = drawBarChart(ctx, {
  x, y, w, h, values, labels, t, start, duration,
  barColor, highlightColor, lineColor, textColor, mutedColor,
  showValues, showLine, valueDecimals
});
// chart.tops / chart.baseline / chart.gap / chart.barW
```

### 时间线

```js
drawTimeline(ctx, {
  x, y, width, progress, nodes, t,
  color, muted, textColor, lineColor, font
});
```

`nodes` 是 `[{ label, sub }]`。

### 纸卡 / 光效

```js
drawPaperCard(ctx, { x, y, w, h, fill, radius, shadow, border });
drawGlowLine(ctx, { points, color, width, blur, alpha });
drawDot(ctx, { x, y, r, color, glow });
drawRing(ctx, { x, y, r, color, width, alpha, dash });
```

### 信息条

```js
drawInfoBar(ctx, env, { left, right, progress, y });
```

## 6. 调色板

`engine/palettes.js`：

- `science`：深蓝黑 + 金 + 冷青；
- `history`：暗琥珀 + 羊皮纸 + 旧金 + 铁锈红；
- `investing`：墨绿黑 + 奶油纸 + 红/蓝。

不要在场景里硬编码颜色；用 `env.palette`。需要局部色时从 palette 派生。

## 7. 调试

| URL | 作用 |
|---|---|
| `?t=7.5` | 只画第 7.5 秒 |
| `?export=1` | 导出模式：不启动实时循环，只画第 0 帧 |
| `?debug=1` | 显示安全区、时间码、场景 id |

示例：

```
http://localhost:8080/episodes/000-style-test/?t=5&debug=1
```

## 8. 性能建议

- 不要在每帧创建大量对象/渐变；能缓存的缓存。
- 上万粒子用 `Points` / `InstancedMesh`。
- 长片分段渲染。
- 先渲 5–10 秒小段，再渲全片。
