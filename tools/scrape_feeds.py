"""
tools/scrape_feeds.py
=======================
Layer 3: Deterministic RSS Scraper Tool

Purpose: Fetch, parse, and normalize articles from registered RSS feeds
         into the canonical Article schema (see gemini.md).

Output: .tmp/articles.json

Usage:
    python tools/scrape_feeds.py
    python tools/scrape_feeds.py --hours 48  # Look back 48 hours
"""

import json
import hashlib
import time
import re
import os
import sys
import argparse
from datetime import datetime, timezone, timedelta
from pathlib import Path

try:
    import feedparser
    import requests
    from bs4 import BeautifulSoup
    from dateutil import parser as dateutil_parser
except ImportError:
    print("❌ Missing dependencies. Run: pip install -r tools/requirements.txt")
    sys.exit(1)


# ─────────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────────

FEED_REGISTRY = [
    {
        "source": "bensbites",
        "source_label": "Ben's Bites",
        "url": "https://bensbites.substack.com/feed",
        "color": "#6366f1",
    },
    {
        "source": "rundown_ai",
        "source_label": "The AI Rundown",
        "url": "https://rss.beehiiv.com/feeds/2R3C6Bt5wj.xml",
        "color": "#f59e0b",
    },
]

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

OUTPUT_DIR = Path(".tmp")
OUTPUT_FILE = OUTPUT_DIR / "articles.json"
ERROR_LOG = OUTPUT_DIR / "errors.log"


# ─────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────

def make_id(url: str) -> str:
    """Generate a deterministic ID from the article URL."""
    return hashlib.sha256(url.encode()).hexdigest()[:16]


def strip_html(html: str) -> str:
    """Remove HTML tags and clean text."""
    if not html:
        return ""
    soup = BeautifulSoup(html, "html.parser")
    text = soup.get_text(separator=" ")
    # Remove Beehiiv template variables like {{ first_name | default }}
    text = re.sub(r"\{\{.*?\}\}", "", text)
    # Collapse whitespace
    text = re.sub(r"\s+", " ", text).strip()
    return text


def truncate(text: str, length: int = 300) -> str:
    """Truncate text to a max length, ending at a word boundary."""
    if len(text) <= length:
        return text
    return text[:length].rsplit(" ", 1)[0] + "…"


def parse_date(entry) -> datetime | None:
    """Robustly parse publication date from an RSS entry."""
    # Try feedparser's pre-parsed tuple
    if hasattr(entry, "published_parsed") and entry.published_parsed:
        try:
            return datetime(*entry.published_parsed[:6], tzinfo=timezone.utc)
        except Exception:
            pass
    # Try the raw string
    if hasattr(entry, "published") and entry.published:
        try:
            return dateutil_parser.parse(entry.published).replace(tzinfo=timezone.utc)
        except Exception:
            pass
    return None


def extract_image(entry) -> str | None:
    """Try to extract a featured image URL from the entry."""
    # Check media:content
    if hasattr(entry, "media_content") and entry.media_content:
        for media in entry.media_content:
            if media.get("type", "").startswith("image"):
                return media.get("url")
    # Check enclosures
    if hasattr(entry, "enclosures") and entry.enclosures:
        for enc in entry.enclosures:
            if enc.get("type", "").startswith("image"):
                return enc.get("url") or enc.get("href")
    # Parse from HTML content
    content = getattr(entry, "content", [{}])
    html = content[0].get("value", "") if content else ""
    if not html:
        html = getattr(entry, "summary", "") or ""
    soup = BeautifulSoup(html, "html.parser")
    img = soup.find("img")
    if img and img.get("src"):
        src = img["src"]
        # Skip tiny tracking pixels
        if "pixel" not in src and "track" not in src:
            return src
    return None


