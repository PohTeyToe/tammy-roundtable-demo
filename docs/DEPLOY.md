# Deploy

## Hosted preview site

Current deploy IDs, mailbox ownership, and collaborator-invite state belong in
private `.ops` notes, not in this durable repo doc.

Use this when the goal is a Tammy-facing review URL rather than a live Apps Script run:

```powershell
cd C:\VFC\tammy-roundtable-demo
npm run build:review-site
npm run deploy:review-site
```

Behavior:

- if a `VERCEL_TOKEN` is available, the wrapper uses it directly for non-interactive deploys
- if `vercel` is already authenticated, the wrapper builds locally, then deploys the repo with the review-site output settings from `vercel.json`
- if `vercel` is not authenticated, the wrapper falls back to the claimable preview deploy script from the shared Vercel skill
- the hosted site is presentation-safe only and does not claim live Google proof

## Default path

If current Google auth is acceptable for a smoke run:

```powershell
cd C:\VFC\tammy-roundtable-demo
clasp push
clasp run setupDemoEnvironment
clasp run seedDemoData
clasp run runGenerateTransactionPackageByTransactionId --params '["RT-LIVE-1002"]'
```

## Re-home into a separate test Google account

Use this if you need the artifact moved off the currently authenticated Google account.

1. Sign out of the current `clasp` session or open a browser session that is already authenticated to the dedicated test Google account.
2. In `C:\VFC\tammy-roundtable-demo`, run:

```powershell
clasp login
```

3. Create a new bound spreadsheet project from the separate account:

```powershell
clasp create --type sheets --title "Tammy Roundtable Demo - Realtor Workflow CRM"
```

4. Link a real GCP project for remote execution:
   - create or pick a GCP project
   - set that project on the Apps Script project in the Apps Script editor under `Project Settings -> Google Cloud Platform (GCP) Project`
   - add the resulting GCP `projectId` to `.clasp.json`
5. Create a desktop OAuth client for that same GCP project and download it as `client_secret.json`.
6. Re-login with project scopes:

```powershell
clasp login --creds client_secret.json --use-project-scopes --include-clasp-scopes
```

7. Confirm `.clasp.json` now points at the new spreadsheet/script IDs and includes the GCP `projectId`.
8. Enable the Apps Script API for that GCP project.
9. Push the local source:

```powershell
clasp push --force
```

10. Create a version and an API-executable deployment:

```powershell
clasp version "Initial Tammy roundtable demo implementation"
clasp deploy -d "Tammy roundtable demo API executable"
```

11. Run setup and seed:

```powershell
clasp run setupDemoEnvironment
clasp run seedDemoData
```

12. Open the spreadsheet from the separate account and authorize the script scopes when prompted.
13. In the sheet, use the `Tammy Roundtable Demo` custom menu for the live operator flow.

## Required scopes

- spreadsheets
- drive
- forms
- calendar
- gmail compose
- container UI

## If `clasp run` fails

The usual causes are:

- `.clasp.json` has no `projectId`
- the Apps Script project is not linked to that GCP project
- the Apps Script API is not enabled
- the `clasp` auth profile was not re-created with project scopes
- the deployment exists, but not as an API executable

1. Open the bound spreadsheet.
2. Open `Extensions -> Apps Script`.
3. Run `setupDemoEnvironment`.
4. Approve scopes.
5. Run `seedDemoData`.
6. Return to the spreadsheet and use the custom menu.
