# 📋 TASK_PLAN.MD — B.L.A.S.T. Blueprint
## Scruper: AI Newsletter Intelligence Dashboard

> **B.L.A.S.T. Phases:** Blueprint → Link → Architect → Self-Anneal → Test

---

## ✅ Phase 0: Protocol 0 — Initialization
- [x] Discovery answers gathered
- [x] `gemini.md` constitution created
- [x] `findings.md` research log created
- [x] `progress.md` execution log created
- [x] RSS feed sources verified

---

## ✅ Phase 1 — B: Blueprint
- [x] `architecture/01_rss_scraper.md` — RSS scraper SOP updated (IIFE + Proxy logic)
- [x] `architecture/02_dashboard.md` — Dashboard SOP updated (Dark + Lime brand)

---

## ✅ Phase 1 — L: Link (Build)

### Tools Layer
- [x] `tools/scrape_feeds.py` — Python scraper (Legacy / Reference)
- [x] `tools/requirements.txt` — dependencies declared

### Frontend Layer
- [x] `index.html` — self-contained dashboard (IIFE script, fetch() API)
- [x] `assets/css/style.css` — Glaido brand design system (dark + lime)
- [x] `assets/js/app.js` — marked as legacy stub
- [x] `assets/js/feed.js` — marked as legacy stub

### Brand Design
- [x] `DesignGuidelines/DesignLogo.png` embedded in sidebar
- [x] Obsidian black + lime green (`#D4FF33`) brand palette
- [x] Left sidebar nav layout (Mobile-first with sliding drawer)
- [x] Glassmorphic dark article cards + TOP PICK badge
- [x] 4-stat metrics row + breadcrumb header + source status panel
- [x] Animated "Shape Landing Hero" background for **Saved** section

---

## ✅ Phase 1 — A: Architect (Decisions Locked)
- [x] No framework — vanilla HTML/CSS/JS (Vercel compatible)
- [x] Primary fetching via `RSS2JSON` API (Specialized RSS-to-JSON)
- [x] Robust proxy fallback loop (AllOrigins → CodeTabs → CorsProxy)
- [x] `localStorage` for Phase 1 persistence
- [x] 72h display window (widened from 24h for newsletter cadence)
- [x] 6h fetch throttle (independent of display window)
- [x] Browser-side parsing (fetch API + custom map)

---

## ✅ Phase 1 — SA: Self-Anneal (Bugs Fixed)
- [x] **SA-01**: ES module `import` blocked on `file://` → single IIFE
- [x] **SA-02**: Python not in PATH → fully browser-side implementation
- [x] **SA-03**: Wrong brand palette → corrected to Dark Obsidian + Glaido Lime
- [x] **SA-05**: 403 Forbidden errors on Vercel → implemented RSS2JSON specialized service
- [x] **SA-06**: Stale cache → decoupled 6h fetch throttle from 72h display window
- [x] **SA-07**: Mobile layout issues → implemented responsive top bar + sliding menu

---

## ✅ Phase 1 — T: Test (Completed)
- [x] Browser smoke test — loads, fetches feeds, renders cards
- [x] The Rundown AI: 20 articles confirmed live
- [x] Ben's Bites: feed confirmed
- [x] Save persistence verified (localStorage logic)
- [x] Error state verified (detailed tooltips on status dots)
- [x] **Mobile/responsive layout verified via browser subagent screenshot**

---

## ✅ Phase 1 Acceptance Criteria
- [x] Dashboard loads and shows articles from both sources
- [x] 72h window shows recent articles from both sources
- [x] Save button works (localStorage)
- [x] Saved tab shows saved articles
- [x] Manual refresh button works
- [x] Design matches Glaido brand
- [x] Error states graceful per-source
- [x] Works locally (file://) and deployed (Vercel)
- [x] Mobile-first responsive UI

---

## ⚡ Phase 2: Expand (Next Steps)
- [x] Strip newsletter boilerplate from summaries ("Read Online | Sign Up...") — **DONE**
- [ ] Add more newsletter sources (e.g., TLDR AI, Superhuman)
- [ ] Reddit integration (AI-related subreddits)
- [ ] Supabase backend — replace localStorage for real persistence
- [ ] User authentication (optional)
- [ ] Tag / category filtering refinements
- [ ] Search bar for articles

---

## 🚢 Phase 3: Deploy
- [x] Host on Vercel — **DONE**
- [x] Push to GitHub (`basilgh-dev/Scrapper-test`) — **DONE**
- [ ] README + maintenance docs refinement
- [ ] Set up scheduled scraping server-side (optional, current browser-side is working well)
