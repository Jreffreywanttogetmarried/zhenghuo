"""检查一期 episode.json 的结构、时间轴、字幕速度与素材文件。

用法：
  python tools/check_episode.py episodes/000-style-test
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
PUNCT = re.compile(r"[\s　，。！？、；：,.!?;:…—\-－()（）「」『』《》〈〉·/\\|]")


def visible_length(text: str) -> int:
    cleaned = PUNCT.sub("", str(text).replace("【", "").replace("】", ""))
    return len(cleaned)


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("episode", type=Path)
    args = parser.parse_args()

    episode_dir = args.episode.resolve()
    if episode_dir.is_file():
        episode_dir = episode_dir.parent
    config_path = episode_dir / "episode.json"
    if not config_path.is_file():
        raise SystemExit(f"找不到 {config_path}")

    data = json.loads(config_path.read_text(encoding="utf-8"))
    errors: list[str] = []
    warnings: list[str] = []
    notes: list[str] = []

    slug = data.get("slug", episode_dir.name)
    print(f"=== 检查 {slug} ===")

    # 基础规格
    width = data.get("width", 1920)
    height = data.get("height", 1080)
    fps = data.get("fps", 30)
    duration = float(data.get("duration", 0))
    if width % 2 or height % 2:
        errors.append("宽高必须为偶数")
    if (width, height) != (1920, 1080):
        warnings.append(f"分辨率是 {width}x{height}，教程规范为 1920x1080")
    if fps != 30:
        warnings.append(f"帧率是 {fps}，教程规范为 30fps")
    if duration <= 0:
        errors.append("duration 必须大于 0")
    if not data.get("palette"):
        warnings.append("没有设置 palette，将回退到 science")
    if not data.get("styleRefs"):
        warnings.append("没有记录 styleRefs（风格编号）")

    # 场景
    scenes = sorted(data.get("scenes", []), key=lambda s: float(s.get("start", 0)))
    if not scenes:
        errors.append("没有 scenes")
    expected = 0.0
    for index, scene in enumerate(scenes):
        sid = scene.get("id", f"scene-{index + 1}")
        start = float(scene.get("start", 0))
        length = float(scene.get("duration", 0))
        if abs(start - expected) > 0.01:
            errors.append(f"场景 {sid} 起点 {start:g}s，与上一场景结束 {expected:g}s 不连续")
        if length <= 0:
            errors.append(f"场景 {sid} 时长必须大于 0")
        module = episode_dir / str(scene.get("module", ""))
        if not module.is_file():
            errors.append(f"场景 {sid} 的模块不存在：{module}")
        expected = start + length
    if abs(expected - duration) > 0.05:
        errors.append(f"场景总时长 {expected:g}s 与 duration {duration:g}s 不一致")

    # 字幕
    subs = sorted(data.get("subtitles", []), key=lambda c: float(c.get("start", 0)))
    if not subs:
        warnings.append("没有字幕；如果做无声视频，字幕就是旁白")
    prev_end = -1.0
    for cue in subs:
        start = float(cue.get("start", 0))
        end = float(cue.get("end", 0))
        text = str(cue.get("text", ""))
        if end <= start:
            errors.append(f"字幕结束时间必须大于开始：{text[:20]}")
            continue
        if start < -0.001 or end > duration + 0.01:
            errors.append(f"字幕超出总时长：{start:g}–{end:g}s / {duration:g}s：{text[:20]}")
        if start < prev_end - 0.001:
            errors.append(f"字幕重叠：{prev_end:g}s 与 {start:g}s：{text[:20]}")
        prev_end = max(prev_end, end)
        chars = visible_length(text)
        speed = chars / max(end - start, 0.001)
        if chars > 0 and (speed < 4 or speed > 9):
            warnings.append(f"字幕速度 {speed:.1f} 字/秒（建议 6–7）：{text[:24]}")
        if chars > 36:
            warnings.append(f"单句字数 {chars}，可能超过两行：{text[:24]}")
    if subs:
        first = float(subs[0].get("start", 99))
        if first > 3.0:
            warnings.append(f"第一句字幕在 {first:g}s 才出现，开头 3 秒可能没有钩子")
    else:
        first = None

    # 字体
    for font in ("NotoSansSC-VF.ttf", "NotoSerifSC-VF.ttf"):
        if not (PROJECT_ROOT / "assets" / "fonts" / font).is_file():
            errors.append(f"缺少字体 assets/fonts/{font}")

    # 事实核查文件
    sources = data.get("sources")
    if sources:
        sources_path = episode_dir / sources
        if not sources_path.is_file():
            errors.append(f"找不到事实核查文件：{sources_path}")
        else:
            text = sources_path.read_text(encoding="utf-8")
            if len(text.strip()) < 200:
                warnings.append("sources.md 内容很少，发布前请补齐来源")
    else:
        warnings.append("episode.json 没有指定 sources 文件")

    notes_path = episode_dir / (data.get("notes") or "notes.md")
    if not notes_path.is_file():
        warnings.append(f"找不到制作笔记：{notes_path}")

    for message in errors:
        print(f"[错误] {message}")
    for message in warnings:
        print(f"[警告] {message}")
    for message in notes:
        print(f"[提示] {message}")

    if errors:
        print(f"\n结论：未通过（{len(errors)} 个错误，{len(warnings)} 个提醒）")
        raise SystemExit(1)
    print(f"\n结论：通过（{len(warnings)} 个提醒）")


if __name__ == "__main__":
    main()
