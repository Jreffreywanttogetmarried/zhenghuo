"""把分段渲染的 MP4 拼成一条（要求各段编码参数一致）。

用法：
  python tools/stitch.py episodes/<slug>/output/part1.mp4 episodes/<slug>/output/part2.mp4 \
    --output episodes/<slug>/output/<slug>.mp4
"""
from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("parts", nargs="+", type=Path)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--force", action="store_true")
    args = parser.parse_args()

    parts = [p.resolve() for p in args.parts]
    for part in parts:
        if not part.is_file():
            raise SystemExit(f"找不到分段：{part}")
    output = args.output.resolve()
    if output.exists() and not args.force:
        raise SystemExit(f"输出已存在：{output}（加 --force 覆盖）")
    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        raise SystemExit("PATH 中找不到 ffmpeg")

    output.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile("w", suffix=".txt", delete=False, encoding="utf-8") as handle:
        list_path = Path(handle.name)
        for part in parts:
            escaped = str(part).replace("'", "'\\''")
            handle.write(f"file '{escaped}'\n")

    try:
        command = [
            ffmpeg, "-hide_banner", "-loglevel", "error", "-y",
            "-f", "concat", "-safe", "0", "-i", str(list_path),
            "-c", "copy", "-movflags", "+faststart", str(output),
        ]
        print("拼接：")
        for part in parts:
            print(f"  {part.name}")
        subprocess.run(command, check=True)
    finally:
        list_path.unlink(missing_ok=True)

    print(f"完成：{output}")


if __name__ == "__main__":
    main()
