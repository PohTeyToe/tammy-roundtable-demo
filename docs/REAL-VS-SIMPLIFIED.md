# Real Vs Simplified

## Real target

- authenticated Google Sheets, Drive, and Gmail execution
- real browser proof from the current machine
- real Claude-backed extraction and draft generation captured in Google surfaces
- final evidence set tied to a successful live run

## Simplified repo target

- implemented Apps Script workflow and state model
- explicit phase-separated operator actions
- source-file lineage and attempt-aware row model
- attempt-aware action log
- shared Claude integration seam
- narrow supported-source boundary with durable failures
- rerunnable local validation commands
- Tammy-facing review packet that does not overclaim live proof

## Why the simplification is acceptable

The valuable work in this repo is the workflow model, operator surface, lineage model, and validation scaffolding. The current missing piece is external auth and execution proof, not uncertainty about what the artifact is supposed to do.

## What still requires a later live pass

- Google auth
- Apps Script remote execution
- Playwright evidence from real Google surfaces
- final pass/fail capture based on that live run
