"""从 _template 复制一期新 episode，并填入 slug / 标题 / 方向。

用法：
  python tools/new_episode.py 001-sky-blue --title "天空为什么是蓝的" --genre science
"""
from __future__ import annotations

import argparse
import json
import re
import shutil
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
TEMPLATE = PROJECT_ROOT / "episodes" / "_template"
EPISODES = PROJECT_ROOT / "episodes"


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("slug", help="英文/数字短名，例如 001-sky-blue")
    parser.add_argument("--title", default="未命名一期")
    parser.add_argument("--genre", default="science", choices=["history", "science", "investing", "mixed"])
    parser.add_argument("--palette", default=None, choices=["history", "science", "investing"])
    parser.add_argument("--force", action="store_true", help="目标已存在时覆盖（危险）")
    args = parser.parse_args()

    if not re.fullmatch(r"[0-9A-Za-z][0-9A-Za-z_-]*", args.slug):
        raise SystemExit("slug 只能用字母、数字、下划线和短横线，且以字母或数字开头")
    if not TEMPLATE.is_dir():
        raise SystemExit(f"找不到模板：{TEMPLATE}")

    target = EPISODES / args.slug
    if target.exists():
        if not args.force:
            raise SystemExit(f"已存在：{target}\n换一个 slug，或加 --force 覆盖。")
        shutil.rmtree(target)

    shutil.copytree(TEMPLATE, target)
    config_path = target / "episode.json"
    data = json.loads(config_path.read_text(encoding="utf-8"))
    data["slug"] = args.slug
    data["title"] = args.title
    data["genre"] = args.genre
    data["palette"] = args.palette or ("history" if args.genre == "history" else "investing" if args.genre == "investing" else "science")
    config_path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    index_path = target / "index.html"
    if index_path.is_file():
        html = index_path.read_text(encoding="utf-8")
        html = html.replace("新一期 | 科普视频工坊", f"{args.title} | 科普视频工坊")
        index_path.write_text(html, encoding="utf-8")

    print(f"已创建：{target}")
    print("\n下一步：")
    print(f"  1. 填写 {target / 'outline.md'}")
    print(f"  2. 填写 {target / 'storyboard.md'}")
    print(f"  3. 登记 {target / 'sources.md'}")
    print(f"  4. 预览：python -m http.server 8080  然后打开 http://localhost:8080/episodes/{args.slug}/")
    print(f"  5. 检查：python tools/check_episode.py episodes/{args.slug}")


if __name__ == "__main__":
    main()
