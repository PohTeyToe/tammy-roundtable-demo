import { extractAgreement, type ExtractedAgreement } from "./claude";
import {
  appendTradeRecordRow,
  createAllDayEvent,
  createGmailDraft,
  driveFolderUrl,
  ensureRequiredDocsForTransaction,
  findOrCreateCalendar,
  findOrCreateFolder,
  findOrCreateWorkbook,
  gmailDraftUrl,
  spreadsheetUrl,
  uploadPdfToFolder,
  DEMO_FOLDER_NAME,
  PROPERTY_TYPE_SUBFOLDERS,
} from "./google";

export type PipelineResult = {
  transactionId: string;
  side: "buyer" | "seller";
  propertyType: "residential" | "condo";
  extracted: ExtractedAgreement;
  folderUrl: string;
  subfolderUrl: string;
  conditionalSubfolderUrl: string;
  conditionalSubfolderName: string;
  spreadsheetUrl: string;
  pdfUrl: string;
  draftUrl?: string;
  conditionEventId?: string;
  possessionEventId?: string;
};

// Mirrors Apps Script `trdDetectPropertyType` in
// C:/VFC/tammy-roundtable-demo/src/AgreementUpload.js. Filename wins, then
// extracted.summary, then extracted.propertyType, else residential.
function detectPropertyType(
  fileName: string,
  extracted: ExtractedAgreement
): "residential" | "condo" {
  const lowerName = (fileName || "").toLowerCase();
  if (lowerName.includes("condo")) return "condo";
  const summary = (extracted.summary || "").toLowerCase();
  if (summary.includes("condo") || summary.includes("condominium")) return "condo";
  if (extracted.propertyType === "condo") return "condo";
  return "residential";
}

