# Realtor Workflow Live + E2E Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship Tammy's `tammy-roundtable-demo.vercel.app` with all four May 20 evening revisions applied (Step 1 = DocuSign upload, realtor folder taxonomy, realtor validation checklist at bottom of trade record, no FINTRAC/lawyers/possession), wired to the existing Apps Script Web App so a Realtor can drop a real signed agreement and get back a real Drive folder + trade record + Gmail draft.

**Architecture:** Vercel static walkthrough hands off to Apps Script Web App via new-tab CTA. Web App's `UploadPage.html` accepts PDF → base64 → `trdProcessUploadedAgreementBase64` → `runFromAgreementUploadByDriveFileId` → Claude extraction → real Drive folder + intake row + trade record + Gmail draft → returns JSON with live links.

**Tech Stack:** Static HTML (Vercel auto-deploy), Apps Script V8 runtime, clasp CLI, Anthropic Claude API, headless Edge (existing `render-fallback-assets.mjs`).

**Reference:** `docs/plans/2026-05-21-realtor-workflow-live-design.md` (design doc, commit `831d411`).

---

## Pre-flight

- [ ] Confirm working directory is `C:\VFC\tammy-roundtable-demo` (not the worktree). All file paths in this plan are relative to that repo.
- [ ] Confirm clasp HEAD deployment ID: `AKfycbwH2fE6VR-btqpeCrHJvseg5QDhlqi7xmiC56hPaCKl`. This is the Web App URL we'll wire from Vercel.
- [ ] Confirm Tammy's template Drive folder: `https://drive.google.com/drive/folders/1qU5bK10o1wTcEfRZffyrOwoF9zXeIvom`. 8 PDFs we'll model the trade record visual off of.

---

## Task 1: Inspect Tammy's actual templates to inform the trade record visual

**Files:** none (read-only investigation)

- [ ] **Step 1: Download two key templates from Tammy's shared folder**

```powershell
$ANTHROPIC_DIR = "C:\VFC\tammy-roundtable-demo\.tmp\tammy-templates"
New-Item -ItemType Directory -Force -Path $ANTHROPIC_DIR | Out-Null
gws drive files get --params "{`"fileId`": `"1P-cYz57kdu8DqkH8GQgUX0VsKQony4L7`", `"alt`": `"media`"}" -o "$ANTHROPIC_DIR\exclusive-buyer-agreement.pdf"
gws drive files get --params "{`"fileId`": `"1H3DkhC7gEtFQfSrMVNUzp7HUvdDwuIlV`", `"alt`": `"media`"}" -o "$ANTHROPIC_DIR\residential-purchase-contract.pdf"
```

Expected: both PDFs in `.tmp\tammy-templates\`. `.tmp` should be in `.gitignore` already (verify with `cat .gitignore`).

- [ ] **Step 2: Pull text from each PDF to extract the field list**

Use Read tool on each PDF (Claude can read PDF content directly). Look specifically for:
- Buyer/Seller name labels
- Property description field shape
- Price / deposit / commission fields
- Condition / waiver structure
- Realtor name field

Goal: produce a short list of 10-12 fields that should appear on the trade record visual. Write the field list into a scratch note in the chat — no file commit needed.

- [ ] **Step 3: No commit (investigation only)**

---

## Task 2: Update `renderFolderTree` for Revision-1 taxonomy

**Files:** Modify `scripts/render-fallback-assets.mjs:507-678`

- [ ] **Step 1: Replace `dirItems` and update `sample.folderTree` to match Tammy's spec**

In `scripts/render-fallback-assets.mjs`:

- Update `sample.folderTree` (around lines 42-53) to:
```js
folderTree: [
  'RT-COMP-1001 - Jordan Patel - 1128 4 Street SW, Calgary, AB',
  'RMS & Photos',
],
```

- Update `dirItems` inside `renderFolderTree` (around lines 511-523) to:
```js
const dirItems = [
  { name: 'RMS & Photos', kind: 'folder', owner: 'me', modified: 'May 19, 2026' },
  { name: 'Exclusive Buyer Agreement - Jordan Patel.pdf', kind: 'doc', owner: 'me', modified: 'May 19, 2026' },
  { name: 'Residential Purchase Contract - RT-COMP-1001.pdf', kind: 'doc', owner: 'me', modified: 'May 19, 2026' },
  { name: 'Deposit Cheque - $25,000.pdf', kind: 'doc', owner: 'me', modified: 'May 19, 2026' },
  { name: 'Condition Waiver - Financing.pdf', kind: 'doc', owner: 'me', modified: 'May 19, 2026' },
  { name: 'MLS Listing A2145678.pdf', kind: 'doc', owner: 'me', modified: 'May 18, 2026' },
  { name: 'Trade Record Summary - RT-COMP-1001.gsheet', kind: 'doc', owner: 'me', modified: 'May 19, 2026' },
];
```

- [ ] **Step 2: Render and visually inspect**

```powershell
npm run render:fallback
```

Expected: `assets/fallback/generated/folder-tree.png` regenerates. Open in image viewer. Should show ONE folder (RMS & Photos) at top, then 6 file tiles below. No FINTRAC, no Possession & Keys, no Lawyer Correspondence.

- [ ] **Step 3: Commit**

```powershell
git add scripts/render-fallback-assets.mjs assets/fallback/generated/folder-tree.png assets/fallback/generated/folder-tree.html assets/fallback/generated/manifest.json
git commit -m "fix(visual): apply Tammy Revision-1 folder taxonomy

