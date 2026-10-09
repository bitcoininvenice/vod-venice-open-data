#!/usr/bin/env python3
"""
Crea il pacchetto ZIP della skill "venice-open-data" da caricare in Claude (o da estrarre in
~/.claude/skills/). Lo ZIP è riproducibile: ordine dei file e date fissi, quindi lo stesso
contenuto produce sempre gli stessi byte e un test verifica che quello pubblicato sia aggiornato.

Uso: python skills/build_skill_zip.py
Output: web/public/downloads/venice-open-data-skill.zip
"""

import os
import sys
import zipfile

ROOT = os.path.dirname(os.path.abspath(__file__))
SKILL_DIR = os.path.join(ROOT, "venice-open-data")
OUT_FILE = os.path.join(ROOT, "..", "web", "public", "downloads", "venice-open-data-skill.zip")
FIXED_DATE = (2026, 1, 1, 0, 0, 0)


def skill_files() -> list[str]:
    files = []
    for dirpath, dirnames, filenames in os.walk(SKILL_DIR):
        dirnames[:] = sorted(d for d in dirnames if d != "__pycache__")
        for name in sorted(filenames):
            if not name.endswith((".pyc",)) and not name.startswith("."):
                files.append(os.path.join(dirpath, name))
    return sorted(files)


def build(out_path: str = OUT_FILE) -> str:
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with zipfile.ZipFile(out_path, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        for path in skill_files():
            arcname = os.path.join("venice-open-data", os.path.relpath(path, SKILL_DIR)).replace(os.sep, "/")
            info = zipfile.ZipInfo(arcname, date_time=FIXED_DATE)
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = (0o755 if path.endswith(".py") else 0o644) << 16
            with open(path, "rb") as fh:
                zf.writestr(info, fh.read())
    return out_path


if __name__ == "__main__":
    print(build())
    sys.exit(0)
