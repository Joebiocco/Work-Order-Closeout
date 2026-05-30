# docs/INDEX.md — Routing Map (shared)

Used by both Claude Code (`CLAUDE.md`) and Codex (`AGENTS.md`). The two entrypoints do **not** read each other.

## Default workflow

1. Read your **agent entrypoint** (`CLAUDE.md` or `AGENTS.md`) **+ this file** — nothing else by default.
2. **Search first with `rg`** for the symbol/class/key/text you need.
3. Open only the **relevant file and line range**. Do not read whole large files.

## Read-when-relevant

| Situation | Read |
|---|---|
| UI, design, styling, homepage, cards, topbar, theming | `docs/ui-style-guide.md` |
| Creating a new tool or page | `docs/new-tool-page-template.html` |
| Touching anything fragile / high-risk | `docs/protected-areas.md` (BEFORE editing) |
| Deciding report length/format | `docs/reporting-rules.md` |
| Need deep historical context / full architecture | `docs/project-reference.md` (verbatim legacy reference; large) |
| Bridge data pipeline | `docs/BRIDGE_INDEX_CHUNK_ARCHITECTURE.md`, `docs/BRIDGE_DATA_EXTRACTION_PLAN.md` |

## File map (sizes are guidance — avoid full reads of large ones)

| File | Role | Note |
|---|---|---|
| `index.html` | Homepage dashboard | hero art in `assets/hero/*.webp` |
| `pages/njsearch.html` | Bridge Navigator | maps/geolocation/bookmarks/chunks — protected |
| `pages/njfuel.html` | Fuel Finder | maps/geolocation/bookmarks — protected |
| `pages/milemarker.html` | Milepost Finder | maps/geolocation |
| `pages/WorkOrderCloseout.html` | Work Order | **~574 KB**, PDF capture — avoid full reads; protected |
| `pages/timesheet.html` | Payroll Calculator | payroll calc/bottom nav/storage — protected |
| `pages/dc144.html` + `js/dc144.js` | DC-144 form | ExcelJS export/cell maps/signature/photos — protected |
| `css/field-ui.css` | Shared shell/tokens | loaded before each page's inline `<style>` |
| `service-worker.js`, `manifest.json` | PWA | protected |

## Hard reminders

- No merge/deploy/version bump unless asked.
- Never rename/clear storage keys or IndexedDB stores (list in entrypoints + `protected-areas.md`).
- Branding = "Field Tools Hub", no agency branding without an official asset.
- Token-saving reports by default.
