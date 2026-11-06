# 科普视频工坊 · 项目说明

## 这是什么

用代码动画制作 2–3 分钟横屏科普视频（历史 / 科学 / 投资）。画面由 HTML + Canvas 逐帧绘制，`window.renderAt(t)` 是唯一时间接口，FFmpeg 编码为 MP4。风格素材来自 `code-animation-prompts` 技能（341 种提示词），制作规范来自本地教程《AI视频副业攻略.pdf》。

完整教程已整理为 `AI视频制作手册.md`（含四个案例的完整提示词、执行协议、郑和下西洋示例）。

## 当前状态（2026-11-06）

- 项目初始化完成：引擎、三套视觉预设、模板、工具链、文档。
- 已有三个测试片：`000-style-test`（12s）、`000-3d-test`（8s）、`000-beat-test`（12s BGM 卡点）。
- 已有一期正式样片：`001-climate-instability`《天气为什么越来越没准》。
- 技能已放进项目内 `.claude/skills/code-animation-prompts`，不依赖项目外目录。
- **新选题仍要先给选题卡，不要未经用户确认就开工一整期。**

## 开工前必读

按顺序读：

0. `AI视频制作手册.md`（完整教程 + 执行协议 + 郑和示例）
1. `docs/01-制作流程.md`
2. `docs/02-选题与大纲.md`
3. `docs/03-分镜规范.md`
4. `docs/04-视觉规范.md`
5. `docs/06-风格选型.md`
6. 当前期目录的 `outline.md` / `storyboard.md` / `sources.md` / `notes.md`

## 硬流程（不要跳步）

```
选题评分 → 大纲 → 分镜表 → 事实核查 → 风格选型 → 15 秒样片 → 全片 → 质检 → 交付
```

- 用户没有确定选题时：先给 2–3 个候选，按 `templates/选题评估表.md` 打分，说明钩子、画面、风险，等用户选。
- 没有 `outline.md` 和 `storyboard.md`，不要写场景代码。
- 没有 `sources.md`，不要写任何具体数字/年份/人名进画面。
- 先做 15 秒样片和 6 张关键帧截图，再渲全片。
- 每次只改一两个地方，改完看截图，不要一次改十个地方。

## 目录

```
engine/                 共享引擎（不要每期复制）
  engine.js             renderAt(t)、场景调度、字幕/标题叠加
  components.js         背景、字幕、标题卡、数字、图表、时间线
  beat.js               BPM / 节拍脉冲
  palettes.js           三套颜色预设
  math.js               缓动、固定种子随机、数字格式
  vendor/three/         Three.js r187（MIT）
.claude/skills/
  code-animation-prompts/  项目内技能（341 风格 + 196 静帧），随仓库提交
episodes/
  _template/            新一期模板
  000-style-test/       12 秒三风格测试片
  000-3d-test/          8 秒 Three.js 测试片
  000-beat-test/        12 秒 BGM 卡点测试片
assets/
  fonts/                Noto Sans SC / Noto Serif SC
  audio/  images/  data/
references/
  AI视频副业攻略.pdf     教程原文（内部使用）
tools/
  render_video.py       逐帧渲染 MP4（支持 episode.json 的 audio）
  snapshot.py           关键帧截图
  check_episode.py      结构/时间轴/字幕检查
  export_srt.py         导出 SRT
  stitch.py             拼接分段渲染
  verify_video.py       校验成片编码规格（--allow-audio / --require-audio）
  beat_grid.py          生成 BPM 拍点表
  make_test_beat.py     生成测试节拍 WAV
  new_episode.py        从模板新建一期
docs/                   流程、选题、分镜、视觉、风格、质检、许可、API、Git
templates/              选题评估、大纲、分镜、事实核查、发布包
```

## 引擎规则

