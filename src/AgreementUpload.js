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
  const propertyType = trdDetectPropertyType(file.getName(), extracted);
  const subName = TRD_CONFIG.folderConditionalSubfolders[propertyType] || TRD_CONFIG.folderConditionalSubfolders.residential;
  const existingSub = folder.getFoldersByName(subName);
  if (!existingSub.hasNext()) {
    folder.createFolder(subName);
  }
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
    propertyType: propertyType,
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

function trdDetectPropertyType(fileName, extracted) {
  const lower = (fileName || '').toLowerCase();
  if (lower.indexOf('condo') !== -1) return 'condo';
  const summary = (extracted && trdAsString(extracted.summary || '')).toLowerCase();
  if (summary.indexOf('condo') !== -1 || summary.indexOf('condominium') !== -1) return 'condo';
  return 'residential';
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

function doPost(e) {
  return doGet(e);
}

const TRD_GATEWAY_SECRET_PROPERTY = 'TRD_GATEWAY_SECRET';

function trdGatewayResponse(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload, null, 2))
    .setMimeType(ContentService.MimeType.JSON);
}

function trdRequireGatewaySecret(params) {
  const expected = trdGetProperty(TRD_GATEWAY_SECRET_PROPERTY);
  if (!expected) {
    throw new Error('Gateway secret is not configured. Set ' + TRD_GATEWAY_SECRET_PROPERTY + ' in Script Properties first.');
  }
  if (trdAsString(params.secret) !== expected) {
    throw new Error('Bad gateway secret.');
  }
}

