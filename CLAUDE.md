# CLAUDE.md — Field Tools Project Context

> ## 🚨 CLAUDE: READ THIS FILE FIRST 🚨
>
> Before reading any HTML file or making any change to this project, **read this entire file**. It is the authoritative reference for:
> - Where things live (file paths, storage keys, DB names)
> - The design system (colors, tokens, animations)
> - What NOT to touch (PDF code, storage keys, certain constants)
> - User preferences and conventions (commit style, increment rules, naming)
>
> **This file exists to save tokens.** Re-reading the four HTML files (~6,800 lines total) for every change is wasteful. Use this reference first; only read source files when you need specifics this file doesn't cover.
>
> ## 🔄 KEEP THIS FILE CURRENT
>
> Every time you make a change to the project, **update the corresponding section of this file in the same commit**. The file is only useful if it stays accurate. If you add a storage key, a CSS class, an animation, or change a behaviour — reflect it here. If you remove or invert a behaviour — remove or invert the note.
>
> ## ✋ ASK BEFORE PUSHING
>
> The user prefers an explicit confirmation before `git push`. After committing locally, **ask "Push?" or similar** before running `git push`. Only when the user confirms, bump the version stamp (footer + service-worker cache) and push.
>
> **Version bump rule:** decimal increments only (v1.0 → v1.1 → v1.2). Never whole-number jumps. Only bump immediately before a push — don't bump on every commit.

---

> **Purpose:** This file is the authoritative quick-reference for the NJDOT Field Tools project. Read this FIRST before reading any HTML file. It contains every architectural decision, storage key, design token, and critical constraint so we can make changes without re-reading 6,800+ lines of HTML.
>
> **Last updated:** 2026-05-26 · v1.14
>
> **Live site:** `https://joebiocco.github.io/NJDOT-Field-Tools-Hub/`
> **Repo:** `https://github.com/Joebiocco/NJDOT-Field-Tools-Hub` (renamed from `Work-Order-Closeout`)
> **Local path:** `C:\Users\Joe\Desktop\Work Order Website`

---

## 1. Project Overview

A static internal PWA for NJ DOT field workers, hosted on GitHub Pages. **No backend.** Five current tools + two placeholder tiles for upcoming features.

**Audience:** NJ DOT field workers using phones and tablets in the field, plus desktop in the office.

**Critical constraints (DO NOT VIOLATE):**
- **DO NOT TOUCH the PDF programming** in `pages/WorkOrderCloseout.html` (uses `html2canvas` + `jspdf`). This was an explicit user constraint from project start.
- **DO NOT clear or rename localStorage/IndexedDB keys** listed below. Doing so destroys user bookmarks, saved work-order sessions, and photos.
- **DO NOT introduce dependencies** that require a backend or build step. The site must be pure static HTML/CSS/JS.

**Geolocation behaviour (current — do not break):**
- Fuel finder **auto-fetches location on page load** if `navigator.permissions.query({name:'geolocation'}).state === 'granted'`. First-time visitors still see the button so the permission prompt only fires on their click. After the prompt is granted once, subsequent visits are silent.
- Bridge navigator's "Find Near Me" pill stays manual (single-purpose locator, not a continuous discovery feature).
- NEVER cache the lat/lng in localStorage with a TTL — workers may be moving and need a fresh fix every time.

---

## 2. File Structure

```
Work Order Website/
├── index.html                       # Hub (1,042 lines) — tool grid, dark toggle, install/bookmark popup
├── manifest.json                    # PWA manifest, theme_color
├── service-worker.js                # Offline cache, network-first HTML
├── push.bat                         # Local helper: git add/commit/push
├── data/
│   ├── njfuel.json                  # ~74 NJDOT fuel stations
│   ├── njstructures.json            # Bridge Navigator source archive/fallback; metadata + records[] wrapper
│   └── bridges/
│       ├── index.json               # Lightweight statewide Bridge Navigator index
│       └── chunks/by-county/*.json  # Full bridge records lazy-loaded by county
├── icons/
│   ├── icon-192.png                 # PWA app icon (192×192) — NJDOT bridge + bar chart, dark navy #001e4d bg, no pre-baked rounding
│   └── icon-512.png                 # PWA app icon (512×512) — same design, maskable, corners filled solid navy
├── js/
│   └── dc144.js                     # DC-144 Field Form logic (~1,964 lines); IDB v2, ExcelJS export, dynamic grids
├── pages/
│   ├── njsearch.html                # Bridge Navigator
│   ├── njfuel.html                  # Fuel Station Finder
│   ├── milemarker.html              # Road Milepost Finder
│   ├── timesheet.html               # Payroll Calculator & Timesheet
│   ├── WorkOrderCloseout.html       # Work Order tool
│   └── dc144.html                   # DC-144 Field Form (~494 lines); loads ../js/dc144.js
├── _archive/                        # old files, ignore
├── reference/                       # data sources, ignore
├── scripts/                         # transient helper scripts
└── tools/
    └── validate-bridge-data.js      # Validates Bridge Navigator index/chunk data integrity
```

