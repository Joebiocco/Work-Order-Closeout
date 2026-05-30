# docs/reporting-rules.md — Report Length (shared)

Default to the **shortest** report that fits the risk. Never paste large file contents or full base64. Prefer line refs over snippets.

## Low-risk → delta-only (default)
Pure wording, color tokens, copy tweaks, doc edits, small CSS.
Report: **files changed · exact changes (1 line each) · 1-line QA · stopped**. No screenshots unless a visual changed (then one composite).

## Medium-risk → concise report
Homepage layout/animation, shared `css/field-ui.css`, multi-file styling.
Report: files changed · key changes · short QA (search/dark/links/overflow as relevant) · risks · stopped. Screenshots only if visual.

## High-risk → full checklist
Triggers: `service-worker.js`/cache/version/deployment, `manifest.json`, any export pipeline (PDF/Excel/KML), storage keys, IndexedDB, maps/geolocation, payroll calculations.
Report: files changed · exact changes · explicit confirmation each protected area is intact · QA steps run · console errors · risks · stopped.

## Always
- State commit/push status; never commit/push/merge/deploy/bump unless asked.
- Confirm protected areas untouched (one line) rather than enumerating each.
- Note any uncommitted-changes hold is intentional per instructions.
