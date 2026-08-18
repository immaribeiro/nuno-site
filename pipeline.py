#!/usr/bin/env python3
"""Build the site's optimized, privacy-stripped photo assets."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

from PIL import Image, ImageOps

try:
    import pillow_heif
except ImportError:  # Allows a clear error when dependencies are not installed.
    pillow_heif = None


SUPPORTED_EXTENSIONS = {".heic", ".jpg", ".jpeg", ".png", ".webp"}
QUALITY = 82


def slug_for(stem: str) -> str:
    """Return a stable, URL-safe slug for a source filename stem."""
    slug = re.sub(r"[^a-z0-9]+", "-", stem.lower()).strip("-")
    return slug or "photo"


def unique_slugs(sources: list[Path]) -> dict[Path, str]:
    """Resolve filenames which sanitize to the same slug deterministically."""
    used: dict[str, int] = {}
    result: dict[Path, str] = {}
    for source in sources:
        base = slug_for(source.stem)
        number = used.get(base, 0)
        used[base] = number + 1
        result[source] = base if number == 0 else f"{base}-{number + 1}"
    return result


def output_size(source: Path, destination: Path, force: bool) -> tuple[int, int, bool]:
    """Convert one source and return (source bytes, output bytes, converted)."""
    source_bytes = source.stat().st_size
    if destination.exists() and not force and destination.stat().st_mtime >= source.stat().st_mtime:
        return source_bytes, destination.stat().st_size, False

    with Image.open(source) as image:
        image = ImageOps.exif_transpose(image)
        width, height = image.size
        limit = 1600 if width >= height else 1200
        if max(width, height) > limit:
            scale = limit / max(width, height)
            image = image.resize((round(width * scale), round(height * scale)), Image.Resampling.LANCZOS)
        if image.mode not in {"RGB", "RGBA"}:
            image = image.convert("RGBA" if "transparency" in image.info else "RGB")
        destination.parent.mkdir(parents=True, exist_ok=True)
        temporary = destination.with_name(destination.name + ".tmp")
        try:
            image.save(temporary, format="WEBP", quality=QUALITY, method=6, exif=b"")
            temporary.replace(destination)
        finally:
            temporary.unlink(missing_ok=True)
    return source_bytes, destination.stat().st_size, True


def write_manifest(path: Path, entries: list[dict[str, str]]) -> bool:
    """Write JSON only when its content changed; return whether it changed."""
    content = json.dumps(entries, indent=2) + "\n"
    if path.exists() and path.read_text(encoding="utf-8") == content:
        return False
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")
    return True


def main() -> int:
    parser = argparse.ArgumentParser(description="Convert source photos into optimized WebP assets.")
    parser.add_argument("--force", action="store_true", help="regenerate every output photo")
    args = parser.parse_args()

    if pillow_heif is None:
        print("Missing dependency: install requirements.txt in the project venv.", file=sys.stderr)
        return 2
    pillow_heif.register_heif_opener()

    root = Path(__file__).resolve().parent
    source_dir = root / "src_photos"
    output_dir = root / "public" / "photos"
    manifest_path = root / "public" / "manifest.json"
    sources = sorted((p for p in source_dir.iterdir() if p.is_file() and p.suffix.lower() in SUPPORTED_EXTENSIONS), key=lambda p: p.name.lower()) if source_dir.exists() else []
    slugs = unique_slugs(sources)
    entries: list[dict[str, str]] = []
    rows: list[tuple[str, str, int, int, str]] = []

    for source in sources:
        slug = slugs[source]
        destination = output_dir / f"{slug}.webp"
        before, after, converted = output_size(source, destination, args.force)
        with Image.open(destination) as rendered:
            orientation = "landscape" if rendered.width >= rendered.height else "portrait"
        entries.append({"src": f"/photos/{destination.name}", "caption": "", "orientation": orientation})
        rows.append((source.name, destination.name, before, after, "converted" if converted else "skipped"))

    changed = write_manifest(manifest_path, entries)
    print("Source                         Output                         Before    After  Status")
    print("-" * 89)
    for source, destination, before, after, status in rows:
        print(f"{source:<30} {destination:<30} {before:>8} {after:>8}  {status}")
    print(f"Processed {len(sources)} photo(s); manifest {'updated' if changed else 'unchanged'}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
