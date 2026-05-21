const DRIVE_API = "https://www.googleapis.com/drive/v3";
const DRIVE_UPLOAD = "https://www.googleapis.com/upload/drive/v3";
const SHEETS_API = "https://sheets.googleapis.com/v4/spreadsheets";
const GMAIL_API = "https://gmail.googleapis.com/gmail/v1/users/me";
const CALENDAR_API = "https://www.googleapis.com/calendar/v3";

export const DEMO_FOLDER_NAME = "MCC Realtor Workflow Demo";
export const WORKBOOK_NAME = "MCC Realtor Workflow Demo - Trade Record";
export const CALENDAR_NAME = "MCC Realtor Workflow Demo";

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
  if (list.files && list.files.length) return list.files[0].id;
  const created = await call<{ spreadsheetId: string }>(token, SHEETS_API, {
    method: "POST",
    body: JSON.stringify({
      properties: { title: WORKBOOK_NAME },
      sheets: [{ properties: { title: "TradeRecord" } }],
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
  return created.spreadsheetId;
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

