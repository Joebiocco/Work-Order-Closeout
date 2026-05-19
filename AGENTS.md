# AGENTS.md — Field Tools Project Context

> ## 🚨 Codex: READ THIS FILE FIRST 🚨
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
> **Last updated:** 2026-05-19 · v1.2
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
- Bridge navigator's "Find My Bridge" pill stays manual (single-purpose locator, not a continuous discovery feature).
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
│   ├── njstructures.json            # ~6,825 NJ bridge records (inline-embedded in njsearch.html too)
│   └── mileposts/
│       ├── index.json               # Tile index for Road Milemarker Finder (filtered state routes only)
│       └── chunks/*.json            # Per-tile milepost chunks loaded lazily near user GPS
├── icons/
│   ├── icon-192.png                 # PWA app icon (dark navy + amber bridge arch)
│   └── icon-512.png                 # PWA app icon (larger)
├── pages/
│   ├── njsearch.html                # Bridge Navigator (1,440 lines)
│   ├── njfuel.html                  # Fuel Station Finder (1,305 lines)
│   ├── milemarker.html              # Road Milemarker Finder (GPS nearest route/milepost)
│   ├── timesheet.html               # Payroll Calculator & Timesheet — Day/Week/Month/Settings
│   └── WorkOrderCloseout.html       # Work Order tool (2,949 lines)
├── _archive/                        # old files, ignore
├── reference/                       # data sources, ignore
└── scripts/
    └── build-mileposts.ps1          # CSV -> filtered tile chunks for milemarker runtime
```

**Backups (on Desktop, DO NOT TOUCH):**
- `Work Order Website - Backup 2026-05-17` — permanent baseline backup
- `Work Order Website - Backup 2026-05-17 (Pre-Analytics)` — pre-GA4 snapshot
- `Work Order Website - Backup 2026-05-18` — pre-large-tasklist snapshot

---

## 3. Storage Architecture

### localStorage keys

| Key | File(s) | Format | Purpose |
|---|---|---|---|
| `ft_bridge_bookmarks` | njsearch | `JSON.stringify(["structNum1", "structNum2"])` | Array of bookmarked Structure_Number strings |
| `ft_fuel_bookmarks` | njfuel | `JSON.stringify(["lat,lng", ...])` | Composite coord keys via `_fuelKey(s)` helper |
| `wo_recent` | WorkOrderCloseout | JSON array (max 5) of recent session metadata | Each rec has `{wo, str, date, fname, route, direction, mp, startDate, endDate, priority, photoKey}` — PHOTOS NOT INCLUDED HERE |
| `workorder_draft` | WorkOrderCloseout | Full session JSON snapshot | Single auto-saved draft |
| `field_dark_mode` | all pages | `"1"` if dark mode on | Theme preference |
| `ft_last` | all pages | `"njsearch" \| "njfuel" \| "closeout" \| "milemarker"` | Last visited tool (used for home badge) |
| `ft_install_shown` | index | int 0-2 | How many times install popup has auto-shown on mobile |
| `ft_bookmark_shown` | index | int 0-2 | How many times bookmark popup has auto-shown on desktop |
| `ft_ts_entries` | timesheet | JSON array of overtime/timesheet entries | Local Day/Week/Month tracker entries with date, start/stop, break, type, job/activity, and notes |
| `ft_ts_settings` | timesheet | JSON settings object | Hourly rate, overtime multiplier, overtime threshold, default break, time format, week start, and default view |

### sessionStorage keys (cleared on tab close)

| Key | Set by | Read by | Purpose |
|---|---|---|---|
| `ft_opening_from_hub` | hub click on tool card | tool page head inline script | Triggers slide-in-from-left animation |
| `ft_returning_to_hub` | hub-back click + browser back | hub head inline script + pageshow | Triggers slide-in-from-right animation |

### IndexedDB

**Database:** `ft_photos` (v1) — defined in WorkOrderCloseout.html

**Object store:** `session_photos` — key is `photoKey` from wo_recent rec.

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

**Important:** When a session is evicted from `wo_recent` (capped at 5), `dbDeletePhotos(rec.photoKey)` is called to free the IDB entry. The `photoKey` is `'pk_' + Date.now()` set at save time.

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
| Find My Bridge pill | `#0d9488` (teal) | `#2dd4bf` | On njsearch.html, distinct from cards |
| Coming Soon — Drainage | `#0891b2` (cyan) | `#67e8f9` | `card-icon-cyan`, `card-border-cyan` |
| Road Milemarker Finder | `#b45309` / `#d97706` (warm amber) | `#fcd34d` | GPS map tool card. `card-icon-amber-soon` |
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
- Road Milemarker Finder tile — always warm amber
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
const CACHE = 'ft-v1.1-2026-05-18';  // BUMP this on every push that should force refresh

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
4. Bump "Last updated" date in `AGENTS.md`
5. `git push` → GitHub Pages auto-deploys

Existing users get the new SW on their next visit; old cache is auto-deleted on activate. **localStorage and IndexedDB are NOT touched by SW cache changes** — user bookmarks/sessions/photos persist.

---

## 7. Critical UI Patterns

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

### Find My Bridge (njsearch.html)

- Floating teal pill, fixed bottom-right
- On click: `navigator.geolocation.getCurrentPosition` (always fresh, no caching)
- Per-bridge dynamic radius: `max(50m, structure_length_m + 40m GPS buffer)` — accounts for NBI coords being at one approach end
- 0 matches → empty state with distance to nearest bridge
- 1 match → auto-opens detail
- Multiple matches → bottom-sheet picker sorted by distance
- Distances always in US units (ft / mi)

### Fuel Station Finder

- Locate button always visible, re-labels to "Update My Location" after first success
- ALWAYS requests fresh location (no localStorage cache — users may be moving)
- Map uses `fuelMap.invalidateSize()` after location + 350ms delay (mobile layout shift fix)
- "Hide Closed" toggle on results header — label dynamic ("Show Closed" when hidden)
- Tooltip on station pin: dark-navy themed, `pointer-events: none`, offset `-36px` so it doesn't cover other pins
- Active station tooltip auto-opens on `highlightStation()`

### Road Milemarker Finder

- Data source is preprocessed from the master CSV into `data/mileposts/`.
- Allowed route classes only: Interstate (`ROUTE_SUBT=1`), US Route (`2`), NJ State Highway (`3`), County Route (`5`).
- Excluded from runtime data: local roads and other subtypes (`4`, `6`, `7`, `8`).
- Runtime does **not** load statewide data at once:
  - First fetch `data/mileposts/index.json`
  - Then fetch only nearby tile chunks from `data/mileposts/chunks/*.json` based on GPS tile + neighbors.
- Nearest lookup uses Haversine distance across loaded points and returns route class, route name, SRI, milepost, cross street, and distance.
- Milemarker direction display is inferred from nearby route geometry around the matched point and shown as cardinal travel label (Northbound/Eastbound/Southbound/Westbound).
- Map layer stack matches Bridge/Fuel tools: Google Street (`lyrs=m`) + Google Satellite (`lyrs=y`) with Leaflet layer toggle.
- Back/Home navigation uses the same animated return pattern as other tools, including browser back interception via dummy `history.pushState`.

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
- Version bumps: footer stamp + SW cache name + `AGENTS.md` "Last updated" — all three together in the push commit
- Decimal increments only: v1.0 → v1.1 → v1.2 → v1.3, NEVER whole-number bumps (no v2.x)
- Update AGENTS.md sections that are affected by the change, in the same commit as the change itself

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
