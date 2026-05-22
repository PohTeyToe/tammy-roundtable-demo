# Tammy Roundtable Demo

Standalone roundtable artifact set for Tammy's realtor workflow story.

The May 21, 2026 meeting is past. This repo is now a post-roundtable artifact and follow-up surface, not a live-prep repo.

## Surface map

- `src/`
  - Apps Script workbook workflow and Google-native fallback path
  - use for `clasp`, workbook logic, and the original Drive/Sheet/Gmail draft pipeline
- `webapp/`
  - live Next.js Realtor Workflow app
  - use for deployed app behavior, auth, Vercel ops, and the try-it surface people actually open
- `site/`
  - static walkthrough and review pages
  - use for browser-facing explainer material
- `site/claude/`
  - separate Claude education / follow-up page inside the static site surface
  - use for the Claude explainer lane, not the main workflow demo
- `C:\VFC\.ops\context\claude-roundtable-pack\`
  - private source pack behind `site/claude/`
  - use for lesson provenance, reusable wording, and FAQ / objection handling

## Status

- the roundtable is past
- `webapp/` is the live try-it surface for the roundtable lane
- `src/` is implementation-complete but its live `clasp` execution path from this machine is still unverified
- `site/` is the static walkthrough / review lane
- `site/claude/` is a separate Claude explainer lane and should not be conflated with the workflow walkthrough
- [docs/STATUS-2026-05-21.md](C:/VFC/tammy-roundtable-demo/docs/STATUS-2026-05-21.md:1) is a dated historical note, not the current repo router

## Apps Script surface

Inside `src/`, the repo implements the phase-separated operator flow inside the bound workbook:

- `Run Extraction`
- `Approve Review`
- `Reject Review`
- `Reverse Approval`
- `Generate Draft`

That surface also implements the attempt-aware row and log model, source-file lineage, shared Claude helper, seeded demo sources, and rerunnable local validation entrypoints.

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

## Known gaps

- authenticated live execution from a Google account on this machine
- working `clasp run` remote execution from the current auth chain
- browser-proven real workbook, Drive, and Gmail surfaces for the new flow
- live Claude-backed proof captured from Google surfaces

## Start here

1. [AGENTS.md](C:/VFC/tammy-roundtable-demo/AGENTS.md:1)
2. [webapp/AGENTS.md](C:/VFC/tammy-roundtable-demo/webapp/AGENTS.md:1)
3. [site/AGENTS.md](C:/VFC/tammy-roundtable-demo/site/AGENTS.md:1)
4. [docs/VERIFICATION.md](C:/VFC/tammy-roundtable-demo/docs/VERIFICATION.md:1)
5. [docs/HANDOFF.md](C:/VFC/tammy-roundtable-demo/docs/HANDOFF.md:1)
6. [docs/TAMMY-REVIEW-PACKET.html](C:/VFC/tammy-roundtable-demo/docs/TAMMY-REVIEW-PACKET.html)

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
- `webapp/`: live Next.js Realtor Workflow app
- `scripts/`: local validation and Playwright helpers
- `docs/`: walkthrough, verification, handoff, and dated status notes
- `site/`: static walkthrough, review pages, and the separate `site/claude/` explainer lane
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
