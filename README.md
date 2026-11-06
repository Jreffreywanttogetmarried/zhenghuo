# 科普视频工坊

> **新手或新 AI 先读 [`AI视频制作手册.md`](AI视频制作手册.md)**：完整教程整理版 + 本项目落地方法 + 选题→成片执行协议 + 郑和下西洋完整示例。
> 其他 AI 代理也可以先读 [`AGENTS.md`](AGENTS.md)；Cursor / Copilot / Trae 的规则文件分别在 `.cursor/rules/`、`.github/copilot-instructions.md`、`.trae/rules/`。

用代码动画做 2–3 分钟横屏科普视频（历史 / 科学 / 投资）。画面由 HTML + Canvas 逐帧绘制，`window.renderAt(t)` 驱动，FFmpeg 编码为 MP4。

## 现在有什么

- 一套可运行的浏览器动画引擎：背景、字幕、关键词高亮、标题卡、数字滚动、柱状图、时间线、信息条、BPM 节拍脉冲。
- 三套视觉预设：`science`（深蓝实验室）、`history`（暗色羊皮纸）、`investing`（墨绿 + 奶油纸卡）。
- 三个测试片：`000-style-test`（12 秒三风格）、`000-3d-test`（8 秒 Three.js）、`000-beat-test`（12 秒 BGM 卡点）。
- 一期正式样片：`001-climate-instability`《天气为什么越来越没准》。
- 一期模板：`episodes/_template/`。
- 项目内技能：`.claude/skills/code-animation-prompts`（341 风格，随仓库提交，不依赖项目外目录）。
- 工具链：渲染、截图、结构检查、SRT 导出、拼接、校验、BPM 拍点、测试节拍、新建一期。
- 文档：完整教程手册、流程、选题、分镜、视觉、风格选型、质检、许可、引擎 API、Git 结构。
- 字体：Noto Sans SC / Noto Serif SC（OFL）。

下一步可以从 `docs/02-选题与大纲.md` 的候选里选新题，或按 `AI视频制作手册.md` 第四部分的郑和示例继续做一期。

## 快速开始

需要：Python 3.10+、ffmpeg、Node.js（可选）、Playwright（可用系统 Edge/Chrome 代替 Playwright 自带 Chromium）。

```bash
# 安装渲染依赖（第一次）
python -m pip install playwright
python -m playwright install chromium

# 预览
python -m http.server 8080
# 打开 http://localhost:8080/episodes/000-style-test/

# 渲染 12 秒测试片
python tools/render_video.py episodes/000-style-test
# 没有 Playwright Chromium 时，可用系统 Edge：
python tools/render_video.py episodes/000-style-test --browser msedge

# 渲染 8 秒 3D 测试片
python tools/render_video.py episodes/000-3d-test --browser msedge

# 截关键帧
python tools/snapshot.py episodes/000-style-test --times 0,3,6,9,12

# 新建一期
python tools/new_episode.py 001-sky-blue --title "天空为什么是蓝的" --genre science
```

## 目录

```
engine/          动画引擎（renderAt、字幕、图表、调色板、节拍）
  vendor/three/  Three.js r187（MIT，已本地化）
episodes/        每期一个目录（_template 模板，000-* 测试片，001-* 正式期）
assets/          字体、音频、图片、数据
.claude/skills/  项目内 code-animation-prompts 技能（341 风格，随仓库提交）
references/      教程原文与参考
tools/           渲染、截图、检查、SRT、拼接、校验、节拍、新建
docs/            流程 / 选题 / 分镜 / 视觉 / 风格 / 质检 / 许可 / API / Git
templates/       选题评估、大纲、分镜、事实核查、发布包
```

## 制作流程

```
选题评分 → 大纲 → 分镜表 → 事实核查 → 风格选型 → 15 秒样片 → 全片 → 质检 → 发布包
```

详细步骤见 `docs/01-制作流程.md`。核心规则：

- 开头 3 秒内出钩子，第 1 帧不是黑场；
- 字幕 64px，每秒 6–7 个字，单句 2–3 秒，最多两行；
- 画面不允许静止超过 3 秒；
- 所有数字、年份、人名、引语必须能查到来源；
- 先做 15 秒样片，再渲全片。

## 视频规格

- 1920×1080，30fps
- H.264，yuv420p，≥12 Mbps（渲染器默认 14M CBR）
- 默认无配音，字幕即旁白；有音轨时 AAC 192kbps

## 风格

风格素材来自 `code-animation-prompts` 技能的 341 种提示词。选型规则：**1 个主画风 + 1 个运动语法 + 1 个版式/数据风格**，不要机械叠加。

三个默认配方：

| 方向 | 运动 | 画风 | 版式/数据 |
|---|---|---|---|
| 历史 | M20 时间线/历史 | K35 旧学院风 / L16 档案灯箱 | L5 视觉调查 |
| 科学 | M21 原理拆解 / M18 科学讲解 | E1 极简几何 / L41 等距信息图 | F1 图表生长 |
| 投资 | L40 数据叙事 | F1 图表生长 | H12 Editorial Forest / L10 方案比较墙 |

详见 `docs/06-风格选型.md`。

## 文档

| 文件 | 内容 |
|---|---|
| `AI视频制作手册.md` | **完整教程 + 落地方法 + 执行协议 + 郑和示例** |
| `AGENTS.md` | 给其他 AI 代理的入口 |
| `docs/01-制作流程.md` | 九步流程、时间预期 |
| `docs/02-选题与大纲.md` | 选题标准、五幕结构、22 个候选选题 |
| `docs/03-分镜规范.md` | 字段、时间码、镜头语法、示例 |
| `docs/04-视觉规范.md` | 字体、颜色、字幕、图表、3D、确定性 |
| `docs/05-音频字幕与交付.md` | 字幕工作流、音乐、SRT、平台规格 |
| `docs/06-风格选型.md` | 341 种风格怎么选、三套配方 |
| `docs/07-质检清单.md` | 出片前检查 |
| `docs/08-素材与许可.md` | 风格库、字体、教程的署名与许可 |
| `docs/09-引擎API.md` | episode.json、场景模块、组件 API |
| `docs/10-项目结构与Git.md` | 目录结构、技能位置、Git 上传、版权提醒 |
| `docs/参考-爆款结构.md` | 教程四条样片的结构拆解 |

## 说明

- 本项目参考了本地教程《AI视频副业攻略.pdf》，并把教程整理为 `AI视频制作手册.md` 供内部使用；没有复制其示例视频/图片素材。公开仓库前请先确认教程授权，详见 `docs/10-项目结构与Git.md`。
- 字体为 SIL Open Font License，见 `assets/fonts/README.md`。
- 风格素材的使用与署名规则见项目内技能目录 `.claude/skills/code-animation-prompts/references/attribution.md`。

## 上传 Git

本项目已初始化为 git 仓库，技能已放进 `.claude/skills/code-animation-prompts`，不依赖项目外目录。提交前先看 `docs/10-项目结构与Git.md`，尤其是：

- 哪些文件会被提交、哪些输出被忽略；
- 建议使用**私有仓库**（教程原文与完整整理版涉及转载授权）；
- 首次提交/推送命令。
