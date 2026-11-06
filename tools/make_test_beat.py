"""生成一段简单的测试节拍 WAV（kick + hi-hat + 每 4 拍重音）。

用途：在没有版权音乐时验证 BGM 与卡点流程；不要把它当正式配乐。
用法：
  python tools/make_test_beat.py --bpm 120 --duration 12 --output assets/audio/test-120bpm.wav
"""
from __future__ import annotations

import argparse
import math
import random
import struct
import sys
import wave
from pathlib import Path


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--bpm", type=float, default=120)
    parser.add_argument("--duration", type=float, default=12)
    parser.add_argument("--sample-rate", type=int, default=44100)
    parser.add_argument("--output", type=Path, default=Path("assets/audio/test-120bpm.wav"))
    args = parser.parse_args()

    sr = args.sample_rate
    total = int(args.duration * sr)
    buffer = [0.0] * total
    spb = 60.0 / args.bpm
    rng = random.Random(42)

    def add(start: float, length: float, fn) -> None:
        begin = int(start * sr)
        count = int(length * sr)
        for i in range(count):
            idx = begin + i
            if 0 <= idx < total:
                buffer[idx] += fn(i / sr)

    def kick(t: float) -> float:
        freq = 120 * math.exp(-t * 18) + 45
        env = math.exp(-t * 14)
        return 0.42 * env * math.sin(2 * math.pi * freq * t)

    def hat(t: float) -> float:
        env = math.exp(-t * 90)
        return 0.07 * env * (rng.random() * 2 - 1)

    def accent(t: float) -> float:
        env = math.exp(-t * 30)
        return 0.10 * env * math.sin(2 * math.pi * 880 * t)

    beats = int(args.duration / spb) + 1
    for n in range(beats):
        start = n * spb
        add(start, 0.22, kick)
        if n % 4 == 0:
            add(start, 0.10, accent)
        add(start + spb / 2, 0.06, hat)

    # 软削波 + 淡入淡出
    fade = int(0.02 * sr)
    for i in range(total):
        x = math.tanh(buffer[i] * 1.2)
        if i < fade:
            x *= i / fade
        if i > total - fade:
            x *= (total - i) / fade
        buffer[i] = max(-0.98, min(0.98, x))

    args.output.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(args.output), "wb") as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(sr)
        frames = b"".join(struct.pack("<h", int(x * 32767)) for x in buffer)
        wav.writeframes(frames)

    print(f"已写入 {args.output} | {args.bpm:g} BPM | {args.duration:g}s | {beats} 拍 | {sr}Hz mono")


if __name__ == "__main__":
    main()
