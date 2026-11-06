# AGENTS.md

本目录是一个「代码动画科普视频」制作项目。任何 AI 代理（Claude Code、Codex、Cursor、Trae、通义灵码等）接手前，请按下面顺序读：

1. **`AI视频制作手册.md`** —— 完整教程整理版 + 本项目落地方法 + 选题→成片执行协议 + 郑和下西洋完整示例。
2. **`CLAUDE.md`** —— 本仓库的硬规则、命令、目录说明。
3. 当前期目录的 `outline.md` / `storyboard.md` / `sources.md` / `notes.md`。

## 当用户说「我想做一期关于 XXX 的视频」

**不要立刻写代码。** 按 `AI视频制作手册.md` 第三部分执行：

1. 给选题卡（钩子、视觉主角、五幕、关键数字、风险、评分）；
2. 等用户确认；
3. 写 `episodes/<slug>/outline.md`；
4. 写 `storyboard.md` 和 `episode.json` 时间轴；
5. 写 `sources.md`（所有数字/年份/人名/引语必须有来源）；
6. 选风格（1 主画风 + 1 运动 + 1 版式）；
7. 做 15 秒样片 + 6 张关键帧；
8. 做全片、质检、交付。

## 三条硬规则

- 没有 `outline.md` / `storyboard.md` / `sources.md`，不写场景代码。
- 不编造数字、年份、人名、引语；不确定用「约」「超过」「几十」。
- 不用 AI 生成真实人物的脸；找不到授权照片就用剪影。

## 技术要点

- 动画引擎在 `engine/`，页面暴露 `window.renderAt(t)`；画面只依赖 `t` 和固定种子。
- 风格素材在项目内 `.claude/skills/code-animation-prompts`，不依赖项目外目录。
- 渲染：`python tools/render_video.py episodes/<slug>`；没有 Playwright Chromium 时加 `--browser msedge`。不要用技能自带的 `scripts/render_video.py` 渲染 `episodes/`（它只适合独立 HTML）。
- 检查：`python tools/check_episode.py episodes/<slug>`。
- 截图：`python tools/snapshot.py episodes/<slug> --every 4`。
- 校验：`python tools/verify_video.py <mp4> --duration <秒>`。
- 规格：1920×1080 / 30fps / H.264 / yuv420p / ≥12 Mbps / 默认无配音。
- 如果加 BGM：`episode.json` 的 `audio` + `env.beat`，参考 `episodes/000-beat-test/`；无音轨时交付要说明「无声」。

## 当前状态

- 引擎、三套配色、模板、工具、文档、三个测试片（`000-style-test` 12s、`000-3d-test` 8s、`000-beat-test` 12s）已完成；另有一期 `001-climate-instability`。
- 新选题未定；已有 `001-climate-instability`。不要未经用户确认直接开工一整期，先给选题卡。

## 示例

用户说「我想做一期关于郑和下西洋的历史故事视频」时，直接参考 `AI视频制作手册.md` 第四部分：选题卡、150 秒大纲、分镜表、风格、`episode.json` 骨架、代码计划和事实核查清单都已给出。
