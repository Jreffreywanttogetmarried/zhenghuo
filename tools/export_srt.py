"""从 episode.json 导出 SRT 字幕（去掉【】高亮标记）。

用法：
  python tools/export_srt.py episodes/000-style-test
  python tools/export_srt.py episodes/000-style-test --max-chars 18
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent


def timestamp(seconds: float) -> str:
    ms = int(round(seconds * 1000))
    hours, ms = divmod(ms, 3600_000)
    minutes, ms = divmod(ms, 60_000)
    secs, ms = divmod(ms, 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{ms:03d}"


def wrap_text(text: str, max_chars: int) -> str:
    if max_chars <= 0 or len(text) <= max_chars:
        return text
    lines = []
    rest = text
    while len(rest) > max_chars:
        cut = max_chars
        # 尽量在标点后断行
        for i in range(max_chars, max(0, max_chars - 8), -1):
            if rest[i - 1] in "，。！？、；：,.!?;:":
                cut = i
                break
        lines.append(rest[:cut])
        rest = rest[cut:]
    if rest:
        lines.append(rest)
    return "\n".join(lines[:2])


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("episode", type=Path)
    parser.add_argument("--output", type=Path)
    parser.add_argument("--max-chars", type=int, default=0, help="每行最多几个字，0 表示不自动换行")
    parser.add_argument("--txt", action="store_true", help="同时导出带时间码的纯文本旁白")
    args = parser.parse_args()

    episode_dir = args.episode.resolve()
    if episode_dir.is_file():
        episode_dir = episode_dir.parent
    config = episode_dir / "episode.json"
    if not config.is_file():
        raise SystemExit(f"找不到 {config}")
    data = json.loads(config.read_text(encoding="utf-8"))
    slug = data.get("slug", episode_dir.name)
    cues = sorted(data.get("subtitles", []), key=lambda c: float(c.get("start", 0)))
    if not cues:
        raise SystemExit("没有字幕可导出")

    output = (args.output or (episode_dir / "output" / f"{slug}.srt")).resolve()
    output.parent.mkdir(parents=True, exist_ok=True)

    blocks = []
    plain = []
    for index, cue in enumerate(cues, start=1):
        text = str(cue.get("text", "")).replace("【", "").replace("】", "")
        text = wrap_text(text, args.max_chars)
        start = float(cue.get("start", 0))
        end = float(cue.get("end", 0))
        blocks.append(f"{index}\n{timestamp(start)} --> {timestamp(end)}\n{text}\n")
        plain.append(f"[{timestamp(start)}] {text.replace(chr(10), ' ')}")
    output.write_text("\n".join(blocks), encoding="utf-8-sig")
    print(f"已写入 {output}（{len(cues)} 条字幕）")

    if args.txt:
        txt_path = output.with_suffix(".txt")
        txt_path.write_text("\n".join(plain) + "\n", encoding="utf-8-sig")
        print(f"已写入 {txt_path}")


if __name__ == "__main__":
    main()
