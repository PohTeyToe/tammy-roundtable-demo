function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu(TRD_CONFIG.menuName)
    .addItem('Setup Demo Environment', 'setupDemoEnvironment')
    .addItem('Seed Demo Data', 'seedDemoData')
    .addSeparator()
    .addItem('Generate Transaction Package', 'generateTransactionPackageForSelectedRow')
    .addItem('Rerun Selected Transaction', 'rerunSelectedTransactionPackage')
    .addToUi();
}

function setupDemoEnvironment() {
  trdLogAction('', 'Setup Demo Environment', 'started', '', '');
  const folder = trdEnsureDemoFolder();
  const form = trdEnsureFormAndIntakeSheet();
  const calendar = trdEnsureDemoCalendar();
  trdEnsureWorkbookStructure();
  trdSetProperty(TRD_CONFIG.propertyKeys.demoFolderId, folder.getId());
  trdSetProperty(TRD_CONFIG.propertyKeys.formId, form.getId());
  trdSetProperty(TRD_CONFIG.propertyKeys.calendarId, calendar.getId());
  trdEnsureReferenceDataSheet();
  trdRefreshDashboardAssets();
  trdLogAction('', 'Setup Demo Environment', 'success', folder.getId(), 'Idempotent setup completed.');
  trdAlert('Demo environment is ready.');
  return {
    folderId: folder.getId(),
    formId: form.getId(),
    calendarId: calendar.getId(),
    spreadsheetId: trdGetSpreadsheet().getId(),
  };
}

function seedDemoData() {
  setupDemoEnvironment();
  const completedSample = TRD_CONFIG.sampleTransactions.completed;
  const liveSample = TRD_CONFIG.sampleTransactions.live;
  const completedRow = trdEnsureSampleResponse(completedSample);
  const liveRow = trdEnsureSampleResponse(liveSample);
  const intakeSheet = trdGetIntakeSheet();
  trdSetRowValuesByHeader(intakeSheet, completedRow, {
    'Processing Status': 'Seeded fallback sample',
    'Last Run Result': 'Ready for fallback walkthrough',
  });
  trdSetRowValuesByHeader(intakeSheet, liveRow, {
    'Processing Status': 'Intake Received',
    'Last Run Result': 'Ready for live generation',
  });
  trdUpsertDashboardRow(
    {
      transactionId: liveSample.transactionId,
      transactionName: `${liveSample.buyer1} - ${liveSample.dealAddress}`,
    },
    {
      currentStep: 'Intake Received',
      requiredDocsStatus: '',
      driveFolderFormula: '',
      calendarStatus: 'Pending operator action',
      emailDraftStatus: 'Pending operator action',
      tradeRecordStatus: 'Pending operator action',
      lastActionResult: 'Ready for live generation',
      lastRunAt: '',
    }
  );
  trdGenerateTransactionPackageByTransactionId(completedSample.transactionId, { allowRerun: true, source: 'seed' });
  trdLogAction(completedSample.transactionId, 'Seed Demo Data', 'success', '', '');
  trdLogAction(liveSample.transactionId, 'Seed Demo Data', 'success', '', '');
  trdAlert('Seed data is ready. Completed sample and live sample are both in the workbook.');
  return {
    completedTransactionId: completedSample.transactionId,
    liveTransactionId: liveSample.transactionId,
  };
}

function generateTransactionPackageForSelectedRow() {
  const rowNumber = trdGetSelectedRowNumber();
  const result = trdGenerateTransactionPackageForRow(rowNumber, { allowRerun: false, source: 'menu' });
  trdAlert(`Generated transaction package for ${result.transactionId}.`);
  return result;
}

function rerunSelectedTransactionPackage() {
  const rowNumber = trdGetSelectedRowNumber();
  const result = trdGenerateTransactionPackageForRow(rowNumber, { allowRerun: true, source: 'menu-rerun' });
  trdAlert(`Reran transaction package for ${result.transactionId}.`);
  return result;
}

function runGenerateTransactionPackageByTransactionId(transactionId) {
  return trdGenerateTransactionPackageByTransactionId(transactionId, { allowRerun: false, source: 'clasp-run' });
}

function rerunTransactionPackageByTransactionId(transactionId) {
  return trdGenerateTransactionPackageByTransactionId(transactionId, { allowRerun: true, source: 'clasp-run-rerun' });
}

function trdGenerateTransactionPackageByTransactionId(transactionId, options) {
  const rowNumber = trdFindIntakeRowByTransactionId(transactionId);
  if (rowNumber === -1) {
    throw new Error(`No intake row found for transaction ID ${transactionId}.`);
  }
  return trdGenerateTransactionPackageForRow(rowNumber, options);
}

