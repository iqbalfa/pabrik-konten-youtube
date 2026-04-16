#!/usr/bin/env python3
"""
Sync Knowledge Base data from ~/knowledge-base to ~/pabrik-konten-youtube/data/
Run this after knowledge-base scrapers have updated the data.
"""

import shutil
import sys
from pathlib import Path

KB_DIR = Path.home() / "knowledge-base" / "data"
PK_DIR = Path.home() / "pabrik-konten-youtube" / "data"

MAPPING = {
    "news/latest.json": "news_latest.json",
    "news/trending.json": "news_trending.json",
    "youtube/comments.json": "youtube_comments.json",
}


def main():
    PK_DIR.mkdir(parents=True, exist_ok=True)

    synced = 0
    for src_name, dst_name in MAPPING.items():
        src = KB_DIR / src_name
        dst = PK_DIR / dst_name

        if not src.exists():
            print(f"  [SKIP] {src_name} not found")
            continue

        shutil.copy2(src, dst)
        size = dst.stat().st_size / 1024
        print(f"  [OK] {src_name} → {dst_name} ({size:.0f}KB)")
        synced += 1

    print(f"\nSynced {synced}/{len(MAPPING)} files to {PK_DIR}")
    print("Run 'npm run build' in pabrik-konten-youtube to include new data.")


if __name__ == "__main__":
    main()