Remove FINTRAC, Possession & Keys, Lawyer Correspondence folders per
Tammy's 10:28 PM MDT email. New structure: 6 loose docs at root + one
conditional folder (RMS & Photos for residential / Condo Docs for condo)."
```

---

## Task 3: Update `renderTradeRecord` for Revision-2 (checklist trimmed, fields from templates)

**Files:** Modify `scripts/render-fallback-assets.mjs:1025-1118`

- [ ] **Step 1: Replace the `checklist` array with the new 6-item Realtor validation list**

In `renderTradeRecord`, replace the 10-item `checklist` (around lines 1038-1049) with:

```js
const checklist = [
  ['Signed agreement (Exclusive Buyer / Seller)', 'Complete', '2026-05-19', 'Exclusive Buyer Agreement uploaded via DocuSign'],
  ['Purchase contract & amendments', 'Complete', '2026-05-19', 'Residential Purchase Contract on file'],
  ['Deposit confirmed', 'Complete', '2026-05-19', 'Trust cheque from buyer agent'],
  ['Condition waiver / fulfillment', 'Pending', '', 'Due 2026-05-21'],
  ['MLS listing on file', 'Complete', '2026-05-18', 'Pulled from MLS export A2145678'],
  ['Trade record review', 'Pending', '', 'Closing checklist sign-off'],
];
```

- [ ] **Step 2: Update the checklist meta count**

Replace the `tr-cl-meta` text (around line 1056) from `7 of 10 complete / 3 pending` to:

```html
<span class="tr-cl-meta">4 of 6 complete / 2 pending</span>
```

- [ ] **Step 3: Update `tr-cl-badge` label**

Tammy framed this as the Realtor's anchor. The current badge says `Realtor validation` already — keep it. No change needed.

- [ ] **Step 4: Render and inspect**

```powershell
npm run render:fallback
```

Expected: `assets/fallback/generated/trade-record.png` shows the trade record row on top and a 6-row validation checklist at the bottom. No FINTRAC entries, no lawyer entries, no possession entry. Status pills: 4 green Complete, 2 amber Pending.

- [ ] **Step 5: Commit**

```powershell
git add scripts/render-fallback-assets.mjs assets/fallback/generated/trade-record.png assets/fallback/generated/trade-record.html assets/fallback/generated/manifest.json
git commit -m "fix(visual): apply Tammy Revision-2 trade record checklist

