# Verification

## Verified now

- local Apps Script source parses cleanly
- `setup` hardening is now non-destructive at the workbook-tab level:
  - no more `clear()` on `ReferenceData`
  - no more `clear()` on `Dashboard`
  - no more `clear()` on `TradeRecord`
- rerun logic now refreshes mutable outputs instead of just reusing IDs:
  - existing calendar events are updated or recreated
  - missing-date events are removed
  - existing Gmail drafts are updated in place
- synthetic local fallback presentation assets were generated successfully under `assets/fallback/generated`

## Still only scaffolded

- live Google setup has not run end to end from this machine
- the bound workbook has not yet been transformed from `Sheet1` into the full demo workbook by Apps Script
- no live Google-side screenshots were captured from the actual workbook/form/calendar/draft surfaces
- the fallback pack is local and synthetic; it should not be presented as evidence that the live Google workbook/form/calendar/draft surfaces were exercised from this machine

## Why the live Google path is still blocked

- `clasp run` on this machine still lacks the full execution auth chain:
  - linked GCP `projectId`
  - Apps Script API enabled for that GCP project
  - desktop OAuth client for that same project
  - `clasp login` redone with project scopes
- the current machine auth is still the primary mailbox, not a separate dedicated test Google account

## Practical status

- fallback presentation pack: usable now as a synthetic local presentation layer
- local deploy-ready Apps Script project: usable now
- real Google live demo path: not yet verified from this machine
