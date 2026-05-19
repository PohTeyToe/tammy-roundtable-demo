# New Transaction Flow Design

## Goal

Build one small Google-native artifact Tammy can safely show on May 21, 2026:

`accepted offer received -> operator starts transaction package -> folders, reminders, draft email, trade-record output`

## Implementation choices

- bound Apps Script project attached to the workbook
- dedicated demo folder, form, and calendar
- Gmail draft only
- sheet-first UI with a custom menu
- one seeded completed sample plus one live happy-path sample
- deterministic templates instead of live AI generation

## Rerun policy

- normal generate blocks duplicate package creation
- explicit rerun reuses the existing folder and existing calendar events when possible
- rerun preserves an existing draft if one is already stored

## Fallback policy

- seeded completed sample remains available even if live auth or live execution is flaky
- docs and dashboard links explain the exact safe path Tammy can present
