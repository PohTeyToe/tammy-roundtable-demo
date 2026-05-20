# Verification

## Current target

The repo target is now:

- implementation-complete
- rerunnable from local entrypoints
- honest about live-validation gaps
- packaged for Tammy review without pretending the Google auth chain already works

## Implemented and checked

- explicit operator menu actions now exist:
  - `Run Extraction`
  - `Approve Review`
  - `Reject Review`
  - `Reverse Approval`
  - `Generate Draft`
- committed row-state model is implemented in code:
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
- `TransactionIntake` now has the expanded canonical current-attempt surface:
  - source file link and ID
  - current attempt ID and number
  - extraction metadata
  - extraction pass/fail and missing-field summary
  - derived notes phase cue
  - Gmail draft link and ID
  - last result and last error
- `ActionLog` now uses the attempt-aware schema:
  - timestamp
  - transaction ID
  - attempt ID
  - attempt number
  - phase
  - row status
  - source file ID
  - source file link
  - output reference
  - result summary
  - error text
- shared Claude helper exists in [src/Claude.js](C:/VFC/tammy-roundtable-demo/src/Claude.js:1)
- script-property seam exists for Claude secret and runtime config
- supported source boundary is implemented for:
  - PDFs
  - JPG / JPEG / PNG
  - Google Docs
  - DOCX-style text export
  - plain text
- unsupported source types fail explicitly
- extraction enforces a required minimum field set and persists failure details
- draft reruns update the same Gmail draft when possible
- local validation entrypoints exist in [package.json](C:/VFC/tammy-roundtable-demo/package.json:1) and [scripts](C:/VFC/tammy-roundtable-demo/scripts:1)
- local parse validation passed for the rewritten Apps Script source
- `clasp push --force` succeeded for the current source

## Evidence in repo

- fallback presentation assets:
  - [assets/fallback/generated](C:/VFC/tammy-roundtable-demo/assets/fallback/generated:1)
- Tammy-facing review packet:
  - [docs/TAMMY-REVIEW-PACKET.html](C:/VFC/tammy-roundtable-demo/docs/TAMMY-REVIEW-PACKET.html)
- live-validation helpers:
  - [scripts/live-preflight.ps1](C:/VFC/tammy-roundtable-demo/scripts/live-preflight.ps1:1)
  - [scripts/live-smoke.ps1](C:/VFC/tammy-roundtable-demo/scripts/live-smoke.ps1:1)
  - [scripts/playwright-live-validation.ps1](C:/VFC/tammy-roundtable-demo/scripts/playwright-live-validation.ps1:1)
  - [scripts/playwright-capture-evidence.ps1](C:/VFC/tammy-roundtable-demo/scripts/playwright-capture-evidence.ps1:1)

## Not claimed yet

- authenticated workbook access from the intended Google account on this machine
- successful remote `clasp run` execution
- browser-verified real workbook, Drive, and Gmail surfaces for the new phase model
- live Claude extraction and draft output captured from Google surfaces
- final evidence pack built from a real authenticated run

## Concrete current blocker

- the workbook opens to Google sign-in in the browser from this machine
- `.clasp.json` still has no linked `projectId`
- `clasp run setupDemoEnvironment` fails under the current auth state

## Promotion path to full live proof

1. Authenticate a Google account that is allowed to access the bound workbook and Apps Script project.
2. Link the Apps Script project to the intended GCP project so `.clasp.json` has a valid `projectId`.
3. Re-authorize `clasp` with the required Apps Script scopes.
4. Run:
   - `npm run setup`
   - `npm run seed`
   - `npm run smoke:live`
5. Use the Playwright scripts to capture workbook, Drive, and Gmail evidence.
6. Replace the current packet's deferred-live wording with real screenshots and pass/fail results.
