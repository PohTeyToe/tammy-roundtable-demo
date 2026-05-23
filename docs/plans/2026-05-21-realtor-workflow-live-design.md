# Realtor Workflow Live + E2E Design

> Historical design note for the May 21, 2026 roundtable lane. Keep this file
> for implementation reasoning only. Current deploy/auth state, collaborator
> access, and outbound communication belong in the current repo routers and
> `C:\VFC\.ops`.

Date: 2026-05-21
Author: Abdallah (via Claude session)
Status: Approved for implementation
Target: May 21 realtor roundtable (today)

## Why this exists

Tammy sent four asks across the May 20 evening Gmail thread that converge on a single deliverable:

- `question` (Wed 7:09 PM MDT): Step 1 should be a Realtor uploading a signed DocuSign agreement (Exclusive Buyer or Seller). The system should create a Drive folder and seed the trade record from the agreement.
- `Brokerage vs Realtor - revise please` (Wed 7:13 PM MDT): The current demo is built for the Brokerage. The Realtor's validation point is the checklist at the bottom of the trade record.
- `Revision` (Wed 10:28 PM MDT): On the Drive page, keep loose docs only plus ONE folder for `RMS & Photos` or `Condo Docs`. Remove `Possession and Keys`, `Lawyer Correspondence`, and `FINTRAC`.
- `Revision - 2` (Wed 10:32 PM MDT): The trade record should be created from the document templates she provided. FINTRAC is done on a different app and never uploaded here.

Plus an earlier request in the same `Technical stack` thread (Wed 8:11 PM MDT) to give her access to the Vercel app so she can adjust things herself.

The current `tammy-roundtable-demo.vercel.app` site has the Realtor framing in copy but the visuals (folder taxonomy, trade record checklist) still reflect the Brokerage-flavored model. The Apps Script backend (Web App + `AgreementUpload.js` + `UploadPage.html`) is already pushed but is deployed `MYSELF`-only and is never linked from the Vercel site, so the e2e flow is not actually reachable.

## What "deployed live and tested e2e working" means here

Two surfaces, working together:

1. The Vercel page is the Realtor-facing walkthrough. Visuals match Tammy's two `Revision` emails. Step 1 has a real CTA that opens the live Apps Script Web App.
2. The Apps Script Web App is the live execution surface. A Realtor (or Tammy at the roundtable) drops one of Tammy's signed agreement PDFs and the backend creates a real Drive folder, seeds a real intake row, populates the trade record + 6-item Realtor validation checklist, and creates a Gmail draft. Returns links.

End-to-end means: a real PDF from Tammy's shared folder goes in, real Google artifacts come out, and the live flow's outputs match what the Vercel walkthrough advertises.

## Architecture

```
Realtor / Tammy
      |
      v
[Vercel: tammy-roundtable-demo.vercel.app]
  Walkthrough explains the 5 steps
  Step 1 CTA: "Upload signed agreement" -> opens
      |
      v
[Apps Script Web App: /macros/s/<DEPLOYMENT>/exec]
  UploadPage.html: drop PDF -> google.script.run
      |
      v
[trdProcessUploadedAgreementBase64 (AgreementUpload.js)]
  Decode base64 -> create file in demo folder
  -> runFromAgreementUploadByDriveFileId
       Claude extraction (Anthropic API via Script Property)
       Detect buyer/seller side
       Create transaction folder (realtor closing taxonomy)
       Seed intake row
       Run happy path: extraction -> approve -> draft
       Upsert trade record + 6-item validation checklist
       Return JSON: { transactionId, side, folderUrl, spreadsheetUrl, draftUrl }
      |
      v
[UploadPage shows links to live Drive folder, trade record, Gmail draft]
```

Why a new-tab link from Vercel to the Web App rather than an iframe or a CORS POST:

