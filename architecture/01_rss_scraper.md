# SOP-01: RSS Feed Scraper
## Architecture Layer 1 — Standard Operating Procedure

---

## Purpose
Fetch, parse, and normalize article data from newsletter RSS feeds into the canonical `Article` JSON schema defined in `gemini.md`.

> **Note (updated 2026-02-21):** The original Python-only design was supplemented by a browser-side implementation due to Python not being in PATH on the development machine. Both implementations are maintained — use whichever applies to your environment.

---

## Inputs
| Input | Type | Source |
|-------|------|--------|
| Feed URL | string | Hardcoded in `FEEDS` array (`index.html`) |
| Time window | integer (hours) | **Default: 72** |

## Outputs

### Browser-side (primary)
| Output | Type | Destination |
|--------|------|-------------|
| Normalized articles | JSON array | `localStorage['scruper_cache']` |

### Python scraper (server/headless use)
| Output | Type | Destination |
|--------|------|-------------|
| Normalized articles | JSON array | `.tmp/articles.json` |
| Error log | text | `.tmp/errors.log` |

---

## Feed Registry
| Source Label | RSS URL | Format |
|---|---|---|
| Ben's Bites | https://bensbites.substack.com/feed | Substack RSS 2.0 |
| The AI Rundown | https://rss.beehiiv.com/feeds/2R3C6Bt5wj.xml | Beehiiv RSS 2.0 |

---

## Browser-Side Processing (IIFE in index.html)

1. **Fetch via CORS proxy**: `XHR GET https://api.allorigins.win/get?url={encoded_feed_url}`
   - Fallback proxy: `https://api.codetabs.com/v1/proxy?quest={encoded_feed_url}`
2. **Parse XML**: `DOMParser.parseFromString(xmlStr, 'application/xml')`
3. **Extract items**: `xml.querySelectorAll('item')`
4. **Filter by date**: Keep only entries where `published_at` is within the last **72 hours**
5. **Normalize**: Map to canonical `Article` schema (see `gemini.md`)
6. **Clean text**: Strip HTML tags. Remove Beehiiv template vars (`{{ ... }}`). Truncate summary to 260 chars
7. **Extract image**: Check `media:content`, `enclosure`, then `<img>` in `content:encoded`
8. **Deduplicate**: FNV-style hash of URL → `id` field
9. **Merge**: Merge into existing `localStorage` cache, preserving saved state

## Python Scraper Processing (tools/scrape_feeds.py)

1. **Fetch XML**: GET request with 10s timeout and browser-like User-Agent header
2. **Parse with feedparser**: Extract `entries[]` list
3. **Filter by date**: Keep only entries where `published_parsed` is within the last 72 hours
4. **Normalize**: Map to canonical `Article` schema
5. **Clean text**: Strip HTML. Remove `{{ ... }}` template vars. Truncate to 300 chars
6. **Deduplicate**: Hash URL → `id`
7. **Write output**: Merge with `.tmp/articles.json`, deduplicating by `id`

---

## Edge Cases & Rules
- If feed returns HTTP 4xx/5xx: Log error, skip feed, continue with others.
- If `published_parsed` is None: Parse `published` string manually with `dateutil`.
- If article has no image: Set `image_url` to `null`.
- Rate limit: 1-second delay between feed fetches (Python only).
- Never throw an unhandled exception — catch all errors per-feed.
- Strip known newsletter boilerplate: "Read Online", "Sign Up", "Advertise", "Unsubscribe".
