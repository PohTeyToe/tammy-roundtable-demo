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
  ];
  trdUpsertRowsByFirstColumn(sheet, assetRows, 2);
  sheet.autoResizeColumns(1, 3);
}

function trdEnsureRequiredDocsSheet() {
  const sheet = trdEnsureSheet(TRD_CONFIG.sheetNames.requiredDocs);
  if (sheet.getLastRow() === 0) {
    trdEnsureHeaders(sheet, 1, TRD_CONFIG.requiredDocsHeaders);
  } else {
    trdEnsureHeaders(sheet, 1, TRD_CONFIG.requiredDocsHeaders);
  }
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
  sheet.getRange('A2').setValue('Safe demo surface. Sample data only. Gmail draft only. No auto-send.');
  trdEnsureHeaders(sheet, 4, TRD_CONFIG.dashboardAssetHeaders);
  trdEnsureHeaders(sheet, 8, TRD_CONFIG.dashboardTableHeaders);
  trdRefreshDashboardAssets();
  sheet.setColumnWidths(1, 10, 180);
}

function trdRefreshDashboardAssets() {
  const sheet = trdEnsureSheet(TRD_CONFIG.sheetNames.dashboard);
  const formId = trdGetProperty(TRD_CONFIG.propertyKeys.formId) || '';
  const folderId = trdGetProperty(TRD_CONFIG.propertyKeys.demoFolderId) || '';
  const calendarId = trdGetProperty(TRD_CONFIG.propertyKeys.calendarId) || '';
  const spreadsheetId = trdGetSpreadsheet().getId();
  const assetRows = [
    ['Workbook', spreadsheetId ? 'Ready' : 'Missing', trdCreateHyperlinkFormula(trdGetSpreadsheet().getUrl(), 'Open workbook'), 'Bound spreadsheet'],
    ['Demo Form', formId ? 'Ready' : 'Missing', formId ? trdCreateHyperlinkFormula(FormApp.openById(formId).getPublishedUrl(), 'Open form') : '', 'Google Form intake'],
    ['Demo Folder', folderId ? 'Ready' : 'Missing', folderId ? trdCreateHyperlinkFormula(trdGetFolderUrl(folderId), 'Open folder') : '', 'Dedicated Drive container'],
    ['Demo Calendar', calendarId ? 'Ready' : 'Missing', calendarId || '', 'Dedicated calendar ID'],
  ];
  sheet.getRange(5, 1, assetRows.length, 4).setValues(assetRows);
}

function trdEnsureTradeRecordSheet() {
  const sheet = trdEnsureSheet(TRD_CONFIG.sheetNames.tradeRecord);
  sheet.getRange('A1').setValue('Trade Record Output').setFontSize(14).setFontWeight('bold');
  sheet.getRange('A2').setValue('Simplified export-ready preview plus normalized table output.');
  TRD_CONFIG.tradeRecordPreviewRows.forEach(function (row, index) {
    sheet.getRange(4 + index, 1).setValue(row[0]).setFontWeight('bold');
    if (!trdAsString(sheet.getRange(4 + index, 2).getValue())) {
      sheet.getRange(4 + index, 2).setValue('');
    }
  });
  trdEnsureHeaders(sheet, 21, TRD_CONFIG.tradeRecordHeaders);
  sheet.setColumnWidths(1, 22, 180);
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
    .concat(TRD_CONFIG.intakeInternalColumns);
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
  const row = [[
    transaction.transactionId,
    transaction.transactionName,
    payload.currentStep || '',
    payload.requiredDocsStatus || '',
    payload.driveFolderFormula || '',
    payload.calendarStatus || '',
    payload.emailDraftStatus || '',
    payload.tradeRecordStatus || '',
    payload.lastActionResult || '',
    payload.lastRunAt || '',
  ]];
  sheet.getRange(targetRow, 1, 1, row[0].length).setValues(row);
}

function trdUpsertTradeRecord(transaction, derived) {
  const sheet = trdEnsureSheet(TRD_CONFIG.sheetNames.tradeRecord);
  const previewValues = TRD_CONFIG.tradeRecordPreviewRows.map(function (row) {
    const key = row[1];
    let value = derived[key];
    if (key === 'saleDate' || key === 'possessionDate') {
      value = trdFormatDate(value);
    }
    return [row[0], value || ''];
  });
  sheet.getRange(4, 1, previewValues.length, 2).setValues(previewValues);

  const rowNumber = trdFindRowByValue(sheet, 'Transaction ID', transaction.transactionId);
  const targetRow = rowNumber === -1 ? Math.max(22, sheet.getLastRow() + 1) : rowNumber;
  const row = [[
    transaction.transactionId,
    transaction.buyer1,
    transaction.seller1,
    transaction.dealAddress,
    transaction.soldPrice,
    trdFormatDate(transaction.saleDate),
    trdFormatDate(transaction.possessionDate),
    transaction.mlsNumber,
    transaction.contractNumber,
    transaction.condition1,
    transaction.condition2,
    transaction.listingRealtor,
    transaction.sellingRealtor,
    transaction.sellerLawyer,
    transaction.buyerLawyer,
    derived.depositHolderText,
    derived.brokerageName,
    derived.listingCommissionText,
    derived.sellingCommissionText,
    transaction.operatorNotes,
    derived.packageFolderFormula,
    derived.draftStatus,
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
