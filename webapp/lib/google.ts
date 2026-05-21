const DRIVE_API = "https://www.googleapis.com/drive/v3";
const DRIVE_UPLOAD = "https://www.googleapis.com/upload/drive/v3";
const SHEETS_API = "https://sheets.googleapis.com/v4/spreadsheets";
const GMAIL_API = "https://gmail.googleapis.com/gmail/v1/users/me";
const CALENDAR_API = "https://www.googleapis.com/calendar/v3";

export const DEMO_FOLDER_NAME = "MCC Realtor Workflow Demo";
export const WORKBOOK_NAME = "MCC Realtor Workflow Demo - Trade Record";
export const CALENDAR_NAME = "MCC Realtor Workflow Demo";

// Mirrors Apps Script TRD_CONFIG.folderConditionalSubfolders in
// C:/VFC/tammy-roundtable-demo/src/Config.js. One nested folder per deal:
// residential -> RMS & Photos, condo -> Condo Docs. No other subfolders.
export const PROPERTY_TYPE_SUBFOLDERS: Record<"residential" | "condo", string> = {
  residential: "RMS & Photos",
  condo: "Condo Docs",
};

// Mirrors Apps Script TRD_CONFIG.sheetNames.requiredDocs and
// TRD_CONFIG.requiredDocsHeaders in C:/VFC/tammy-roundtable-demo/src/Config.js.
// The 6-item checklist Tammy anchored in her May 20 revision set lives on
// this dedicated tab so it sits "at the bottom of the [workbook]" the same
// way the Apps Script backend exposes it.
export const REQUIRED_DOCS_SHEET = "RequiredDocs";
export const REQUIRED_DOCS_HEADERS = [
  "Transaction ID",
  "Document Category",
  "Document Name",
  "Status",
  "Notes",
  "Last Updated",
] as const;

// Mirrors Apps Script TRD_CONFIG.requiredDocs and
// TRD_CONFIG.sampleDocStatusPresets.live. Agreement + MLS are 'Received' on
// seed because the agreement just landed; the rest are 'Expected' until the
// realtor checks them off. Order matches the Apps Script config exactly.
export const REQUIRED_DOCS_ITEMS: ReadonlyArray<{
  category: string;
  name: string;
  initialStatus: "Received" | "Expected";
}> = [
  { category: "Agreement", name: "Signed Agreement (Exclusive Buyer / Seller)", initialStatus: "Received" },
  { category: "Contract", name: "Purchase Contract & Amendments", initialStatus: "Expected" },
  { category: "Deposit", name: "Deposit Cheque / Proof of Deposit", initialStatus: "Expected" },
  { category: "Conditions", name: "Condition Waiver / Fulfillment", initialStatus: "Expected" },
  { category: "Compliance", name: "MLS Listing", initialStatus: "Received" },
  { category: "Closing", name: "Trade Record Review", initialStatus: "Expected" },
];

type FetchInit = RequestInit & { searchParams?: Record<string, string> };

async function call<T>(token: string, url: string, init: FetchInit = {}): Promise<T> {
  const fullUrl = init.searchParams
    ? `${url}?${new URLSearchParams(init.searchParams).toString()}`
    : url;
  const res = await fetch(fullUrl, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init.body && !(init.body instanceof FormData) && !(init.body instanceof Blob)
        ? { "Content-Type": "application/json" }
        : {}),
      ...(init.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google API ${res.status} ${url}: ${text.slice(0, 400)}`);
  }
  if (res.status === 204) return {} as T;
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return (await res.json()) as T;
  return (await res.text()) as unknown as T;
}

export async function findOrCreateFolder(token: string, name: string, parentId?: string) {
  const q = [
    `name = '${name.replace(/'/g, "\\'")}'`,
    "mimeType = 'application/vnd.google-apps.folder'",
    "trashed = false",
    parentId ? `'${parentId}' in parents` : "'root' in parents",
  ].join(" and ");
  const list = await call<{ files: { id: string; name: string }[] }>(token, `${DRIVE_API}/files`, {
    searchParams: { q, fields: "files(id,name)" },
  });
  if (list.files && list.files.length) return list.files[0].id;
  const body: Record<string, unknown> = {
    name,
    mimeType: "application/vnd.google-apps.folder",
  };
  if (parentId) body.parents = [parentId];
  const created = await call<{ id: string }>(token, `${DRIVE_API}/files`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  return created.id;
}