def normalize_entry(entry, feed_meta: dict, fetched_at: str) -> dict | None:
    """Normalize a feedparser entry into the canonical Article schema."""
    title = getattr(entry, "title", "").strip()
    url = getattr(entry, "link", "").strip()

    if not title or not url:
        return None

    article_id = make_id(url)

    # Get content for summary
    content_list = getattr(entry, "content", [])
    raw_html = content_list[0].get("value", "") if content_list else ""
    if not raw_html:
        raw_html = getattr(entry, "summary", "") or ""

    summary = truncate(strip_html(raw_html))
    image_url = extract_image(entry)
    published_dt = parse_date(entry)
    published_at = published_dt.isoformat() if published_dt else fetched_at

    # Extract tags
    tags = [tag.get("term", "") for tag in getattr(entry, "tags", []) if tag.get("term")]

    return {
        "id": article_id,
        "title": title,
        "summary": summary,
        "url": url,
        "source": feed_meta["source"],
        "source_label": feed_meta["source_label"],
        "published_at": published_at,
        "fetched_at": fetched_at,
        "image_url": image_url,
        "tags": tags,
        "is_saved": False,
    }


# ─────────────────────────────────────────────
# CORE SCRAPER
# ─────────────────────────────────────────────

def scrape_feed(feed_meta: dict, hours_back: int, fetched_at: str) -> list[dict]:
    """Fetch a single RSS feed and return normalized articles within the time window."""
    articles = []
    url = feed_meta["url"]
    label = feed_meta["source_label"]
    cutoff = datetime.now(timezone.utc) - timedelta(hours=hours_back)

    print(f"  ⟳ Fetching {label}...")

    try:
        response = requests.get(url, headers=HEADERS, timeout=15)
        response.raise_for_status()
        feed = feedparser.parse(response.text)

        if feed.bozo and not feed.entries:
            raise ValueError(f"Feed parse error: {feed.bozo_exception}")

        print(f"  ✓ {label}: {len(feed.entries)} total entries")

        for entry in feed.entries:
            pub_date = parse_date(entry)
            if pub_date and pub_date < cutoff:
                continue  # Outside the time window

            article = normalize_entry(entry, feed_meta, fetched_at)
            if article:
                articles.append(article)

        print(f"  ✓ {label}: {len(articles)} articles within {hours_back}h window")

    except Exception as e:
        error_msg = f"[{datetime.now().isoformat()}] ERROR fetching {label} ({url}): {e}\n"
        print(f"  ✗ {label}: {e}")
        ERROR_LOG.parent.mkdir(exist_ok=True)
        with open(ERROR_LOG, "a") as f:
            f.write(error_msg)

    return articles


def load_existing_cache() -> dict:
    """Load the existing article cache if it exists."""
    if OUTPUT_FILE.exists():
        try:
            with open(OUTPUT_FILE) as f:
                return json.load(f)
        except Exception:
            pass
    return {"last_fetched": None, "articles": []}


def merge_articles(existing: list[dict], new: list[dict]) -> list[dict]:
    """Merge new articles into existing, deduplicating by ID. Preserve is_saved state."""
    existing_map = {a["id"]: a for a in existing}
    for article in new:
        art_id = article["id"]
        if art_id in existing_map:
            # Preserve saved state
            article["is_saved"] = existing_map[art_id].get("is_saved", False)
        existing_map[art_id] = article
    # Sort by published_at descending
    merged = sorted(existing_map.values(), key=lambda x: x["published_at"], reverse=True)
    return merged


# ─────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Scruper RSS Feed Scraper")
    parser.add_argument("--hours", type=int, default=24, help="Look-back window in hours (default: 24)")
    args = parser.parse_args()

    OUTPUT_DIR.mkdir(exist_ok=True)
    fetched_at = datetime.now(timezone.utc).isoformat()

    print(f"\n🚀 Scruper Feed Scraper")
    print(f"   Window: last {args.hours} hours")
    print(f"   Time:   {fetched_at}")
    print(f"   Feeds:  {len(FEED_REGISTRY)}\n")

    all_new_articles = []

    for i, feed_meta in enumerate(FEED_REGISTRY):
        articles = scrape_feed(feed_meta, args.hours, fetched_at)
        all_new_articles.extend(articles)
        if i < len(FEED_REGISTRY) - 1:
            time.sleep(1)  # Rate limit courtesy

    # Load existing cache and merge
    cache = load_existing_cache()
    merged = merge_articles(cache.get("articles", []), all_new_articles)

    output = {
        "last_fetched": fetched_at,
        "articles": merged,
    }

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"\n✅ Done! {len(all_new_articles)} new articles fetched.")
    print(f"   Total in cache: {len(merged)}")
    print(f"   Output: {OUTPUT_FILE.resolve()}\n")


if __name__ == "__main__":
    main()
