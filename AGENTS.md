# Tammy Roundtable Demo Agent Guide

## Scope

- Project root: `C:\VFC\tammy-roundtable-demo`
- Purpose: standalone May 21, 2026 roundtable support artifact for Tammy's Google-native `NEW TRANSACTION FLOW`
- Boundary: this is a narrow demo/support surface, not the broader `mcc-ops` website lane and not a production CRM

## Start Here

1. [README.md](C:/VFC/tammy-roundtable-demo/README.md:1)
2. [docs/VERIFICATION.md](C:/VFC/tammy-roundtable-demo/docs/VERIFICATION.md:1)
3. [docs/HANDOFF.md](C:/VFC/tammy-roundtable-demo/docs/HANDOFF.md:1)
4. [docs/DEPLOY.md](C:/VFC/tammy-roundtable-demo/docs/DEPLOY.md:1)

## Canonical Project Files

- implementation:
  - [src/Workflow.js](C:/VFC/tammy-roundtable-demo/src/Workflow.js:1)
  - [src/FormDriveCalendar.js](C:/VFC/tammy-roundtable-demo/src/FormDriveCalendar.js:1)
  - [src/SheetSetup.js](C:/VFC/tammy-roundtable-demo/src/SheetSetup.js:1)
  - [src/Config.js](C:/VFC/tammy-roundtable-demo/src/Config.js:1)
- current readiness:
  - [docs/VERIFICATION.md](C:/VFC/tammy-roundtable-demo/docs/VERIFICATION.md:1)
- operator/demo material:
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

- the local project is scaffolded, documented, and git-tracked here
- the fallback pack is ready to show
- the only material open gap is the still-unverified live Google execution path from this machine

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
- do not move volatile machine-auth state into durable docs beyond the current blocker summary already documented here
