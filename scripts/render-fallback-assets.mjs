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
    title: 'Realtor Workflow CRM - Google Sheets',
    width: 1600,
    height: 920,
    render: renderDashboard,
  },
  {
    name: 'intake-form',
    title: 'New Transaction Intake - Google Forms',
    width: 1300,
    height: 1000,
    render: renderIntakeForm,
  },
  {
    name: 'required-docs',
    title: 'Realtor Workflow CRM - Google Sheets',
    width: 1600,
    height: 920,
    render: renderRequiredDocs,
  },
  {
    name: 'trade-record',
    title: 'Realtor Workflow CRM - Google Sheets',
    width: 1600,
    height: 920,
    render: renderTradeRecord,
  },
  {
    name: 'folder-tree',
    title: 'My Drive - Google Drive',
    width: 1500,
    height: 920,
    render: renderFolderTree,
  },
  {
    name: 'draft-preview',
    title: 'Inbox - Gmail',
    width: 1500,
    height: 920,
    render: renderDraftPreview,
  },
  {
    name: 'calendar',
    title: 'May 2026 - Google Calendar',
    width: 1600,
    height: 960,
    render: renderCalendar,
  },
];

fs.rmSync(outputDir, { recursive: true, force: true });
fs.mkdirSync(outputDir, { recursive: true });