export async function uploadPdfToFolder(
  token: string,
  folderId: string,
  fileName: string,
  pdfBytes: Uint8Array
) {
  const metadata = JSON.stringify({ name: fileName, parents: [folderId] });
  const boundary = `--mcc${Date.now()}`;
  const closing = `\r\n--${boundary}--`;
  const pre =
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n` +
    `--${boundary}\r\nContent-Type: application/pdf\r\n\r\n`;
  const buf = Buffer.concat([
    Buffer.from(pre, "utf8"),
    Buffer.from(pdfBytes),
    Buffer.from(closing, "utf8"),
  ]);
  const url = `${DRIVE_UPLOAD}/files?uploadType=multipart&fields=id,webViewLink,name`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": `multipart/related; boundary=${boundary}`,
    },
    body: new Uint8Array(buf),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Drive upload ${res.status}: ${text.slice(0, 300)}`);
  }
  return (await res.json()) as { id: string; webViewLink: string; name: string };
}

export async function findOrCreateWorkbook(token: string, parentFolderId: string) {
  const q = [
    `name = '${WORKBOOK_NAME.replace(/'/g, "\\'")}'`,
    "mimeType = 'application/vnd.google-apps.spreadsheet'",
    "trashed = false",
  ].join(" and ");
  const list = await call<{ files: { id: string; name: string }[] }>(token, `${DRIVE_API}/files`, {
    searchParams: { q, fields: "files(id,name)" },
  });
  if (list.files && list.files.length) {
    // Workbook already exists from an earlier run. Make sure the RequiredDocs
    // tab + header are present (handles existing workbooks created before this
    // patch shipped). Idempotent.
    await ensureRequiredDocsSheet(token, list.files[0].id);
    return list.files[0].id;
  }
  const created = await call<{ spreadsheetId: string }>(token, SHEETS_API, {
    method: "POST",
    body: JSON.stringify({
      properties: { title: WORKBOOK_NAME },
      sheets: [
        { properties: { title: "TradeRecord" } },
        { properties: { title: REQUIRED_DOCS_SHEET } },
      ],
    }),
  });
  await call(token, `${DRIVE_API}/files/${created.spreadsheetId}`, {
    method: "PATCH",
    searchParams: { addParents: parentFolderId, removeParents: "root" },
    body: JSON.stringify({}),
  });
  const headers = [
    "Timestamp",
    "Transaction ID",
    "Side",
    "Deal Address",
    "Buyer",
    "Seller",
    "Sold Price",
    "Sale Date",
    "Possession Date",
    "MLS Number",
    "Contract Number",
    "Listing Realtor",
    "Selling Realtor",
    "Buyer Lawyer",
    "Seller Lawyer",
    "Condition 1",
    "Condition 2",
    "Drive Folder",
    "Source PDF",
    "Gmail Draft",
    "Summary",
  ];
  await call(token, `${SHEETS_API}/${created.spreadsheetId}/values/TradeRecord!A1:append`, {
    method: "POST",
    searchParams: { valueInputOption: "USER_ENTERED" },
    body: JSON.stringify({ values: [headers] }),
  });
  // Seed the RequiredDocs header row. Per-transaction rows are appended later
  // by ensureRequiredDocsForTransaction.
  await call(
    token,
    `${SHEETS_API}/${created.spreadsheetId}/values/${REQUIRED_DOCS_SHEET}!A1:append`,
    {
      method: "POST",
      searchParams: { valueInputOption: "USER_ENTERED" },
      body: JSON.stringify({ values: [Array.from(REQUIRED_DOCS_HEADERS)] }),
    }
  );
  return created.spreadsheetId;
}

// Idempotent: ensures the RequiredDocs tab exists on an existing workbook and
// that the header row is in place. Mirrors Apps Script trdEnsureRequiredDocsSheet.
export async function ensureRequiredDocsSheet(token: string, spreadsheetId: string) {
  const meta = await call<{
    sheets: { properties: { sheetId: number; title: string } }[];
  }>(token, `${SHEETS_API}/${spreadsheetId}`, {
    searchParams: { fields: "sheets.properties(sheetId,title)" },
  });
  const exists = meta.sheets?.some(
    (s) => s.properties.title === REQUIRED_DOCS_SHEET
  );
  if (!exists) {
    await call(token, `${SHEETS_API}/${spreadsheetId}:batchUpdate`, {
      method: "POST",
      body: JSON.stringify({
        requests: [
          {
            addSheet: {
              properties: { title: REQUIRED_DOCS_SHEET },
            },
          },
        ],
      }),
    });
  }
  // Always confirm the header row (safe on either fresh or existing tab).
  const existing = await call<{ values?: string[][] }>(
    token,
    `${SHEETS_API}/${spreadsheetId}/values/${REQUIRED_DOCS_SHEET}!A1:F1`
  );
  if (!existing.values || existing.values.length === 0) {
    await call(
      token,
      `${SHEETS_API}/${spreadsheetId}/values/${REQUIRED_DOCS_SHEET}!A1:append`,
      {
        method: "POST",
        searchParams: { valueInputOption: "USER_ENTERED" },
        body: JSON.stringify({ values: [Array.from(REQUIRED_DOCS_HEADERS)] }),
      }
    );
  }
}

