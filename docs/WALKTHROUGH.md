# Walkthrough

## What Tammy can show now

1. Open the workbook and show the custom `Tammy Roundtable Demo` menu.
2. Open `TransactionIntake` and point to the implemented phase states and source-lineage columns.
3. Show that the operator flow is now split into `Run Extraction`, `Approve Review`, `Reject Review`, `Reverse Approval`, and `Generate Draft`.
4. Open `Dashboard` and show the status summary, source label, attempt number, Drive folder link, calendar state, draft state, trade-record state, and last result.
5. Open `ActionLog` and show the attempt-aware audit trail.
6. Open `TradeRecord` and show that the output is tied to the current attempt and source file.
7. If needed, open the seeded fallback assets for a presentation-safe visual walkthrough.

## What this now proves

- the repo is no longer a one-click happy-path scaffold
- the workbook model now reflects extraction, review, reversal, rejection, and draft phases explicitly
- source-file lineage, current-attempt lineage, and draft lineage are first-class row concepts
- the log schema matches the committed attempt-aware structure
- the repo has durable local entrypoints for setup, smoke, and later browser validation

## What this does not prove yet

- real Google-authenticated execution from this machine
- live Sheets, Drive, and Gmail browser proof for the new phase model
- remote `clasp run` success under the intended auth chain
- live Claude output captured from Google surfaces
