#!/usr/bin/env python3
"""Genererer data/materialer.json ud fra filer i downloads/."""

from __future__ import annotations

import json
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import quote

ROOT = Path(__file__).resolve().parents[1]
DOWNLOADS = ROOT / "downloads"
OUTPUT = ROOT / "data" / "materialer.json"

ALLOWED_EXTENSIONS = {
    ".pdf",
    ".doc", ".docx",
    ".xls", ".xlsx",
    ".ppt", ".pptx",
    ".zip",
    ".jpg", ".jpeg", ".png", ".webp",
    ".mp3", ".mp4",
    ".txt",
}


def format_size(size: int) -> str:
    """Formaterer bytes som B, KB, MB, GB eller TB."""
    units = ("B", "KB", "MB", "GB", "TB")
    value = float(size)

    for unit in units:
        if value < 1024 or unit == units[-1]:
            decimals = 0 if unit == "B" else 1
            number = f"{value:.{decimals}f}".replace(".", ",")
            return f"{number} {unit}"
        value /= 1024

    return f"{size} B"


def file_url(path: Path) -> str:
    """Laver en URL med sikker kodning af mellemrum og danske tegn."""
    relative_parts = path.relative_to(ROOT).parts
    return "/".join(quote(part) for part in relative_parts)


def git_modified(path: Path) -> datetime:
    """Finder filens seneste commitdato; falder tilbage til filens tidsstempel."""
    relative_path = path.relative_to(ROOT).as_posix()

    try:
        result = subprocess.run(
            ["git", "log", "-1", "--format=%cI", "--", relative_path],
            cwd=ROOT,
            check=True,
            capture_output=True,
            text=True,
        )
        value = result.stdout.strip()
        if value:
            return datetime.fromisoformat(value)
    except (OSError, subprocess.CalledProcessError, ValueError):
        pass

    return datetime.fromtimestamp(path.stat().st_mtime, tz=timezone.utc)


def scan_folder(folder: Path) -> list[dict]:
    """Scanner en mappe rekursivt og returnerer mapper før filer."""
    if not folder.exists() or not folder.is_dir():
        return []

    entries = sorted(
        folder.iterdir(),
        key=lambda item: (not item.is_dir(), item.name.casefold()),
    )

    items: list[dict] = []

    for item in entries:
        # Skjulte filer/mapper og symbolske links medtages ikke.
        if item.name.startswith(".") or item.is_symlink():
            continue

        if item.is_dir():
            items.append({
                "type": "folder",
                "name": item.name,
                "children": scan_folder(item),
            })
            continue

        extension = item.suffix.lower()
        if not item.is_file() or extension not in ALLOWED_EXTENSIONS:
            continue

        stat = item.stat()
        modified = git_modified(item)

        items.append({
            "type": "file",
            "name": item.name,
            "url": file_url(item),
            "extension": extension.removeprefix("."),
            "size": stat.st_size,
            "size_display": format_size(stat.st_size),
            "modified": modified.isoformat(),
            "modified_display": modified.strftime("%d-%m-%Y"),
        })

    return items


def main() -> None:
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)

    data = {
        "generated": datetime.now(timezone.utc).isoformat(),
        "items": scan_folder(DOWNLOADS),
    }

    OUTPUT.write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    print(f"Materialelisten er genereret: {OUTPUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
