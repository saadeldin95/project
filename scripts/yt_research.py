#!/usr/bin/env python3
"""YouTube Research Tool — scrapes metadata via yt-dlp."""

import argparse
import json
import sys

import yt_dlp


def search_youtube(query: str, max_results: int = 25) -> list[dict]:
    """Search YouTube and return video metadata."""
    ydl_opts = {
        "quiet": True,
        "no_warnings": True,
        "extract_flat": False,
        "skip_download": True,
        "ignoreerrors": True,
    }

    search_url = f"ytsearch{max_results}:{query}"
    results = []

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(search_url, download=False)
        if not info or "entries" not in info:
            return results

        for entry in info["entries"]:
            if entry is None:
                continue
            results.append({
                "title": entry.get("title", "N/A"),
                "url": entry.get("webpage_url") or f"https://www.youtube.com/watch?v={entry.get('id', '')}",
                "views": entry.get("view_count", 0),
                "author": entry.get("uploader") or entry.get("channel", "N/A"),
                "duration_seconds": entry.get("duration", 0),
                "duration_friendly": _format_duration(entry.get("duration", 0)),
                "upload_date": entry.get("upload_date", "N/A"),
                "description": (entry.get("description") or "")[:200],
            })

    return results


def _format_duration(seconds: int | None) -> str:
    if not seconds:
        return "N/A"
    m, s = divmod(int(seconds), 60)
    h, m = divmod(m, 60)
    if h:
        return f"{h}:{m:02d}:{s:02d}"
    return f"{m}:{s:02d}"


def main():
    parser = argparse.ArgumentParser(description="Search YouTube for videos.")
    parser.add_argument("query", help="Search query")
    parser.add_argument("-n", "--max-results", type=int, default=25,
                        help="Number of results (default: 25)")
    parser.add_argument("--json", action="store_true", help="Output raw JSON")
    args = parser.parse_args()

    results = search_youtube(args.query, args.max_results)

    if args.json:
        print(json.dumps(results, indent=2))
    else:
        print(f"\n{'='*80}")
        print(f"  YouTube Search Results for: {args.query}")
        print(f"  Found {len(results)} videos")
        print(f"{'='*80}\n")
        for i, v in enumerate(results, 1):
            views = f"{v['views']:,}" if isinstance(v["views"], int) and v["views"] else "N/A"
            print(f"  {i:>2}. {v['title']}")
            print(f"      Author: {v['author']}  |  Views: {views}  |  Duration: {v['duration_friendly']}")
            print(f"      URL: {v['url']}")
            print()


if __name__ == "__main__":
    main()