**Backups (on Desktop, DO NOT TOUCH):**
- `Work Order Website - Backup 2026-05-17` — permanent baseline backup
- `Work Order Website - Backup 2026-05-17 (Pre-Analytics)` — pre-GA4 snapshot
- `Work Order Website - Backup 2026-05-18` — pre-large-tasklist snapshot

### Bridge source data

- `data/bridges/index.json` is the Bridge Navigator startup/search/GPS/bookmark index.
- `data/bridges/chunks/by-county/*.json` holds complete original full bridge records for detail panels, copy/share fields, selected bookmark details, and selected GPS details.
- `data/njstructures.json` remains the Bridge Navigator source archive and fallback data file only.
- Current source shape: `{ metadata: { recordCount, generatedDate, source }, records: [...] }`.
- Current local size is about 12.4 MB; `pages/njsearch.html` is about 541 KB after removing inline bridge records.
- `records[].Structure_Number` preserves the exact raw value and remains the stable key for bookmarks, search, and future data migration.
- `ft_bridge_bookmarks` must remain an array of raw `Structure_Number` values. Do not store formatted `XXXX-XXX` values there and do not migrate/rename the key.
- Normal Bridge Navigator startup loads `../data/bridges/index.json` through `loadBridgeIndex()` and stores lightweight records in `bridgeIndex`.
- `bridgeIndexByStructureNumber` maps raw `Structure_Number` values to index records for search, bookmarks, and GPS matching.
- Bridge Navigator search uses strict bridge-number scoring for numeric/dash queries (no fuzzy/subsequence matching), while general text queries still support bridge name, county, route, municipality, facility carried, and feature crossed fields from the statewide index.
- Search result map pins use lightweight index records only. Result sets over 50 pins are capped to the first 50 by default and expose a quiet in-map "Map: 50 of X / Show all" control for broad county/route searches.
- The Bridge Navigator "All Bridges" filter renders the statewide index list without loading all county chunks; it uses the same 50-pin map cap and only lazy-loads the selected bridge's full county chunk.
- Find Near Me / GPS bridge lookup must scan the statewide `bridgeIndex`; do not load county chunks to determine nearest GPS candidates.
- Full bridge records live in `data/bridges/chunks/by-county/*.json` and are lazy-loaded with `getFullBridgeRecord()` only when a bridge detail/share/copy view needs full fields.
- `bridgeChunkCache` caches loaded county chunk promises in memory; chunks are not stored in localStorage or IndexedDB.
- `data/njstructures.json` is loaded only by fallback code if the index cannot be loaded.
- `pages/njsearch.html` no longer embeds `BRIDGES_DATA`; do not re-inline bridge records.
- `service-worker.js` pre-caches `data/bridges/index.json`; county chunks are runtime-cached after first fetch. Do not pre-cache every county chunk unless explicitly approved.

---

## 3. Storage Architecture

### localStorage keys

| Key | File(s) | Format | Purpose |
|---|---|---|---|
| `ft_bridge_bookmarks` | njsearch | `JSON.stringify(["structNum1", "structNum2"])` | Array of bookmarked Structure_Number strings |
| `ft_fuel_bookmarks` | njfuel | `JSON.stringify(["lat,lng", ...])` | Composite coord keys via `_fuelKey(s)` helper |
| `wo_recent` | WorkOrderCloseout | JSON array (max 5) of recent session metadata | Each rec has `{wo, str, date, fname, route, direction, mp, startDate, endDate, priority, photoKey}` — PHOTOS NOT INCLUDED HERE |
| `workorder_draft` | WorkOrderCloseout | Full session JSON snapshot | Single auto-saved draft |
| `ft_dc144_recent` | dc144 | JSON array (max 5) of recent DC-144 session metadata | Each rec has `{id, tab, projectName, date, savedAt, photoKey}` — full data in IDB |
| `ft_dc144_templates` | dc144 | JSON array (max 10) of saved templates | Each entry has `{id, name, createdAt, header:{projectName,contractId,contractor,inspectorName}}` — header-only, no grid rows |
| `field_dark_mode` | all pages | `"1"` if dark mode on | Theme preference |
| `ft_last` | all pages | `"njsearch" \| "njfuel" \| "closeout" \| "milemarker" \| "timesheet" \| "dc144"` | Last visited tool (used for the Home recent badge and Continue section) |
| `ft_install_shown` | index | int 0-2 | How many times install popup has auto-shown on mobile |
| `ft_bookmark_shown` | index | int 0-2 | How many times bookmark popup has auto-shown on desktop |

### sessionStorage keys (cleared on tab close)

| Key | Set by | Read by | Purpose |
|---|---|---|---|
| `ft_opening_from_hub` | hub click on tool card | tool page head inline script | Triggers slide-in-from-left animation |
| `ft_returning_to_hub` | hub-back click + browser back | hub head inline script + pageshow | Triggers slide-in-from-right animation |

