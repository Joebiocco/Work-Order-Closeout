# AGENTS.md — Codex Entrypoint

> **This file is for Codex.** It is intentionally short to save tokens.
> Do **not** read `CLAUDE.md` (that is Claude Code's entrypoint) unless a task is specifically about it.
> Start every task with this file + **`docs/INDEX.md`**. Read anything else **only when relevant**.

## How to work here (token discipline)

1. **Search first with `rg`** for symbols/classes/keys — do not open large files to browse.
2. Use **`docs/INDEX.md`** to decide what else to read; open only the relevant file/section (line ranges).
3. Read deeper docs only when the task needs them:
   - **UI / design / styling →** `docs/ui-style-guide.md`
   - **New tool or page →** `docs/new-tool-page-template.html`
   - **High-risk / fragile systems →** `docs/protected-areas.md` (read BEFORE touching)
   - **Report length →** `docs/reporting-rules.md`
   - **Full historical reference (only if needed) →** `docs/project-reference.md`
4. **Avoid `pages/WorkOrderCloseout.html`** unless required (~574 KB inline base64). Grep with line numbers; never dump it.

## Project in one paragraph

Static internal PWA for NJ DOT field workers on GitHub Pages. **No backend, no build step, no frameworks** — pure static HTML/CSS/JS (vanilla, inline per file; only `service-worker.js` and `css/field-ui.css` are separate). Homepage `index.html` is a command-center dashboard; six tools in `pages/`. Targets phones/tablets + desktop.

## File map

- `index.html` — homepage (hero + grouped dashboard, Continue, search, dark toggle, install). Hero art `assets/hero/*.webp`.
- `pages/`: `njsearch.html` Bridge · `njfuel.html` Fuel · `milemarker.html` Milepost · `WorkOrderCloseout.html` Work Order (PDF) · `timesheet.html` Payroll · `dc144.html` DC-144 (+ `js/dc144.js`).
- `css/field-ui.css` shared shell/tokens · `service-worker.js`, `manifest.json` PWA (protected).
- `docs/`: INDEX, ui-style-guide, new-tool-page-template, protected-areas, reporting-rules, project-reference.

## Universal rules

- **Do not merge, deploy, or bump version unless asked.** Branch off main; commit/push only when asked. Ask before `git push`. Version bumps decimal-only at push time.
- **Protected — plan first** (`docs/protected-areas.md`): Work Order PDF (`html2canvas`/jsPDF/`LOGO_SRC_VAR`), DC-144 Excel export/cell maps/signature/photos, Bridge/Fuel maps+geolocation+bookmarks+chunks, Timesheet payroll calc/bottom nav, `service-worker.js`, `manifest.json`.
- **Never rename/clear** localStorage keys (`ft_bridge_bookmarks`, `ft_fuel_bookmarks`, `wo_recent`, `workorder_draft`, `ft_dc144_recent`, `ft_dc144_templates`, `ft_ts_entries`, `ft_ts_settings`, `field_dark_mode`, `ft_last`, `ft_*_shown`; sessionStorage `ft_opening_from_hub`/`ft_returning_to_hub`) or IndexedDB (db `ft_photos` v2; stores `session_photos`, `dc144_sessions`).
- **No backend/build deps; no heavy image assets** without approval.
- **Branding:** "Field Tools Hub" — no visible "NJDOT"/agency branding without an official optimized asset. Functional geo terms OK; internal `nj`/`njdot` names/paths/keys stay.
- **Homepage group colors** consistent per group (Field Ops teal/green-blue, Documentation purple/indigo, Time & Admin gold, Coming Soon muted).
- **Animation safety:** no persistent `transform`/`will-change`/`contain:layout`/`filter` on `body`/`html`/shell; final keyframes `transform: none`; clean up JS-set body styles; fixed overlays/toasts viewport-fixed (`100dvh`, safe-area); pre-paint background on every page.
- **Reports:** token-saving / delta-only by default (`docs/reporting-rules.md`).

## Keep current

When a change adds/renames a key, protected area, or rule, update the relevant `docs/` file in the same commit; keep this entrypoint short.
