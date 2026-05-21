function runFromAgreementUploadByDriveFileId(driveFileId) {
  trdRequire(driveFileId, 'driveFileId is required');
  const file = DriveApp.getFileById(driveFileId);
  const sourceSelection = trdBuildAgreementSourceSelection(file);

  trdLogAction({
    phase: 'AgreementUpload',
    rowStatus: '',
    sourceFileId: driveFileId,
    sourceFileLink: file.getUrl(),
    resultSummary: 'Agreement upload started',
  });

  const sourceDocument = trdReadSourceFileForClaude(sourceSelection);
  const extractionResponse = trdRunClaudeExtraction(sourceDocument);
  const extracted = extractionResponse.extracted || {};

  const side = trdDetectAgreementSide(file.getName(), extracted);
  const transactionId = trdAsString(extracted.transactionId) || trdGenerateAgreementTransactionId();
  const clientEmail = trdResolveAgreementClientEmail(side, extracted);

  const synthetic = {
    transactionId: transactionId,
    dealAddress: trdAsString(extracted.dealAddress) || 'TBD',
    seller1: trdAsString(extracted.sellerName) || 'TBD',
    buyer1: trdAsString(extracted.buyerName) || 'TBD',
    soldPrice: trdAsString(extracted.soldPrice) || 'TBD',
    saleDate: trdAsString(extracted.saleDate) || trdFormatDate(new Date()),
    possessionDate: trdAsString(extracted.possessionDate) || trdFormatDate(new Date()),
    mlsNumber: trdAsString(extracted.mlsNumber) || 'TBD',
    contractNumber: trdAsString(extracted.contractNumber) || transactionId,
    condition1Name: trdAsString(extracted.condition1Name),
    condition1Date: trdAsString(extracted.condition1Date),
    condition2Name: trdAsString(extracted.condition2Name),
    condition2Date: trdAsString(extracted.condition2Date),
    listingRealtor: trdAsString(extracted.listingRealtor) || 'TBD',
    sellingRealtor: trdAsString(extracted.sellingRealtor) || 'TBD',
    sellerLawyer: trdAsString(extracted.sellerLawyer) || 'TBD',
    buyerLawyer: trdAsString(extracted.buyerLawyer) || 'TBD',
    clientEmail: clientEmail,
    operatorNotes: 'Created from uploaded ' + side + ' agreement: ' + file.getName(),
    sampleProfile: 'live',
  };

  trdEnsureSampleResponse(synthetic);
  const intakeSheet = trdGetIntakeSheet();
  const rowNumber = trdFindIntakeRowByTransactionId(transactionId);
  if (rowNumber === -1) {
    throw new Error('Could not find intake row for transaction ' + transactionId + ' after submitting agreement.');
  }

  const folder = trdCreateOrReuseTransactionFolder(synthetic, '');
  trdMoveFileToFolderIfNeeded(file, folder);

  trdSetRowValuesByHeader(intakeSheet, rowNumber, {
    'Source File Id': file.getId(),
    'Source File Link': file.getUrl(),
    'Source File Name': file.getName(),
    'Source File Mime Type': file.getMimeType(),
    'Source File Modified At': file.getLastUpdated(),
    'Package Folder Id': folder.getId(),
    'Package Folder Link': trdGetFolderUrl(folder.getId()),
    'Processing Status': TRD_CONFIG.statuses.extractionRequired,
    'Last Result': 'Agreement uploaded. Running extraction.',
  });

  const happyPath = runHappyPathByTransactionId(transactionId);

  trdLogAction({
    transactionId: transactionId,
    phase: 'AgreementUpload',
    rowStatus: TRD_CONFIG.statuses.draftGenerated,
    sourceFileId: driveFileId,
    sourceFileLink: file.getUrl(),
    outputReference: folder.getId(),
    resultSummary: 'Agreement upload complete',
  });

  return {
    transactionId: transactionId,
    side: side,
    folderId: folder.getId(),
    folderUrl: trdGetFolderUrl(folder.getId()),
    sourceFileId: file.getId(),
    sourceFileUrl: file.getUrl(),
    draftId: happyPath.draft && happyPath.draft.draftId,
    draftUrl: happyPath.draft && happyPath.draft.draftId ? trdGetDraftUrl(happyPath.draft.draftId) : '',
    tradeRecordRow: happyPath.draft && happyPath.draft.tradeRecordRow,
    spreadsheetUrl: trdGetSpreadsheet().getUrl(),
  };
}