### IndexedDB

**Database:** `ft_photos` (v2) — v1 created by WorkOrderCloseout.html; v2 upgrade performed by dc144.js when the DC-144 page first opens.

**Object store:** `session_photos` (v1) — key is `photoKey` from wo_recent rec.

**Object store:** `dc144_sessions` (v2) — key is `photoKey` from ft_dc144_recent rec. Full session JSON including photos.

**Value structure:**
```js
{
  photos:     Array<Array<{ src, location, description }>>,  // [pageIndex][photoIndex]
  pageData:   Array<{ [data-base attribute]: value }>,        // per-page form data
  pageCount:  number,                                          // how many pages were in this session
  isCloseout: boolean                                          // closeout document toggle state
}
```

**Helper functions in WorkOrderCloseout.html:**
- `openPhotoDB()` — opens/caches IDB connection
- `dbPutPhotos(key, data)` — write
- `dbGetPhotos(key)` — read
- `dbDeletePhotos(key)` — delete on session eviction

**Helper functions in js/dc144.js** (same IDB database, separate store):
- `openPhotoDB()` — same name, bumps to v2, adds `dc144_sessions` if needed
- `dbPutDC144(key, data)` — writes to `dc144_sessions`
- `dbGetDC144(key)` — reads from `dc144_sessions`
- `dbDeleteDC144(key)` — called on session eviction from `ft_dc144_recent`

**Important:** When a session is evicted from `wo_recent` (capped at 5), `dbDeletePhotos(rec.photoKey)` is called to free the IDB entry. The `photoKey` is `'pk_' + Date.now()` set at save time.

**Important:** `ft_photos` v2 `onupgradeneeded` checks `oldVersion` to add stores incrementally — it never recreates `session_photos`. WorkOrderCloseout.html sessions are fully safe when the DC-144 page triggers the v1→v2 upgrade.

---

## 4. Design System

### Color tokens (CSS custom properties)

```css
:root {
  --bg: #eef0f4;          /* page background, light */
  --surface: #ffffff;     /* cards/panels */
  --border: #d1d9e0;
  --border-lo: #e8ecf0;   /* subtle borders */
  --accent: #1a56db;      /* primary blue — buttons, links, focus */
  --accent-lo: rgba(26,86,219,0.08);
  --red: #dc2626;
  --text: #111827;
  --muted: #6b7280;
  --muted2: #4b5563;
  --radius-sm: 5px; --radius: 8px; --radius-lg: 10-12px;
  --sans: 'Inter', system-ui, -apple-system, Arial, sans-serif;
  --transition: 0.14s ease;
}
html[data-dark] {
  --bg: #0f1117; --surface: #1c1e26; --border: #2d3748;
  --border-lo: #1f2937; --text: #f1f5f9; --muted: #94a3b8;
  --muted2: #cbd5e1; --accent-lo: rgba(26,86,219,0.15);
}
```

### Brand / Accent palette (NOT in CSS vars — hardcoded throughout)

| Role | Light mode hex | Dark mode hex | Notes |
|---|---|---|---|
| **Header accent** | `#E5B33B` (saffron gold) | same | Topbar bottom border, hub-back pill, dark toggle, install trigger |
| Header accent hover | `#C9971A` | `#FEE9A1` | Deeper warm gold |
| Topbar background | `#1e2939` (dark navy) | same | Always dark, never themed |
| Bookmark stars / "favorite" | `#f59e0b` (amber-500) | same | Universal star color — DO NOT change to header accent |
| Bridge Navigator card | `#7c3aed` (purple) | `#a78bfa` | `card-border-purple`, `card-icon-purple`, `tag-nj` |
| Fuel Station card | `#10b981` / `#059669` | same | `card-border-green`, `card-icon-green`, `tag-fuel` |
| Work Order card | `#64748b` / `#475569` | same | `card-border-slate`, `card-icon-slate`, `tag-doc` |
| DC-144 Field Form card | `#4338ca` (indigo) | `#818cf8` | `card-border-indigo`, `card-icon-indigo`, `tag-dc` |
| Find Near Me pill | `#0d9488` (teal) | `#2dd4bf` | On njsearch.html, distinct from cards |
| Coming Soon — Drainage | `#0891b2` (cyan) | `#67e8f9` | `card-icon-cyan`, `card-border-cyan` |
| Coming Soon — Milemarker | `#b45309` / `#d97706` (warm amber) | `#fcd34d` | Safety/warning theme. `card-icon-amber-soon` |
| Coming Soon — Emergency | `#be123c` (rose) | `#fb7185` | `card-icon-rose`, `card-border-rose` |
| Condition: Good / Open | `#22c55e` / `#16a34a` | — | Map markers, badges |
| Condition: Poor / Closed | `#dc2626` / `#9ca3af` | — | |

### Color change procedure

