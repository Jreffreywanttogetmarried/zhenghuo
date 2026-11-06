# 10 · 项目结构与上传 Git

## 1. 目录结构

```
项目根目录\
├── README.md                    项目入口
├── CLAUDE.md                    Claude Code 自动读取的项目规则
├── AGENTS.md                    其他 AI 代理入口（Codex/Cursor 等）
├── AI视频制作手册.md            完整教程整理版 + 执行协议 + 郑和示例
├── package.json                 npm scripts（可选）
├── .gitignore
├── .gitattributes
├── .claude/
│   └── skills/
│       └── code-animation-prompts/   项目内技能（341 风格 + 196 静帧 + 渲染脚本）
├── .cursor/rules/               Cursor 规则
├── .github/copilot-instructions.md
├── .trae/rules/                 Trae 规则
├── assets/
│   ├── audio/                   测试节拍 / BGM
│   │   ├── bgm/                 背景音乐
│   │   ├── sfx/                 音效
│   │   └── voice/               配音（可选）
│   ├── data/                    数据文件
│   ├── fonts/                   Noto Sans/Serif SC（OFL）
│   └── images/
├── docs/                        01–10 文档
├── engine/
│   ├── engine.js                renderAt(t) / 场景调度
│   ├── components.js            字幕、标题、图表、时间线
│   ├── beat.js                  BPM / 节拍脉冲
│   ├── palettes.js              三套配色
│   ├── math.js                  缓动 / 固定种子
│   └── vendor/three/            Three.js r187（MIT）
├── episodes/
│   ├── _template/               新一期模板
│   ├── 000-style-test/          12 秒三风格测试片
│   ├── 000-3d-test/             8 秒 Three.js 测试片
│   ├── 000-beat-test/           12 秒 BGM 卡点测试片
│   └── 001-climate-instability/ 已有一期《天气为什么越来越没准》
├── references/
│   ├── AI视频副业攻略.pdf       教程原文（内部使用）
│   └── README.md
├── templates/                   选题评估 / 大纲 / 分镜 / 事实核查 / 发布包
└── tools/                       渲染、截图、检查、SRT、拼接、校验、节拍
```

## 2. 技能已放进项目

`code-animation-prompts` 已从开发机的用户级技能目录复制到：

```
项目根目录/.claude/skills/code-animation-prompts
```

- 约 77MB；包含 `SKILL.md`、`LICENSE.md`、`assets/library/`、`references/`、`scripts/`；
- Claude Code 在新会话里会发现项目级 skill；
- 当前已经开着的会话可能仍使用用户级副本；重启会话后以项目内副本为准；
- 文档里的命令已改成相对路径：
  ```bash
  python ".claude/skills/code-animation-prompts/scripts/styles.py" show M20
  ```
- 不再依赖项目目录之外的 skill 副本。

> 用户级 skill 仍然存在。项目级和用户级同名时，以项目内副本为准；如果不想保留两份，可以手动删除用户级目录，但本项目不依赖它。

## 3. Git 会提交什么

会提交：

- 源码、文档、模板、工具；
- `engine/` 与 `engine/vendor/three/`；
- `assets/fonts/`（约 41MB）；
- `assets/audio/`（测试节拍约 1.1MB）；
- `.claude/skills/code-animation-prompts/`（约 77MB）；
- `references/AI视频副业攻略.pdf`（约 0.8MB）。

默认不提交（`.gitignore` 已处理）：

- `episodes/*/output/*.mp4`、`.srt`、`.txt`、`stills/`、`cover/`；
- `output/`、`.render-*/`、`*.log`；
- `__pycache__/`、`node_modules/`、`.venv/`；
- `.claude/settings.local.json`。

> 当前预计提交约 **120MB / 660+ 文件**，单个文件最大约 24MB（Noto Serif SC 字体），低于 GitHub 单文件 100MB 限制。
> 其中技能内的示例 MP4 约 60MB；如果想让仓库更小，可以删除 `.claude/skills/code-animation-prompts/assets/library/示例/*.mp4`，保留提示词和静帧即可。

