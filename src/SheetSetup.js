function trdEnsureWorkbookStructure() {
  trdEnsureReferenceDataSheet();
  trdEnsureRequiredDocsSheet();
  trdEnsureTradeRecordSheet();
  trdEnsureDashboardSheet();
  trdEnsureActionLogSheet();
  trdEnsureTransactionIntakeColumns();
}

function trdEnsureReferenceDataSheet() {
  const sheet = trdEnsureSheet(TRD_CONFIG.sheetNames.referenceData);
  trdEnsureHeaders(sheet, 1, ['Key', 'Value', 'Description']);
  trdUpsertRowsByFirstColumn(sheet, TRD_CONFIG.referenceRows, 2);
  const assetRows = [
    ['asset.demoFolderId', trdGetProperty(TRD_CONFIG.propertyKeys.demoFolderId) || '', 'Dedicated demo folder ID'],
    ['asset.formId', trdGetProperty(TRD_CONFIG.propertyKeys.formId) || '', 'Dedicated demo form ID'],
    ['asset.calendarId', trdGetProperty(TRD_CONFIG.propertyKeys.calendarId) || '', 'Dedicated demo calendar ID'],
    ['asset.workbookId', trdGetSpreadsheet().getId(), 'Bound workbook ID'],
    ['config.claudeApiUrl', trdGetProperty(TRD_CONFIG.propertyKeys.claudeApiUrl) || TRD_CONFIG.defaultClaudeConfig.apiUrl, 'Claude Messages API endpoint'],
    ['config.claudeModel', trdGetProperty(TRD_CONFIG.propertyKeys.claudeModel) || TRD_CONFIG.defaultClaudeConfig.model, 'Default Claude model'],
  ];
  trdUpsertRowsByFirstColumn(sheet, assetRows, 2);
  sheet.autoResizeColumns(1, 3);
}

function trdEnsureRequiredDocsSheet() {
  const sheet = trdEnsureSheet(TRD_CONFIG.sheetNames.requiredDocs);
  trdEnsureHeaders(sheet, 1, TRD_CONFIG.requiredDocsHeaders);
  sheet.autoResizeColumns(1, TRD_CONFIG.requiredDocsHeaders.length);
}

function trdEnsureActionLogSheet() {
  const sheet = trdEnsureSheet(TRD_CONFIG.sheetNames.actionLog);
  trdEnsureHeaders(sheet, 1, TRD_CONFIG.actionLogHeaders);
  sheet.autoResizeColumns(1, TRD_CONFIG.actionLogHeaders.length);
}

function trdEnsureDashboardSheet() {
  const sheet = trdEnsureSheet(TRD_CONFIG.sheetNames.dashboard);
  sheet.getRange('A1').setValue('Tammy Roundtable Demo Dashboard').setFontSize(14).setFontWeight('bold');
  sheet.getRange('A2').setValue('Strict-live roundtable support surface. Sample data only. Gmail draft only. No auto-send.');
  trdEnsureHeaders(sheet, 4, TRD_CONFIG.dashboardAssetHeaders);
  trdEnsureHeaders(sheet, 8, TRD_CONFIG.dashboardTableHeaders);
  trdRefreshDashboardAssets();
  sheet.setColumnWidths(1, 10, 190);
}

function trdRefreshDashboardAssets() {
  const sheet = trdEnsureSheet(TRD_CONFIG.sheetNames.dashboard);
  const formId = trdGetProperty(TRD_CONFIG.propertyKeys.formId) || '';
  const folderId = trdGetProperty(TRD_CONFIG.propertyKeys.demoFolderId) || '';
  const calendarId = trdGetProperty(TRD_CONFIG.propertyKeys.calendarId) || '';
  const spreadsheetId = trdGetSpreadsheet().getId();
  const apiConfigured = trdGetProperty(TRD_CONFIG.propertyKeys.claudeApiKey) ? 'Configured' : 'Missing';
  const assetRows = [
    ['Workbook', spreadsheetId ? 'Ready' : 'Missing', trdCreateHyperlinkFormula(trdGetSpreadsheet().getUrl(), 'Open workbook'), 'Bound spreadsheet'],
    ['Demo Form', formId ? 'Ready' : 'Missing', formId ? trdCreateHyperlinkFormula(FormApp.openById(formId).getPublishedUrl(), 'Open form') : '', 'Google Form intake'],
    ['Demo Folder', folderId ? 'Ready' : 'Missing', folderId ? trdCreateHyperlinkFormula(trdGetFolderUrl(folderId), 'Open folder') : '', 'Dedicated Drive container'],
    ['Demo Calendar', calendarId ? 'Ready' : 'Missing', calendarId || '', 'Dedicated calendar ID'],
    ['Claude Runtime', apiConfigured, trdGetProperty(TRD_CONFIG.propertyKeys.claudeExtractionModel) || trdGetProperty(TRD_CONFIG.propertyKeys.claudeModel) || TRD_CONFIG.defaultClaudeConfig.model, 'Script properties drive runtime AI config'],
  ];
  sheet.getRange(5, 1, assetRows.length, 4).setValues(assetRows);
}