function trdBuildAgreementSourceSelection(file) {
  return {
    fileId: file.getId(),
    file: file,
    fileName: file.getName(),
    mimeType: file.getMimeType(),
    modifiedAt: file.getLastUpdated(),
    link: file.getUrl(),
  };
}

function trdDetectAgreementSide(fileName, extracted) {
  const lower = (fileName || '').toLowerCase();
  if (lower.indexOf('buyer') !== -1) return 'buyer';
  if (lower.indexOf('seller') !== -1) return 'seller';
  if (lower.indexOf('listing') !== -1) return 'seller';
  if (extracted && trdAsString(extracted.sellingRealtor)) return 'buyer';
  if (extracted && trdAsString(extracted.listingRealtor)) return 'seller';
  return 'buyer';
}

function trdResolveAgreementClientEmail(side, extracted) {
  const fromExtraction = trdAsString(extracted && extracted.clientEmail);
  if (fromExtraction && fromExtraction.indexOf('@') !== -1) {
    return fromExtraction;
  }
  if (side === 'seller') return 'seller@example.com';
  return 'buyer@example.com';
}

function trdSetClaudeApiKey(apiKey) {
  trdRequire(apiKey, 'apiKey is required');
  trdSetProperty(TRD_CONFIG.propertyKeys.claudeApiKey, apiKey);
  return { ok: true, isOAuth: apiKey.indexOf('sk-ant-oat') === 0 };
}

function trdProbeEnvironment() {
  return {
    hasClaudeKey: Boolean(trdGetProperty(TRD_CONFIG.propertyKeys.claudeApiKey)),
    isOAuth: (trdGetProperty(TRD_CONFIG.propertyKeys.claudeApiKey) || '').indexOf('sk-ant-oat') === 0,
    demoFolderId: trdGetProperty(TRD_CONFIG.propertyKeys.demoFolderId),
    formId: trdGetProperty(TRD_CONFIG.propertyKeys.formId),
    calendarId: trdGetProperty(TRD_CONFIG.propertyKeys.calendarId),
    spreadsheetUrl: trdGetSpreadsheet().getUrl(),
    userEmail: Session.getActiveUser().getEmail(),
  };
}

function trdGenerateAgreementTransactionId() {
  const stamp = Utilities.formatDate(new Date(), TRD_CONFIG.timeZone, 'yyyyMMdd-HHmmss');
  return 'RT-UPLOAD-' + stamp;
}

function doGet(e) {
  const params = (e && e.parameter) || {};
  if (params.fileId) {
    const result = runFromAgreementUploadByDriveFileId(params.fileId);
    return ContentService.createTextOutput(JSON.stringify(result, null, 2))
      .setMimeType(ContentService.MimeType.JSON);
  }
  return HtmlService.createHtmlOutputFromFile('UploadPage')
    .setTitle('Tammy Roundtable Demo - Signed Agreement Upload')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function trdProcessUploadedAgreementBase64(payload) {
  const base64 = payload && payload.fileBase64;
  trdRequire(base64, 'fileBase64 is required');
  const mime = (payload.mimeType && payload.mimeType.indexOf('/') !== -1) ? payload.mimeType : 'application/pdf';
  const fileName = trdAsString(payload.fileName) || 'uploaded-agreement.pdf';
  const demoFolder = trdEnsureDemoFolder();
  const blob = Utilities.newBlob(Utilities.base64Decode(base64), mime, fileName);
  const file = demoFolder.createFile(blob);
  return runFromAgreementUploadByDriveFileId(file.getId());
}