When asked to change the **header accent color**, sweep all hex variants together (use python script). Don't just change one — there are typically 80-120 references across the 4 pages in:
- Topbar border-bottom (2px line)
- `.hub-back`, `.topbar-back` pill and hover
- `.dark-toggle` background/border/color
- `.install-trigger` hover
- `.install-banner` border-top
- Theme-color meta tag (in `<head>`)
- `manifest.json` `theme_color` field
- Various focus rings, info badges, etc.

**DO NOT touch the following during accent sweeps:**
- Bookmark stars (`.bookmark-btn`, `.fuel-bookmark-btn`, `.is-bookmarked` markers) — always amber `#f59e0b`
- Coming Soon Milemarker tile — always warm amber
- Card border/icon colors for the 3 main tools (purple/green/slate)
- The `--accent: #1a56db` deep blue (used for buttons/links, NOT the header)

---

## 5. Animation System

### Global animation classes (applied to `<html>`)

| Class | Set by | Triggers | Duration |
|---|---|---|---|
| `theme-transitioning` | dark mode toggle click | Crossfade all bg/color/border properties site-wide | 420ms, cubic-bezier(0.65, 0, 0.35, 1) |
| `exiting-to-tool` | hub tool-card click | Body slides right + fades | 260ms exit, navigate at 180ms |
| `entering-from-hub` | tool page head inline script (reads sessionStorage) | Body slides in from left, scale 0.98→1 | 380ms, cubic-bezier(0.22, 1, 0.36, 1) |
| `exiting-to-hub` | tool's hub-back click + popstate | Body slides left + fades | 360ms exit, navigate at 280ms |
| `returning-from-tool` | hub head inline script + pageshow | Body slides in from right, scale 0.98→1 | 460ms, cubic-bezier(0.22, 1, 0.36, 1) |

### Anti-flicker pattern

Every transition animation class has the FROM state set explicitly via direct CSS properties (`opacity`, `transform`) on the selector — NOT just keyframes — so the body is guaranteed to be in the correct off-screen state before the animation actually starts. Pattern:

```css
@keyframes slideInFromLeft {
  0%   { opacity: 0; transform: translate3d(-18vw, 0, 0) scale(0.98); }
  100% { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
}
html.entering-from-hub body {
  opacity: 0;                                       /* lock start state */
  transform: translate3d(-18vw, 0, 0) scale(0.98);  /* lock start state */
  animation: slideInFromLeft 380ms cubic-bezier(0.22, 1, 0.36, 1) both !important;
  will-change: transform, opacity;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}
```

### Smart header (sticky topbar with hide-on-scroll)

Each page has:
```css
.topbar, #topbar {
  position: sticky; top: 0; z-index: 600;
  /* z-index must be ABOVE .recent-overlay (500) so blur doesn't cover topbar */
  transition: transform 460ms cubic-bezier(0.65, 0, 0.35, 1), opacity 460ms ...;
}
.topbar.header-hidden { transform: translateY(-100%); opacity: 0; pointer-events: none; }
```

JS behavior (in every page):
- Scroll down past 80px → after 1s of sustained downscroll → add `header-hidden`
- Scroll up → remove `header-hidden` immediately
- Mouse near top (clientY ≤ 14) → reveal
- Touch near top (clientY ≤ 30) → reveal (mobile)
- Mouse hovering over topbar → never hide (`mouseOverHeader` flag)

### Other key animations

- **Page fade-in (body)**: `pageFadeIn 460ms cubic-bezier(0.16, 1, 0.3, 1)` — default body load animation, OVERRIDDEN by `entering-from-hub` / `returning-from-tool` via `!important`
- **Photo pop-in (work order)**: 420ms easeOutExpo on `.drop-preview.active`
- **Page block fade-in**: `blockFadeIn 520ms cubic-bezier(0.16, 1, 0.3, 1)` on `.page-block`
- **Page remove**: `pageRemoveFade 380ms cubic-bezier(0.65, 0, 0.35, 1)` followed by height collapse
- **Result/station stagger**: `nth-child` delays 50-60ms between items
- **Toast in/out**: `transform/opacity 240-280ms cubic-bezier(0.16, 1, 0.3, 1)`
- **Button click glow**: `btnGlow 320ms cubic-bezier(0.16, 1, 0.3, 1)` — soft outer pulse via box-shadow
- **Button tap scale**: `transform: scale(0.96) !important; transition: transform 80ms ease-out !important;` on `:active`

### Standard easing curves used

- `cubic-bezier(0.16, 1, 0.3, 1)` — easeOutExpo — luxury entrances
- `cubic-bezier(0.22, 1, 0.36, 1)` — easeOutQuint — gentle settle
- `cubic-bezier(0.65, 0, 0.35, 1)` — easeInOutCubic — symmetric navigation
- `cubic-bezier(0.4, 0, 0.2, 1)` — Material standard — exits

---

## 6. PWA / Service Worker

### Caching strategy

