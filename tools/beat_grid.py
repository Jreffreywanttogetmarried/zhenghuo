"""根据 BPM 和第一拍偏移生成拍点表，用于写分镜、对齐场景和卡点。

用法：
  python tools/beat_grid.py --bpm 120 --offset 0 --duration 30 --every 8
  python tools/beat_grid.py --bpm 112 --offset 7.7 --duration 150 --subdivision 2 --json episodes/x/output/beats.json
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--bpm", type=float, required=True)
    parser.add_argument("--offset", type=float, default=0.0, help="第一拍在音频中的秒数")
    parser.add_argument("--duration", type=float, default=60.0, help="生成到第几秒")
    parser.add_argument("--fps", type=int, default=30)
    parser.add_argument("--subdivision", type=int, default=1, help="每拍细分：1=整拍，2=半拍，4=1/4 拍")
    parser.add_argument("--every", type=int, default=0, help="每隔几拍标一次场景切点")
    parser.add_argument("--json", type=Path, help="另存为 JSON")
    args = parser.parse_args()

    if args.bpm <= 0 or args.duration <= 0 or args.subdivision <= 0:
        raise SystemExit("bpm / duration / subdivision 必须为正数")

    spb = 60.0 / args.bpm
    step = spb / args.subdivision
    rows = []
    t = args.offset
    index = 0
    while t <= args.duration + 1e-9:
        if t >= 0:
            beat = index / args.subdivision
            rows.append({
                "beat": round(beat, 4),
                "time": round(t, 6),
                "frame": round(t * args.fps, 3),
            })
        index += 1
        t = args.offset + index * step

    print(f"BPM {args.bpm:g} | 1 拍 = {spb:.6f}s = {spb * args.fps:.3f} 帧 | 偏移 {args.offset:g}s | {args.fps}fps")
    print(f"{'拍':>8}  {'秒':>10}  {'帧':>9}")
    for row in rows:
        mark = ""
        if args.every and abs(row["beat"] % args.every) < 1e-9:
            mark = f"  ← 场景切点（每 {args.every} 拍）"
        print(f"{row['beat']:8.3f}  {row['time']:10.3f}  {row['frame']:9.1f}{mark}")

    if args.json:
        args.json.parent.mkdir(parents=True, exist_ok=True)
        payload = {
            "bpm": args.bpm,
            "offset": args.offset,
            "fps": args.fps,
            "subdivision": args.subdivision,
            "secondsPerBeat": spb,
            "framesPerBeat": spb * args.fps,
            "beats": rows,
        }
        args.json.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"\n已写入 {args.json}")


if __name__ == "__main__":
    main()