for (const page of pages) {
  const htmlPath = path.join(outputDir, `${page.name}.html`);
  const pngPath = path.join(outputDir, `${page.name}.png`);
  fs.writeFileSync(htmlPath, renderPage(page.title, page.render()), 'utf8');
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

// ---- Shared shell ----------------------------------------------------------

function renderPage(title, body) {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    * { box-sizing: border-box; }
    html, body {
      margin: 0; padding: 0;
      font-family: "Google Sans", "Roboto", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
      color: #202124;
      background: #ffffff;
      -webkit-font-smoothing: antialiased;
    }
    .app { min-height: 100vh; }
  </style>
</head>
<body>
  ${body}
</body>
</html>`;
}

// ---- Inline SVG icons -------------------------------------------------------

function iconFolderDrive() {
  return `
<svg viewBox="0 0 48 40" width="64" height="54" xmlns="http://www.w3.org/2000/svg">
  <path d="M2 6 a4 4 0 0 1 4 -4 h12 l5 6 h21 a4 4 0 0 1 4 4 v24 a4 4 0 0 1 -4 4 H6 a4 4 0 0 1 -4 -4 Z" fill="#5f6368" opacity="0.08"/>
  <path d="M2 8 a4 4 0 0 1 4 -4 h12 l5 6 h21 a4 4 0 0 1 4 4 v22 a4 4 0 0 1 -4 4 H6 a4 4 0 0 1 -4 -4 Z" fill="#5b8ff9"/>
  <path d="M2 14 h44 v20 a4 4 0 0 1 -4 4 H6 a4 4 0 0 1 -4 -4 Z" fill="#4285f4"/>
  <path d="M2 14 h44 v3 H2 Z" fill="#1a73e8" opacity="0.5"/>
</svg>`;
}

function iconDoc() {
  return `
<svg viewBox="0 0 48 60" width="48" height="60" xmlns="http://www.w3.org/2000/svg">
  <path d="M6 0 h26 l12 12 v44 a4 4 0 0 1 -4 4 H6 a4 4 0 0 1 -4 -4 V4 a4 4 0 0 1 4 -4 Z" fill="#4285f4"/>
  <path d="M32 0 v12 h12 Z" fill="#a1c2fa"/>
  <g fill="#fff" opacity="0.9">
    <rect x="10" y="22" width="28" height="2.5" rx="1"/>
    <rect x="10" y="29" width="28" height="2.5" rx="1"/>
    <rect x="10" y="36" width="20" height="2.5" rx="1"/>
    <rect x="10" y="43" width="24" height="2.5" rx="1"/>
  </g>
</svg>`;
}

// ---- 1. Google Forms intake ------------------------------------------------

function renderIntakeForm() {
  return `
  <style>
    body { background: #f0ebf8; }
    .gf-shell { max-width: 770px; margin: 0 auto; padding: 28px 16px 60px; }
    .gf-header {
      background: #673ab7;
      border-radius: 8px 8px 0 0;
      padding: 14px 24px;
      display: flex; align-items: center; justify-content: space-between;
      color: #fff;
    }
    .gf-header .left { display: flex; align-items: center; gap: 12px; font-size: 13px; opacity: 0.95; }
    .gf-header .form-icon {
      width: 22px; height: 28px; background: #fff; border-radius: 2px; position: relative;
    }
    .gf-header .form-icon::before {
      content: ""; position: absolute; top: 6px; left: 4px; right: 4px; height: 2px; background: #673ab7;
      box-shadow: 0 4px 0 #673ab7, 0 8px 0 #673ab7, 0 12px 0 #673ab7;
    }
    .gf-header .pill {
      background: rgba(255,255,255,0.18); padding: 5px 12px; border-radius: 999px; font-size: 12px; letter-spacing: 0.2px;
    }
    .gf-title-card {
      background: #fff;
      border-left: 10px solid #673ab7;
      border-radius: 0 0 8px 8px;
      padding: 26px 28px 22px;
      margin-bottom: 12px;
      box-shadow: 0 1px 3px rgba(60,64,67,.12);
    }
    .gf-title { font-size: 32px; font-weight: 400; color: #202124; margin: 0 0 12px; letter-spacing: -0.2px; }
    .gf-desc { font-size: 14px; color: #5f6368; margin: 0; line-height: 1.5; }
    .gf-q {
      background: #fff; border-radius: 8px; padding: 22px 28px 20px;
      margin-bottom: 12px; box-shadow: 0 1px 3px rgba(60,64,67,.12);
    }
    .gf-label { font-size: 15px; color: #202124; margin-bottom: 14px; font-weight: 400; line-height: 1.4; }
    .gf-required { color: #d93025; margin-left: 4px; }
    .gf-input {
      font-size: 14px; color: #202124;
      border: 0; border-bottom: 1px solid #dadce0;
      padding: 4px 0 6px; min-height: 22px;
    }
    .gf-input.placeholder { color: #9aa0a6; }
    .gf-row { display: flex; gap: 28px; }
    .gf-row .gf-q { flex: 1; }
    .gf-upload-q { background: #fff; border-radius: 8px; padding: 22px 28px; margin-bottom: 12px; box-shadow: 0 1px 3px rgba(60,64,67,.12); }
    .gf-upload-card {
      border: 1px solid #dadce0; border-radius: 8px; padding: 14px 16px;
      display: flex; align-items: center; gap: 12px; max-width: 460px;
    }
    .gf-upload-card .clip {
      width: 28px; height: 28px; border-radius: 4px; background: #e8f0fe; display: grid; place-items: center;
    }
    .gf-upload-card .clip svg { width: 16px; height: 16px; }
    .gf-upload-text { display: flex; flex-direction: column; line-height: 1.3; }
    .gf-upload-text .fname { color: #1a73e8; font-size: 14px; }
    .gf-upload-text .meta { color: #5f6368; font-size: 12px; }
    .gf-footer {
      background: #fff; border-radius: 8px; padding: 14px 18px;
      display: flex; align-items: center; justify-content: space-between;
      box-shadow: 0 1px 3px rgba(60,64,67,.12);
    }
    .gf-submit {
      background: #673ab7; color: #fff; border-radius: 4px; padding: 9px 24px;
      font-size: 14px; font-weight: 500; letter-spacing: 0.25px;
      box-shadow: 0 1px 2px rgba(60,64,67,.3);
    }
    .gf-clear { color: #673ab7; font-size: 14px; font-weight: 500; padding: 9px 12px; }
    .gf-never { font-size: 11px; color: #5f6368; padding: 12px 4px 0; }
  </style>
  <div class="gf-shell">
    <div class="gf-header">
      <div class="left">
        <div class="form-icon"></div>
        <div>New Transaction Intake</div>
      </div>
      <div class="pill">Form preview</div>
    </div>
    <div class="gf-title-card">
      <h1 class="gf-title">New Transaction Intake</h1>
      <p class="gf-desc">Submit when a deal closes. Output lands in the Realtor Workflow CRM workbook.<br/>* Indicates required question</p>
    </div>

    <div class="gf-q">
      <div class="gf-label">Transaction reference<span class="gf-required">*</span></div>
      <div class="gf-input">${escapeHtml(sample.transactionId)}</div>
    </div>

    <div class="gf-row">
      <div class="gf-q">
        <div class="gf-label">Buyer name<span class="gf-required">*</span></div>
        <div class="gf-input">${escapeHtml(sample.buyer1)}</div>
      </div>
      <div class="gf-q">
        <div class="gf-label">Seller name<span class="gf-required">*</span></div>
        <div class="gf-input">${escapeHtml(sample.seller1)}</div>
      </div>
    </div>

    <div class="gf-q">
      <div class="gf-label">Property address<span class="gf-required">*</span></div>
      <div class="gf-input">${escapeHtml(sample.dealAddress)}</div>
    </div>

    <div class="gf-row">
      <div class="gf-q">
        <div class="gf-label">Sold price<span class="gf-required">*</span></div>
        <div class="gf-input">${escapeHtml(sample.soldPrice)}</div>
      </div>
      <div class="gf-q">
        <div class="gf-label">Possession date<span class="gf-required">*</span></div>
        <div class="gf-input">${escapeHtml(sample.possessionDate)}</div>
      </div>
      <div class="gf-q">
        <div class="gf-label">MLS number</div>
        <div class="gf-input">${escapeHtml(sample.mlsNumber)}</div>
      </div>
    </div>

    <div class="gf-upload-q">
      <div class="gf-label">Source document (accepted offer PDF)</div>
      <div class="gf-upload-card">
        <div class="clip">
          <svg viewBox="0 0 24 24" fill="#1a73e8" xmlns="http://www.w3.org/2000/svg"><path d="M16.5 6v11.5a4.5 4.5 0 0 1-9 0V5a3 3 0 1 1 6 0v10.5a1.5 1.5 0 0 1-3 0V6H10v9.5a3 3 0 0 0 6 0V5a4.5 4.5 0 0 0-9 0v12.5a6 6 0 0 0 12 0V6h-2.5z"/></svg>
        </div>
        <div class="gf-upload-text">
          <div class="fname">accepted-offer-RT-COMP-1001.pdf</div>
          <div class="meta">412 KB</div>
        </div>
      </div>
    </div>

    <div class="gf-footer">
      <div class="gf-submit">Submit</div>
      <div class="gf-clear">Clear form</div>
    </div>
    <div class="gf-never">Never submit passwords through Google Forms.</div>
  </div>
  `;
}

// ---- 2. Google Drive folder tree -------------------------------------------

function renderFolderTree() {
  const children = sample.folderTree.slice(1);
  const folders = children.filter((c) => c.includes('Folder') && !c.includes('/')).concat(['Initial Prospect Folder']).filter((v, i, a) => a.indexOf(v) === i);
  // Build a flat list of "items in this directory" mimic
  const dirItems = [
    { name: 'Initial Prospect Folder', kind: 'folder', owner: 'me', modified: 'May 18, 2026' },
    { name: 'Full Info Prospects Folder', kind: 'folder', owner: 'me', modified: 'May 19, 2026' },
    { name: 'Financials', kind: 'folder', owner: 'me', modified: 'May 19, 2026' },
    { name: 'Monthly Sales', kind: 'folder', owner: 'me', modified: 'May 19, 2026' },
    { name: 'Franchise & Lease Agreements', kind: 'folder', owner: 'me', modified: 'May 18, 2026' },
    { name: 'Payroll & Staff', kind: 'folder', owner: 'me', modified: 'May 18, 2026' },
    { name: 'Incorporated Docs', kind: 'folder', owner: 'me', modified: 'May 17, 2026' },
    { name: 'Store Photos', kind: 'folder', owner: 'me', modified: 'May 17, 2026' },
    { name: 'Normalized Financials_', kind: 'folder', owner: 'me', modified: 'May 19, 2026' },
    { name: 'accepted-offer-RT-COMP-1001.pdf', kind: 'doc', owner: 'me', modified: 'May 19, 2026' },
    { name: 'trade-record-summary.gsheet', kind: 'doc', owner: 'me', modified: 'May 19, 2026' },
  ];

  const tileHtml = dirItems.map((it) => `
    <div class="gd-tile">
      <div class="gd-tile-icon">${it.kind === 'folder' ? iconFolderDrive() : iconDoc()}</div>
      <div class="gd-tile-name">${escapeHtml(it.name)}</div>
    </div>
  `).join('');

  return `
  <style>
    body { background: #fff; font-size: 14px; color: #202124; }
    .gd { display: grid; grid-template-rows: 64px 1fr; height: 100vh; }
    .gd-top {
      display: grid; grid-template-columns: 256px 1fr 220px;
      align-items: center; padding: 0 16px;
      border-bottom: 1px solid #e8eaed; background: #fff;
    }
    .gd-brand { display: flex; align-items: center; gap: 12px; padding-left: 8px; }
    .gd-burger { width: 18px; height: 14px; position: relative; }
    .gd-burger::before, .gd-burger::after, .gd-burger span {
      content: ""; position: absolute; left: 0; right: 0; height: 2px; background: #5f6368; border-radius: 2px;
    }
    .gd-burger::before { top: 0; }
    .gd-burger span { top: 6px; display: block; }
    .gd-burger::after { bottom: 0; }
    .gd-brand-text { font-size: 22px; color: #5f6368; letter-spacing: 0.2px; }
    .gd-search {
      background: #f1f3f4; border-radius: 8px; height: 46px;
      display: flex; align-items: center; padding: 0 16px; max-width: 720px;
      color: #5f6368; font-size: 16px;
    }
    .gd-search svg { width: 22px; height: 22px; margin-right: 14px; }
    .gd-account { justify-self: end; display: flex; align-items: center; gap: 8px; }
    .gd-avatar { width: 32px; height: 32px; border-radius: 50%; background: #1a73e8; color: #fff; display: grid; place-items: center; font-size: 14px; font-weight: 500; }

    .gd-body { display: grid; grid-template-columns: 256px 1fr; height: 100%; min-height: 0; }
    .gd-side { background: #f0f4f9; padding: 8px 0; }
    .gd-new {
      margin: 8px 16px 12px;
      background: #c2e7ff; color: #001d35;
      padding: 14px 24px 14px 18px; border-radius: 16px;
      font-size: 14px; font-weight: 500; display: inline-flex; align-items: center; gap: 12px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.1);
    }
    .gd-new .plus {
      width: 22px; height: 22px; border-radius: 50%; background: #fff; color: #1f1f1f;
      display: grid; place-items: center; font-size: 16px; font-weight: 500;
    }
    .gd-nav { padding: 0 8px; }
    .gd-nav-item {
      display: flex; align-items: center; gap: 14px;
      padding: 7px 12px; margin: 1px 0;
      border-radius: 0 999px 999px 0;
      font-size: 14px; color: #1f1f1f;
    }
    .gd-nav-item.active { background: #c2e7ff; font-weight: 500; }
    .gd-nav-item .ico { width: 20px; height: 20px; display: grid; place-items: center; color: #444746; }
    .gd-nav-item .ico svg { width: 20px; height: 20px; }
    .gd-storage { padding: 16px; color: #5f6368; font-size: 12px; }
    .gd-storage .bar { background: #e8eaed; border-radius: 999px; height: 4px; margin-top: 6px; }
    .gd-storage .fill { background: #1a73e8; width: 18%; height: 100%; border-radius: 999px; }

    .gd-main { background: #fff; overflow: hidden; }
    .gd-crumbs { padding: 18px 24px 6px; font-size: 22px; color: #1f1f1f; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
    .gd-crumbs .sep { color: #5f6368; font-size: 18px; }
    .gd-crumbs .chev { color: #5f6368; }
    .gd-crumbs .last { font-weight: 500; }
    .gd-toolbar {
      display: flex; gap: 8px; padding: 6px 24px 14px;
    }
    .gd-chip { background: #f1f3f4; border-radius: 999px; padding: 6px 14px; font-size: 13px; color: #444746; display: inline-flex; align-items: center; gap: 6px; }
    .gd-section { padding: 6px 24px 0; font-size: 14px; color: #1f1f1f; font-weight: 500; }
    .gd-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 8px; padding: 8px 16px 24px;
    }
    .gd-tile {
      background: #f8f9fa; border-radius: 8px; padding: 12px 14px;
      display: flex; align-items: center; gap: 10px;
      font-size: 14px; color: #1f1f1f; min-height: 48px;
    }
    .gd-tile-icon { display: grid; place-items: center; width: 36px; }
    .gd-tile-icon svg { width: 28px; height: 24px; }
    .gd-tile-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  </style>
  <div class="gd">
    <div class="gd-top">
      <div class="gd-brand">
        <div class="gd-burger"><span></span></div>
        <div class="gd-brand-text">Drive</div>
      </div>
      <div class="gd-search">
        <svg viewBox="0 0 24 24" fill="#5f6368" xmlns="http://www.w3.org/2000/svg"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
        Search in Drive
      </div>
      <div class="gd-account">
        <div class="gd-avatar">T</div>
      </div>
    </div>
    <div class="gd-body">
      <aside class="gd-side">
        <div class="gd-new">
          <span class="plus">+</span>
          <span>New</span>
        </div>
        <div class="gd-nav">
          <div class="gd-nav-item active">
            <span class="ico"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg></span>
            My Drive
          </div>
          <div class="gd-nav-item">
            <span class="ico"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 8h-3V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v9c0 1.1.9 2 2 2h3v3c0 1.1.9 2 2 2h9c1.1 0 2-.9 2-2v-9c0-1.1-.9-2-2-2zM5 14V5h9v3h-4c-1.1 0-2 .9-2 2v4H5zm14 5h-9v-9h9v9z"/></svg></span>
            Shared with me
          </div>
          <div class="gd-nav-item">
            <span class="ico"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg></span>
            Starred
          </div>
          <div class="gd-nav-item">
            <span class="ico"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg></span>
            Recent
          </div>
          <div class="gd-nav-item">
            <span class="ico"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg></span>
            Trash
          </div>
        </div>
        <div class="gd-storage">
          Storage<br/>
          <div class="bar"><div class="fill"></div></div>
          2.7 GB of 15 GB used
        </div>
      </aside>
      <main class="gd-main">
        <div class="gd-crumbs">
          <span>My Drive</span>
          <span class="chev">&rsaquo;</span>
          <span>Maxwell Canyon Creek</span>
          <span class="chev">&rsaquo;</span>
          <span>Transactions</span>
          <span class="chev">&rsaquo;</span>
          <span class="last">${escapeHtml(sample.folderTree[0])}</span>
        </div>
        <div class="gd-toolbar">
          <div class="gd-chip">Type &nbsp;&#x25BE;</div>
          <div class="gd-chip">People &nbsp;&#x25BE;</div>
          <div class="gd-chip">Modified &nbsp;&#x25BE;</div>
        </div>
        <div class="gd-section">Folders</div>
        <div class="gd-grid">${tileHtml}</div>
      </main>
    </div>
  </div>
  `;
}

// ---- 3. Google Calendar -----------------------------------------------------

function renderCalendar() {
  // Week containing May 21, 2026 (Thu). Sun May 17 -> Sat May 23.
  const days = [
    { wd: 'SUN', d: 17, today: false },
    { wd: 'MON', d: 18, today: false },
    { wd: 'TUE', d: 19, today: false },
    { wd: 'WED', d: 20, today: false },
    { wd: 'THU', d: 21, today: true },
    { wd: 'FRI', d: 22, today: false },
    { wd: 'SAT', d: 23, today: false },
  ];
  const hours = [];
  for (let h = 7; h <= 18; h += 1) {
    const label = h === 12 ? '12 PM' : h > 12 ? `${h - 12} PM` : `${h} AM`;
    hours.push(label);
  }

  const dayColsHtml = days.map((d, idx) => {
    let event = '';
    if (d.d === 21) {
      // Condition reminder at 10am - 11am, hour rows start at 7am so row index 3
      event = `<div class="gc-event" style="top: ${(10 - 7) * 56 + 4}px; height: ${56 - 8}px;">
        <div class="gc-event-title">10 - 11 AM</div>
        <div class="gc-event-sub">RT-COMP-1001 - Condition Reminder</div>
      </div>`;
    }
    return `<div class="gc-day-col">${event}<div class="gc-grid-lines">${hours.map(() => '<div class="gc-row"></div>').join('')}</div></div>`;
  }).join('');

  // Add possession reminder column note: June 15 isn't in this week, so instead show a second event later in the week or note. Keep one event clean; add a "later" placeholder for week of June 15 via a second mini calendar.
  return `
  <style>
    body { background: #fff; color: #202124; font-size: 13px; }
    .gc { display: grid; grid-template-rows: 64px 1fr; height: 100vh; min-height: 0; }
    .gc-top {
      display: grid; grid-template-columns: 280px 1fr 220px;
      align-items: center; padding: 0 16px;
      border-bottom: 1px solid #dadce0;
    }
    .gc-brand { display: flex; align-items: center; gap: 16px; }
    .gc-burger { width: 18px; height: 2px; background: #5f6368; box-shadow: 0 6px 0 #5f6368, 0 -6px 0 #5f6368; }
    .gc-cal-logo {
      width: 38px; height: 38px; border: 2px solid #1a73e8; border-radius: 6px;
      display: grid; place-items: center; color: #1a73e8; font-weight: 500; font-size: 14px;
      background: #fff;
    }
    .gc-brand-text { font-size: 22px; color: #5f6368; }
    .gc-controls { display: flex; align-items: center; gap: 14px; }
    .gc-btn { font-size: 14px; color: #444746; padding: 6px 14px; border: 1px solid #dadce0; border-radius: 4px; background: #fff; }
    .gc-arrow { width: 32px; height: 32px; border-radius: 50%; display: grid; place-items: center; color: #5f6368; }
    .gc-month { font-size: 22px; color: #202124; font-weight: 400; margin-left: 6px; }
    .gc-right { justify-self: end; display: flex; align-items: center; gap: 12px; }
    .gc-view-chip { background: #fff; border: 1px solid #dadce0; padding: 6px 14px; border-radius: 4px; font-size: 14px; color: #444746; }
    .gc-avatar { width: 32px; height: 32px; border-radius: 50%; background: #34a853; color: #fff; display: grid; place-items: center; font-size: 14px; font-weight: 500; }

    .gc-body { display: grid; grid-template-columns: 256px 1fr; min-height: 0; height: 100%; }
    .gc-side { padding: 16px; border-right: 1px solid #f1f3f4; }
    .gc-create {
      background: #c2e7ff; color: #001d35;
      padding: 12px 20px; border-radius: 16px; font-size: 14px; font-weight: 500;
      display: inline-flex; align-items: center; gap: 10px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.1); margin-bottom: 18px;
    }
    .gc-mini { font-size: 12px; }
    .gc-mini-h { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; padding: 0 4px; font-weight: 500; color: #444746; }
    .gc-mini-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; text-align: center; }
    .gc-mini-grid .h { color: #70757a; font-size: 10px; padding: 4px 0; }
    .gc-mini-grid .d { padding: 5px 0; border-radius: 50%; color: #3c4043; }
    .gc-mini-grid .d.dim { color: #c4c7c5; }
    .gc-mini-grid .d.today { background: #1a73e8; color: #fff; }
    .gc-mini-grid .d.range { background: #e8f0fe; color: #1967d2; }
    .gc-my-cals { margin-top: 20px; font-size: 13px; color: #3c4043; }
    .gc-cal-row { display: flex; align-items: center; gap: 10px; padding: 4px 4px; }
    .gc-cal-row .sw { width: 14px; height: 14px; border-radius: 3px; }

    .gc-main { display: grid; grid-template-rows: auto 1fr; min-height: 0; }
    .gc-day-header {
      display: grid; grid-template-columns: 60px repeat(7, 1fr);
      border-bottom: 1px solid #dadce0; align-items: end;
    }
    .gc-day-header .hcell { text-align: center; padding: 6px 0 8px; color: #70757a; font-size: 11px; font-weight: 500; letter-spacing: 0.5px; }
    .gc-day-header .hcell .num { display: block; font-size: 26px; font-weight: 400; color: #3c4043; margin-top: 2px; }
    .gc-day-header .hcell.today .num { color: #fff; background: #1a73e8; width: 46px; height: 46px; border-radius: 50%; line-height: 46px; margin: 2px auto 4px; }
    .gc-day-header .hcell.today { color: #1a73e8; }
    .gc-day-header .spacer { }

    .gc-week {
      display: grid; grid-template-columns: 60px repeat(7, 1fr);
      overflow: hidden; min-height: 0;
    }
    .gc-times { position: relative; }
    .gc-time-label { height: 56px; padding-right: 8px; text-align: right; color: #70757a; font-size: 10px; border-right: 1px solid #dadce0; padding-top: 0; transform: translateY(-7px); }
    .gc-day-col {
      position: relative; border-right: 1px solid #f1f3f4;
    }
    .gc-grid-lines .gc-row { height: 56px; border-bottom: 1px solid #f1f3f4; }
    .gc-event {
      position: absolute; left: 4px; right: 4px;
      background: #1a73e8; color: #fff; border-radius: 4px;
      padding: 4px 6px; font-size: 11px; line-height: 1.25;
      box-shadow: 0 1px 2px rgba(0,0,0,0.15);
    }
    .gc-event-title { font-weight: 500; }
    .gc-event-sub { font-weight: 400; opacity: 0.95; }
  </style>
  <div class="gc">
    <div class="gc-top">
      <div class="gc-brand">
        <div class="gc-burger"></div>
        <div class="gc-cal-logo">21</div>
        <div class="gc-brand-text">Calendar</div>
      </div>
      <div class="gc-controls">
        <div class="gc-btn">Today</div>
        <div class="gc-arrow">&lsaquo;</div>
        <div class="gc-arrow">&rsaquo;</div>
        <div class="gc-month">May 2026</div>
      </div>
      <div class="gc-right">
        <div class="gc-view-chip">Week &nbsp;&#x25BE;</div>
        <div class="gc-avatar">T</div>
      </div>
    </div>
    <div class="gc-body">
      <aside class="gc-side">
        <div class="gc-create">
          <span style="font-size:18px;">+</span> Create
        </div>
        <div class="gc-mini">
          <div class="gc-mini-h"><span>May 2026</span><span>&lsaquo; &rsaquo;</span></div>
          <div class="gc-mini-grid">
            <div class="h">S</div><div class="h">M</div><div class="h">T</div><div class="h">W</div><div class="h">T</div><div class="h">F</div><div class="h">S</div>
            <div class="d dim">26</div><div class="d dim">27</div><div class="d dim">28</div><div class="d dim">29</div><div class="d dim">30</div><div class="d">1</div><div class="d">2</div>
            <div class="d">3</div><div class="d">4</div><div class="d">5</div><div class="d">6</div><div class="d">7</div><div class="d">8</div><div class="d">9</div>
            <div class="d">10</div><div class="d">11</div><div class="d">12</div><div class="d">13</div><div class="d">14</div><div class="d">15</div><div class="d">16</div>
            <div class="d range">17</div><div class="d range">18</div><div class="d range">19</div><div class="d range">20</div><div class="d today">21</div><div class="d range">22</div><div class="d range">23</div>
            <div class="d">24</div><div class="d">25</div><div class="d">26</div><div class="d">27</div><div class="d">28</div><div class="d">29</div><div class="d">30</div>
            <div class="d">31</div><div class="d dim">1</div><div class="d dim">2</div><div class="d dim">3</div><div class="d dim">4</div><div class="d dim">5</div><div class="d dim">6</div>
          </div>
        </div>
        <div class="gc-my-cals">
          <div style="margin: 16px 4px 8px; color: #70757a; font-size: 11px; letter-spacing: 0.5px;">MY CALENDARS</div>
          <div class="gc-cal-row"><span class="sw" style="background:#1a73e8;"></span> Tammy MacDonald</div>
          <div class="gc-cal-row"><span class="sw" style="background:#33b679;"></span> MCC Transactions</div>
          <div class="gc-cal-row"><span class="sw" style="background:#f6bf26;"></span> Reminders</div>
        </div>
      </aside>
      <main class="gc-main">
        <div class="gc-day-header">
          <div class="spacer"></div>
          ${days.map((d) => `<div class="hcell ${d.today ? 'today' : ''}">${d.wd}<span class="num">${d.d}</span></div>`).join('')}
        </div>
        <div class="gc-week">
          <div class="gc-times">${hours.map((h) => `<div class="gc-time-label">${h}</div>`).join('')}</div>
          ${dayColsHtml}
        </div>
      </main>
    </div>
  </div>
  `;
}

// ---- Google Sheets chrome (shared) -----------------------------------------

function renderSheetsChrome({ activeTab, contentHtml }) {
  const tabs = ['Trade Records', 'RequiredDocs', 'Folders', 'Calendar', 'Logs'];
  return `
  <style>
    body { background: #f8f9fa; color: #202124; font-size: 13px; }
    .gs { display: grid; grid-template-rows: 48px 28px 40px 28px 1fr 32px; height: 100vh; min-height: 0; }
    .gs-top {
      display: flex; align-items: center; gap: 8px; padding: 4px 12px;
      border-bottom: 1px solid #e0e0e0;
    }
    .gs-icon-sheets {
      width: 32px; height: 32px; background: #0f9d58; border-radius: 4px;
      display: grid; place-items: center; color: #fff; font-weight: 700; font-size: 14px; letter-spacing: 0.5px;
    }
    .gs-title-wrap { display: flex; flex-direction: column; line-height: 1.1; flex: 1; }
    .gs-title { font-size: 18px; color: #202124; font-weight: 400; }
    .gs-meta { font-size: 11px; color: #5f6368; margin-top: 2px; }
    .gs-star { color: #5f6368; font-size: 18px; padding: 0 8px; }
    .gs-right { display: flex; align-items: center; gap: 8px; }
    .gs-share {
      background: #c2e7ff; color: #001d35; padding: 8px 16px; border-radius: 999px;
      font-size: 13px; font-weight: 500; display: inline-flex; align-items: center; gap: 6px;
    }
    .gs-avatar { width: 32px; height: 32px; border-radius: 50%; background: #1a73e8; color: #fff; display: grid; place-items: center; font-size: 13px; font-weight: 500; }

    .gs-menu { display: flex; gap: 4px; padding: 0 16px; font-size: 13px; color: #444746; align-items: center; }
    .gs-menu .item { padding: 2px 8px; border-radius: 4px; }
    .gs-toolbar {
      display: flex; align-items: center; gap: 6px;
      padding: 0 8px; background: #f9fbfd; margin: 4px 8px; border-radius: 20px;
      height: 36px;
    }
    .gs-tool { padding: 6px 8px; color: #444746; font-size: 13px; border-radius: 4px; }
    .gs-tool.icon { width: 28px; text-align: center; }
    .gs-divider { width: 1px; height: 20px; background: #dadce0; margin: 0 4px; }

    .gs-name-box {
      display: flex; align-items: center; gap: 8px; padding: 0 12px;
      border-bottom: 1px solid #e0e0e0; font-size: 12px; color: #5f6368;
    }
    .gs-name-cell { width: 96px; padding: 2px 8px; border: 1px solid #dadce0; border-radius: 2px; background: #fff; font-size: 12px; color: #202124; }

    .gs-sheet { overflow: hidden; }
    .gs-tabs {
      display: flex; align-items: stretch; border-top: 1px solid #e0e0e0; background: #f1f3f4;
      padding: 0 8px;
    }
    .gs-tabs .add { padding: 6px 10px; color: #5f6368; font-size: 16px; }
    .gs-tab {
      padding: 6px 14px 5px; font-size: 12px; color: #5f6368; border-right: 1px solid #e0e0e0;
      display: flex; align-items: center; gap: 4px;
    }
    .gs-tab.active { background: #fff; color: #202124; font-weight: 500; border-bottom: 2px solid #0f9d58; }
  </style>
  <div class="gs">
    <div class="gs-top">
      <div class="gs-icon-sheets">≣</div>
      <div class="gs-title-wrap">
        <div class="gs-title">Realtor Workflow CRM <span class="gs-star">&#9734;</span></div>
        <div class="gs-meta">File &nbsp;Edit &nbsp;View &nbsp;Insert &nbsp;Format &nbsp;Data &nbsp;Tools &nbsp;Extensions &nbsp;Help &nbsp;<span style="color:#188038;">Last edit was seconds ago</span></div>
      </div>
      <div class="gs-right">
        <div class="gs-share">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="#001d35"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/></svg>
          Share
        </div>
        <div class="gs-avatar">T</div>
      </div>
    </div>
    <div class="gs-menu">
      <div class="item">File</div><div class="item">Edit</div><div class="item">View</div><div class="item">Insert</div><div class="item">Format</div><div class="item">Data</div><div class="item">Tools</div><div class="item">Extensions</div><div class="item">Help</div>
    </div>
    <div class="gs-toolbar">
      <div class="gs-tool icon">&#8631;</div>
      <div class="gs-tool icon">&#8634;</div>
      <div class="gs-tool icon">&#128424;</div>
      <div class="gs-tool icon">%</div>
      <div class="gs-tool">100%</div>
      <div class="gs-divider"></div>
      <div class="gs-tool">$</div>
      <div class="gs-tool">.0</div>
      <div class="gs-tool">.00</div>
      <div class="gs-tool">123 &#x25BE;</div>
      <div class="gs-divider"></div>
      <div class="gs-tool">Default (Arial) &#x25BE;</div>
      <div class="gs-tool">10 &#x25BE;</div>
      <div class="gs-divider"></div>
      <div class="gs-tool" style="font-weight:700;">B</div>
      <div class="gs-tool" style="font-style:italic;">I</div>
      <div class="gs-tool" style="text-decoration:line-through;">S</div>
      <div class="gs-tool" style="color:#d93025;">A</div>
      <div class="gs-divider"></div>
      <div class="gs-tool icon">&#9632;</div>
      <div class="gs-tool icon">&#9647;</div>
      <div class="gs-tool icon">&#8801;</div>
      <div class="gs-tool icon">&#8676;</div>
    </div>
    <div class="gs-name-box">
      <div class="gs-name-cell">A1</div>
      <div style="color:#5f6368; padding-left:8px;">fx</div>
      <div style="padding-left:8px; color:#202124;">Transaction ID</div>
    </div>
    <div class="gs-sheet">${contentHtml}</div>
    <div class="gs-tabs">
      <div class="add">+</div>
      ${tabs.map((t) => `<div class="gs-tab ${t === activeTab ? 'active' : ''}">${escapeHtml(t)} &#x25BE;</div>`).join('')}
    </div>
  </div>
  `;
}

function sheetGrid({ columns, rows, highlightRow = -1, frozenHeaderColor = '#0f9d58' }) {
  // Build columns A,B,C..., a wide row of fixed widths
  const colLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M'];
  const visibleCols = columns.length;
  const totalCols = Math.max(visibleCols, 12);
  const totalRows = Math.max(rows.length + 8, 22);

  let headerRow = `<div class="sg-row sg-col-header"><div class="sg-cell sg-row-num"></div>`;
  for (let i = 0; i < totalCols; i += 1) {
    headerRow += `<div class="sg-cell sg-col-letter">${colLetters[i] || ''}</div>`;
  }
  headerRow += `</div>`;

  // Frozen header row (sheet's own column titles)
  let frozenRow = `<div class="sg-row"><div class="sg-cell sg-row-num">1</div>`;
  for (let i = 0; i < totalCols; i += 1) {
    const text = columns[i] || '';
    frozenRow += `<div class="sg-cell sg-frozen" style="background:${frozenHeaderColor};">${escapeHtml(text)}</div>`;
  }
  frozenRow += `</div>`;

  let dataRowsHtml = '';
  for (let r = 0; r < totalRows; r += 1) {
    const row = rows[r] || [];
    const isHighlight = r === highlightRow;
    dataRowsHtml += `<div class="sg-row ${isHighlight ? 'sg-row-active' : ''}"><div class="sg-cell sg-row-num ${isHighlight ? 'sg-row-num-active' : ''}">${r + 2}</div>`;
    for (let c = 0; c < totalCols; c += 1) {
      const cell = row[c];
      let cellHtml = '';
      if (cell && typeof cell === 'object' && cell.html) cellHtml = cell.html;
      else if (cell != null) cellHtml = escapeHtml(String(cell));
      dataRowsHtml += `<div class="sg-cell">${cellHtml}</div>`;
    }
    dataRowsHtml += `</div>`;
  }

  return `
  <style>
    .sg { font-family: "Roboto", Arial, sans-serif; font-size: 12px; color: #202124; background: #fff; overflow: hidden; }
    .sg-row { display: flex; }
    .sg-cell {
      border-right: 1px solid #e0e0e0; border-bottom: 1px solid #e0e0e0;
      padding: 4px 8px; min-width: 130px; height: 22px;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      background: #fff;
    }
    .sg-row-num {
      min-width: 48px; max-width: 48px; background: #f8f9fa;
      color: #5f6368; text-align: center; font-size: 11px;
      border-right: 1px solid #c0c0c0;
    }
    .sg-col-header .sg-cell { background: #f8f9fa; color: #5f6368; text-align: center; font-size: 11px; height: 22px; border-bottom: 1px solid #c0c0c0; }
    .sg-col-letter { font-weight: 400; }
    .sg-frozen { color: #fff; font-weight: 600; }
    .sg-row-active .sg-cell { background: #e8f0fe; border-bottom: 1px solid #1a73e8; border-top: 1px solid #1a73e8; }
    .sg-row-active .sg-cell:first-child + .sg-cell { border-left: 2px solid #1a73e8; }
    .sg-row-num-active { background: #1a73e8 !important; color: #fff !important; }
    .pill-rec, .pill-mis, .pill-exp { padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 500; display: inline-block; }
    .pill-rec { background: #e6f4ea; color: #137333; }
    .pill-mis { background: #fce8e6; color: #c5221f; }
    .pill-exp { background: #fef7e0; color: #b06000; }
  </style>
  <div class="sg">${headerRow}${frozenRow}${dataRowsHtml}</div>
  `;
}

// ---- 4. Trade Record (Sheets row) ------------------------------------------

function renderTradeRecord() {
  const columns = [
    'Transaction ID', 'Buyer', 'Seller', 'Address', 'Sold Price',
    'Sale Date', 'Possession', 'MLS #', 'Contract #', 'Listing Realtor',
    'Selling Realtor', 'Status',
  ];
  const dataRow = [
    sample.transactionId, sample.buyer1, sample.seller1, sample.dealAddress, sample.soldPrice,
    sample.saleDate, sample.possessionDate, sample.mlsNumber, sample.contractNumber, sample.listingRealtor,
    sample.sellingRealtor, { html: '<span class="pill-rec">Package Generated</span>' },
  ];
  const grid = sheetGrid({ columns, rows: [dataRow], highlightRow: 0 });
  return renderSheetsChrome({ activeTab: 'Trade Records', contentHtml: grid });
}

// ---- 5. Required Docs (Sheets tab) -----------------------------------------

function renderRequiredDocs() {
  const columns = ['Category', 'Document', 'Status', 'Notes', 'Last Update', 'Owner', 'Linked File'];
  const notesByName = {
    'Accepted OTP / Offer to Purchase': 'Received with offer',
    'Deposit Cheque / Proof of Deposit': 'From buyer agent',
    'Area Forms / Consumer Agreement': 'Uploaded May 19',
    'MLS Copy': 'Pulled from MLS export',
    'Seller Lawyer Contact': 'Jordan & Co. confirmed',
    'Buyer Lawyer Contact': 'Summit Legal confirmed',
    'Condition Waiver / Fulfillment': 'Waiting on buyer',
    'Transaction Report / Trade Record Review': 'Pending package close',
  };
  const datesByName = {
    'Accepted OTP / Offer to Purchase': '2026-05-19',
    'Deposit Cheque / Proof of Deposit': '2026-05-19',
    'Area Forms / Consumer Agreement': '2026-05-19',
    'MLS Copy': '2026-05-18',
    'Seller Lawyer Contact': '2026-05-19',
    'Buyer Lawyer Contact': '2026-05-19',
    'Condition Waiver / Fulfillment': '',
    'Transaction Report / Trade Record Review': '',
  };
  const rows = sample.requiredDocs.map(([cat, name, status]) => {
    const pillClass = status === 'Received' ? 'pill-rec' : status === 'Missing' ? 'pill-mis' : 'pill-exp';
    return [
      cat,
      name,
      { html: `<span class="${pillClass}">${escapeHtml(status)}</span>` },
      notesByName[name] || '',
      datesByName[name] || '',
      'Tammy MacDonald',
      status === 'Received' ? 'drive://RT-COMP-1001/' : '',
    ];
  });
  const grid = sheetGrid({ columns, rows });
  return renderSheetsChrome({ activeTab: 'RequiredDocs', contentHtml: grid });
}

// ---- 0. Dashboard (also Sheets) --------------------------------------------

function renderDashboard() {
  const columns = ['Transaction ID', 'Transaction Name', 'Current Step', 'Required Docs', 'Drive Folder', 'Calendar', 'Email Draft', 'Trade Record', 'Last Action'];
  const dataRow = [
    sample.transactionId,
    sample.transactionName,
    { html: '<span class="pill-rec">Package Generated</span>' },
    sample.docsSummary,
    'Open package folder',
    { html: '<span class="pill-rec">Calendar Ready</span>' },
    { html: '<span class="pill-rec">Draft Created</span>' },
    'Trade Record Row 22',
    'Generated successfully',
  ];
  const grid = sheetGrid({ columns, rows: [dataRow], highlightRow: 0 });
  return renderSheetsChrome({ activeTab: 'Trade Records', contentHtml: grid });
}

// ---- 6. Gmail compose -------------------------------------------------------

function renderDraftPreview() {
  const subject = `[Review Draft] Next steps for ${sample.dealAddress}`;
  const body = `Hi ${sample.buyer1},

Following up on the next steps for ${sample.dealAddress}.

Transaction reference: ${sample.transactionId}
Sold price: ${sample.soldPrice}
Possession: ${sample.possessionDate}

Here's what we're tracking on our side:
  • accepted offer package review
  • deposit and required-doc follow-up
  • condition waiver date tracking
  • lawyer and contact confirmation

I'll follow up once the condition waiver and trade record review are in.

Regards,
Maxwell Canyon Creek`;

  return `
  <style>
    body { background: #f6f8fc; }
    .gm { position: relative; height: 100vh; }
    .gm-top {
      display: grid; grid-template-columns: 280px 1fr 220px;
      align-items: center; padding: 6px 16px; height: 64px;
      background: #f6f8fc; border-bottom: 1px solid #e8eaed;
    }
    .gm-brand { display: flex; align-items: center; gap: 16px; }
    .gm-burger { width: 18px; height: 2px; background: #5f6368; box-shadow: 0 6px 0 #5f6368, 0 -6px 0 #5f6368; }
    .gm-brand-text { font-size: 22px; color: #5f6368; }
    .gm-search {
      background: #eaf1fb; border-radius: 8px; height: 48px;
      display: flex; align-items: center; padding: 0 16px;
      color: #5f6368; font-size: 16px; max-width: 720px;
    }
    .gm-search svg { width: 22px; height: 22px; margin-right: 12px; }
    .gm-right { justify-self: end; display: flex; align-items: center; gap: 12px; }
    .gm-avatar { width: 32px; height: 32px; border-radius: 50%; background: #ea4335; color: #fff; display: grid; place-items: center; font-size: 14px; font-weight: 500; }

    .gm-body { display: grid; grid-template-columns: 260px 1fr; height: calc(100vh - 64px); }
    .gm-side { padding: 16px 12px; background: #f6f8fc; }
    .gm-compose {
      background: #c2e7ff; color: #001d35; padding: 16px 24px; border-radius: 16px;
      font-size: 14px; font-weight: 500; display: inline-flex; align-items: center; gap: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .gm-nav { margin-top: 18px; font-size: 14px; color: #1f1f1f; }
    .gm-nav-item { padding: 6px 16px; border-radius: 0 999px 999px 0; display: flex; align-items: center; gap: 14px; margin: 1px 0; }
    .gm-nav-item.active { background: #d3e3fd; font-weight: 500; }
    .gm-nav-item .num { margin-left: auto; font-size: 12px; color: #444746; }
    .gm-nav-item .ico { width: 20px; }

    .gm-main { background: #fff; padding: 16px 32px; overflow: hidden; }
    .gm-listrow { padding: 8px 12px; border-bottom: 1px solid #f1f3f4; display: flex; gap: 16px; align-items: center; font-size: 13px; color: #5f6368; }
    .gm-listrow .from { width: 180px; color: #202124; }
    .gm-listrow.unread .from { font-weight: 700; }
    .gm-listrow.unread .subj { color: #202124; font-weight: 500; }
    .gm-listrow .date { margin-left: auto; }

    .gm-compose-window {
      position: absolute; right: 32px; bottom: 0; width: 540px; height: 600px;
      background: #fff; border-radius: 8px 8px 0 0;
      box-shadow: 0 8px 10px 1px rgba(0,0,0,0.14), 0 3px 14px 2px rgba(0,0,0,0.12);
      display: grid; grid-template-rows: 40px auto auto 1fr 56px;
      overflow: hidden;
    }
    .gmw-header {
      background: #f2f6fc; color: #202124; padding: 0 8px 0 16px;
      display: flex; align-items: center; justify-content: space-between; font-size: 14px; font-weight: 500;
    }
    .gmw-header .icons { display: flex; gap: 4px; }
    .gmw-header .ic { width: 28px; height: 28px; display: grid; place-items: center; color: #5f6368; }
    .gmw-field {
      padding: 8px 16px; border-bottom: 1px solid #eaeaea; display: flex; align-items: center; gap: 8px;
      font-size: 13px; color: #444746;
    }
    .gmw-field .lbl { color: #5f6368; width: 24px; }
    .gmw-chip {
      background: #e8eaed; border-radius: 999px; padding: 3px 10px 3px 4px;
      display: inline-flex; align-items: center; gap: 6px; color: #202124; font-size: 12px;
    }
    .gmw-chip .av { width: 22px; height: 22px; border-radius: 50%; background: #34a853; color: #fff; display: grid; place-items: center; font-size: 11px; font-weight: 500; }
    .gmw-subject { font-size: 13px; color: #202124; }
    .gmw-body {
      padding: 14px 16px; font-size: 14px; color: #202124; line-height: 1.5; white-space: pre-wrap;
      font-family: "Roboto", Arial, sans-serif; overflow: auto;
    }
    .gmw-toolbar {
      display: flex; align-items: center; gap: 4px; padding: 8px 12px;
      border-top: 1px solid #eaeaea; background: #fff;
    }
    .gmw-send {
      background: #0b57d0; color: #fff; padding: 9px 22px 9px 22px; border-radius: 999px 4px 4px 999px;
      font-size: 14px; font-weight: 500; display: inline-flex; align-items: center; gap: 4px;
    }
    .gmw-send-caret {
      background: #0b57d0; color: #fff; padding: 9px 10px; border-radius: 4px 999px 999px 4px;
      margin-right: 8px; border-left: 1px solid rgba(255,255,255,0.3);
    }
    .gmw-tool { width: 32px; height: 32px; display: grid; place-items: center; color: #5f6368; }
    .gmw-trash { margin-left: auto; }
  </style>
  <div class="gm">
    <div class="gm-top">
      <div class="gm-brand">
        <div class="gm-burger"></div>
        <div class="gm-brand-text">Gmail</div>
      </div>
      <div class="gm-search">
        <svg viewBox="0 0 24 24" fill="#5f6368" xmlns="http://www.w3.org/2000/svg"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
        Search mail
      </div>
      <div class="gm-right">
        <div class="gm-avatar">T</div>
      </div>
    </div>
    <div class="gm-body">
      <aside class="gm-side">
        <div class="gm-compose">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#001d35"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
          Compose
        </div>
        <div class="gm-nav">
          <div class="gm-nav-item active">
            <span class="ico"><svg width="18" height="18" viewBox="0 0 24 24" fill="#444746"><path d="M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.11 0 2-.9 2-2V5c0-1.1-.89-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/></svg></span>
            Inbox <span class="num">128</span>
          </div>
          <div class="gm-nav-item"><span class="ico"><svg width="18" height="18" viewBox="0 0 24 24" fill="#444746"><path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg></span> Starred</div>
          <div class="gm-nav-item"><span class="ico"><svg width="18" height="18" viewBox="0 0 24 24" fill="#444746"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg></span> Snoozed</div>
          <div class="gm-nav-item"><span class="ico"><svg width="18" height="18" viewBox="0 0 24 24" fill="#444746"><path d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2z"/></svg></span> Sent</div>
          <div class="gm-nav-item"><span class="ico"><svg width="18" height="18" viewBox="0 0 24 24" fill="#444746"><path d="M3 6v15h15v-2H5V6H3zm6-2v13h13V4H9zm11 11H11V6h9v9z"/></svg></span> Drafts <span class="num">3</span></div>
          <div class="gm-nav-item"><span class="ico"><svg width="18" height="18" viewBox="0 0 24 24" fill="#444746"><path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 14H4V8l8 5 8-5v10zM4 6l8 5 8-5H4z"/></svg></span> All Mail</div>
        </div>
      </aside>
      <main class="gm-main">
        <div class="gm-listrow unread"><div class="from">Maxwell Canyon Creek</div><div class="subj">[Review Draft] Next steps for 1128 4 Street SW, Calgary, AB</div><div class="date">10:42 AM</div></div>
        <div class="gm-listrow"><div class="from">Ava Singh</div><div class="subj">Re: RT-COMP-1001 selling-side handoff</div><div class="date">9:15 AM</div></div>
        <div class="gm-listrow"><div class="from">Summit Legal</div><div class="subj">Confirming buyer-side file for Jordan Patel</div><div class="date">May 19</div></div>
        <div class="gm-listrow"><div class="from">Jordan & Co. Law</div><div class="subj">Seller-side closing checklist</div><div class="date">May 19</div></div>
        <div class="gm-listrow"><div class="from">Google Calendar</div><div class="subj">Reminder: RT-COMP-1001 - Condition Reminder May 21</div><div class="date">May 18</div></div>
      </main>
    </div>

    <div class="gm-compose-window">
      <div class="gmw-header">
        <div>New Message</div>
        <div class="icons">
          <div class="ic">&ndash;</div>
          <div class="ic">&#9744;</div>
          <div class="ic">&times;</div>
        </div>
      </div>
      <div class="gmw-field">
        <span class="lbl">To</span>
        <div class="gmw-chip"><span class="av">J</span>${escapeHtml(sample.clientEmail)}</div>
      </div>
      <div class="gmw-field"><span class="lbl">&nbsp;</span><span class="gmw-subject">${escapeHtml(subject)}</span></div>
      <div class="gmw-body">${escapeHtml(body)}</div>
      <div class="gmw-toolbar">
        <div class="gmw-send">Send</div>
        <div class="gmw-send-caret">&#x25BE;</div>
        <div class="gmw-tool"><svg width="18" height="18" viewBox="0 0 24 24" fill="#5f6368"><path d="M12 19c-2.76 0-5-2.24-5-5V7a3 3 0 1 1 6 0v6a1 1 0 0 1-2 0V7H9.5v6a2.5 2.5 0 0 0 5 0V7c0-2.49-2.01-4.5-4.5-4.5S5.5 4.51 5.5 7v7c0 3.59 2.91 6.5 6.5 6.5s6.5-2.91 6.5-6.5V8H17v6c0 2.76-2.24 5-5 5z"/></svg></div>
        <div class="gmw-tool"><svg width="18" height="18" viewBox="0 0 24 24" fill="#5f6368"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93C7.05 19.44 4 16.08 4 12c0-.61.08-1.21.21-1.78L9 15v1a2 2 0 0 0 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3a1 1 0 0 0-1-1H8v-2h2a1 1 0 0 0 1-1V7h2a2 2 0 0 0 2-2v-.41C17.93 5.78 20 8.65 20 12c0 2.08-.81 3.98-2.1 5.39z"/></svg></div>
        <div class="gmw-tool"><svg width="18" height="18" viewBox="0 0 24 24" fill="#5f6368"><path d="M16.5 6v11.5a4.5 4.5 0 0 1-9 0V5a3 3 0 1 1 6 0v10.5a1.5 1.5 0 0 1-3 0V6H10v9.5a3 3 0 0 0 6 0V5a4.5 4.5 0 0 0-9 0v12.5a6 6 0 0 0 12 0V6h-2.5z"/></svg></div>
        <div class="gmw-tool"><svg width="18" height="18" viewBox="0 0 24 24" fill="#5f6368"><path d="M20 5h-3.17l-1.84-2H9.01L7.17 5H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-8 13c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/></svg></div>
        <div class="gmw-tool gmw-trash"><svg width="18" height="18" viewBox="0 0 24 24" fill="#5f6368"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg></div>
      </div>
    </div>
  </div>
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
