import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const outputDir = path.join(projectRoot, 'assets', 'fallback', 'generated');

const sample = {
  transactionId: 'RT-COMP-1001',
  buyer1: 'Jordan Patel',
  seller1: 'Maple Retail Holdings Ltd.',
  dealAddress: '1128 4 Street SW, Calgary, AB',
  soldPrice: '$425,000',
  saleDate: '2026-05-19',
  possessionDate: '2026-06-15',
  mlsNumber: 'A2145678',
  contractNumber: 'MCC-TR-1001',
  listingRealtor: 'Tammy MacDonald',
  sellingRealtor: 'Ava Singh',
  sellerLawyer: 'Jordan & Co. Law | 403-555-0112',
  buyerLawyer: 'Summit Legal | 403-555-0189',
  clientEmail: 'jordan.patel@example.com',
  operatorNotes: 'Seeded fallback sample. Review draft only. Missing condition waiver left visible on purpose.',
  transactionName: 'Jordan Patel - 1128 4 Street SW, Calgary, AB',
  driveUrl: 'https://drive.google.com/drive/folders/DEMO_FOLDER_ID',
  formUrl: 'https://docs.google.com/forms/d/DEMO_FORM_ID/viewform',
  dashboardStatus: 'Package Generated',
  docsSummary: 'Expected 1 / Received 6 / Missing 1',
  requiredDocs: [
    ['Accepted Offer', 'Accepted OTP / Offer to Purchase', 'Received'],
    ['Deposit', 'Deposit Cheque / Proof of Deposit', 'Received'],
    ['Compliance', 'Area Forms / Consumer Agreement', 'Received'],
    ['Compliance', 'MLS Copy', 'Received'],
    ['Lawyers', 'Seller Lawyer Contact', 'Received'],
    ['Lawyers', 'Buyer Lawyer Contact', 'Received'],
    ['Conditions', 'Condition Waiver / Fulfillment', 'Missing'],
    ['Closing', 'Transaction Report / Trade Record Review', 'Expected'],
  ],
  folderTree: [
    'RT-COMP-1001 - Jordan Patel - 1128 4 Street SW, Calgary, AB',
    'Initial Prospect Folder',
    'Full Info Prospects Folder',
    'Full Info Prospects Folder/Financials',
    'Full Info Prospects Folder/Monthly Sales',
    'Full Info Prospects Folder/Franchise & Lease Agreements',
    'Full Info Prospects Folder/Payroll & Staff',
    'Full Info Prospects Folder/Incorporated Docs',
    'Full Info Prospects Folder/Store Photos',
    'Full Info Prospects Folder/Normalized Financials_',
  ],
  calendarItems: [
    ['RT-COMP-1001 - Condition Reminder', '2026-05-21', 'Demo reminder for Jordan Patel - 1128 4 Street SW, Calgary, AB'],
    ['RT-COMP-1001 - Possession Reminder', '2026-06-15', 'Demo possession reminder for Jordan Patel - 1128 4 Street SW, Calgary, AB'],
  ],
};

const pages = [
  {
    name: 'dashboard',
    title: 'Dashboard',
    width: 1500,
    height: 1100,
    body: renderDashboard(),
  },
  {
    name: 'required-docs',
    title: 'Required Docs',
    width: 1400,
    height: 1200,
    body: renderRequiredDocs(),
  },
  {
    name: 'trade-record',
    title: 'Trade Record',
    width: 1400,
    height: 1300,
    body: renderTradeRecord(),
  },
  {
    name: 'folder-tree',
    title: 'Drive Folder Tree',
    width: 1300,
    height: 1000,
    body: renderFolderTree(),
  },
  {
    name: 'draft-preview',
    title: 'Draft Preview',
    width: 1300,
    height: 1000,
    body: renderDraftPreview(),
  },
  {
    name: 'calendar',
    title: 'Calendar Reminders',
    width: 1300,
    height: 900,
    body: renderCalendar(),
  },
];

fs.rmSync(outputDir, { recursive: true, force: true });
fs.mkdirSync(outputDir, { recursive: true });

for (const page of pages) {
  const htmlPath = path.join(outputDir, `${page.name}.html`);
  const pngPath = path.join(outputDir, `${page.name}.png`);
  fs.writeFileSync(htmlPath, renderPage(page.title, page.body), 'utf8');
  captureScreenshot(htmlPath, pngPath, page.width, page.height);
}