- Apps Script Web Apps redirect to sign-in on first hit and the iframe sandbox flow is fragile across browsers.
- Web Apps do not return CORS headers, so `fetch` from the Vercel origin to `/exec` will fail in the browser. `google.script.run` only works from inside an Apps Script HTML service page.
- A new tab keeps the demo storytelling clean and uses the existing `UploadPage.html` UI we already have.

## Concrete revisions to apply (per Tammy's emails)

### Folder taxonomy (Revision-1)

Old (in `scripts/render-fallback-assets.mjs` and `src/Config.js`):

- `01 Signed Agreement`, `02 FINTRAC`, `03 Purchase Contract & Amendments`, `04 Deposit`, `05 Condition Documents`, `06 Lawyer Correspondence`, `07 MLS & Listing Docs`, `08 Possession & Keys`, `09 Trade Record`

New (matches Tammy's email):

- Root (loose files, no folders):
  - `Signed Agreement` (the uploaded DocuSign PDF)
  - `Purchase Contract & Amendments`
  - `Deposit`
  - `Condition Documents`
  - `MLS Copy`
  - `Trade Record Summary`
- One folder (conditional on agreement type / property):
  - `RMS & Photos` for residential
  - `Condo Docs` for condo property

Removed: FINTRAC, Possession & Keys, Lawyer Correspondence.

### Trade record + Realtor validation checklist (Revision-2 + Brokerage-vs-Realtor)

Trade record visual is rebuilt from her actual templates (read `Exclusive Buyer Representation Agreement.pdf` and `Residential Purchase Contract.pdf` from her shared Drive folder to model the field set).

The 6-item Realtor validation checklist at the bottom of the trade record:

1. Signed Agreement (uploaded DocuSign)
2. Purchase Contract & Amendments
3. Deposit / Proof of Deposit
4. Condition Waiver / Fulfillment
5. MLS Listing
6. Trade Record Review

Removed from any prior checklist: FINTRAC (different app), lawyer items (not Realtor's validation surface), possession (operational, not validation).

### Step 4 caption on the Vercel site

Current copy contradicts the revised checklist. Rewrite from:

> "Claude extracts the deal fields and writes the row. The Realtor validation checklist sits at the bottom: signed agreement, FINTRAC, deposit, lawyers, condition waiver, possession, trade record review."

To:

> "Claude extracts the deal fields and writes the row. The Realtor validation checklist sits at the bottom: signed agreement, purchase contract, deposit, condition waiver, MLS listing, trade record review."

## Files to change

### Visual / Vercel side

- `scripts/render-fallback-assets.mjs` — rewrite the inline HTML for `folder-tree.html` (new 6-loose + 1-folder taxonomy) and `trade-record.html` (new field set from templates + 6-item validation checklist). Re-run to regenerate the PNGs.
- `site/index.html` — (a) add visible "Upload signed agreement" CTA on Step 1 linking to `https://script.google.com/macros/s/AKfycbwH2fE6VR-btqpeCrHJvseg5QDhlqi7xmiC56hPaCKl/exec` in a new tab; (b) update Step 4 caption per above; (c) update the sidebar Step 2 description if it mentions removed folders.
- `docs/TAMMY-REVIEW-PACKET.html` — same caption and screenshot replacements as `site/index.html`.

### Apps Script / backend side

- `src/Config.js` — replace `folderTemplatePaths` and `requiredDocs` with the new taxonomy + 6-item checklist. Update `sampleDocStatusPresets` to match the new doc names.
- `src/AgreementUpload.js` — in `runFromAgreementUploadByDriveFileId`, after creating the transaction folder, also create the single conditional sub-folder (`RMS & Photos` or `Condo Docs` based on agreement side / file name heuristic). Default to `RMS & Photos` unless filename or extracted text indicates condo.
- `src/FormDriveCalendar.js` — review `trdCreateOrReuseTransactionFolder` to ensure it consumes the new `folderTemplatePaths` correctly.

### Pushed and redeployed

- `clasp push --force`
- Redeploy HEAD with `Execute as: Me`, `Who has access: Anyone` (manual via Apps Script editor, since clasp CLI cannot set Web App access scope reliably).

## Historical operator note

The day-of manual auth and deploy steps were intentionally removed from this
shareable design note during boundary cleanup.

Use the current repo-owned deploy instructions plus the private `.ops` deploy
state if you need to run the artifact today:

- [docs/DEPLOY.md](C:/VFC/tammy-roundtable-demo/docs/DEPLOY.md:1)
- [mcc-realtor-app deploy ops](C:/VFC/.ops/context/systems/mcc-realtor-app-deploy-ops.md:1)

## Testing / verification

After manual steps above, this session will:

1. `curl -sL "https://script.google.com/macros/s/AKfycbwH2fE6VR-btqpeCrHJvseg5QDhlqi7xmiC56hPaCKl/exec"` and confirm it returns HTML for the upload page (not a sign-in redirect).
2. Download one of Tammy's templates from her shared folder (`Exclusive Buyer Representation Agreement (Designated Agency) (10).pdf`) and upload it via the Web App in a browser, then verify:
   - A new transaction folder exists in Drive with the 6 loose docs + 1 conditional subfolder
   - A new intake row exists in the workbook
   - A new trade record row exists with the 6-item validation checklist beneath it
   - A Gmail draft exists with the next-step email
3. Open `https://tammy-roundtable-demo.vercel.app/` after deploy and confirm:
   - New `folder-tree.png` shows revised taxonomy
   - New `trade-record.png` shows the revised checklist
   - Step 1's "Upload signed agreement" CTA renders and links to the Web App
   - Step 4's caption matches the new 6-item checklist
4. Capture screenshots and assemble a short evidence note in `docs/VERIFICATION.md`.

## Scope this design explicitly excludes

To avoid drift before the roundtable:

- No DocuSign webhook integration. The upload is a Realtor manually dragging the signed PDF in. Real DocuSign API integration is a later track.
- No replacement of the Vercel walkthrough with a single-page React app. Static HTML walkthrough plus Apps Script Web App is the surface.
- No changes to the `mcc-ops` rebuild repo. This work is fully scoped to `C:\VFC\tammy-roundtable-demo`.
- No new design variants or alternate stylesheets. Visual changes are limited to the two screenshots Tammy critiqued and the Step 4 caption.
- No live email send. Gmail step remains draft-only per the standing safety rule.

## Risks

- Browser auth step depends on the operator being able to sign in to the script editor and approve scopes. If the correct Google account does not own the script project, the deploy step will fail and the project may need to be re-created or re-homed.
- `clasp push --force` may overwrite manual edits if any were made in the editor. The repo source is authoritative; verify nothing was hand-edited in the editor before pushing.
- The Anthropic API key needs to be set as a Script Property. If the wrong key shape is used (e.g. an OAuth token instead of `sk-ant-api...`), extraction will fail at the Claude call. The current `trdSetClaudeApiKey` already special-cases the OAuth shape.
- Real-template extraction may produce missing-field outcomes if Tammy's templates don't contain all the fields in `extractionMinimumFieldKeys`. May need to relax the minimum field set or tolerate a partial fill for the demo.

## Why this design over alternatives

- Vercel hosts the upload form directly: rejected because Apps Script Web Apps lack CORS, so a Vercel-origin fetch will fail.
- Build a separate Node service to relay between Vercel and Apps Script: rejected on time grounds. Adds infra and an extra failure mode for a one-day demo.
- Skip the visual revisions and only ship the live backend: rejected because Tammy's two `Revision` emails were specifically about the visual representation. Shipping the backend without the visual fixes would still leave her demo visually wrong.
- Full rewrite of `UploadPage.html` to match Vercel branding: rejected on time grounds. The existing styled `UploadPage.html` is usable as-is; new-tab handoff makes the brand shift acceptable.
