# SOP-02: Dashboard Frontend
## Architecture Layer 1 — Standard Operating Procedure

---

## Purpose
Render scraped article data in a premium, interactive single-page dashboard. All data comes from `localStorage` cache populated by the in-browser RSS parser or specialized RSS-to-JSON service.

---

## Technology
- **Vanilla HTML5 / CSS3 / JavaScript**: No framework, no build step.
- **Vercel Optimized**: Fully compatible with Vercel deployment.
- **Single IIFE `<script>`**: Avoids ES module issues on `file://`.
- **Primary Data Service**: `RSS2JSON` API (Specialized RSS-to-JSON).
- **Fallback Loop**: `fetch()` API with automatic proxy rotation (AllOrigins, CodeTabs, CorsProxy).

---

## Brand Design System
| Token | Value |
|-------|-------|
| Background | `#050505` (obsidian) |
| Accent | `#D4FF33` (Glaido lime green) |
| Surface | `#111111` |
| Image | `DesignGuidelines/DesignLogo.png` |
| Layout | Mobile-first responsive grid. Left sidebar (Desktop) / Sliding Drawer (Mobile). |
| Aesthetics | Glassmorphism, animated backgrounds, premium gradients. |

---

## Layout Structure
```
.app-shell (CSS grid)
├── .mobile-top-bar (visible only on mobile)
├── .sidebar-overlay (for mobile drawer backdrop)
├── .sidebar (fixed desktop / absolute drawer mobile)
│   ├── .sidebar-brand (logo + name)
│   ├── .sidebar-section (tabs: All / Ben's Bites / The Rundown AI / Saved)
│   └── .sidebar-footer (source status + tooltips + Refresh button)
├── .main-header (sticky, breadcrumb, page title)
└── .main-content
    ├── .saved-bg-overlay (animated shapes for Saved tab)
    ├── .stats-row (4 glass cards)
    └── #articles-grid (masonry-style grid of article cards)
```

---

## Runtime Logic

### 1. Unified Fetching Strategy
- **Fetch Throttle (6h)**: App re-fetches feeds automatically if they are stale (>6h).
- **Time Window (72h)**: Feed filters articles to the last 3 days of content.
- **Persistence**: Save button state is preserved in `state.savedIds` and persisted to `localStorage['scruper_saved']`.

### 2. Navigation & Rendering
- **Saved Tab**: Triggers the `.saved-page` class on `.main-content`, activating animated "Shape Landing Hero" blobs.
- **Mobile Menu**: Uses a sliding drawer animation with a hamburger toggle button and a backdrop blur overlay.

### 3. Article Cards
- **Smart Images**: Fallback to source logo or removing image container if URL fails.
- **Deduplication**: SHA-like hashing of the URL to ensure no duplicate articles across sources.
- **Boilerplate Stripping**: Summaries are cleaned of common preamble ("Read Online", etc.).

---

## Performance & UX
- **No Synchronous Calls**: All network requests use modern `async/wait` fetch.
- **GPU Animations**: UI transitions (drawer, scale-ups, floating shapes) use `transform` and `opacity` only.
- **Error Transparency**: Troubleshooting info (HTTP codes) is available by hovering over the status dots in the sidebar.
