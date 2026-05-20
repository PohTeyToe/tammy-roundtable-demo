# Handoff

## Current posture

This repo has been simplified from a strict-live completion target to a cleaner and more honest handoff target:

- workflow implementation complete
- local validation surfaces in place
- Tammy-facing packet ready
- live Google auth and browser proof deferred

## What is done

- the old single `Generate Transaction Package` story has been replaced by the explicit phase model
- the committed row-state model is implemented in code
- the transaction row is now the canonical current-attempt surface
- the action log is now attempt-aware
- source-file handling is intentionally narrow and explicit for v1
- one shared Claude helper is in place for extraction and draft generation
- durable npm and PowerShell entrypoints exist for preflight, smoke, and later Playwright validation
- the repo now includes a Tammy-facing packet that matches the simplified finish line

## What still blocks a true live-complete claim

- Google sign-in from this machine
- Apps Script remote execution auth
- GCP linkage for the bound script project
- browser-captured evidence from real Sheets, Drive, and Gmail surfaces

## Safest next move

If the next worker is doing presentation or review support:

- use [docs/TAMMY-REVIEW-PACKET.html](C:/VFC/tammy-roundtable-demo/docs/TAMMY-REVIEW-PACKET.html)
- use [docs/WALKTHROUGH.md](C:/VFC/tammy-roundtable-demo/docs/WALKTHROUGH.md:1)
- keep the live-proof caveat explicit

If the next worker is doing live completion:

1. fix Google auth first
2. fix `clasp run` second
3. capture real browser evidence third
4. only then upgrade the packet language

## What not to redo

- do not collapse the phase model back into one action
- do not re-expand the scope into the website lane or broader CRM work
- do not relabel fallback assets as live proof
- do not spend more time polishing docs until the next worker decides whether the goal is presentation-ready or truly live-complete