```js
const CACHE = 'ft-v1.11-2026-05-21';  // BUMP this on every push that should force refresh

// HTML pages → NETWORK-FIRST (always latest, cache as offline fallback)
// Static files (icons, JSON, manifest) → CACHE-FIRST (rarely change)
// CDN libs (Leaflet, html2canvas, jsPDF, Inter font) → NETWORK-FIRST with cache fallback
```

**Important:** The service worker cache is **completely separate** from localStorage and IndexedDB. Updating/clearing the SW cache does NOT touch user bookmarks, sessions, or photos.

### Update protocol

**Only when actually pushing to GitHub** (not on every commit):
1. Ask user for confirmation first ("Push?" / "Ready to push?")
2. On confirmation: bump `CACHE` constant in `service-worker.js` (e.g., `ft-v1.1-2026-05-18` → `ft-v1.2-2026-05-18`)
3. Bump version stamp in `index.html` footer (decimal increment only)
4. Bump "Last updated" date in `CLAUDE.md`
5. `git push` → GitHub Pages auto-deploys

Existing users get the new SW on their next visit; old cache is auto-deleted on activate. **localStorage and IndexedDB are NOT touched by SW cache changes** — user bookmarks/sessions/photos persist.

---

## 7. Critical UI Patterns

### Standard map frame

- Leaflet maps should use the Bridge Navigator framed-map treatment unless a task explicitly says otherwise.
- Standard map frame: equal spacing on all sides (`12px` desktop, `10px` mobile), `14px` desktop radius, `12px` mobile radius, `overflow:hidden`, token border, light-mode soft shadow, darker dark-mode shadow, and neutral `#e8ecf0` loading background.
- The map frame element itself owns the border/radius/shadow/overflow. Do not put a rounded map inside an extra padded transparent card; that creates inconsistent map width and spacing.
- On stacked tablet/mobile layouts, map frames should align to the same page edge rhythm as the primary content (`10px` side spacing at the current 656px test width). Use a `max-width:720px`-style breakpoint when needed, not only narrow phone breakpoints.
- Keep map controls inside the rounded clipped frame. Place auxiliary map UI as quiet in-map controls when possible instead of large notices above/below the map.
- After changing map container spacing or dimensions, call/keep existing `invalidateSize()` behavior where the page already uses it and test desktop, tablet-width, and phone-width layouts.

### Bookmark system (bridges + fuel stations)

Two parallel implementations, identical behavior:

**Bridge bookmarks (njsearch.html):**
- Storage: `localStorage["ft_bridge_bookmarks"]` = array of `Structure_Number` strings
- Helpers: `getBookmarks()`, `setBookmarks()`, `isBookmarked(structNum)`, `toggleBookmark(structNum)`
- UI: "Save"/"Saved" pill button on bridge detail panel header, star `.bookmark-filter` button at top of search area
- Filter mode: `bookmarkFilterOn` boolean — when true, doSearch shows only bookmarked bridges sorted by insertion order

**Fuel bookmarks (njfuel.html):**
- Storage: `localStorage["ft_fuel_bookmarks"]` = array of `lat.toFixed(5)+","+lng.toFixed(5)` keys
- Helpers: `_fuelKey(s)`, `getFuelBookmarks()`, `setFuelBookmarks()`, `isFuelBookmarked(key)`, `toggleFuelBookmarkClick(btnEl)`
- UI: Circle bookmark button at **bottom-right of each station card** (in `.coords-row`), star pill in own labeled `.bookmark-card` box that sits after the Google My Maps line
- Filter mode: `fuelBookmarkFilterOn` boolean — `toggleFuelBookmarkFilter()` shows bookmarked stations sorted by **Open first → Hours-Vary → Closed**, then by distance/name within each group
- Empty state shown if no bookmarks
- Scrolls to bookmark card after location is found (double-rAF + manual scroll math with 70px top offset)

### Work Order Closeout session system

- Multi-page document (`.page-block` elements in `#pagesContainer`)
- Each page has up to N photo cards with file inputs (camera + gallery)
- "Recent sessions" panel (top-right) shows last 5 saved sessions
- Save flow: collect photos → store full snapshot to IDB with `photoKey` → save metadata to `wo_recent` localStorage (no photos in localStorage)
- Restore flow on chip click: read `wo_recent` rec, fetch IDB snapshot by `photoKey`, restore page count + per-page text fields + photos
- Per-page text fields keyed by `data-base` attribute (NOT `el.name` which includes page-number suffix that breaks on rebuild)

### Find Near Me / GPS bridge lookup (njsearch.html)

- Floating teal pill, fixed bottom-right
- On click: `navigator.geolocation.getCurrentPosition` (always fresh, no caching)
- GPS candidate matching scans the lightweight statewide `bridgeIndex`, not county chunks.
- Per-bridge dynamic radius: `max(50m, structure_length_m + 40m GPS buffer)` — accounts for NBI coords being at one approach end
- 0 matches → empty state with distance to nearest bridge
- 1 match → auto-opens detail
- Multiple matches → bottom-sheet picker sorted by distance
- Distances always in US units (ft / mi)
- Opening a search result, bookmark, or GPS-selected bridge lazy-loads the selected bridge's full county chunk before rendering copy/share/full detail fields.