function safeFileNameSegment(s: string) {
  return s
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

function inferTransactionId(extracted: ExtractedAgreement) {
  if (extracted.transactionId) return extracted.transactionId;
  if (extracted.contractNumber) return extracted.contractNumber;
  const stamp = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace("T", "-")
    .slice(0, 15);
  return `RT-UPLOAD-${stamp}`;
}

function buildDraftBody(extracted: ExtractedAgreement, side: "buyer" | "seller") {
  const lawyer = side === "buyer" ? extracted.buyerLawyer : extracted.sellerLawyer;
  const lines = [
    `<p>Hi,</p>`,
    `<p>Following up on the signed ${side === "buyer" ? "buyer" : "seller"} agreement` +
      (extracted.dealAddress ? ` for <strong>${extracted.dealAddress}</strong>` : "") +
      `. Quick recap of the trade record so we&apos;re aligned:</p>`,
    `<ul>`,
    extracted.soldPrice ? `<li>Price: ${extracted.soldPrice}</li>` : "",
    extracted.saleDate ? `<li>Sale date: ${extracted.saleDate}</li>` : "",
    extracted.possessionDate ? `<li>Possession: ${extracted.possessionDate}</li>` : "",
    extracted.condition1Name
      ? `<li>Condition: ${extracted.condition1Name}${extracted.condition1Date ? ` (by ${extracted.condition1Date})` : ""}</li>`
      : "",
    extracted.condition2Name
      ? `<li>Condition: ${extracted.condition2Name}${extracted.condition2Date ? ` (by ${extracted.condition2Date})` : ""}</li>`
      : "",
    lawyer ? `<li>Lawyer of record: ${lawyer}</li>` : "",
    `</ul>`,
    `<p>I&apos;ve set the file up in Drive, the trade record sheet is updated, and the condition + possession reminders are on my calendar. Let me know if anything looks off.</p>`,
    `<p>Thanks,<br>{your name}</p>`,
  ];
  return lines.filter(Boolean).join("\n");
}

function defaultRecipient(side: "buyer" | "seller", extracted: ExtractedAgreement) {
  const lawyerLine = side === "buyer" ? extracted.buyerLawyer : extracted.sellerLawyer;
  const match = lawyerLine && lawyerLine.match(/[a-z0-9._+-]+@[a-z0-9.-]+\.[a-z]{2,}/i);
  if (match) return match[0];
  return side === "buyer" ? "buyer@example.com" : "seller@example.com";
}

export async function runPipeline(
  accessToken: string,
  pdfBytes: Uint8Array,
  originalFileName: string
): Promise<PipelineResult> {
  const extracted = await extractAgreement(pdfBytes);
  const transactionId = inferTransactionId(extracted);
  const side = extracted.side;

  const rootFolderId = await findOrCreateFolder(accessToken, DEMO_FOLDER_NAME);
  const segment = safeFileNameSegment(
    [transactionId, extracted.buyerName || extracted.sellerName, extracted.dealAddress]
      .filter(Boolean)
      .join(" - ")
  );
  const subFolderId = await findOrCreateFolder(accessToken, segment || transactionId, rootFolderId);

  // Per Tammy's May 20, 2026 revisions: agreement PDF lives directly in the
  // transaction folder. The only nested folder is the conditional one based on
  // property type (RMS & Photos for residential, Condo Docs for condo).
  // FINTRAC is handled in conveyancing (out of scope here).
  const propertyType = detectPropertyType(originalFileName, extracted);
  const conditionalSubfolderName = PROPERTY_TYPE_SUBFOLDERS[propertyType];
  const conditionalSubfolderId = await findOrCreateFolder(
    accessToken,
    conditionalSubfolderName,
    subFolderId
  );

  const cleanedName =
    originalFileName ||
    `${side === "buyer" ? "Exclusive Buyer Agreement" : "Listing Agreement"} - ${segment}.pdf`;
  const uploaded = await uploadPdfToFolder(
    accessToken,
    subFolderId,
    cleanedName,
    pdfBytes
  );

  const workbookId = await findOrCreateWorkbook(accessToken, rootFolderId);

  // Seed / refresh the 6-item RequiredDocs checklist for this transaction.
  // Mirrors Apps Script `trdEnsureRequiredDocsSheet` + the requiredDocs config
  // from C:/VFC/tammy-roundtable-demo/src/Config.js (TRD_CONFIG.requiredDocs).
  try {
    await ensureRequiredDocsForTransaction(accessToken, workbookId, transactionId);
  } catch (err) {
    console.error("RequiredDocs seed failed", err);
  }

  const calendarId = await findOrCreateCalendar(accessToken);
  let conditionEventId: string | undefined;
  let possessionEventId: string | undefined;
  const conditionDate = extracted.condition1Date || extracted.condition2Date;
  if (conditionDate) {
    const ev = await createAllDayEvent(
      accessToken,
      calendarId,
      `${transactionId} - Condition reminder`,
      conditionDate,
      `Condition: ${extracted.condition1Name || extracted.condition2Name || ""}`
    );
    conditionEventId = ev.id;
  }
  if (extracted.possessionDate) {
    const ev = await createAllDayEvent(
      accessToken,
      calendarId,
      `${transactionId} - Possession`,
      extracted.possessionDate,
      `Possession for ${extracted.dealAddress}`
    );
    possessionEventId = ev.id;
  }

  const recipient = defaultRecipient(side, extracted);
  const subject = `Trade record ready: ${transactionId}`;
  const body = buildDraftBody(extracted, side);
  let draftUrl: string | undefined;
  try {
    const draft = await createGmailDraft(accessToken, recipient, subject, body);
    draftUrl = gmailDraftUrl(draft.message.id);
  } catch (err) {
    console.error("Gmail draft failed", err);
  }

  await appendTradeRecordRow(accessToken, workbookId, [
    new Date().toISOString(),
    transactionId,
    side,
    extracted.dealAddress,
    extracted.buyerName,
    extracted.sellerName,
    extracted.soldPrice,
    extracted.saleDate,
    extracted.possessionDate,
    extracted.mlsNumber,
    extracted.contractNumber,
    extracted.listingRealtor,
    extracted.sellingRealtor,
    extracted.buyerLawyer,
    extracted.sellerLawyer,
    [extracted.condition1Name, extracted.condition1Date].filter(Boolean).join(" | "),
    [extracted.condition2Name, extracted.condition2Date].filter(Boolean).join(" | "),
    driveFolderUrl(subFolderId),
    uploaded.webViewLink,
    draftUrl || "",
    extracted.summary,
  ]);

  return {
    transactionId,
    side,
    propertyType,
    extracted,
    folderUrl: driveFolderUrl(rootFolderId),
    subfolderUrl: driveFolderUrl(subFolderId),
    conditionalSubfolderUrl: driveFolderUrl(conditionalSubfolderId),
    conditionalSubfolderName,
    spreadsheetUrl: spreadsheetUrl(workbookId),
    pdfUrl: uploaded.webViewLink,
    draftUrl,
    conditionEventId,
    possessionEventId,
  };
}