function trdEnsureSampleResponse(sampleTransaction) {
  const existingRow = trdFindIntakeRowByTransactionId(sampleTransaction.transactionId);
  if (existingRow !== -1) {
    return existingRow;
  }

  const formId = trdRequire(trdGetProperty(TRD_CONFIG.propertyKeys.formId), 'Form ID is missing. Run setup first.');
  const form = FormApp.openById(formId);
  const itemsByTitle = {};
  form.getItems().forEach(function (item) {
    itemsByTitle[item.getTitle()] = item;
  });

  const response = form.createResponse();
  TRD_CONFIG.formFields.forEach(function (field) {
    const item = itemsByTitle[field.title];
    if (!item) {
      throw new Error(`Missing form item ${field.title}.`);
    }
    const value = sampleTransaction[field.key];
    if (field.type === 'date' && value) {
      response.withItemResponse(item.asDateItem().createResponse(trdParseDate(value)));
    } else if (field.type === 'paragraph') {
      response.withItemResponse(item.asParagraphTextItem().createResponse(trdAsString(value)));
    } else {
      response.withItemResponse(item.asTextItem().createResponse(trdAsString(value)));
    }
  });
  response.submit();
  Utilities.sleep(1200);
  trdEnsureTransactionIntakeColumns();
  return trdFindIntakeRowByTransactionId(sampleTransaction.transactionId);
}

