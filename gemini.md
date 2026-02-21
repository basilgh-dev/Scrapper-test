# 📜 GEMINI.MD — Project Constitution
## Scruper: AI Newsletter Intelligence Dashboard

> **This file is LAW. Never make code changes that conflict with this document without updating it first.**

---

## 🌟 North Star
> A beautiful, interactive dashboard that auto-fetches the latest AI newsletter articles every 24 hours from multiple sources and displays them with save/persist functionality.

---

## 🏗️ Architecture

### Stack
- **Frontend**: Vanilla HTML + CSS + JavaScript (no framework)
- **Backend/Scraper**: Python 3 (via `tools/`)
- **Data Store (Phase 1)**: `localStorage` + flat JSON cache in `.tmp/`
- **Data Store (Phase 2)**: Supabase (PostgreSQL)
- **Intermediates**: `.tmp/` directory

### Layer Map (A.N.T.)
| Layer | Location | Purpose |
|-------|----------|---------|
| Architecture | `architecture/` | SOPs in Markdown |
| Navigation | `index.html` + `app.js` | Routing, state, UI logic |
| Tools | `tools/` | Python scrapers (deterministic) |

---

## 📦 Data Schema

### Article Object (Canonical Shape)
```json
{
  "id": "string (SHA256 hash of URL)",
  "title": "string",
  "summary": "string (first 300 chars of content, stripped of HTML)",
  "url": "string (canonical article URL)",
  "source": "string (enum: 'bensbites' | 'rundown_ai' | 'reddit')",
  "source_label": "string ('Ben's Bites' | 'The AI Rundown' | 'Reddit')",
  "published_at": "ISO 8601 datetime string",
  "fetched_at": "ISO 8601 datetime string",
  "image_url": "string | null",
  "tags": ["string"],
  "is_saved": false
}
```

### Feed Cache Object
```json
{
  "last_fetched": "ISO 8601 datetime string",
  "articles": [Article]
}
```

### LocalStorage Keys
| Key | Value |
|-----|-------|
| `scruper_cache` | Serialized FeedCache object |
| `scruper_saved` | Array of saved article IDs |
| `scruper_last_fetch` | ISO timestamp of last fetch |

---

## 🔗 Data Sources

### Phase 1 (Active)
| Source | Type | URL | Notes |
|--------|------|-----|-------|
| Ben's Bites | Substack RSS | `https://bensbites.substack.com/feed` | Standard RSS 2.0 |
| The AI Rundown | Beehiiv RSS | `https://rss.beehiiv.com/feeds/2R3C6Bt5wj.xml` | Standard RSS 2.0 |

### Phase 2 (Planned)
| Source | Type | Notes |
|--------|------|-------|
| Reddit r/artificial | JSON API | `https://www.reddit.com/r/artificial/.json` |
| Supabase | PostgreSQL | For persistent cross-device storage |

---

## 🧠 Behavioral Rules

1. **72-Hour Window**: Only display articles published within the last 72 hours. If no new articles exist, show a "No new articles" state gracefully. (Widened from 24h — newsletters typically publish once per weekday, not every day.)
2. **Auto-Refresh**: The dashboard checks for new data every 72 hours. Manual refresh button always available.
3. **Save Persistence**: Saved articles persist across sessions via localStorage. A saved article is NEVER removed from view even if it's older than 72 hours.
4. **No Overwrite**: Never overwrite saved article state when fetching new data.
5. **Deduplication**: Articles are deduplicated by URL hash. Same article from multiple fetches = one card.
6. **Graceful Degradation**: If a feed fails to load, show the source card in an error state. Never crash the whole dashboard.
7. **Rate Limit Safety**: Minimum 1 second delay between HTTP requests in the Python scraper.
8. **CORS Proxy**: The frontend fetches RSS via `https://api.allorigins.win/get?url=` as primary CORS proxy. Fallback: `https://api.codetabs.com/v1/proxy?quest=`.
9. **No ES Modules on file://**: The dashboard runs as a single IIFE `<script>` tag. Do not use `import/export` — they require a server origin and break on `file://`.

---

## 🔌 Integrations & Credentials

| Service | Key Location | Status |
|---------|-------------|--------|
| RSS Feeds | No key needed | ✅ Verified |
| Supabase | `.env` (Phase 2) | ⏳ Pending |
| Reddit API | `.env` (Phase 2) | ⏳ Pending |

---

## 📐 Architectural Invariants

1. The `Article` schema shape above must never break without a migration plan.
2. `tools/` scripts are stateless — they write to `.tmp/` and exit.
3. `gemini.md` is updated BEFORE any code change that affects schema or rules.
4. All API keys live in `.env` only. Never hardcode credentials.

---

## 🔧 Maintenance Log

| Date | Change | Reason |
|------|--------|--------|
| 2026-02-21 | Initial constitution created | Protocol 0 initialization |
| 2026-02-21 | Behavioral Rule #1 updated to 72h | Newsletters publish ~weekdays; 24h was too strict |
| 2026-02-21 | Behavioral Rule #9 added (no ES modules on file://) | SA-01 fix formalized |
| 2026-02-21 | Behavioral Rule #8 updated with fallback proxy | Production resilience |