const manifest = {
  generatedAt: new Date().toISOString(),
  note: 'Synthetic local presentation renders from the seeded sample transaction. Safe to show if live Google auth is unavailable, but not proof of a live Google-side run.',
  files: pages.map((page) => ({
    name: page.name,
    html: `${page.name}.html`,
    png: `${page.name}.png`,
  })),
};
fs.writeFileSync(path.join(outputDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
fs.writeFileSync(path.join(outputDir, 'README.md'), [
  '# Generated Fallback Assets',
  '',
  'These are synthetic local presentation assets rendered from the seeded fallback transaction.',
  'They are not proof that the live Google workbook, form, calendar, or Gmail draft surfaces were exercised from this machine.',
  '',
  'Files:',
  ...manifest.files.map((file) => `- \`${file.png}\` and \`${file.html}\``),
  '',
  'Use these when live Google execution or auth is flaky.',
].join('\n'), 'utf8');

function captureScreenshot(htmlPath, pngPath, width, height) {
  const edgePath = findEdgePath();
  execFileSync(edgePath, [
    '--headless=new',
    '--disable-gpu',
    `--window-size=${width},${height}`,
    '--hide-scrollbars',
    `--screenshot=${pngPath}`,
    `file:///${htmlPath.replace(/\\/g, '/')}`,
  ], { stdio: 'pipe' });
}

function findEdgePath() {
  const candidates = [
    process.env.EDGE_PATH,
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  throw new Error('Microsoft Edge executable not found. Set EDGE_PATH or install Edge.');
}

function renderPage(title, body) {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; background: #edf2f7; color: #1f2937; }
    .frame { padding: 28px; }
    .card { background: #ffffff; border-radius: 18px; box-shadow: 0 12px 32px rgba(15, 23, 42, 0.08); padding: 24px; }
    h1 { margin: 0 0 8px; font-size: 28px; }
    h2 { margin: 0 0 12px; font-size: 20px; }
    p.sub { margin: 0 0 20px; color: #5b6573; font-size: 14px; }
    .pill { display: inline-block; background: #dde7f5; color: #234; border-radius: 999px; padding: 6px 12px; font-size: 12px; margin-right: 8px; }
    table { width: 100%; border-collapse: collapse; font-size: 14px; }
    th, td { border-bottom: 1px solid #e5e7eb; padding: 10px 12px; vertical-align: top; text-align: left; }
    th { background: #eef3f8; font-weight: 700; }
    .status-ready { color: #166534; font-weight: 700; }
    .status-missing { color: #b91c1c; font-weight: 700; }
    .status-expected { color: #92400e; font-weight: 700; }
    .grid { display: grid; gap: 18px; }
    .grid-2 { grid-template-columns: 1.2fr 1fr; }
    .note { background: #fff7ed; border: 1px solid #fdba74; border-radius: 12px; padding: 12px 14px; color: #9a3412; font-size: 13px; }
    .tree ul { list-style: none; padding-left: 18px; margin: 0; }
    .tree li { margin: 6px 0; }
    .mail { background: #f8fafc; border: 1px solid #d8e1ec; border-radius: 14px; padding: 18px; white-space: pre-wrap; line-height: 1.5; }
    .meta { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 16px; }
    .meta .box { background: #f8fafc; border: 1px solid #d8e1ec; border-radius: 12px; padding: 12px 14px; min-width: 220px; }
    .small { font-size: 12px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="frame">
    <div class="card">
      ${body}
    </div>
  </div>
</body>
</html>`;
}

function renderDashboard() {
  return `
    <h1>Tammy Roundtable Demo Dashboard</h1>
    <p class="sub">Safe demo surface. Sample data only. Gmail draft only. No auto-send.</p>
    <div class="meta">
      <div class="box"><strong>Workbook</strong><div class="status-ready">Ready</div><div class="small">Bound spreadsheet</div></div>
      <div class="box"><strong>Demo Form</strong><div class="status-ready">Ready</div><div class="small">Google Form intake</div></div>
      <div class="box"><strong>Demo Folder</strong><div class="status-ready">Ready</div><div class="small">Dedicated Drive container</div></div>
      <div class="box"><strong>Demo Calendar</strong><div class="status-ready">Ready</div><div class="small">Dedicated calendar</div></div>
    </div>
    <table>
      <thead>
        <tr>
          <th>Transaction ID</th><th>Transaction Name</th><th>Current Step</th><th>Required Docs Status</th>
          <th>Drive Folder</th><th>Calendar Status</th><th>Email Draft Status</th><th>Trade Record Status</th><th>Last Action Result</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${sample.transactionId}</td>
          <td>${escapeHtml(sample.transactionName)}</td>
          <td class="status-ready">${sample.dashboardStatus}</td>
          <td>${sample.docsSummary}</td>
          <td>Open package folder</td>
          <td class="status-ready">Calendar Ready</td>
          <td class="status-ready">Draft Created</td>
          <td class="status-ready">Trade Record Row 22</td>
          <td class="status-ready">Generated successfully</td>
        </tr>
      </tbody>
    </table>
    <div class="note" style="margin-top:18px;">This synthetic local presentation render mirrors the seeded completed sample. It is safe to use if live Google auth is flaky on demo day, but it is not proof of a live Google-side run from this machine.</div>
  `;
}

function renderRequiredDocs() {
  return `
    <h1>RequiredDocs</h1>
    <p class="sub">Visible missing-doc tracking for the fallback transaction.</p>
    <table>
      <thead><tr><th>Category</th><th>Document</th><th>Status</th><th>Notes</th></tr></thead>
      <tbody>
        ${sample.requiredDocs.map(([category, name, status]) => `
          <tr>
            <td>${escapeHtml(category)}</td>
            <td>${escapeHtml(name)}</td>
            <td class="${statusClass(status)}">${escapeHtml(status)}</td>
            <td>${status === 'Missing' ? 'Left visible on purpose for demo review.' : ''}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function renderTradeRecord() {
  return `
    <h1>Trade Record Output</h1>
    <p class="sub">Simplified export-ready preview plus normalized output row.</p>
    <div class="grid grid-2">
      <table>
        <tbody>
          ${[
            ['Transaction ID', sample.transactionId],
            ['Buyer 1', sample.buyer1],
            ['Seller 1', sample.seller1],
            ['Deal Address', sample.dealAddress],
            ['Sold Price', sample.soldPrice],
            ['Sale Date', sample.saleDate],
            ['Possession Date', sample.possessionDate],
            ['MLS Number', sample.mlsNumber],
            ['Contract Number', sample.contractNumber],
            ['Listing Realtor', sample.listingRealtor],
            ['Selling Realtor', sample.sellingRealtor],
            ['Deposit Holder', 'Deposits held by MaxWell Canyon Creek trust'],
          ].map(([label, value]) => `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`).join('')}
        </tbody>
      </table>
      <div class="note">
        Demo-only trade record generated from sample intake data and fixed defaults.
        <br /><br />
        Listing commission wording and selling commission wording are intentionally fixed for the May 21 artifact.
      </div>
    </div>
  `;
}

function renderFolderTree() {
  const root = sample.folderTree[0];
  const children = sample.folderTree.slice(1);
  return `
    <h1>Drive Folder Tree</h1>
    <p class="sub">Trimmed client-folder structure aligned to Tammy's existing operating model.</p>
    <div class="tree">
      <ul>
        <li><strong>${escapeHtml(root)}</strong>
          <ul>
            ${children.map((child) => `<li>${escapeHtml(child)}</li>`).join('')}
          </ul>
        </li>
      </ul>
    </div>
  `;
}

function renderDraftPreview() {
  return `
    <h1>Gmail Draft Preview</h1>
    <p class="sub">Draft only. No auto-send.</p>
    <div class="pill">To: ${escapeHtml(sample.clientEmail)}</div>
    <div class="pill">Subject: [Review Draft] Next steps for ${escapeHtml(sample.dealAddress)}</div>
    <div class="mail" style="margin-top:16px;">Hi ${escapeHtml(sample.buyer1)},

This is a review draft for the next-step transaction email.

Property: ${escapeHtml(sample.dealAddress)}
Transaction ID: ${sample.transactionId}
Sold Price: ${sample.soldPrice}
Possession Date: ${sample.possessionDate}

Next steps we are tracking in this demo package:
- accepted offer package review
- deposit and required-doc follow-up
- condition-date reminder tracking
- lawyer/contact confirmation

This draft stays in review and does not auto-send.

Regards,
MaxWell Canyon Creek</div>
  `;
}

function renderCalendar() {
  return `
    <h1>Calendar Reminders</h1>
    <p class="sub">Two reminders created from the operator action.</p>
    <table>
      <thead><tr><th>Event</th><th>Date</th><th>Description</th></tr></thead>
      <tbody>
        ${sample.calendarItems.map(([title, date, description]) => `
          <tr>
            <td>${escapeHtml(title)}</td>
            <td>${escapeHtml(date)}</td>
            <td>${escapeHtml(description)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function statusClass(status) {
  if (status === 'Received') return 'status-ready';
  if (status === 'Missing') return 'status-missing';
  return 'status-expected';
}
