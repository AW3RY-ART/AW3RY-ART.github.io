from __future__ import annotations

import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent
GALLERY_ROOT = ROOT / "gallery"
OUTPUT_FILE = ROOT / "gallery-data.json"
JS_OUTPUT_FILE = ROOT / "gallery-data.js"
IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif", ".bmp"}


def friendly_name(value: str) -> str:
    cleaned = re.sub(r"[_-]+", " ", value).strip()
    if not cleaned:
        return "Gallery"
    return " ".join(part.capitalize() for part in cleaned.split())


def collect_gallery() -> list[dict]:
    albums: list[dict] = []
    if not GALLERY_ROOT.exists():
        return albums

    for folder in sorted(GALLERY_ROOT.iterdir(), key=lambda item: item.name.lower()):
        if not folder.is_dir():
            continue

        images = []
        for file in sorted(folder.iterdir(), key=lambda item: item.name.lower()):
            if file.is_file() and file.suffix.lower() in IMAGE_EXTS:
                images.append(file.relative_to(ROOT).as_posix())

        if images:
            albums.append({
                "name": folder.name,
                "title": friendly_name(folder.name),
                "images": images,
            })

    return albums


def main() -> None:
    albums = collect_gallery()
    items = []
    for album in albums:
        for index, image in enumerate(album["images"], start=1):
            items.append({
                "album": album["name"],
                "albumTitle": album["title"],
                "image": image,
                "label": f"{index:02d}",
            })

    payload = {
        "albums": albums,
        "items": items,
    }

    OUTPUT_FILE.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    JS_OUTPUT_FILE.write_text(
        "window.galleryData = " + json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + ";\n",
        encoding="utf-8",
    )
    print(f"Saved {len(albums)} albums and {len(items)} images to {OUTPUT_FILE.name} and {JS_OUTPUT_FILE.name}")


if __name__ == "__main__":
    main()