// Seed the 6-item checklist for a transaction id, but only if rows for that
// transaction id don't already exist. Mirrors the Apps Script live preset
// (TRD_CONFIG.sampleDocStatusPresets.live).
export async function ensureRequiredDocsForTransaction(
  token: string,
  spreadsheetId: string,
  transactionId: string
) {
  if (!transactionId) return;
  await ensureRequiredDocsSheet(token, spreadsheetId);
  const all = await call<{ values?: string[][] }>(
    token,
    `${SHEETS_API}/${spreadsheetId}/values/${REQUIRED_DOCS_SHEET}!A2:F1000`
  );
  const already = (all.values || []).some(
    (row) => (row?.[0] || "").trim() === transactionId
  );
  if (already) return;
  const nowIso = new Date().toISOString();
  const rows = REQUIRED_DOCS_ITEMS.map((item) => [
    transactionId,
    item.category,
    item.name,
    item.initialStatus,
    "",
    nowIso,
  ]);
  await call(
    token,
    `${SHEETS_API}/${spreadsheetId}/values/${REQUIRED_DOCS_SHEET}!A1:append`,
    {
      method: "POST",
      searchParams: {
        valueInputOption: "USER_ENTERED",
        insertDataOption: "INSERT_ROWS",
      },
      body: JSON.stringify({ values: rows }),
    }
  );
}

// Read all RequiredDocs rows for a transaction id. Returns [] if none.
export async function readRequiredDocsForTransaction(
  token: string,
  spreadsheetId: string,
  transactionId: string
) {
  if (!transactionId) return [];
  const all = await call<{ values?: string[][] }>(
    token,
    `${SHEETS_API}/${spreadsheetId}/values/${REQUIRED_DOCS_SHEET}!A2:F1000`
  );
  return (all.values || []).filter(
    (row) => (row?.[0] || "").trim() === transactionId
  );
}

export async function appendTradeRecordRow(
  token: string,
  spreadsheetId: string,
  row: (string | number)[]
) {
  return call<{ updates?: { updatedRange?: string } }>(
    token,
    `${SHEETS_API}/${spreadsheetId}/values/TradeRecord!A1:append`,
    {
      method: "POST",
      searchParams: { valueInputOption: "USER_ENTERED", insertDataOption: "INSERT_ROWS" },
      body: JSON.stringify({ values: [row] }),
    }
  );
}

export async function readTradeRecord(token: string, spreadsheetId: string) {
  return call<{ values?: string[][] }>(
    token,
    `${SHEETS_API}/${spreadsheetId}/values/TradeRecord!A1:U200`
  );
}

export async function findOrCreateCalendar(token: string) {
  const list = await call<{ items: { id: string; summary: string }[] }>(
    token,
    `${CALENDAR_API}/users/me/calendarList`,
    { searchParams: { maxResults: "250" } }
  );
  const found = list.items?.find((c) => c.summary === CALENDAR_NAME);
  if (found) return found.id;
  const created = await call<{ id: string }>(token, `${CALENDAR_API}/calendars`, {
    method: "POST",
    body: JSON.stringify({ summary: CALENDAR_NAME, timeZone: "America/Toronto" }),
  });
  return created.id;
}

export async function createAllDayEvent(
  token: string,
  calendarId: string,
  title: string,
  date: string,
  description: string
) {
  return call<{ id: string; htmlLink: string }>(
    token,
    `${CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events`,
    {
      method: "POST",
      body: JSON.stringify({
        summary: title,
        description,
        start: { date },
        end: { date },
      }),
    }
  );
}

export async function createGmailDraft(
  token: string,
  to: string,
  subject: string,
  body: string
) {
  const rfc822 =
    `To: ${to}\r\n` +
    `Subject: ${subject}\r\n` +
    `Content-Type: text/html; charset=UTF-8\r\n` +
    `\r\n` +
    body;
  const raw = Buffer.from(rfc822, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return call<{ id: string; message: { id: string; threadId: string } }>(
    token,
    `${GMAIL_API}/drafts`,
    {
      method: "POST",
      body: JSON.stringify({ message: { raw } }),
    }
  );
}

export function gmailDraftUrl(messageId: string) {
  return `https://mail.google.com/mail/u/0/#drafts?compose=${messageId}`;
}

export function driveFolderUrl(folderId: string) {
  return `https://drive.google.com/drive/folders/${folderId}`;
}

export function spreadsheetUrl(id: string) {
  return `https://docs.google.com/spreadsheets/d/${id}/edit`;
}