> 如果想让别人直接看到测试片，可以单独把某个 MP4 加进去：
> ```bash
> git add -f episodes/000-style-test/output/000-style-test.mp4
> ```
> 视频文件较大，建议只在必要时这么做，或使用 Git LFS。

> ⚠️ **不要**直接 `git add -f` 这期的大成片：`episodes/001-climate-instability/output/001-climate-instability.mp4` 约 200MB，超过 GitHub 单文件 100MB 限制。需要版本管理请用 Git LFS，或只提交截图/封面，成片放网盘并在 README 写链接。

## 4. 上传 Git（本地初始化 + 首次提交）

> 本目录已经执行过 `git init`；下面从 `git add` 开始。如果你是从零开始，先运行 `git init`。

```bash
cd <你的项目目录>

git add .
git status              # 先检查一遍，确认没有把 output/video 加进去
git commit -m "init: 科普视频工坊（引擎/文档/模板/项目内技能）"

# 在 GitHub/Gitee 新建空仓库后：
git branch -M main
git remote add origin <你的仓库地址>
git push -u origin main
```

> 本仓库超过 100MB，但单个文件都小于 GitHub 的 100MB 限制；最大的字体约 24MB，技能总量约 77MB。如果平台提示体积问题，可以：
> - 把 `assets/fonts/` 改为下载脚本（不提交字体）；
> - 把 `.claude/skills/code-animation-prompts/` 改为 submodule 或压缩包；
> - 使用 Git LFS 管理字体/音视频。

## 5. 公开仓库的版权提醒

- `references/AI视频副业攻略.pdf` 是作者许先森 Ai 的粉丝群资料；
- `AI视频制作手册.md` 包含教程的完整整理版与四个案例提示词；
- `code-animation-prompts` 素材库的约定是免费使用/转发，但**禁止包装成付费课程/付费 skill 出售**。

**建议把仓库设为私有**。如果要公开，请先确认教程作者的授权，或删除 `references/` 和手册中的完整提示词部分，只保留结构摘要与自己的内容。

## 6. 换电脑后怎么用

```bash
git clone <仓库地址>
cd <克隆下来的项目目录>

# Python 依赖（渲染）
python -m pip install playwright
python -m playwright install chromium
# 或者不装 Chromium，用系统 Edge：
# 渲染时加 --browser msedge

# 预览
python -m http.server 8080
```

- 字体、Three.js、技能素材都在仓库里，不需要再下载；
- 如果 `.claude/skills` 没有被 git 跟踪，检查 `.gitignore` 里的 `!.claude/...` 规则，或执行：
  ```bash
  git check-ignore -v .claude/skills/code-animation-prompts/SKILL.md
  ```
  确认不是被全局忽略规则挡住。

## 7. 更新项目内技能

```bash
# 如果你本机保留着技能源仓库（不是 clone 下来的项目必需步骤）：
git -C "<技能源仓库>" pull

# 重新复制到项目（先删旧副本）
rm -rf .claude/skills/code-animation-prompts
python "<技能源仓库>/scripts/install_skill.py" \
  --target claude --scope project --project-dir "<项目根目录>"
```

> 重新安装后，跑一遍 `python tools/check_episode.py episodes/000-style-test`，确认没有路径/版本问题。

## 8. 首次推送前 5 项检查

```bash
# 1. 技能没有被忽略（退出码应为 1）
git check-ignore -q .claude/skills/code-animation-prompts/SKILL.md; echo $?

# 2. 成片被忽略（退出码应为 0）
git check-ignore -q episodes/001-climate-instability/output/001-climate-instability.mp4; echo $?

# 3. 字体没有被忽略（退出码应为 1）
git check-ignore -q assets/fonts/NotoSansSC-VF.ttf; echo $?

# 4. 看看会提交哪些文件
git add -n . | wc -l

# 5. 确认仓库是私有的（如果是公开仓库，先处理教程版权）
```

- 技能文件：退出码 1（未忽略）；
- 成片：退出码 0（已忽略）；
- 字体：退出码 1（未忽略）；
- `git add -n .` 的文件数应约 660+；
- 公开仓库前，先看第 5 节的版权提醒。
