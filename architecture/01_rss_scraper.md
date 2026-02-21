# SOP-01: RSS Feed Scraper
## Architecture Layer 1 — Standard Operating Procedure

---

## Purpose
Fetch, parse, and normalize article data from newsletter RSS feeds into the canonical `Article` JSON schema defined in `gemini.md`.

---

## Inputs
| Input | Type | Source |
|-------|------|--------|
| Feed URL | string | Hardcoded in `FEEDS` array (`index.html`) |
| Time window | integer (hours) | **Default: 72** |
| Fetch Throttle | integer (hours) | **6 hours** |

---

## Outputs

### Browser-side (primary)
| Output | Type | Destination |
|--------|------|-------------|
| Normalized articles | JSON array | `localStorage['scruper_cache']` |

---

## Feed Registry
| Source Label | RSS URL | Format |
|---|---|---|
| Ben's Bites | https://bensbites.substack.com/feed | Substack RSS 2.0 |
| The Rundown AI | https://rss.beehiiv.com/feeds/2R3C6Bt5wj.xml | Beehiiv RSS 2.0 |

---

## Browser-Side Processing (IIFE in index.html)

1. **Strategic Fetching**:
   - **Primary**: `fetch()` from `rss2json.com` (converts RSS to clean JSON, high reputation).
   - **Secondary (CORS Fallback Loop)**: `AllOrigins` → `CodeTabs` → `CorsProxy.io`.
2. **Fetch Control**: 
   - `FETCH_THROTTLE_MS` (6h) prevents redundant network calls.
   - `WINDOW_MS` (72h) manages the display history.
3. **Parse XML (Fallbacks only)**: `DOMParser.parseFromString(xmlStr, 'application/xml')`.
4. **Normalize**: Map to canonical `Article` schema (see `gemini.md`).
5. **Clean text**: Strip HTML tags. Remove template vars (`{{ ... }}`). Truncate summary to 260 chars.
6. **Robust Image Extraction**: Check `media:content`, `enclosure`, then `<img>` in `content:encoded`.
7. **Deduplicate**: FNV-style hash of URL → `id` field.
8. **Merge & Evict**: Merge new articles into state; evict those >72h old unless they are **Saved**.

---

## Edge Cases & Rules
- **403 Forbidden**: If a proxy returns 403, the loop automatically rotates to the next available proxy.
- **Newsletter Boilerplate**: `stripHtml()` automatically removes "Read Online", "Sign Up", "Good morning...", etc.
- **Persistence**: State is mirrored to `localStorage` after every success and every toggle.
- **Error Transparency**: Fetch errors are stored in `state.errors` and displayed in the sidebar status tooltips.
