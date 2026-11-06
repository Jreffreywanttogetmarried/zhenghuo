"""检查成片的编码规格：H.264 / 分辨率 / 帧率 / yuv420p / 时长 / 码率。

用法：
  python tools/verify_video.py episodes/000-style-test/output/000-style-test.mp4
  python tools/verify_video.py video.mp4 --min-bitrate 12 --duration 12
"""
from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
from fractions import Fraction
from pathlib import Path


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("video", type=Path)
    parser.add_argument("--width", type=int, default=1920)
    parser.add_argument("--height", type=int, default=1080)
    parser.add_argument("--fps", type=float, default=30)
    parser.add_argument("--min-bitrate", type=float, default=12, help="最低码率（Mbps）")
    parser.add_argument("--duration", type=float, help="期望时长（秒），容差 0.1s")
    parser.add_argument("--allow-audio", action="store_true", help="允许存在音频轨")
    parser.add_argument("--require-audio", action="store_true", help="要求必须存在音频轨")
    args = parser.parse_args()

    video = args.video.resolve()
    if not video.is_file():
        raise SystemExit(f"找不到视频：{video}")
    ffprobe = shutil.which("ffprobe")
    if not ffprobe:
        raise SystemExit("PATH 中找不到 ffprobe")

    result = subprocess.run(
        [ffprobe, "-v", "error", "-print_format", "json", "-show_streams", "-show_format", str(video)],
        capture_output=True, text=True, encoding="utf-8",
    )
    if result.returncode:
        raise SystemExit(result.stderr)
    data = json.loads(result.stdout)
    streams = data.get("streams", [])
    video_stream = next((s for s in streams if s.get("codec_type") == "video"), None)
    audio_stream = next((s for s in streams if s.get("codec_type") == "audio"), None)
    if not video_stream:
        raise SystemExit("没有视频流")

    errors: list[str] = []
    warnings: list[str] = []
    fmt = data.get("format", {})

    codec = video_stream.get("codec_name")
    if codec != "h264":
        errors.append(f"编码是 {codec}，应为 h264")
    width = int(video_stream.get("width", 0))
    height = int(video_stream.get("height", 0))
    if (width, height) != (args.width, args.height):
        errors.append(f"分辨率是 {width}x{height}，应为 {args.width}x{args.height}")
    fps_text = video_stream.get("r_frame_rate", "0/1")
    try:
        fps = float(Fraction(fps_text))
    except Exception:
        fps = 0
    if abs(fps - args.fps) > 0.01:
        errors.append(f"帧率是 {fps:g}，应为 {args.fps:g}")
    pix_fmt = video_stream.get("pix_fmt")
    if pix_fmt != "yuv420p":
        errors.append(f"像素格式是 {pix_fmt}，应为 yuv420p")

    duration = float(fmt.get("duration", 0))
    if args.duration is not None and abs(duration - args.duration) > 0.1:
        errors.append(f"时长是 {duration:.3f}s，应为 {args.duration:g}s")
    bitrate = float(fmt.get("bit_rate", 0)) / 1_000_000
    if bitrate < args.min_bitrate:
        errors.append(f"码率 {bitrate:.2f} Mbps，低于 {args.min_bitrate:g} Mbps")
    if audio_stream and not args.allow_audio:
        warnings.append(f"存在音频轨（{audio_stream.get('codec_name')}）")
    if args.require_audio and not audio_stream:
        errors.append("要求有音频轨，但成片没有音频流")

    print(f"文件：{video.name}（{video.stat().st_size / 1_048_576:.1f} MB）")
    print(f"编码：{codec} | {width}x{height} | {fps:g} fps | {pix_fmt}")
    print(f"时长：{duration:.3f}s | 码率：{bitrate:.2f} Mbps | 音频：{'有' if audio_stream else '无'}")
    for message in errors:
        print(f"[错误] {message}")
    for message in warnings:
        print(f"[警告] {message}")
    if errors:
        raise SystemExit(1)
    print("结论：通过")


if __name__ == "__main__":
    main()
