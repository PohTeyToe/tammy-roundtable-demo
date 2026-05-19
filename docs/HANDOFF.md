# Handoff

## Purpose

This project is the standalone May 21, 2026 Tammy roundtable support artifact:

- one accepted-offer / new-transaction happy path
- real Google core where available
- simplified edges where safer
- fallback-first presentation package

## Ready Now

- Apps Script source is scaffolded and pushed
- setup is non-destructive at the workbook-tab level
- rerun refreshes calendar and Gmail draft outputs
- fallback assets are generated locally and clearly labeled as synthetic presentation assets
- walkthrough, click-path, and expectation-setting docs are in place

## Still Open

The only material blocker is live Google execution verification from this machine.

That path still needs:

1. the intended separate test Google account authenticated on this machine
2. a linked GCP `projectId` for the Apps Script project
3. Apps Script API enabled for that GCP project
4. a desktop OAuth client for that same project
5. `clasp login` redone with project scopes
6. then a real `setup -> seed -> generate` run against the dedicated demo assets

## Safest Next Move

If the next worker is doing presentation support, use the fallback pack and leave the live path alone.

If the next worker is doing operations/setup, work only on the auth/GCP execution chain until `clasp run` succeeds. Do not spend more time polishing the local artifact until the live blocker is cleared.

## What Not To Redo

- do not re-expand the scope into inbox triggers, CRM, OneDrive parity, auth, or a custom web UI
- do not relabel fallback assets as live proof
- do not disturb the separate `C:\VFC\mcc-ops` website lane
