# Tammy Roundtable Demo

Standalone Apps Script project for the May 21, 2026 Tammy roundtable artifact.

This project is intentionally narrow:

- one Google Form intake
- one bound Google Sheet dashboard/workbook
- one manual operator action: `Generate Transaction Package`
- one transaction-package folder tree
- two calendar reminders
- one Gmail draft
- one simplified trade-record output
- one visible action log

## Current linked Google assets

- Spreadsheet: `Tammy Roundtable Demo - Realtor Workflow CRM`
- Script: bound Apps Script project linked through `.clasp.json`

## Local commands

```powershell
cd C:\VFC\tammy-roundtable-demo
clasp push
clasp run setupDemoEnvironment
clasp run seedDemoData
clasp run runGenerateTransactionPackageByTransactionId --params '["RT-LIVE-1002"]'
```

`setupDemoEnvironment` provisions the dedicated demo folder, calendar, form, workbook tabs, reference data, and menu.

`seedDemoData` submits two sample form responses:

- `RT-COMP-1001` seeded and fully generated for fallback/demo-walkthrough mode
- `RT-LIVE-1002` seeded as the clean live happy-path transaction

## Separate test-account note

The current machine auth is live and usable, but it is currently authenticated as `abdalsf5@gmail.com`. If you need to re-home this into a truly separate test Google account, use the exact rebinding steps in [docs/DEPLOY.md](C:/VFC/tammy-roundtable-demo/docs/DEPLOY.md:1).

## Start here for future work

1. [AGENTS.md](C:/VFC/tammy-roundtable-demo/AGENTS.md:1)
2. [docs/VERIFICATION.md](C:/VFC/tammy-roundtable-demo/docs/VERIFICATION.md:1)
3. [docs/HANDOFF.md](C:/VFC/tammy-roundtable-demo/docs/HANDOFF.md:1)
4. [docs/DEPLOY.md](C:/VFC/tammy-roundtable-demo/docs/DEPLOY.md:1)

## Project layout

- `src/`: Apps Script source files pushed by `clasp`
- `docs/`: walkthrough, deploy, fallback, and decision docs
- `assets/fallback/generated/`: synthetic local presentation HTML + PNG assets rendered from the seeded completed sample; useful for fallback walkthroughs, not proof of live Google-side readiness

## Safety model

- sample data only
- no live client docs
- no FINTRAC docs
- Gmail draft only
- no auto-send
- all actions logged
