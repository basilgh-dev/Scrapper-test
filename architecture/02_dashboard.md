# SOP-02: Dashboard Frontend
## Architecture Layer 1 — Standard Operating Procedure

---

## Purpose
Render scraped article data in a premium, interactive single-page dashboard. All data comes from `localStorage` cache populated by the in-browser RSS parser running via CORS proxy.

---

## Technology
- Vanilla HTML5 / CSS3 / JavaScript (no framework, no build step)
- Single IIFE `<script>` tag in `index.html` — **no ES modules** (blocked on `file://`)
- Open `index.html` directly from the filesystem — no server required
- CORS Proxy (primary): `https://api.allorigins.win/get?url=`
- CORS Proxy (fallback): `https://api.codetabs.com/v1/proxy?quest=`

---

## Brand Design System (as of 2026-02-21)
| Token | Value |
|-------|-------|
| Background | `#050505` (obsidian) |
| Accent | `#D4FF33` (Glaido lime green) |
| Surface | `#111111` |
| Text Primary | `#ffffff` |
| Text Muted | `#a1a1a1` |
| Font | Inter (Google Fonts) |
| Logo | `DesignGuidelines/DesignLogo.png` |
| Layout | Left sidebar (220px) + main content grid |

---

## Layout Structure
```
.app-shell (CSS grid)
├── .sidebar (left, fixed width)
│   ├── .sidebar-brand (logo + name)
│   ├── .sidebar-section (nav items: All / Ben's Bites / The AI Rundown / Saved)
│   └── .sidebar-footer (live source status + Refresh Feeds button)
├── .main-header (breadcrumb + page title)
└── .main-content
    ├── .stats-row (4 metric cards)
    ├── .section-header
    └── #articles-grid (article cards)
```

---

## Rendering Logic

### On Page Load
1. Read `scruper_cache` from `localStorage`
2. Read `scruper_saved` from `localStorage`
3. Check `scruper_last_fetch` timestamp
4. If last fetch > 72 hours ago (or no cache): trigger `fetchAll()`
5. Render articles filtered to last **72h** (saved articles always shown)
6. Update nav badges + stats row

### fetchAll()
1. For each feed in `FEEDS` array:
   - Show source status dot in "loading" (amber pulse)
   - Fetch via primary CORS proxy → fallback if fails
   - Parse XML with `DOMParser`
   - Merge into localStorage cache (deduplicate by `id`)
   - Update source status dot → "ok" (lime) or "error" (red)
2. Update `scruper_last_fetch` timestamp
3. Re-render articles grid

### Article Card
Each card shows:
- Source badge (colored pill, color per source)
- Published time (relative: "2h ago")
- **TOP PICK** badge on first card per source
- Article title (links to original in new tab)
- Summary (260 chars, boilerplate stripped)
- Article image (if available, lazy-loaded)
- Tags (if present)
- "Read Article →" link + Save button (☆ / ★)

---

## State Management
- All state lives in the `state` object inside the IIFE
- Persisted to `localStorage` on every change
- `localStorage` keys: `scruper_cache`, `scruper_saved`, `scruper_last_fetch`
- Phase 2: `localStorage` will be replaced by Supabase

---

## Navigation
| Nav Item | Filter Logic |
|----------|-------------|
| All Articles | `isWithin72h(a)` or `savedIds[a.id]` |
| Ben's Bites | Above + `a.source === 'bensbites'` |
| The AI Rundown | Above + `a.source === 'rundown_ai'` |
| Saved | `savedIds[a.id]` (no time filter) |

---

## Error States
- Feed fetch failed → Source status dot red + retry button
- No articles in 72h window → Empty state with floating 📭 icon + message
- Saved tab empty → "You haven't saved any articles yet" message

---

## Performance Rules
- No external JS frameworks
- Images lazy-loaded via `loading="lazy"`
- Animations: `transform` + `opacity` only (GPU accelerated)
- No synchronous fetch calls — all XHR async
