# Tammy Roundtable Demo Agent Guide

## Scope

- Project root: `C:\VFC\tammy-roundtable-demo`
- Purpose: standalone roundtable artifact set for Tammy's realtor workflow story and follow-up materials
- Boundary: this is a narrow artifact/support surface, not the broader `mcc-ops` website lane and not a production CRM
- Status: the May 21, 2026 roundtable is past; treat this repo as post-roundtable cleanup and follow-up work unless a dated note explicitly says otherwise

## Start Here

1. [README.md](C:/VFC/tammy-roundtable-demo/README.md:1)
2. [webapp/AGENTS.md](C:/VFC/tammy-roundtable-demo/webapp/AGENTS.md:1)
3. [site/AGENTS.md](C:/VFC/tammy-roundtable-demo/site/AGENTS.md:1)
4. [docs/VERIFICATION.md](C:/VFC/tammy-roundtable-demo/docs/VERIFICATION.md:1)
5. [docs/HANDOFF.md](C:/VFC/tammy-roundtable-demo/docs/HANDOFF.md:1)

## Surface Map

- `src/`
  - Google-native Apps Script workbook workflow and validation helpers
  - use for `clasp`, workbook logic, Drive/Sheet/Gmail draft pipeline questions, and fallback backend work
- `webapp/`
  - live Next.js Realtor Workflow app
  - use for deployed app behavior, auth, Vercel ops, and the try-it surface people actually open
- `site/`
  - static walkthrough and review pages
  - use for browser-facing explainer material, not the live app implementation
- `site/claude/`
  - separate Claude education / follow-up page inside the static site surface
  - use for Claude explainer presentation work, not the main workflow walkthrough
- `C:\VFC\.ops\context\claude-roundtable-pack\`
  - private source pack behind `site/claude/`
  - use for lesson provenance, reusable wording, and FAQ / objection handling

## Canonical Project Files

- route by surface:
  - [webapp/AGENTS.md](C:/VFC/tammy-roundtable-demo/webapp/AGENTS.md:1)
  - [site/AGENTS.md](C:/VFC/tammy-roundtable-demo/site/AGENTS.md:1)
- Apps Script implementation:
  - [src/Workflow.js](C:/VFC/tammy-roundtable-demo/src/Workflow.js:1)
  - [src/FormDriveCalendar.js](C:/VFC/tammy-roundtable-demo/src/FormDriveCalendar.js:1)
  - [src/SheetSetup.js](C:/VFC/tammy-roundtable-demo/src/SheetSetup.js:1)
  - [src/Config.js](C:/VFC/tammy-roundtable-demo/src/Config.js:1)
- dated Apps Script readiness:
  - [docs/VERIFICATION.md](C:/VFC/tammy-roundtable-demo/docs/VERIFICATION.md:1)
- historical repo status:
  - [docs/STATUS-2026-05-21.md](C:/VFC/tammy-roundtable-demo/docs/STATUS-2026-05-21.md:1)
- walkthrough and operator material:
  - [docs/WALKTHROUGH.md](C:/VFC/tammy-roundtable-demo/docs/WALKTHROUGH.md:1)
  - [docs/CLICK-BY-CLICK-SCRIPT.md](C:/VFC/tammy-roundtable-demo/docs/CLICK-BY-CLICK-SCRIPT.md:1)
  - [docs/REAL-VS-SIMPLIFIED.md](C:/VFC/tammy-roundtable-demo/docs/REAL-VS-SIMPLIFIED.md:1)
- fallback presentation pack:
  - [assets/fallback/generated](C:/VFC/tammy-roundtable-demo/assets/fallback/generated:1)

## Non-Negotiable Rules

- keep this project standalone; do not merge it into `C:\VFC\mcc-ops`
- keep Gmail draft-only; no auto-send
- keep the dedicated demo-asset boundary: dedicated form, workbook, Drive parent, and calendar
- keep fallback assets labeled as synthetic local presentation assets unless live Google-side screenshots are actually captured
- do not represent the live Google execution path as verified unless it has been exercised from the current machine/account setup

## Current State

- the repo now contains multiple surfaces; do not assume `src/` is the whole project
- `webapp/` is the live try-it surface for the roundtable lane
- `src/` remains the Google-native Apps Script surface and its live `clasp` execution path from this machine is still unverified
- `site/` is the static walkthrough / review lane
- `site/claude/` is a separate Claude explainer lane backed by the private source pack in `.ops`
- `docs/STATUS-2026-05-21.md` and other May 21 notes are historical snapshots, not the current repo router

## Working Commands

```powershell
cd C:\VFC\tammy-roundtable-demo
npm run render:fallback
clasp push --force
clasp run setupDemoEnvironment
clasp run seedDemoData
clasp run runGenerateTransactionPackageByTransactionId --params '["RT-LIVE-1002"]'
```

## Placement

- durable project truth lives in this repo
- broader Tammy communication or workspace routing context stays in `C:\VFC\.ops`
- dated live-state snapshots should stay explicitly dated; do not silently reuse them as current routing truth
- do not move volatile machine-auth state into durable docs beyond the current blocker summary already documented here