### Fuel Station Finder

- Locate button always visible. First label is "Find Near Me"; after a successful lookup it becomes "Refresh Location".
- ALWAYS requests fresh location (no localStorage cache — users may be moving)
- Map uses `fuelMap.invalidateSize()` after location + 350ms delay (mobile layout shift fix)
- "Hide Closed" toggle on results header — label dynamic ("Show Closed" when hidden)
- Tooltip on station pin: dark-navy themed, `pointer-events: none`, offset `-36px` so it doesn't cover other pins
- Active station tooltip auto-opens on `highlightStation()`

### Road Milepost Finder

- Data source is preprocessed from the master CSV into `data/mileposts/`.
- Runtime data may include multiple route subtypes, but UI matching is intentionally filtered by mode.
- `State / US / Interstate` mode prefers mainline Interstate (`ROUTE_SUBT=1`), US Route (`2`), NJ State Highway (`3`), and Authority/Parkway/Expressway (`4`) records. Ramp, connector, and secondary-looking records only win when the user is very close and no mainline point is nearby enough.
- `County Routes` mode matches County Route (`ROUTE_SUBT=5`) records only.
- Runtime does **not** load statewide data at once: first fetch `data/mileposts/index.json`, then fetch only nearby tile chunks from `data/mileposts/chunks/*.json` based on GPS tile + neighbors.
- Nearest lookup uses Haversine distance across loaded points and returns route class, route name, SRI, milepost, cross street, and distance.
- Map layer stack matches Bridge/Fuel tools: Google Street (`lyrs=m`) + Google Satellite (`lyrs=y`) with Leaflet layer toggle.

### DC-144 Field Form

- **Source files:** `pages/dc144.html` (shell + CSS) + `js/dc144.js` (all logic)
- **CDN dependency:** ExcelJS v4.4.0 via `cdn.jsdelivr.net` — used for client-side .xlsx generation
- **Session isolation:** Each session is tied to exactly one tab (a/b/c/d). `tab` field is the discriminator.
- **Row caps per tab:** a=17, b=19, c=18, d=24. `addGridRow()` disables add button when limit reached.
- **Remarks fields:** Single unified `<textarea>` per remarks region, not line-by-line row inputs.
- **Photo appendix:** Photos go to separate 'Photo Appendix' worksheet only. Each photo gets 4 rows: title (Photo N — caption), metadata (section · timestamp), image, spacer. Image placed with `ext: {width, height}` pixel dimensions (not fragile `tl/br`). Helpers: `getDisplayImageSize()` (DISPLAY_W=420px, aspect-ratio clamped 80–380px), `getFriendlySectionLabel()`, `formatDateTime()`. Sanity check: `assertPhotoAppendixPreserved(wb, session)` called before `writeBuffer()` — verifies worksheet exists, image count, caption cell not blank.
- **Remarks photo reference format:** Compact inline — `"text [Photos in Appendix: 1, 2]"` (NOT multi-line `"\n\n[See Photo Appendix…]"`).
- **Photo UI:** Grid card layout (`.photo-strip` = `grid; auto-fill; minmax(140px,1fr)`). Each photo is a `.photo-item` card with `aspect-ratio:4/3` thumbnail + `.photo-caption-label` + `.photo-caption-input` (textarea). Add button is `.photo-item.photo-add-item` (dashed border card). Old `.photo-caption` input class is GONE — use `.photo-caption-input` textarea.
- **Template:** `data/dc144-template.xlsx` — must be created manually from the original XLS. No blank-workbook fallback — export fails explicitly if template is missing.
- **Image compression:** Canvas → 1400px max long side → JPEG 0.72 → fallback 0.58. Target ≤200KB per photo. WebP/HEIC/HEIF always go through canvas pipeline (`needsNormalize` flag). Stores `widthPx`/`heightPx` in photo object for aspect ratio export.
- **ExcelJS cell addressing:** All uses `ws.getCell(row, col)` with 1-based row/col from `DC144_CELL_MAP`.
- **IDB store:** `dc144_sessions` in `ft_photos` v2. Key = `photoKey` from `ft_dc144_recent` rec.
- **Auto-save:** 2000ms debounce on `input`/`change` events. Writes full session JSON to IDB + updates `ft_dc144_recent` chip. Status indicator: "Saving…" → "Draft Saved" (clears after 3s) in `#autosave-status` span.
- **Filename pattern:** `DC-144-[TAB]-[YYYYMMDD]-[SafeProjectName].xlsx`
- **Tab color palette:** a=indigo `#4338ca`, b=amber `#92400e`, c=teal `#0e7490`, d=rose `#9f1239`
- **Template system:** `ft_dc144_templates` localStorage key (max 10). "Save as Template" saves header fields only. "Load" shows tab-picker overlay then starts new session with header pre-populated.
- **Unit dropdowns (Tab A):** Placed Qty and As Built Qty columns use `type:'qty-unit'` — renders `.qty-cell-wrap` (now `flex-wrap: wrap`) with number input + unit select (SF/LF/SY/TONS/CY/UNIT/LS/Custom) + custom text input. Export concatenates: `"450 SY"`, `"1 LS"`, `"12 BNDL"` etc.
- **Dark mode:** Page ONLY reads `field_dark_mode` from localStorage at load — never writes it. No local dark toggle exists on this page.
- **Navigation:** Topbar back button always shows "Home" (house icon). Form actionbar "← Back to Reports" button goes back to dashboard. Topbar back from dashboard triggers `exiting-to-hub` animation then navigates to `../index.html`. Topbar export button is ALWAYS hidden (`display:none`) — single export location is the actionbar only.
- **Screen transitions:** `playScreenTransition(el, 'forward'|'back')` adds `.screen-entering-forward` (slide from right) or `.screen-entering-back` (slide from left) for 240ms. Called by `showDashboard()` and `showForm()`.
- **Unified modal CSS:** `.dc-modal-backdrop`, `.dc-modal-box`, `.dc-modal-title`, `.dc-modal-actions` — template modal uses these plus its own `.template-modal-*` classes.
- **Sticky actionbar gap fix:** `#form-actionbar` top CSS transitions between `var(--topbar-h)` (topbar visible) and `0px` (topbar hidden) via `initSmartHeader()` → `updateActionbarTop()`. Mobile actionbar: `overflow-x: auto; scrollbar-width: none` so buttons don't wrap.
- **Form screen width:** `#form-screen .page-content { max-width: 1180px; }` (wider than dashboard 900px).
- **Touch targets:** `@media (pointer: coarse)` sets `.btn-primary/.btn-secondary/.btn-export/.btn-template` to `min-height: 44px`.

