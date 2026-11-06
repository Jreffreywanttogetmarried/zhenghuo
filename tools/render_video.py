"""把 episode 的 HTML 逐帧渲染成 MP4。

用法：
  python tools/render_video.py episodes/000-style-test
  python tools/render_video.py episodes/000-style-test --start 0 --end 15 --output episodes/000-style-test/output/sample.mp4

要求：
  - 页面暴露 window.renderAt(t)（见 engine/engine.js）
  - 安装 playwright + chromium，ffmpeg 在 PATH 中
  - 从项目根目录提供服务，因此 episodes 可以引用 ../engine 与 ../assets

输出规格：H.264 / yuv420p / 默认 1920x1080 / 30fps / 12 Mbps。
"""
from __future__ import annotations

import argparse
import functools
import http.server
import json
import math
import shutil
import subprocess
import sys
import tempfile
import threading
from pathlib import Path
from urllib.parse import quote

PROJECT_ROOT = Path(__file__).resolve().parent.parent


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        pass


def load_episode(path: Path) -> tuple[Path, dict]:
    if path.is_dir():
        html = path / "index.html"
        config = path / "episode.json"
    else:
        html = path
        config = path.parent / "episode.json"
    if not html.is_file():
        raise SystemExit(f"找不到 HTML：{html}")
    meta = {}
    if config.is_file():
        try:
            meta = json.loads(config.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            raise SystemExit(f"episode.json 不是合法 JSON：{exc}") from exc
    return html.resolve(), meta


def bitrate_bufsize(bitrate: str) -> str:
    text = bitrate.strip().upper()
    if text.endswith("M"):
        try:
            return f"{max(float(text[:-1]) * 2, 24):g}M"
        except ValueError:
            pass
    return "24M"


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("episode", type=Path, help="episode 目录或 index.html")
    parser.add_argument("--output", type=Path, help="输出 mp4；默认 <episode>/output/<slug>.mp4")
    parser.add_argument("--root", type=Path, default=PROJECT_ROOT, help="HTTP 服务根目录，默认项目根目录")
    parser.add_argument("--duration", type=float, help="覆盖 episode.json 的总时长（秒）")
    parser.add_argument("--fps", type=int, help="覆盖帧率")
    parser.add_argument("--width", type=int, help="覆盖宽度")
    parser.add_argument("--height", type=int, help="覆盖高度")
    parser.add_argument("--start", type=float, default=0.0, help="从第几秒开始渲染（用于样片）")
    parser.add_argument("--end", type=float, help="渲染到第几秒（用于样片）")
    parser.add_argument("--audio", type=Path, help="可选音轨；不填则读取 episode.json 的 audio.src")
    parser.add_argument("--audio-loop", action=argparse.BooleanOptionalAction, default=None,
                        help="循环音轨到视频时长；不填则读取 episode.json 的 audio.loop")
    parser.add_argument("--audio-volume", type=float, default=None,
                        help="音轨音量倍数，默认读取 episode.json 的 audio.volume 或 1.0")
    parser.add_argument("--audio-fade-out", type=float, default=None,
                        help="片尾音频淡出秒数，默认读取 episode.json 的 audio.fadeOut 或 0")
    parser.add_argument("--bitrate", default="14M", help="视频码率，默认 14M CBR（实际约 12.6 Mbps，满足教程 ≥12 Mbps）")
    parser.add_argument("--crf", type=int, help="改用 CRF 质量模式（设置后忽略 --bitrate）")
    parser.add_argument("--browser", default="chromium", choices=["chromium", "msedge", "chrome"],
                        help="使用 Playwright 自带 Chromium，或系统中已安装的 Edge/Chrome")
    parser.add_argument("--force", action="store_true", help="覆盖已存在的输出文件")
    args = parser.parse_args()

    html, meta = load_episode(args.episode)
    episode_dir = html.parent
    root = args.root.resolve()
    try:
        url_path = "/" + html.relative_to(root).as_posix()
    except ValueError:
        raise SystemExit(f"HTML 必须位于服务根目录 {root} 内，当前是 {html}")

    fps = args.fps or int(meta.get("fps") or 30)
    width = args.width or int(meta.get("width") or 1920)
    height = args.height or int(meta.get("height") or 1080)
    duration = args.duration if args.duration is not None else float(meta.get("duration") or 12)
    start = max(0.0, args.start)
    end = args.end if args.end is not None else duration
    end = min(end, duration)
    if not (math.isfinite(duration) and duration > 0):
        raise SystemExit("duration 必须是正数")
    if fps <= 0 or width <= 0 or height <= 0 or width % 2 or height % 2:
        raise SystemExit("fps、宽高必须为正数，宽高必须为偶数")
    if end <= start:
        raise SystemExit("--end 必须大于 --start")

    frame_start = int(round(start * fps))
    frame_end = int(round(end * fps))
    frame_count = max(1, frame_end - frame_start)
    effective_duration = frame_count / fps

    slug = str(meta.get("slug") or episode_dir.name)
    output = (args.output or (episode_dir / "output" / f"{slug}.mp4")).resolve()
    if output.exists() and not args.force:
        raise SystemExit(f"输出已存在：{output}\n换一个文件名，或加 --force 覆盖。")
    if output.suffix.lower() != ".mp4":
        raise SystemExit("输出文件必须以 .mp4 结尾")
    audio_meta = meta.get("audio")
    if isinstance(audio_meta, str):
        audio_meta = {"src": audio_meta}
    if not isinstance(audio_meta, dict):
        audio_meta = {}

    audio_path = args.audio
    if audio_path is None and audio_meta.get("src"):
        candidate = Path(str(audio_meta["src"]))
        if not candidate.is_absolute():
            episode_candidate = episode_dir / candidate
            root_candidate = PROJECT_ROOT / candidate
            candidate = episode_candidate if episode_candidate.is_file() else root_candidate
        audio_path = candidate
    if audio_path is not None:
        audio_path = audio_path.resolve()
        if not audio_path.is_file():
            raise SystemExit(f"找不到音轨：{audio_path}")

    audio_loop = args.audio_loop if args.audio_loop is not None else bool(audio_meta.get("loop", False))
    audio_volume = args.audio_volume if args.audio_volume is not None else float(audio_meta.get("volume", 1.0))
    audio_fade_out = args.audio_fade_out if args.audio_fade_out is not None else float(audio_meta.get("fadeOut", 0))
    if audio_volume < 0:
        raise SystemExit("--audio-volume 不能为负数")
    if audio_fade_out < 0:
        raise SystemExit("--audio-fade-out 不能为负数")

    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        raise SystemExit("PATH 中找不到 ffmpeg。安装后重试。")
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        raise SystemExit("缺少 playwright。运行：python -m pip install playwright && python -m playwright install chromium")

    output.parent.mkdir(parents=True, exist_ok=True)
    handler = functools.partial(QuietHandler, directory=str(root))
    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    process = None
    browser = None

    try:
        with tempfile.TemporaryDirectory(prefix=".render-", dir=output.parent) as temp_name:
            temp = Path(temp_name)
            temp_video = temp / "video.mp4"
            with sync_playwright() as pw:
                browser = pw.chromium.launch(
                    headless=True,
                    channel=None if args.browser == "chromium" else args.browser,
                )
                page = browser.new_page(
                    viewport={"width": width, "height": height},
                    device_scale_factor=1,
                )
                errors: list[str] = []
                console_errors: list[str] = []
                page.on("pageerror", lambda error: errors.append(f"pageerror: {error}"))
                page.on(
                    "console",
                    lambda msg: console_errors.append(msg.text) if msg.type == "error" else None,
                )

                url = f"http://127.0.0.1:{server.server_port}{quote(url_path, safe='/')}?export=1"
                print(f"打开 {url}")
                page.goto(url, wait_until="load")
                page.evaluate(
                    """async () => {
                        if (window.__episodeError) throw new Error(window.__episodeError);
                        if (document.fonts && document.fonts.ready) await document.fonts.ready;
                        if (window.__episodeReady) await window.__episodeReady;
                        if (window.__episodeError) throw new Error(window.__episodeError);
                    }"""
                )
                if not page.evaluate("typeof window.renderAt === 'function'"):
                    raise RuntimeError("页面没有 window.renderAt(t)")
                if console_errors:
                    print("控制台错误（不阻断，请检查资源路径）：")
                    for line in console_errors[:5]:
                        print(f"  {line}")
                meta_info = page.evaluate("window.__episodeMeta || null")
                if meta_info:
                    print(f"Episode: {meta_info.get('title')} | {width}x{height} @ {fps}fps | {duration:g}s")

                command = [
                    ffmpeg, "-hide_banner", "-loglevel", "error", "-y",
                    "-f", "image2pipe", "-vcodec", "png", "-framerate", str(fps), "-i", "pipe:0",
                ]
                if audio_path is not None:
                    if audio_loop:
                        command += ["-stream_loop", "-1", "-i", str(audio_path)]
                    else:
                        command += ["-i", str(audio_path)]
                    command += ["-map", "0:v:0", "-map", "1:a:0"]
                    audio_filters = []
                    if abs(audio_volume - 1.0) > 1e-6:
                        audio_filters.append(f"volume={audio_volume:g}")
                    if audio_fade_out > 0:
                        fade_start = max(0.0, effective_duration - audio_fade_out)
                        audio_filters.append(f"afade=t=out:st={fade_start:.3f}:d={audio_fade_out:.3f}")
                    if not audio_loop:
                        audio_filters.append("apad")
                    if audio_filters:
                        command += ["-af", ",".join(audio_filters)]
                    command += ["-c:a", "aac", "-b:a", "192k"]
                command += ["-c:v", "libx264", "-pix_fmt", "yuv420p", "-preset", "medium"]
                if args.crf is not None:
                    command += ["-crf", str(args.crf)]
                else:
                    # 教程要求 ≥12 Mbps；暗色/静态画面用 ABR 会掉到 10 Mbps 以下，
                    # 所以默认用 CBR 锁住码率。
                    command += [
                        "-b:v", args.bitrate,
                        "-minrate", args.bitrate,
                        "-maxrate", args.bitrate,
                        "-bufsize", bitrate_bufsize(args.bitrate),
                        "-x264-params", "nal-hrd=cbr",
                    ]
                command += [
                    "-r", str(fps), "-t", f"{effective_duration:.6f}",
                    "-movflags", "+faststart", str(temp_video),
                ]

                log_path = temp / "ffmpeg.log"
                with log_path.open("w+b") as log:
                    process = subprocess.Popen(
                        command, stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=log,
                    )
                    try:
                        for index in range(frame_count):
                            t = (frame_start + index) / fps
                            page.evaluate("async t => { await window.renderAt(t); }", t)
                            if errors:
                                raise RuntimeError("浏览器报错：\n" + "\n".join(errors[:5]))
                            process.stdin.write(page.screenshot(type="png"))
                            if index % fps == 0:
                                print(f"渲染 {index}/{frame_count} 帧", flush=True)
                        process.stdin.close()
                        code = process.wait(timeout=180)
                        if code:
                            log.seek(0)
                            raise RuntimeError(log.read().decode("utf-8", errors="replace"))
                    finally:
                        if process.poll() is None:
                            process.kill()
                            process.wait()
                        if process.stdin and not process.stdin.closed:
                            process.stdin.close()

            if not temp_video.is_file() or temp_video.stat().st_size == 0:
                raise RuntimeError("FFmpeg 没有生成有效视频")
            if output.exists():
                output.unlink()
            shutil.move(str(temp_video), str(output))
    finally:
        if browser:
            try:
                browser.close()
            except Exception:
                pass
        server.shutdown()
        server.server_close()
        thread.join()

    print(
        f"完成：{output} | {width}x{height} | {fps} fps | {effective_duration:.3f}s | "
        f"{frame_count} 帧 | audio: {audio_path.name if audio_path else 'none'} | "
        f"bitrate: {'CRF ' + str(args.crf) if args.crf is not None else args.bitrate}"
    )


if __name__ == "__main__":
    main()