- 页面必须暴露 `window.renderAt(t)`；引擎已实现。
- 画面只能由 `t` 和固定种子决定：禁止 `Math.random()`、`setTimeout`、`requestAnimationFrame` 驱动画面。
- 场景模块签名：`export default { draw(ctx, t, env) }`，`t` 是本场景内的秒数。
- 场景时间轴写在 `episode.json` 的 `scenes`（start/duration），不要写死在代码里。
- 字幕写在 `episode.json` 的 `subtitles`；`【】` 渲染为金色关键词。
- 修改颜色/字号优先改 `engine/palettes.js`、`engine/components.js`，不要每期散落硬编码。
- 场景可用 `palette` 字段覆盖该场景的调色板（见 `000-style-test`）。
- 3D 场景用本地化的 `engine/vendor/three/three.module.js`；参考 `episodes/000-3d-test/`：离屏 WebGL 渲染后 `drawImage` 到 2D canvas，字幕仍由引擎绘制。
- BGM/卡点：`episode.json` 的 `audio` 配置驱动 `env.beat`；场景里用 `env.beat.pulse(env.globalT)`；参考 `episodes/000-beat-test/`。
- 音频默认不生成；渲染器只负责把现成音轨挂上去。无音轨时交付必须说明「无声」。 

## 视觉规格（简版）

- 1920×1080，30fps，H.264，yuv420p，≥12 Mbps。
- 字幕：Noto Sans SC 700，64px，白色，字间距 2px，距顶约 690px，最多两行；关键词 `#FFC15E`。
- 金句：Noto Serif SC 900，96–150px，暖白 `#FFF3DC`，外发光。
- 开头 3 秒内出钩子；第 1 帧画面完整，不从黑场淡入。
- 不允许画面静止超过 3 秒；镜头始终缓慢运动。
- 数字滚动 20–40 帧，停下轻微回弹。
- 详细规范见 `docs/04-视觉规范.md`。

## 风格选型

- 技能目录：`.claude/skills/code-animation-prompts`（项目内，随仓库提交）
- 先检索目录，再读选中的 `.md`；不要一次加载全部提示词。
- 组合规则：1 个主画风 + 1 个运动语法 + 1 个版式/数据风格，不要机械叠加。
- 三种默认配方见 `docs/06-风格选型.md`。
- 记录编号和名称到 `episode.json` 的 `styleRefs`。
- B6 只存在于 `assets/library/示例/`，不在 341 条目录里；不要冒充。

## 常用命令

```bash
# 预览（项目根目录）
python -m http.server 8080
# 浏览器打开 http://localhost:8080/episodes/000-style-test/

# 新建一期
python tools/new_episode.py 001-sky-blue --title "天空为什么是蓝的" --genre science

# 检查
python tools/check_episode.py episodes/000-style-test

# 关键帧
python tools/snapshot.py episodes/000-style-test --times 0,3,6,9,12

# 渲染（全片）
python tools/render_video.py episodes/000-style-test --output episodes/000-style-test/output/000-style-test.mp4

# 渲染（15 秒样片）
python tools/render_video.py episodes/000-style-test --start 0 --end 15 --output episodes/000-style-test/output/sample-15s.mp4

# 加音轨
python tools/render_video.py episodes/000-style-test --audio assets/audio/track.mp3 --output episodes/000-style-test/output/with-audio.mp4

# 导出字幕
python tools/export_srt.py episodes/000-style-test
```

## 交付

- 实际文件链接：`episodes/<slug>/output/<slug>.mp4`。
- 说明所用风格编号、运行方法、视频规格、声音状态。
- 没有实际渲染就不要说「已生成视频」；没有音轨就不要说「已配音」。
- 保留素材来源与第三方许可；免费分享约定见技能 `.claude/skills/code-animation-prompts/references/attribution.md`。
- 所有数字、年份、人名、引语必须能在 `sources.md` 找到来源。

## 禁止

- 不要用 AI 生成真实人物的脸。
- 不要用未经授权的音乐/图片/字体。
- 不要把中文放进 three.js 3D 文字几何体。
- 不要从黑场淡入开场。
- 不要把无声预览描述成成片。
- 不要未经用户确认直接开工一整期。