### Hub install/bookmark popup

- **Mobile:** auto-shows bottom banner up to 2 times (`ft_install_shown` counter), then never auto-shows. Manual trigger via 📲 button.
- **Desktop:** auto-shows bottom info banner up to 2 times (`ft_bookmark_shown` counter). Manual trigger via 📲 button.
- **Both** click trigger opens **dropdown anchored under the icon** (not bottom banner) with device-aware content (iOS Safari, Firefox, Samsung, Chrome each get specific Add to Home Screen / Ctrl+D instructions)

---

## 8. Google Analytics

GA4 measurement ID: `G-XZJ7XL4S34` (Joe's account — admin-only access).

Custom events tracked:
- `find_my_bridge_tap` (njsearch) — pill button pressed
- `bridge_located` (njsearch) — GPS auto-matched to single bridge, includes `bridge_name` + `structure_number`
- `session_saved` (WorkOrderCloseout) — session stored to IDB, includes `work_order` + `page_count`

**Commit message rule:** Do NOT mention analytics or GA4 in commit messages (user request). Use generic descriptions.

---

## 9. Browser/Device Support

- **Primary targets:** iPhone Safari, Android Chrome, Android Firefox, Windows Chrome/Edge, Mac Safari
- **PWA install:** works on Chrome/Edge/Samsung (native beforeinstallprompt), iOS Safari (Share→Add to Home Screen), Firefox Android (⋮→Install)
- **Service worker** registered on all pages
- **Geolocation** requires HTTPS (GitHub Pages provides)
- **IndexedDB** ~50MB+ quota, sufficient for ~20 photos × 5 sessions
- **localStorage** ~5MB; we keep photos OUT of it for that reason

---

## 9.5 Naming convention — IMPORTANT

The user has asked that the visible label "Hub" be replaced with "Home" or "Field Tools" throughout the UI. Reason: the original "Hub" wording felt off-brand. **DO NOT use the word "Hub" in:**
- Page titles
- Button labels
- Heading text
- Banner / dropdown text
- Commit messages or release notes

**Internal identifiers retain the old name** to preserve persistence and avoid mass renames:
- CSS classes: `.hub-back`, `.topbar-back` — KEEP
- sessionStorage keys: `ft_returning_to_hub`, `ft_opening_from_hub` — KEEP
- JS variable names containing "hub" — KEEP
- URL/repo path `NJDOT-Field-Tools-Hub` — KEEP (renaming would break user bookmarks)
- CSS comment headers like `/* Hub-to-tool transition */` — fine to keep

**Visible text to use:**
- Site name: **"Field Tools"** (no "Hub")
- Back button on tools: **"Home"**
- App / manifest name: **"NJDOT Field Tools"**

## 10. Convention Cheatsheet

- **All HTML/CSS/JS inline per file** — no separate .css or .js files (except service-worker.js)
- **No build step** — files served as-is
- **No frameworks** — vanilla JS only
- **CDN libs only** for Leaflet (maps), html2canvas + jsPDF (PDF export on Work Order), Inter font
- **`var` declarations everywhere** (legacy style, predates project — don't refactor to let/const without reason)
- **CSS uses class selectors heavily**, IDs reserved for unique elements
- **Mobile breakpoints**: 720px primary, 600px and 520px for finer adjustments
- **Dark mode**: `html[data-dark]` selector, toggled via `data-dark` attribute on `<html>`
- **Toast messages**: `showToast(message, type, duration)` where type is `'ok' | 'err' | 'info'`

---

## 11. Operational Tips for Future Changes

### When making a UI change

1. Grep the project for the relevant class name to find ALL instances
2. Test in BOTH light AND dark mode
3. Test on BOTH mobile (max-width: 720) AND desktop layouts
4. Check whether the change should affect ALL pages or just one

### When making a color change

1. Use the python sweep pattern (see git log for examples)
2. Sweep all hex variants together: primary + hover + dark + light + dark-mode variants + rgba
3. Don't forget `manifest.json` theme_color and the `<meta name="theme-color">` tag
4. Restore amber for bookmark stars after the sweep (over-sweep risk)

### When animation changes

1. Always use `transform` and `opacity` only (no width/height/margin animations — causes layout shift)
2. Use `translate3d(...)` not `translateX(...)` for GPU acceleration
3. Add `will-change: transform, opacity` for elements that animate
4. Always include `animation-fill-mode: both` AND set the from-state via direct CSS properties
5. Respect `@media (prefers-reduced-motion: reduce)` — already handled globally

### When committing

- Don't mention Google Analytics
- Commit message body should describe WHAT changed and WHY, with one feature/fix per bullet
- **Do NOT bump version on every commit.** Only bump at push time after user confirmation.
- Version bumps: footer stamp + SW cache name + `CLAUDE.md` "Last updated" — all three together in the push commit
- Decimal increments only: v1.0 → v1.1 → v1.2 → v1.3, NEVER whole-number bumps (no v2.x)
- Update CLAUDE.md sections that are affected by the change, in the same commit as the change itself

### When unsure

- Check this file first
- Then grep the relevant area
- Avoid full-file reads of WorkOrderCloseout.html (2,949 lines, large)
- For grep on large files, use `head_limit` parameter to avoid noise

## 12. Payroll Calculator Rules (2026-05)

### Rate Types

- `Normal`: regular time; overtime is only from daily threshold logic.
- `Cash`: immediate overtime at 1x (all entered hours go to overtime).
- `XP`: comp-time conversion at 1.5x (`1.0h` worked becomes `1.5h` credited).
- `Emergency`: immediate overtime at 1x hours, with entry-specific `Emergency Rate ($/hr)` pay input. Emergency is not a multiplier.

### Automatic Shift Detection

- Day shift: `06:00` through `17:59`.
- Night shift: `18:00` through `05:59`.
- There is no day/night user toggle in the form.
- For reporting, entries are internally split into day/night minute buckets while UI stays single-entry.

### 15-Minute Increment Time Entry

- Start/stop time controls allow only `:00`, `:15`, `:30`, `:45`.
- Desktop uses select controls instead of free-typing minute values.
- Validation blocks non-quarter-hour values and identical start/stop times.

### Biweekly Summary Rules

- The weekly tab is replaced by biweekly summary.
- Summary toggle supports current pay period and previous pay period.
- Biweekly cards include:
  - total regular hours
  - total overtime hours
  - total XP raw and converted
  - total emergency raw and overtime hours
  - total comp time earned
  - total hours worked
  - total entries

### Summary Totals and Badges

- Summary totals include:
  - overtime (`Cash` + `XP converted` + `Emergency hours` + threshold overtime from `Normal`)
  - regular hours
  - comp time earned
  - total worked hours
  - entries
- Badge colors:
  - Regular = blue
  - Overtime = red
  - XP = green
  - Emergency = orange

### Theme Inheritance from Home

- Payroll Calculator does not expose local theme toggles in header or settings.
- Tracker reads global `field_dark_mode` state set by Home and applies `html[data-dark]`.
- No per-page theme preference writes are performed in tracker.

### Desktop vs Mobile Layout Requirements

- Main content is centered with a wide desktop cap (`max-width: 1200px`).
- Desktop uses increased spacing, wider cards, and multi-column groups.
- Mobile keeps compact stacked layout and bottom-tab navigation.

### Payroll Calculator Schema

- Local keys:
  - `ft_ts_entries`
  - `ft_ts_settings`
- Entry fields:
  - `id`, `date`, `start`, `stop`, `breakMin`
  - `rateType`
  - `emergencyRate`
  - `job`, `act`, `notes`
- Removed concepts:
  - `isOvertime`
  - `emergencyMultiplier`
  - `shiftToggle`
  - overtime toggle UI
  - day/night toggle UI
