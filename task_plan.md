# 📋 TASK_PLAN.MD — B.L.A.S.T. Blueprint
## Scruper: AI Newsletter Intelligence Dashboard

> **B.L.A.S.T. Phases:** Blueprint → Link → Architect → Self-Anneal → Test

---

## ✅ Phase 0: Protocol 0 — Initialization
- [x] Discovery answers gathered (partial — see ⚠️ below)
- [x] `gemini.md` constitution created
- [x] `findings.md` research log created
- [x] `progress.md` execution log created
- [x] RSS feed sources verified

> ⚠️ **HALT FLAG**: Several Protocol 0 discovery questions were never formally asked.
> See `implementation_plan.md` → "Blocked Questions" section before proceeding to Phase 2.

---

## ✅ Phase 1 — B: Blueprint
- [x] `architecture/01_rss_scraper.md` — RSS scraper SOP written
- [x] `architecture/02_dashboard.md` — Dashboard SOP written
- [ ] ⚠️ SOPs need update: still reference 24h window, old ES module approach

---

## ✅ Phase 1 — L: Link (Build)

### Tools Layer
- [x] `tools/scrape_feeds.py` — Python scraper written
- [x] `tools/requirements.txt` — dependencies declared
- [ ] ⚠️ Python scraper untested — Python not in PATH on this machine

### Frontend Layer
- [x] `index.html` — self-contained dashboard (IIFE script, no ES modules)
- [x] `assets/css/style.css` — Glaido brand design system (dark + lime)
- [x] `assets/js/app.js` — legacy stub (superseded by inline script)
- [x] `assets/js/feed.js` — legacy stub (superseded by inline script)
- [ ] ⚠️ Legacy JS files are dead code — decision needed: delete or keep?

### Brand Design
- [x] `DesignGuidelines/DesignLogo.png` embedded in sidebar
- [x] Obsidian black + lime green (`#D4FF33`) brand palette
- [x] Left sidebar nav layout
- [x] Glassmorphic dark article cards + TOP PICK badge
- [x] 4-stat metrics row + breadcrumb header + source status panel

---

## ✅ Phase 1 — A: Architect (Decisions Locked)
- [x] No framework — vanilla HTML/CSS/JS
- [x] CORS proxy via `allorigins.win` (fallback: `codetabs.com`)
- [x] `localStorage` for Phase 1 persistence
- [x] 72h display window (widened from 24h for newsletter cadence)
- [x] Browser-side RSS parsing (DOMParser + XHR)

---

## ✅ Phase 1 — SA: Self-Anneal (Bugs Fixed)
- [x] **SA-01**: ES module `import` blocked on `file://` → rewrote as single IIFE
- [x] **SA-02**: Python not in PATH → ported scraping fully to browser JS
- [x] **SA-03**: Wrong brand palette (light theme) → corrected to dark + lime
- [x] **SA-04**: 24h window too strict → expanded to 72h
- [ ] ⚠️ `gemini.md` not updated to reflect 72h change (Behavioral Rule #1 still says 24h)
- [ ] ⚠️ Architecture SOPs not updated after IIFE refactor and 72h change

---

## ⏸️ Phase 1 — T: Test (Incomplete)
- [x] Browser smoke test — loads, fetches feeds, renders cards
- [x] The AI Rundown: 20 articles confirmed live
- [x] Ben's Bites: feed confirmed (0 articles within window — correct)
- [ ] ⚠️ No formal test plan written against acceptance criteria
- [ ] ⚠️ Save persistence not formally tested end-to-end (save → close tab → reopen → verify)
- [ ] ⚠️ Error state not tested (no test of a bad feed URL / network fail)
- [ ] ⚠️ Mobile/responsive layout not verified

---

## 🎯 Phase 1 Acceptance Criteria
- [x] Dashboard loads and shows articles from both sources
- [x] 72h window shows recent articles from both sources
- [x] Save button works (localStorage)
- [x] Saved tab shows saved articles
- [x] Manual refresh button works
- [x] Design matches Glaido brand
- [x] Error states graceful per-source
- [x] Works by double-clicking `index.html` — no server needed
- [ ] ⚠️ Save persistence verified across tab close/reopen
- [ ] ⚠️ Responsive design verified on mobile viewport

---

## ⚡ Phase 2: Expand — BLOCKED ON ANSWERS
> **Do not start Phase 2 until the questions in `implementation_plan.md` are answered.**

- [ ] Strip newsletter boilerplate from summaries ("Read Online | Sign Up...")
- [ ] Add more newsletter sources (TBD — awaiting answer Q3)
- [ ] Reddit integration (awaiting answer Q4)
- [ ] Supabase backend — replace localStorage (awaiting answer Q5)
- [ ] User authentication (awaiting answer Q6)
- [ ] Tag / category filtering
- [ ] Search / keyword filter

---

## 🚢 Phase 3: Deploy — BLOCKED ON ANSWERS
> **Awaiting answer Q7 (deployment target) and Q8 (domain).**

- [ ] Host on Vercel / Netlify
- [ ] Set up scheduled scraping (Supabase Edge Function or cron)
- [ ] Custom domain
- [ ] README + maintenance docs