Drop FINTRAC (handled in a separate app per Tammy), lawyer items (not the
Realtor's validation surface), and possession (operational, not validation).
New 6-item checklist: signed agreement, purchase contract, deposit,
condition waiver, MLS, trade record review. Counts updated to 4 of 6."
```

---

## Task 4: Update `site/index.html` Step 4 caption + Step 2 sidebar

**Files:** Modify `site/index.html`

- [ ] **Step 1: Update Step 4 sub-text to match new checklist**

Find the Step 4 `step-sub` (around line 721) that currently says:
```
Claude extracts the deal fields and writes the row. The Realtor validation checklist sits at the bottom: signed agreement, FINTRAC, deposit, lawyers, condition waiver, possession, trade record review.
```

Replace with:
```
Claude extracts the deal fields and writes the row. The Realtor validation checklist sits at the bottom: signed agreement, purchase contract, deposit, condition waiver, MLS listing, trade record review.
```

- [ ] **Step 2: Update Step 2 sidebar text if it mentions removed folders**

Grep first:
```powershell
Select-String -Path site\index.html -Pattern "FINTRAC|Possession|Lawyer Correspondence"
```

If any match in step-card copy: rewrite the affected `step-sub` to describe the new "loose docs + one folder for RMS & Photos / Condo Docs" structure. Don't touch the `<style>` block or scripts.

- [ ] **Step 3: Update the static `What you actually see` summary list**

Find the bullet list around line 760-765 that currently says `Realtor validation checklist sits at the bottom of the trade record`. Confirm it's still accurate after the trim — no change needed unless it enumerates removed items.

- [ ] **Step 4: Visual check via local server**

```powershell
npx http-server -p 8045 -c-1 .
```

Open `http://127.0.0.1:8045/site/`. Click through all 5 steps. Confirm Step 4 caption matches new copy.

- [ ] **Step 5: Commit**

```powershell
git add site/index.html
git commit -m "fix(site): update Step 4 caption and any folder mentions

Match the trimmed 6-item Realtor validation checklist. Drop FINTRAC,
lawyers, possession from the on-page enumeration."
```

---

## Task 5: Wire Vercel Step 1 to the live Apps Script Web App

**Files:** Modify `site/index.html`

- [ ] **Step 1: Add a CTA button to Step 1's stage frame**

In `site/index.html`, find the Step 1 stage frame block (around the `<div class="stage-frame">` for step 1) and add a visible CTA above or next to the screenshot:

```html
<a class="step-cta" href="https://script.google.com/macros/s/AKfycbwH2fE6VR-btqpeCrHJvseg5QDhlqi7xmiC56hPaCKl/exec" target="_blank" rel="noopener">
  Try the live upload &rarr;
</a>
```

CSS to add inside the existing `<style>` block (near `.stage-caption-*` rules):

```css
.step-cta {
  display: inline-flex; align-items: center; gap: 6px;
  background: var(--accent); color: var(--paper);
  padding: 10px 16px; border-radius: 8px;
  font-family: var(--sans); font-weight: 600; font-size: 14px;
  letter-spacing: 0.01em; margin-top: 12px;
  transition: background .15s ease;
}
.step-cta:hover { background: var(--accent-deep); }
```

- [ ] **Step 2: Render CTA only on Step 1**

The stage frame is reused for all 5 steps via the JS `setStep` function. To avoid showing the CTA on other steps, put it inside an element with `id="stage-cta"` and toggle visibility in the existing `setStep` JS:

In `setStep`, after the existing image/caption update, add:
```js
document.getElementById('stage-cta').style.display = (num === '01') ? 'inline-flex' : 'none';
```

- [ ] **Step 3: Test locally**

Reload `http://127.0.0.1:8045/site/`. Click Step 1: CTA visible. Click Step 2-5: CTA hidden. Click CTA: opens Apps Script URL in new tab.

- [ ] **Step 4: Commit**

```powershell
git add site/index.html
git commit -m "feat(site): wire Step 1 to live Apps Script Web App

Add 'Try the live upload' CTA on Step 1 stage frame that opens the
deployed Web App (/macros/s/AKfycbwH2fE6VR-.../exec) in a new tab.
This is the bridge from the Vercel walkthrough into the live flow."
```

---

## Task 6: Mirror the Step 4 caption fix in `docs/TAMMY-REVIEW-PACKET.html`

**Files:** Modify `docs/TAMMY-REVIEW-PACKET.html`

- [ ] **Step 1: Grep for old checklist enumeration**

```powershell
Select-String -Path docs\TAMMY-REVIEW-PACKET.html -Pattern "FINTRAC|signed agreement, FINTRAC|lawyers, condition"
```

- [ ] **Step 2: Replace each match with the 6-item list**

Use the same sentence as in `site/index.html` Step 4:
> "...signed agreement, purchase contract, deposit, condition waiver, MLS listing, trade record review."

- [ ] **Step 3: Commit**

```powershell
git add docs/TAMMY-REVIEW-PACKET.html
git commit -m "fix(packet): trim FINTRAC/lawyers/possession from checklist text"
```

---

## Task 7: Update `src/Config.js` folder taxonomy

**Files:** Modify `src/Config.js:236-246`

- [ ] **Step 1: Replace `folderTemplatePaths`**

Current:
```js
folderTemplatePaths: Object.freeze([
  'Initial Prospect Folder',
  'Full Info Prospects Folder',
  'Full Info Prospects Folder/Financials',
  ...
]),
```

Replace with:
```js
folderTemplatePaths: Object.freeze([]),
folderConditionalSubfolders: Object.freeze({
  residential: 'RMS & Photos',
  condo: 'Condo Docs',
}),
```

The empty `folderTemplatePaths` means `trdCreateOrReuseTransactionFolder` won't pre-create any sub-folders. The conditional one is created by `AgreementUpload.js` in Task 9.

- [ ] **Step 2: Verify `FormDriveCalendar.js` consumes `folderTemplatePaths` defensively**

```powershell
Select-String -Path src\FormDriveCalendar.js -Pattern "folderTemplatePaths"
```

Confirm the consumer iterates the array (will safely no-op on `[]`). If it doesn't, we'll need to handle that in the consumer, but the existing pattern is `.forEach(...)` style.

- [ ] **Step 3: Commit**

```powershell
git add src/Config.js
git commit -m "fix(backend): replace pre-created folder list with conditional subfolder map

Tammy's Revision-1 spec: loose docs at root + one folder (RMS & Photos for
residential or Condo Docs for condo). Pre-creation list emptied; the single
conditional folder is created by AgreementUpload based on agreement type."
```

---

## Task 8: Update `src/Config.js` `requiredDocs` and `sampleDocStatusPresets`

**Files:** Modify `src/Config.js:153-162` and `247-268`

- [ ] **Step 1: Replace `requiredDocs`**

Current has 8 items including Compliance/Lawyers/Closing categories with FINTRAC-adjacent docs.

Replace with the 6-item Realtor validation set:
```js
requiredDocs: Object.freeze([
  { category: 'Agreement', name: 'Signed Agreement (Exclusive Buyer / Seller)' },
  { category: 'Contract', name: 'Purchase Contract & Amendments' },
  { category: 'Deposit', name: 'Deposit Cheque / Proof of Deposit' },
  { category: 'Conditions', name: 'Condition Waiver / Fulfillment' },
  { category: 'Compliance', name: 'MLS Listing' },
  { category: 'Closing', name: 'Trade Record Review' },
]),
```

- [ ] **Step 2: Replace `sampleDocStatusPresets`**

```js
sampleDocStatusPresets: Object.freeze({
  completed: Object.freeze({
    'Signed Agreement (Exclusive Buyer / Seller)': 'Received',
    'Purchase Contract & Amendments': 'Received',
    'Deposit Cheque / Proof of Deposit': 'Received',
    'Condition Waiver / Fulfillment': 'Missing',
    'MLS Listing': 'Received',
    'Trade Record Review': 'Expected',
  }),
  live: Object.freeze({
    'Signed Agreement (Exclusive Buyer / Seller)': 'Received',
    'Purchase Contract & Amendments': 'Expected',
    'Deposit Cheque / Proof of Deposit': 'Expected',
    'Condition Waiver / Fulfillment': 'Expected',
    'MLS Listing': 'Received',
    'Trade Record Review': 'Expected',
  }),
}),
```

- [ ] **Step 3: Verify consumers**

```powershell
Select-String -Path src\*.js -Pattern "requiredDocs|sampleDocStatusPresets"
```

Confirm `trdUpsertRequiredDocs` (in `Workflow.js`) iterates `TRD_CONFIG.requiredDocs` and looks up status by `doc.name`. New names will flow through naturally.

- [ ] **Step 4: Commit**

```powershell
git add src/Config.js
git commit -m "fix(backend): trim requiredDocs to 6-item Realtor checklist

Match Tammy's two Revision emails: drop Accepted Offer (dupe of contract),
Area Forms / Consumer Agreement, Seller Lawyer Contact, Buyer Lawyer
Contact. Add Signed Agreement as the new anchor doc."
```

---

## Task 9: Update `src/AgreementUpload.js` to create conditional subfolder

**Files:** Modify `src/AgreementUpload.js:1-91`

- [ ] **Step 1: Add property-type detection**

After `trdDetectAgreementSide` (around line 112), add:

```js
function trdDetectPropertyType(fileName, extracted) {
  const lower = (fileName || '').toLowerCase();
  if (lower.indexOf('condo') !== -1) return 'condo';
  const summary = (extracted && trdAsString(extracted.summary || '')).toLowerCase();
  if (summary.indexOf('condo') !== -1 || summary.indexOf('condominium') !== -1) return 'condo';
  return 'residential';
}
```

- [ ] **Step 2: Create the conditional subfolder after the transaction folder**

In `runFromAgreementUploadByDriveFileId`, after `const folder = trdCreateOrReuseTransactionFolder(synthetic, '');` (around line 52), add:

```js
const propertyType = trdDetectPropertyType(file.getName(), extracted);
const subName = TRD_CONFIG.folderConditionalSubfolders[propertyType] || TRD_CONFIG.folderConditionalSubfolders.residential;
const existingSub = folder.getFoldersByName(subName);
if (!existingSub.hasNext()) {
  folder.createFolder(subName);
}
```

- [ ] **Step 3: Include propertyType in the response**

In the return value (around line 79-90), add `propertyType: propertyType,` to the returned object.

- [ ] **Step 4: Commit**

```powershell
git add src/AgreementUpload.js
git commit -m "feat(backend): create conditional RMS & Photos / Condo Docs subfolder

Detect property type from filename + extracted summary. Create one
subfolder (RMS & Photos for residential, Condo Docs for condo) under
the transaction folder. Match Tammy's Revision-1 spec."
```

---

## Task 10: Push backend changes to Apps Script project

**Files:** none (clasp push)

- [ ] **Step 1: Push**

```powershell
clasp push --force
```

Expected: `Pushed N files.` no errors. If errors mention `tsconfig.json` ignore; clasp lints loosely.

- [ ] **Step 2: Verify push landed**

```powershell
clasp status
```

Expected: all `src/*.js` and `src/*.html` files listed as tracked, none untracked.

- [ ] **Step 3: No commit needed (push is a deploy, not a code change)**

---

## Task 11: Commit + push Vercel-side changes to GitHub for auto-deploy

**Files:** all preceding commits

- [ ] **Step 1: Push to origin/main**

```powershell
git push origin main
```

- [ ] **Step 2: Wait for Vercel build**

Vercel project is linked to GitHub `productionBranch: main`, so push triggers auto-deploy. Monitor:

```powershell
vercel ls --token $env:VERCEL_TOKEN tammy-roundtable-demo 2>&1 | Select-Object -First 5
```

Or wait ~60s and curl:

```powershell
curl -sL -w "%{http_code}`n" -o $null https://tammy-roundtable-demo.vercel.app/
```

Expected: 200.

- [ ] **Step 3: No new commit (this is the deploy step)**

---

## Task 12: Visually verify the live Vercel URL

**Files:** none (verification)

- [ ] **Step 1: Open in browser**

```powershell
Start-Process "https://tammy-roundtable-demo.vercel.app/"
```

- [ ] **Step 2: Walk through all 5 steps**

Confirm in this order:
1. Step 1 shows the "Try the live upload" CTA. Clicking opens Apps Script URL in new tab.
2. Step 2 (Drive folder) screenshot shows 6 loose docs + 1 folder (RMS & Photos). NO FINTRAC, NO Possession & Keys, NO Lawyer Correspondence.
3. Step 4 (Trade record) screenshot shows trade record row on top + 6-item validation checklist at bottom. Pills: 4 green Complete, 2 amber Pending.
4. Step 4 caption text matches the new 6-item list.
5. Auto-play still cycles through all 5 steps without breaking.

- [ ] **Step 3: Capture evidence screenshots**

```powershell
.\scripts\playwright-capture-evidence.ps1
```

(If that script isn't wired for the live URL, take manual screenshots and save under `docs/evidence/2026-05-21/`.)

- [ ] **Step 4: No commit (visual verification only)**

---

## Task 13: Write manual auth + redeploy handoff doc

**Files:** Create `docs/MANUAL-AUTH-2026-05-21.md`

- [ ] **Step 1: Write the doc**

```markdown
# Manual Auth + Redeploy Steps (May 21, 2026)

These steps require browser access and OAuth approval, which can't be automated from the terminal. Estimated time: 15 minutes.

## 1. Open the Apps Script editor

https://script.google.com/d/1tMt6waE8UKTMmxcv2BCwQk7aHHS1bkCMNoAwSircsT2fOmt3VzPG15fK/edit

Sign in as `abdalsf5@gmail.com` if not already.

## 2. Set the Claude API key

- Project Settings (gear icon) -> Script Properties -> Add script property
- Name: `TRD_CLAUDE_API_KEY`
- Value: contents of `$env:ANTHROPIC_API_KEY` (Anthropic API key, starts with `sk-ant-api...`)
- Save

## 3. Authorize OAuth scopes

- In the editor, select function `setupDemoEnvironment` from the function dropdown
- Click Run
- A consent dialog appears. Click `Review permissions`, pick the account, click `Allow`
- Wait for execution to complete. Logs panel should show `Idempotent setup completed`

## 4. Seed demo data

- Select function `seedDemoData` -> Run
- Logs panel should show two `Seed` entries (one for RT-COMP-1001, one for RT-LIVE-1002)

## 5. Redeploy Web App with Anyone access

- Deploy (top right) -> Manage deployments
- Find the HEAD deployment (the one without a version number)
- Click the pencil icon to edit
- Configuration: `Web app`
- Execute as: `Me (abdalsf5@gmail.com)`
- Who has access: `Anyone`
- Click Deploy
- URL should stay the same: `/macros/s/AKfycbwH2fE6VR-btqpeCrHJvseg5QDhlqi7xmiC56hPaCKl/exec`

## 6. Confirm

In a private/incognito window (so you're not auto-signed in), open:
`https://script.google.com/macros/s/AKfycbwH2fE6VR-btqpeCrHJvseg5QDhlqi7xmiC56hPaCKl/exec`

Expected: the "Signed agreement upload" page renders. No sign-in prompt.

## 7. Tell the agent you're done

Reply in the session: `manual auth complete`. The agent will then run the e2e test pass.
```

- [ ] **Step 2: Commit**

```powershell
git add docs/MANUAL-AUTH-2026-05-21.md
git commit -m "docs: handoff steps for manual Apps Script auth + Web App redeploy"
git push origin main
```

- [ ] **Step 3: Halt and wait for user**

Stop executing tasks. Print to user: `Tasks 1-13 complete. Open docs/MANUAL-AUTH-2026-05-21.md and walk through the 7 steps. Reply 'manual auth complete' when done so I can run the e2e test pass.`

---

## Task 14: E2E test with one of Tammy's real templates

**Files:** none initially; possibly update `docs/VERIFICATION.md` at the end

- [ ] **Step 1: Curl the Web App URL anonymously**

```powershell
curl -sL -w "`n%{http_code} %{url_effective}`n" "https://script.google.com/macros/s/AKfycbwH2fE6VR-btqpeCrHJvseg5QDhlqi7xmiC56hPaCKl/exec" | Select-Object -Last 5
```

Expected: `200` with body containing `Signed agreement upload` (not a sign-in URL).

- [ ] **Step 2: Open the Web App and upload a real template**

```powershell
Start-Process "https://script.google.com/macros/s/AKfycbwH2fE6VR-btqpeCrHJvseg5QDhlqi7xmiC56hPaCKl/exec"
```

In the page that opens, drag `.tmp\tammy-templates\exclusive-buyer-agreement.pdf` (from Task 1) into the dropzone. Click `Process agreement`. Wait 30-60 seconds.

- [ ] **Step 3: Confirm result panel**

Expected: result panel shows `RT-UPLOAD-<timestamp> - buyer side` (or `seller side` if the heuristic flipped) and three links: Drive folder, Trade record, Gmail draft.

- [ ] **Step 4: Open each link, verify content**

For Drive folder: should contain the uploaded PDF, plus an `RMS & Photos` subfolder.
For Trade record (Sheets): a `TradeRecord` sheet should have a new row for this transaction. Scroll right to confirm fields populated from Claude extraction.
For Gmail draft: an unsent draft should exist with subject and body templating the deal summary.

- [ ] **Step 5: Append result to `docs/VERIFICATION.md`**

Append a new section:

```markdown
## 2026-05-21 e2e live verification

Verified the realtor upload flow end-to-end with `Exclusive Buyer Representation Agreement (Designated Agency) (10).pdf` from Tammy's shared folder.

- Web App URL anonymous-accessible: yes
- Extraction succeeded: yes / no
- Drive folder created with new realtor taxonomy: yes / no
- Trade record row populated: yes / no
- Gmail draft created: yes / no
- Transaction ID: RT-UPLOAD-...
- Folder URL: ...
- Sheet URL: ...
- Draft URL: ...
```

Fill in actual values from the upload.

- [ ] **Step 6: Commit**

```powershell
git add docs/VERIFICATION.md
git commit -m "docs: record 2026-05-21 e2e live verification result"
git push origin main
```

---

## Task 15: Tammy handoff message draft

**Files:** none (draft only, do not send)

- [ ] **Step 1: Draft a short Gmail reply to the `Technical stack` thread**

Body (reply, in-thread):

```
Hi Tammy,

Both revisions are in on https://tammy-roundtable-demo.vercel.app/:

- Step 2 / Drive folder: loose docs at root plus one folder (RMS & Photos by default; Condo Docs if the agreement is condo). FINTRAC, Possession & Keys, and Lawyer Correspondence are gone.
- Step 4 / Trade record + checklist: rebuilt from the templates you shared. 6-item validation checklist at the bottom (signed agreement, purchase contract, deposit, condition waiver, MLS listing, trade record review). FINTRAC, lawyers, and possession dropped.

Step 1 now has a "Try the live upload" button that opens the live upload page. Drop one of the signed DocuSign agreements there and you get back a real Drive folder, a real trade record row + checklist, and a Gmail draft. I tested it end-to-end with the Exclusive Buyer Agreement from your shared folder.

If you want Vercel access to tweak copy yourself, send me the email you want me to invite and I'll add you as a collaborator.

Thanks,
Abdallah
```

- [ ] **Step 2: Save as Gmail draft (do NOT send)**

```powershell
gws gmail +reply --thread-id 19e3e8b32adefd7b --body @'
[paste body above]
'@ --dry-run
```

Then save as draft (without `--dry-run`, but use the draft helper, not send). If the gws CLI doesn't support draft-only mode, leave the draft creation for the user to do manually in Gmail and just print the body to the chat for them to copy.

- [ ] **Step 3: Print the body to the chat and stop**

Tell user: `Draft is ready. Review in Gmail Drafts. Do not send without final read.`

---

## Self-review against design doc

Spec coverage check:

1. Apply Revision-1 folder taxonomy -> Task 2 (visual), Task 7 (backend code).
2. Apply Revision-2 trade record + checklist -> Task 3 (visual), Task 8 (backend code).
3. Step 1 DocuSign upload framing -> already in place from prior commit (visual); Task 5 wires the live CTA.
4. Brokerage-vs-Realtor (checklist as Realtor anchor) -> Task 3 (visual badge already says "Realtor validation"; checklist contents trimmed).
5. Live Apps Script Web App with Anyone access -> Task 10 (push), Task 13 (manual deploy with Anyone access).
6. End-to-end test with real template -> Task 14.
7. Vercel collaborator invite for Tammy -> mentioned in Task 15 draft but not a separate task; she has to send the email she wants invited first.

No placeholders. All steps have concrete code or commands. Field names referenced (`folderTemplatePaths`, `folderConditionalSubfolders`, `requiredDocs`, `sampleDocStatusPresets`, `trdDetectPropertyType`) are consistent across tasks.