function trdEnsureTradeRecordSheet() {
  const sheet = trdEnsureSheet(TRD_CONFIG.sheetNames.tradeRecord);
  sheet.getRange('A1').setValue('Trade Record Output').setFontSize(14).setFontWeight('bold');
  sheet.getRange('A2').setValue('Normalized extraction preview plus attempt-aware output row.');
  TRD_CONFIG.tradeRecordPreviewRows.forEach(function (row, index) {
    sheet.getRange(4 + index, 1).setValue(row[0]).setFontWeight('bold');
    if (!trdAsString(sheet.getRange(4 + index, 2).getValue())) {
      sheet.getRange(4 + index, 2).setValue('');
    }
  });
  trdEnsureHeaders(sheet, 21, TRD_CONFIG.tradeRecordHeaders);
  sheet.setColumnWidths(1, 21, 180);
}

function trdEnsureTransactionIntakeColumns() {
  const sheet = trdGetSheet(TRD_CONFIG.sheetNames.intake);
  if (!sheet) {
    return;
  }
  const expectedHeaders = ['Timestamp']
    .concat(
      TRD_CONFIG.formFields.map(function (field) {
        return field.title;
      })
    )
    .concat(TRD_CONFIG.intakeInternalColumns)
    .concat(trdGetExtractedFieldHeaders());
  const lastColumn = Math.max(sheet.getLastColumn(), 1);
  const currentHeaders = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
  let nextColumn = currentHeaders.filter(Boolean).length + 1;
  expectedHeaders.forEach(function (header) {
    if (currentHeaders.indexOf(header) === -1) {
      sheet.getRange(1, nextColumn).setValue(header);
      currentHeaders[nextColumn - 1] = header;
      nextColumn += 1;
    }
  });
  sheet.getRange(1, 1, 1, sheet.getLastColumn()).setFontWeight('bold').setBackground('#dfe7ef');
  sheet.setFrozenRows(1);
}

function trdUpsertDashboardRow(transaction, payload) {
  const sheet = trdEnsureSheet(TRD_CONFIG.sheetNames.dashboard);
  const rowNumber = trdFindRowByValue(sheet, 'Transaction ID', transaction.transactionId);
  const targetRow = rowNumber === -1 ? Math.max(9, sheet.getLastRow() + 1) : rowNumber;
  const sourceLabel = payload.sourceLabel || '';
  const attemptLabel = payload.attemptNumber ? `Attempt ${payload.attemptNumber}` : '';
  const row = [[
    transaction.transactionId,
    payload.status || '',
    sourceLabel,
    attemptLabel,
    payload.reviewApproval || '',
    payload.driveFolderFormula || '',
    payload.calendarStatus || '',
    payload.draftStatus || '',
    payload.tradeRecordStatus || '',
    payload.lastResult || '',
  ]];
  sheet.getRange(targetRow, 1, 1, row[0].length).setValues(row);
}

function trdUpsertTradeRecord(transaction, extracted, derived) {
  const sheet = trdEnsureSheet(TRD_CONFIG.sheetNames.tradeRecord);
  const previewValues = TRD_CONFIG.tradeRecordPreviewRows.map(function (row) {
    const key = row[1];
    let value = derived[key];
    if (key.toLowerCase().indexOf('date') !== -1) {
      value = trdNormalizeMaybeDate(value);
    }
    return [row[0], value || ''];
  });
  sheet.getRange(4, 1, previewValues.length, 2).setValues(previewValues);

  const rowNumber = trdFindRowByValue(sheet, 'Transaction ID', transaction.transactionId);
  const targetRow = rowNumber === -1 ? Math.max(22, sheet.getLastRow() + 1) : rowNumber;
  const row = [[
    transaction.transactionId,
    derived.attemptNumber,
    derived.attemptId,
    derived.sourceFileFormula,
    extracted.buyerName,
    extracted.sellerName,
    extracted.dealAddress,
    extracted.soldPrice,
    extracted.saleDate,
    extracted.possessionDate,
    extracted.listingRealtor,
    extracted.sellingRealtor,
    extracted.condition1,
    extracted.condition2,
    extracted.sellerLawyer,
    extracted.buyerLawyer,
    extracted.mlsNumber,
    extracted.contractNumber,
    derived.packageFolderFormula,
    derived.draftFormula,
    derived.extractionSummary,
  ]];
  sheet.getRange(targetRow, 1, 1, row[0].length).setValues(row);
  return targetRow;
}

function trdSummarizeRequiredDocs(transactionId) {
  const sheet = trdEnsureSheet(TRD_CONFIG.sheetNames.requiredDocs);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return 'Expected 0 / Received 0 / Missing 0';
  }
  const values = sheet.getRange(2, 1, lastRow - 1, 6).getValues().filter(function (row) {
    return trdNormalizeKey(row[0]) === trdNormalizeKey(transactionId);
  });
  const counts = trdCountStatuses(values);
  return `Expected ${counts.Expected} / Received ${counts.Received} / Missing ${counts.Missing}`;
}
