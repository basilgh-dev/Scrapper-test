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

## 🚀 Vercel Deployment & 403 Forbidden (2026-02-21)
- **Problem**: When deployed to Vercel, generic CORS proxies (AllOrigins) often return `403 Forbidden` or `503 Service Unavailable` due to high traffic or IP-based rate limiting on newsletter platforms (Beehiiv/Substack).
- **Solution**: Switch to a specialized RSS-to-JSON service like **RSS2JSON**.
- **RSS2JSON API**: `https://api.rss2json.com/v1/api.json?rss_url={url}`
- **Advantage**: Higher reliability, clean JSON output, and lower likelihood of being flagged as a "scraper" compared to general-purpose proxies.

---

## ⚠️ Known Constraints
1. Beehiiv RSS feeds may include template variables like `{{ first_name | AI enthusiasts }}` in content — these must be stripped.
2. The Rundown AI rebranded from "The AI Rundown" — consistency in naming is required.
3. Vercel deployment requires robust `fetch()` retry logic with proxy rotation support.
4. **Cache Strategy**: A 6-hour fetch throttle with a 72-hour display window is the optimal balance for daily newsletters.
