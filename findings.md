# 🔍 FINDINGS.MD — Research & Discoveries
## Scruper: AI Newsletter Intelligence Dashboard

---

## 📡 RSS Feed Research (2026-02-21)

### Ben's Bites
- **Platform**: Substack (migrated from Beehiiv)
- **RSS URL**: `https://bensbites.substack.com/feed`
- **Format**: Standard RSS 2.0 with `<item>` tags
- **Fields available**: `<title>`, `<link>`, `<description>`, `<pubDate>`, `<content:encoded>`
- **Frequency**: Daily newsletter (weekdays)
- **Sections**: "What I'm consuming", "Tools and demos", "Dev Dish", "Afters"
- **Status**: ✅ Verified accessible

### The AI Rundown
- **Platform**: Beehiiv
- **RSS URL**: `https://rss.beehiiv.com/feeds/2R3C6Bt5wj.xml`
- **Format**: Standard RSS 2.0
- **Fields available**: `<title>`, `<link>`, `<description>`, `<pubDate>`
- **Content structure**: Sections include "Latest Developments", "Trending AI Tools", "Community Workflows"
- **Frequency**: Daily newsletter (every weekday morning)
- **Status**: ✅ Verified accessible (confirmed live article from 2026-02-20)

### The AI Rundown — Domain Clarification
- Main website: `therundown.ai` (confirmed via RSS content links)
- The domain `theairundown.ai` does NOT exist (DNS lookup failed)
- The correct brand name/domain is **The Rundown AI** at `therundown.ai`

---

## 🌐 CORS Considerations
- Browser cannot directly fetch RSS XML from cross-origin domains
- **Solution**: Use `https://api.allorigins.win/get?url={encoded_url}` as a CORS proxy
- Response format: `{ contents: "<raw XML string>" }`
- Alternative: `https://corsproxy.io/?{encoded_url}`
- Both are free, no-auth proxies suitable for development

---

## 🐍 Python Scraper Notes
- `feedparser` library parses RSS reliably
- `requests` + `beautifulsoup4` for fallback HTML scraping
- `python-dateutil` for robust date parsing
- Output format: JSON to `.tmp/articles.json`
- Run via: `python tools/scrape_feeds.py`

---

## 🔑 Reddit (Phase 2 Research)
- Reddit has a free JSON API: `https://www.reddit.com/r/artificial/new.json?limit=25`
- No OAuth required for read-only public subreddits
- Rate limit: 60 requests/minute (unauthenticated)
- Relevant subreddits: `r/artificial`, `r/MachineLearning`, `r/ChatGPT`

---

## ⚠️ Known Constraints
1. Beehiiv RSS feeds may include template variables like `{{ first_name | AI enthusiasts }}` in content — these must be stripped.
2. Ben's Bites Substack posts may have long HTML content — summarize to first 300 chars.
3. Both feeds are updated once daily (morning EST) — 24-hour filter will often return 1 article per source.