function trdGenerateTransactionPackageForRow(rowNumber, options) {
  const intakeSheet = trdGetIntakeSheet();
  if (rowNumber < 2) {
    throw new Error('Select a data row, not the header row.');
  }

  const rowObject = trdGetRowObject(intakeSheet, rowNumber);
  const transaction = trdBuildTransactionRecordFromRow(rowObject, rowNumber);
  trdRequire(transaction.transactionId, `Transaction ID is required on row ${rowNumber}.`);
  trdRequire(transaction.dealAddress, `Deal address is required on row ${rowNumber}.`);
  trdRequire(transaction.clientEmail, `Client email is required on row ${rowNumber}.`);

  if (!options.allowRerun && trdAsString(rowObject['Package Folder Id'])) {
    throw new Error(`Transaction ${transaction.transactionId} already has a generated package. Use rerun if you need to refresh it.`);
  }

  const lastRunAt = new Date();
  trdSetRowValuesByHeader(intakeSheet, rowNumber, {
    'Processing Status': 'Running',
    'Last Run At': lastRunAt,
    'Last Run Result': 'Started',
  });
  trdLogAction(transaction.transactionId, 'Generate Transaction Package', 'started', '', '');

  try {
    const folder = trdCreateOrReuseTransactionFolder(transaction, rowObject['Package Folder Id']);
    trdLogAction(transaction.transactionId, 'Drive Folder', 'success', folder.getId(), '');

    const docSummary = trdUpsertRequiredDocs(transaction);
    trdLogAction(transaction.transactionId, 'Required Docs', 'success', docSummary, '');

    const calendarResult = trdCreateOrReuseCalendarEvents(transaction, {
      conditionEventId: trdAsString(rowObject['Condition Event Id']),
      possessionEventId: trdAsString(rowObject['Possession Event Id']),
    });
    trdLogAction(
      transaction.transactionId,
      'Calendar',
      'success',
      [calendarResult.conditionEventId, calendarResult.possessionEventId].filter(Boolean).join(' | '),
      calendarResult.updatedExisting ? 'Existing event refreshed.' : calendarResult.recreated ? 'Missing event recreated.' : calendarResult.deleted ? 'Missing-date event removed.' : ''
    );

    const draftResult = trdCreateOrReuseDraft(transaction, trdAsString(rowObject['Gmail Draft Id']));
    trdLogAction(transaction.transactionId, 'Gmail Draft', 'success', draftResult.draftId, draftResult.updatedExisting ? 'Existing draft refreshed.' : 'New draft created.');

    const derived = {
      brokerageName: trdGetReferenceValue('brokerageName'),
      depositHolderText: trdGetReferenceValue('depositHolderText'),
      listingCommissionText: trdGetReferenceValue('listingCommissionText'),
      sellingCommissionText: trdGetReferenceValue('sellingCommissionText'),
      operatorNotes: transaction.operatorNotes,
      packageFolderFormula: trdCreateHyperlinkFormula(trdGetFolderUrl(folder.getId()), 'Open package folder'),
      draftStatus: draftResult.createdNew ? 'Draft Created' : draftResult.updatedExisting ? 'Draft Updated' : 'Draft Reused',
      transactionId: transaction.transactionId,
      buyer1: transaction.buyer1,
      seller1: transaction.seller1,
      dealAddress: transaction.dealAddress,
      soldPrice: transaction.soldPrice,
      saleDate: transaction.saleDate,
      possessionDate: transaction.possessionDate,
      mlsNumber: transaction.mlsNumber,
      contractNumber: transaction.contractNumber,
      condition1: transaction.condition1,
      condition2: transaction.condition2,
      listingRealtor: transaction.listingRealtor,
      sellingRealtor: transaction.sellingRealtor,
    };
    const tradeRecordRow = trdUpsertTradeRecord(transaction, derived);
    trdLogAction(transaction.transactionId, 'Trade Record', 'success', String(tradeRecordRow), '');

    trdSetRowValuesByHeader(intakeSheet, rowNumber, {
      'Processing Status': 'Package Generated',
      'Package Folder Id': folder.getId(),
      'Package Folder Link': trdGetFolderUrl(folder.getId()),
      'Condition Event Id': calendarResult.conditionEventId || '',
      'Possession Event Id': calendarResult.possessionEventId || '',
      'Gmail Draft Id': draftResult.draftId,
      'Trade Record Row': tradeRecordRow,
      'Last Run At': lastRunAt,
      'Last Run Result': options.allowRerun ? 'Rerun completed' : 'Generated successfully',
    });

    trdUpsertDashboardRow(transaction, {
      currentStep: 'Package Generated',
      requiredDocsStatus: docSummary,
      driveFolderFormula: trdCreateHyperlinkFormula(trdGetFolderUrl(folder.getId()), 'Open package folder'),
      calendarStatus:
        calendarResult.conditionEventId || calendarResult.possessionEventId
          ? calendarResult.updatedExisting || calendarResult.recreated || calendarResult.deleted
            ? 'Calendar Refreshed'
            : 'Calendar Ready'
          : 'No dates available',
      emailDraftStatus: draftResult.createdNew ? 'Draft Created' : draftResult.updatedExisting ? 'Draft Updated' : 'Draft Reused',
      tradeRecordStatus: `Trade Record Row ${tradeRecordRow}`,
      lastActionResult: options.allowRerun ? 'Rerun completed' : 'Generated successfully',
      lastRunAt: trdFormatTimestamp(lastRunAt),
    });

    return {
      transactionId: transaction.transactionId,
      folderId: folder.getId(),
      draftId: draftResult.draftId,
      tradeRecordRow: tradeRecordRow,
      requiredDocsStatus: docSummary,
    };
  } catch (error) {
    trdSetRowValuesByHeader(intakeSheet, rowNumber, {
      'Processing Status': 'Error',
      'Last Run At': lastRunAt,
      'Last Run Result': error.message,
    });
    trdUpsertDashboardRow(transaction, {
      currentStep: 'Error',
      requiredDocsStatus: '',
      driveFolderFormula: '',
      calendarStatus: '',
      emailDraftStatus: '',
      tradeRecordStatus: '',
      lastActionResult: error.message,
      lastRunAt: trdFormatTimestamp(lastRunAt),
    });
    trdLogAction(transaction.transactionId, 'Generate Transaction Package', 'error', '', error.message);
    throw error;
  }
}

function trdUpsertRequiredDocs(transaction) {
  const sheet = trdEnsureSheet(TRD_CONFIG.sheetNames.requiredDocs);
  const headerMap = trdGetHeaderMap(sheet);
  const lastRow = sheet.getLastRow();
  const existingRows = {};

  if (lastRow >= 2) {
    const values = sheet.getRange(2, 1, lastRow - 1, 6).getValues();
    values.forEach(function (row, index) {
      if (trdNormalizeKey(row[0]) === trdNormalizeKey(transaction.transactionId)) {
        existingRows[trdNormalizeKey(row[2])] = index + 2;
      }
    });
  }

  const preset = TRD_CONFIG.sampleDocStatusPresets[transaction.sampleProfile] || {};

  TRD_CONFIG.requiredDocs.forEach(function (doc) {
    const rowNumber = existingRows[trdNormalizeKey(doc.name)] || sheet.getLastRow() + 1;
    const status = preset[doc.name] || 'Expected';
    sheet.getRange(rowNumber, headerMap['Transaction ID'], 1, 6).setValues([[
      transaction.transactionId,
      doc.category,
      doc.name,
      status,
      status === 'Missing' ? 'Left visible on purpose for demo review.' : '',
      new Date(),
    ]]);
  });

  return trdSummarizeRequiredDocs(transaction.transactionId);
}