function doGet(e) {
  const params = (e && e.parameter) || {};
  try {
    const op = trdAsString(params.op);

    if (!op) {
      return HtmlService.createHtmlOutputFromFile('UploadPage')
        .setTitle('Tammy Roundtable Demo - Signed Agreement Upload')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    }

    if (op === 'bootstrap-secret') {
      const existing = trdGetProperty(TRD_GATEWAY_SECRET_PROPERTY);
      if (existing) {
        return trdGatewayResponse({ ok: false, error: 'Secret already set. Use op=probe with secret param.' });
      }
      const proposed = trdAsString(params.value);
      trdRequire(proposed, 'value is required');
      trdSetProperty(TRD_GATEWAY_SECRET_PROPERTY, proposed);
      return trdGatewayResponse({ ok: true, message: 'Gateway secret installed.' });
    }

    trdRequireGatewaySecret(params);

    if (op === 'probe') {
      return trdGatewayResponse({ ok: true, env: trdProbeEnvironment() });
    }
    if (op === 'setup') {
      return trdGatewayResponse({ ok: true, setup: setupDemoEnvironment() });
    }
    if (op === 'seed') {
      return trdGatewayResponse({ ok: true, seed: seedDemoData() });
    }
    if (op === 'set-key') {
      const value = trdAsString(params.value);
      trdRequire(value, 'value is required');
      return trdGatewayResponse({ ok: true, result: trdSetClaudeApiKey(value) });
    }
    if (op === 'set-model') {
      const value = trdAsString(params.value);
      trdRequire(value, 'value is required');
      trdSetProperty(TRD_CONFIG.propertyKeys.claudeModel, value);
      trdSetProperty(TRD_CONFIG.propertyKeys.claudeExtractionModel, value);
      trdSetProperty(TRD_CONFIG.propertyKeys.claudeDraftModel, value);
      return trdGatewayResponse({ ok: true, model: value });
    }
    if (op === 'extract-raw') {
      const fileId = trdAsString(params.fileId);
      trdRequire(fileId, 'fileId is required');
      const file = DriveApp.getFileById(fileId);
      const sel = trdBuildAgreementSourceSelection(file);
      const doc = trdReadSourceFileForClaude(sel);
      const prompt = 'Read the attached document. List every fact you can see. Return plain text, not JSON.';
      const resp = trdCallClaudeJson('extraction', doc.contentBlocks, prompt);
      return trdGatewayResponse({ ok: true, model: resp.model, text: resp.text });
    }
    if (op === 'extract-debug') {
      const fileId = trdAsString(params.fileId);
      trdRequire(fileId, 'fileId is required');
      const file = DriveApp.getFileById(fileId);
      const sel = trdBuildAgreementSourceSelection(file);
      const doc = trdReadSourceFileForClaude(sel);
      const ex = trdRunClaudeExtraction(doc);
      return trdGatewayResponse({ ok: true, extracted: ex.extracted, model: ex.model });
    }
    if (op === 'claude-ping') {
      const model = trdAsString(params.model) || 'claude-haiku-4-5-20251001';
      trdSetProperty(TRD_CONFIG.propertyKeys.claudeModel, model);
      const blocks = [{ type: 'text', text: 'reply with just the word PONG' }];
      const resp = trdCallClaudeJson('extraction', blocks, 'reply with PONG');
      return trdGatewayResponse({ ok: true, model: resp.model, text: resp.text });
    }
    if (op === 'upload') {
      const fileId = trdAsString(params.fileId);
      trdRequire(fileId, 'fileId is required');
      return trdGatewayResponse({ ok: true, result: runFromAgreementUploadByDriveFileId(fileId) });
    }
    if (op === 'happy-path') {
      const txn = trdAsString(params.transactionId);
      trdRequire(txn, 'transactionId is required');
      return trdGatewayResponse({ ok: true, result: runHappyPathByTransactionId(txn) });
    }
    if (op === 'upload-base64') {
      const base64 = trdAsString(params.value);
      const fileName = trdAsString(params.fileName) || 'uploaded-agreement.pdf';
      const mimeType = trdAsString(params.mimeType) || 'application/pdf';
      trdRequire(base64, 'value (base64) is required');
      return trdGatewayResponse({ ok: true, result: trdProcessUploadedAgreementBase64({ fileBase64: base64, fileName: fileName, mimeType: mimeType }) });
    }
    if (op === 'list-seed-pdfs') {
      const demoFolder = trdEnsureDemoFolder();
      const out = [];
      const files = demoFolder.getFiles();
      while (files.hasNext() && out.length < 20) {
        const f = files.next();
        if (f.getMimeType() === 'application/pdf') {
          out.push({ id: f.getId(), name: f.getName(), url: f.getUrl() });
        }
      }
      const subFolders = demoFolder.getFolders();
      while (subFolders.hasNext() && out.length < 60) {
        const sf = subFolders.next();
        const sfiles = sf.getFiles();
        while (sfiles.hasNext() && out.length < 60) {
          const f = sfiles.next();
          if (f.getMimeType() === 'application/pdf') {
            out.push({ id: f.getId(), name: f.getName(), url: f.getUrl(), folder: sf.getName() });
          }
        }
      }
      return trdGatewayResponse({ ok: true, pdfs: out });
    }
    return trdGatewayResponse({ ok: false, error: 'Unknown op: ' + op });
  } catch (err) {
    return trdGatewayResponse({ ok: false, error: err.message, stack: (err && err.stack) || '' });
  }
}

function trdRunWithBuiltInSamplePdf() {
  const url = 'https://tammy-roundtable-demo.vercel.app/samples/exclusive-buyer-agreement-jordan-patel.pdf';
  const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  if (response.getResponseCode() < 200 || response.getResponseCode() >= 300) {
    throw new Error('Could not fetch sample PDF (' + response.getResponseCode() + ').');
  }
  const blob = response.getBlob();
  const demoFolder = trdEnsureDemoFolder();
  const fileName = 'Exclusive Buyer Agreement - Jordan Patel (sample).pdf';
  const file = demoFolder.createFile(blob.copyBlob().setName(fileName).setContentType('application/pdf'));
  return runFromAgreementUploadByDriveFileId(file.getId());
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

