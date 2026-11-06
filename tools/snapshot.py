"""导出 episode 在指定时间点的关键帧截图，用于分镜确认与质检。

用法：
  python tools/snapshot.py episodes/000-style-test --times 0,2,4,6,8,10
  python tools/snapshot.py episodes/000-style-test --every 4
"""
from __future__ import annotations

import argparse
import functools
import http.server
import json
import math
import sys
import threading
from pathlib import Path
from urllib.parse import quote

PROJECT_ROOT = Path(__file__).resolve().parent.parent


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        pass


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("episode", type=Path, help="episode 目录或 index.html")
    parser.add_argument("--root", type=Path, default=PROJECT_ROOT)
    parser.add_argument("--times", help="逗号分隔的秒数，例如 0,2,4,6")
    parser.add_argument("--every", type=float, help="每隔几秒截一张")
    parser.add_argument("--out-dir", type=Path, help="默认 <episode>/output/stills")
    parser.add_argument("--width", type=int)
    parser.add_argument("--height", type=int)
    parser.add_argument("--browser", default="chromium", choices=["chromium", "msedge", "chrome"],
                        help="使用 Playwright 自带 Chromium，或系统中已安装的 Edge/Chrome")
    args = parser.parse_args()

    if args.episode.is_dir():
        html = (args.episode / "index.html").resolve()
        config = args.episode / "episode.json"
    else:
        html = args.episode.resolve()
        config = html.parent / "episode.json"
    if not html.is_file():
        raise SystemExit(f"找不到 HTML：{html}")

    meta = {}
    if config.is_file():
        meta = json.loads(config.read_text(encoding="utf-8"))

    width = args.width or int(meta.get("width") or 1920)
    height = args.height or int(meta.get("height") or 1080)
    duration = float(meta.get("duration") or 12)
    slug = str(meta.get("slug") or html.parent.name)

    if args.times:
        times = [float(value.strip()) for value in args.times.split(",") if value.strip()]
    elif args.every:
        times = [round(i * args.every, 3) for i in range(int(math.floor(duration / args.every)) + 1)]
    else:
        times = [0, duration / 2, max(0, duration - 1 / 30)]

    out_dir = (args.out_dir or (html.parent / "output" / "stills")).resolve()
    out_dir.mkdir(parents=True, exist_ok=True)

    root = args.root.resolve()
    try:
        url_path = "/" + html.relative_to(root).as_posix()
    except ValueError:
        raise SystemExit(f"HTML 必须位于服务根目录 {root} 内")

    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        raise SystemExit("缺少 playwright。运行：python -m pip install playwright && python -m playwright install chromium")

    handler = functools.partial(QuietHandler, directory=str(root))
    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    browser = None
    try:
        with sync_playwright() as pw:
            browser = pw.chromium.launch(
                headless=True,
                channel=None if args.browser == "chromium" else args.browser,
            )
            page = browser.new_page(viewport={"width": width, "height": height}, device_scale_factor=1)
            errors: list[str] = []
            page.on("pageerror", lambda error: errors.append(str(error)))
            url = f"http://127.0.0.1:{server.server_port}{quote(url_path, safe='/')}?export=1"
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
                raise SystemExit("页面没有 window.renderAt(t)")

            for t in times:
                page.evaluate("async t => { await window.renderAt(t); }", t)
                if errors:
                    raise SystemExit("浏览器报错：" + errors[0])
                t_tag = f"{t:07.3f}".replace(".", "p")
                name = f"{slug}_{t_tag}s.png"
                target = out_dir / name
                page.screenshot(path=str(target), type="png")
                print(f"截图 {t:g}s -> {target}")
    finally:
        if browser:
            try:
                browser.close()
            except Exception:
                pass
        server.shutdown()
        server.server_close()
        thread.join()

    print(f"共 {len(times)} 张，目录：{out_dir}")


if __name__ == "__main__":
    main()
