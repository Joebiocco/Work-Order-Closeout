# docs/protected-areas.md — Fragile Systems (shared)

Read this **before** touching anything below. Make a specific plan; do not rename functional IDs/classes; CSS-surface-only changes where possible. For deeper detail see `docs/project-reference.md`.

## DC-144 (`pages/dc144.html` + `js/dc144.js`)
- ExcelJS `.xlsx` export, `DC144_CELL_MAP` cell addressing, workbook/template (`data/dc144-template.xlsx`), sheet pruning, photo appendix, inspector signature pad, mobile actionbar, export-review modal.
- IndexedDB store `dc144_sessions` (db `ft_photos` v2). Keys `ft_dc144_recent`, `ft_dc144_templates`.
- Do not change functional IDs/classes or export/form/signature/photo logic without a plan.

## Work Order (`pages/WorkOrderCloseout.html`)
- PDF generation via `html2canvas` + `jsPDF`. **Do not touch the capture/export markup or `.pdf-*` IDs/classes.**
- `LOGO_SRC_VAR` base64 is still used by the PDF (`.pdf-logo`) — keep it; only the header `<img>` was removed. File is ~574 KB; avoid full reads.
- IndexedDB store `session_photos`; keys `wo_recent`, `workorder_draft`, `photoKey` flow.

## Bridge / Fuel (`pages/njsearch.html`, `pages/njfuel.html`)
- Leaflet maps, geolocation (always fresh — never cache lat/lng), map containers + `invalidateSize`.
- Bookmarks: `ft_bridge_bookmarks` (raw `Structure_Number` array), `ft_fuel_bookmarks` (`lat,lng` composite via `_fuelKey`). Search scoring, 50-pin cap.
- Bridge data lazy-loads county chunks (`getFullBridgeRecord()`); don't pre-load all chunks. KML export internals (njfuel) — leave unless asked.

## Timesheet / Payroll (`pages/timesheet.html`)
- Payroll calculations (Normal/Cash/XP/Emergency, shift detection, biweekly summary), bottom-tab nav, entry modal, 15-min increments.
- Keys `ft_ts_entries`, `ft_ts_settings`. Reads `field_dark_mode` (never writes).

## PWA infra
- `service-worker.js` (cache name/version, network-first HTML, `LOCAL_ASSETS`) and `manifest.json` (name, theme_color, icons, install behavior). **Do not touch without explicit approval.** New static assets (e.g. `assets/hero/*.webp`) need adding to `LOCAL_ASSETS` only at the deliberate SW/version step.

## Storage (never rename/clear)
- localStorage: `ft_bridge_bookmarks`, `ft_fuel_bookmarks`, `wo_recent`, `workorder_draft`, `ft_dc144_recent`, `ft_dc144_templates`, `ft_ts_entries`, `ft_ts_settings`, `field_dark_mode`, `ft_last`, `ft_install_shown`, `ft_bookmark_shown`, `ft_dc144_guide_shown`, `ft_pc_guide_shown`, `ft_wo_guide_shown`.
- sessionStorage: `ft_opening_from_hub`, `ft_returning_to_hub`.
- IndexedDB: db `ft_photos` (v2); stores `session_photos`, `dc144_sessions`.

## Animation / overlay safety (all pages)
- Never put persistent `transform`/`will-change:transform`/`contain:layout`/`filter`/`perspective` on `body`/`html`/main shell. Final keyframes end `transform: none`. Clean up JS-set inline body styles (incl. on `pageshow`). Fixed overlays/toasts use `position:fixed` + `100dvh` + safe-area insets. Every page sets a pre-paint background.
