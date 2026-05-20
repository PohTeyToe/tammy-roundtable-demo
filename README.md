# Tammy Roundtable Demo

Standalone Apps Script artifact for Tammy's May 21, 2026 roundtable workflow demo.

This repo now implements the phase-separated operator flow inside the bound workbook:

- `Run Extraction`
- `Approve Review`
- `Reject Review`
- `Reverse Approval`
- `Generate Draft`

It also implements the attempt-aware row and log model, source-file lineage, shared Claude helper, seeded demo sources, and rerunnable local validation entrypoints.

## Current completion target

The active finish line for this repo is now:

- implementation-complete
- pushed and rerunnable
- Tammy-packet-ready
- explicit about what is and is not live-verified

This repo does **not** currently claim end-to-end live Google execution from this machine. That remains a later validation pass once Google auth and Apps Script execution are available.

## What is implemented

- bound Apps Script workbook workflow with explicit phase actions
- row states:
  - `Extraction Required`
  - `Source Missing`
  - `Source Changed`
  - `Running Extraction`
  - `Extracted`
  - `Ready For Review`
  - `Review Rejected`
  - `Running Draft`
  - `Draft Failed`
  - `Draft Generated`
- canonical transaction-row surface for source lineage, current attempt, extraction metadata, review status, Gmail draft lineage, and last result/error
- attempt-aware `ActionLog`
- shared Claude API helper for extraction and draft generation
- narrow v1 source support:
  - PDF
  - JPG / JPEG / PNG
  - Google Docs
  - DOCX-style text export
  - plain text
- durable failure handling for unsupported sources and missing required extraction fields
- Gmail draft update-in-place behavior on reruns
- seeded sample source documents for PDF, image, text-doc, and unsupported-format paths

## What is not claimed yet

- authenticated live execution from a Google account on this machine
- working `clasp run` remote execution from the current auth chain
- browser-proven real workbook, Drive, and Gmail surfaces for the new flow
- live Claude-backed proof captured from Google surfaces

## Start here

1. [AGENTS.md](C:/VFC/tammy-roundtable-demo/AGENTS.md:1)
2. [docs/VERIFICATION.md](C:/VFC/tammy-roundtable-demo/docs/VERIFICATION.md:1)
3. [docs/HANDOFF.md](C:/VFC/tammy-roundtable-demo/docs/HANDOFF.md:1)
4. [docs/WALKTHROUGH.md](C:/VFC/tammy-roundtable-demo/docs/WALKTHROUGH.md:1)
5. [docs/TAMMY-REVIEW-PACKET.html](C:/VFC/tammy-roundtable-demo/docs/TAMMY-REVIEW-PACKET.html)

## Working commands

```powershell
cd C:\VFC\tammy-roundtable-demo
npm run push
npm run preflight:live
npm run setup
npm run seed
npm run extract:live
npm run approve:live
npm run reject:live
npm run reverse:live
npm run draft:live
npm run happy:live
npm run smoke:live
npm run playwright:workbook
npm run playwright:capture
npm run build:review-site
npm run deploy:review-site
```

## Repo layout

- `src/`: Apps Script source files pushed with `clasp`
- `scripts/`: local validation and Playwright helpers
- `docs/`: walkthrough, verification, handoff, and Tammy-facing review packet
- `site/`: static hosted front door for Vercel-style preview deployment
- `assets/fallback/generated/`: synthetic local presentation assets rendered from seeded sample data

## Hosted review site

For a Tammy-facing hosted preview:

```powershell
cd C:\VFC\tammy-roundtable-demo
npm run build:review-site
npm run deploy:review-site
```

That builds a static review site into `dist/review-site` and then deploys it through Vercel if the CLI is authenticated, or through the claimable preview fallback if it is not.

## Safety rules

- sample data only
- Gmail draft only
- no auto-send
- no live client docs
- no FINTRAC docs
- all actions logged
