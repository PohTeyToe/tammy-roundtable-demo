function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu(TRD_CONFIG.menuName)
    .addItem('Setup Demo Environment', 'setupDemoEnvironment')
    .addItem('Seed Demo Data', 'seedDemoData')
    .addSeparator()
    .addItem('Run Extraction', 'runExtractionForSelectedRow')
    .addItem('Approve Review', 'approveReviewForSelectedRow')
    .addItem('Reject Review', 'rejectReviewForSelectedRow')
    .addItem('Reverse Approval', 'reverseApprovalForSelectedRow')
    .addItem('Generate Draft', 'generateDraftForSelectedRow')
    .addToUi();
}

function onEdit(e) {
  if (!e || !e.range) {
    return;
  }
  const sheet = e.range.getSheet();
  if (sheet.getName() !== TRD_CONFIG.sheetNames.intake || e.range.getRow() < 2) {
    return;
  }
  const headerMap = trdGetHeaderMap(sheet);
  const sourceColumns = [headerMap['Source File Link'], headerMap['Source File Id']].filter(Boolean);
  if (!sourceColumns.length) {
    return;
  }
  const editedStart = e.range.getColumn();
  const editedEnd = editedStart + e.range.getNumColumns() - 1;
  const touchedSource = sourceColumns.some(function (column) {
    return column >= editedStart && column <= editedEnd;
  });
  if (!touchedSource) {
    return;
  }
  trdHandleSourceSelectionEdit(sheet, e.range.getRow());
}

function setupDemoEnvironment() {
  trdLogAction({
    phase: TRD_CONFIG.phases.setup,
    rowStatus: '',
    resultSummary: 'Setup started',
  });
  const folder = trdEnsureDemoFolder();
  const form = trdEnsureFormAndIntakeSheet();
  const calendar = trdEnsureDemoCalendar();
  trdEnsureWorkbookStructure();
  trdSetProperty(TRD_CONFIG.propertyKeys.demoFolderId, folder.getId());
  trdSetProperty(TRD_CONFIG.propertyKeys.formId, form.getId());
  trdSetProperty(TRD_CONFIG.propertyKeys.calendarId, calendar.getId());
  trdEnsureReferenceDataSheet();
  trdRefreshDashboardAssets();
  trdLogAction({
    phase: TRD_CONFIG.phases.setup,
    rowStatus: '',
    outputReference: folder.getId(),
    resultSummary: 'Idempotent setup completed',
  });
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
  const intakeSheet = trdGetIntakeSheet();
  const completedSample = TRD_CONFIG.sampleTransactions.completed;
  const liveSample = TRD_CONFIG.sampleTransactions.live;
  const completedRow = trdEnsureSampleResponse(completedSample);
  const liveRow = trdEnsureSampleResponse(liveSample);
  const completedSeed = trdPrepareSeedTransaction(completedSample, completedRow, 'googleDocId');
  const liveSeed = trdPrepareSeedTransaction(liveSample, liveRow, 'pdfId');

  trdUpsertDashboardRow(completedSample, {
    status: TRD_CONFIG.statuses.extractionRequired,
    sourceLabel: 'Seeded Google Doc source',
    attemptNumber: '',
    reviewApproval: 'Pending',
    driveFolderFormula: trdCreateHyperlinkFormula(trdGetFolderUrl(completedSeed.folderId), 'Open package folder'),
    calendarStatus: 'Pending extraction',
    draftStatus: 'Not generated',
    tradeRecordStatus: 'Not generated',
    lastResult: 'Seeded with source documents',
  });
  trdUpsertDashboardRow(liveSample, {
    status: TRD_CONFIG.statuses.extractionRequired,
    sourceLabel: 'Seeded PDF source',
    attemptNumber: '',
    reviewApproval: 'Pending',
    driveFolderFormula: trdCreateHyperlinkFormula(trdGetFolderUrl(liveSeed.folderId), 'Open package folder'),
    calendarStatus: 'Pending extraction',
    draftStatus: 'Not generated',
    tradeRecordStatus: 'Not generated',
    lastResult: 'Seeded with source documents',
  });

  trdLogAction({
    transactionId: completedSample.transactionId,
    phase: TRD_CONFIG.phases.seed,
    rowStatus: TRD_CONFIG.statuses.extractionRequired,
    sourceFileId: completedSeed.sourceId,
    sourceFileLink: completedSeed.sourceLink,
    outputReference: completedSeed.folderId,
    resultSummary: 'Completed sample seeded with source files',
  });
  trdLogAction({
    transactionId: liveSample.transactionId,
    phase: TRD_CONFIG.phases.seed,
    rowStatus: TRD_CONFIG.statuses.extractionRequired,
    sourceFileId: liveSeed.sourceId,
    sourceFileLink: liveSeed.sourceLink,
    outputReference: liveSeed.folderId,
    resultSummary: 'Live sample seeded with source files',
  });

  trdAlert('Seed data is ready. Sample rows now include seeded source documents for extraction.');
  return {
    completedTransactionId: completedSample.transactionId,
    liveTransactionId: liveSample.transactionId,
  };
}

function runExtractionForSelectedRow() {
  const rowNumber = trdGetSelectedRowNumber();
  const result = trdRunExtractionForRow(rowNumber, { source: 'menu' });
  trdAlert(`Extraction completed for ${result.transactionId}.`);
  return result;
}

function approveReviewForSelectedRow() {
  const rowNumber = trdGetSelectedRowNumber();
  const result = trdApproveReviewForRow(rowNumber, { source: 'menu' });
  trdAlert(`Review approved for ${result.transactionId}.`);
  return result;
}

function rejectReviewForSelectedRow() {
  const rowNumber = trdGetSelectedRowNumber();
  const result = trdRejectReviewForRow(rowNumber, { source: 'menu' });
  trdAlert(`Review rejected for ${result.transactionId}.`);
  return result;
}

function reverseApprovalForSelectedRow() {
  const rowNumber = trdGetSelectedRowNumber();
  const result = trdReverseApprovalForRow(rowNumber, { source: 'menu' });
  trdAlert(`Review approval reversed for ${result.transactionId}.`);
  return result;
}

function generateDraftForSelectedRow() {
  const rowNumber = trdGetSelectedRowNumber();
  const result = trdGenerateDraftForRow(rowNumber, { source: 'menu' });
  trdAlert(`Draft generated for ${result.transactionId}.`);
  return result;
}

function runExtractionByTransactionId(transactionId) {
  const rowNumber = trdFindIntakeRowByTransactionId(transactionId);
  if (rowNumber === -1) {
    throw new Error(`No intake row found for transaction ID ${transactionId}.`);
  }
  return trdRunExtractionForRow(rowNumber, { source: 'clasp-run' });
}

function approveReviewByTransactionId(transactionId) {
  const rowNumber = trdFindIntakeRowByTransactionId(transactionId);
  if (rowNumber === -1) {
    throw new Error(`No intake row found for transaction ID ${transactionId}.`);
  }
  return trdApproveReviewForRow(rowNumber, { source: 'clasp-run' });
}

function rejectReviewByTransactionId(transactionId) {
  const rowNumber = trdFindIntakeRowByTransactionId(transactionId);
  if (rowNumber === -1) {
    throw new Error(`No intake row found for transaction ID ${transactionId}.`);
  }
  return trdRejectReviewForRow(rowNumber, { source: 'clasp-run' });
}

function reverseApprovalByTransactionId(transactionId) {
  const rowNumber = trdFindIntakeRowByTransactionId(transactionId);
  if (rowNumber === -1) {
    throw new Error(`No intake row found for transaction ID ${transactionId}.`);
  }
  return trdReverseApprovalForRow(rowNumber, { source: 'clasp-run' });
}

function generateDraftByTransactionId(transactionId) {
  const rowNumber = trdFindIntakeRowByTransactionId(transactionId);
  if (rowNumber === -1) {
    throw new Error(`No intake row found for transaction ID ${transactionId}.`);
  }
  return trdGenerateDraftForRow(rowNumber, { source: 'clasp-run' });
}

function runHappyPathByTransactionId(transactionId) {
  const extraction = runExtractionByTransactionId(transactionId);
  approveReviewByTransactionId(transactionId);
  const draft = generateDraftByTransactionId(transactionId);
  return {
    transactionId: transactionId,
    extraction: extraction,
    draft: draft,
  };
}

function runGenerateTransactionPackageByTransactionId(transactionId) {
  return runHappyPathByTransactionId(transactionId);
}

function rerunTransactionPackageByTransactionId(transactionId) {
  return runHappyPathByTransactionId(transactionId);
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

function trdPrepareSeedTransaction(sampleTransaction, rowNumber, sourceKey) {
  const intakeSheet = trdGetIntakeSheet();
  const folder = trdCreateOrReuseTransactionFolder(sampleTransaction, '');
  const sourceIds = trdEnsureSampleSourceFiles(sampleTransaction, folder);
  const sourceId = sourceIds[sourceKey];
  const sourceLink = trdGetFileUrl(sourceId);
  trdClearExtractedFieldsForRow(intakeSheet, rowNumber);
  trdWriteCommonRowState(intakeSheet, rowNumber, {
    'Processing Status': TRD_CONFIG.statuses.extractionRequired,
    'Source File Link': sourceLink,
    'Source File Id': sourceId,
    'Source File Name': '',
    'Source File Mime Type': '',
    'Source File Modified At': '',
    'Package Folder Id': folder.getId(),
    'Package Folder Link': trdGetFolderUrl(folder.getId()),
    'Condition Event Id': '',
    'Possession Event Id': '',
    'Current Attempt Id': '',
    'Current Attempt Number': '',
    'Extraction Timestamp': '',
    'Extraction Model Label': '',
    'Extraction Summary': '',
    'Extraction Pass/Fail': '',
    'Missing Field Summary': '',
    'Review Approved At': '',
    'Gmail Draft Link': '',
    'Gmail Draft Id': '',
    'Draft Model Label': '',
    'Trade Record Row': '',
    'Last Result': 'Seeded with source files. Run extraction to begin the current attempt.',
    'Last Error': '',
  });
  return {
    folderId: folder.getId(),
    sourceId: sourceId,
    sourceLink: sourceLink,
  };
}

function trdRunExtractionForRow(rowNumber) {
  const intakeSheet = trdGetIntakeSheet();
  if (rowNumber < 2) {
    throw new Error('Select a data row, not the header row.');
  }
  const rowObject = trdGetRowObject(intakeSheet, rowNumber);
  const transaction = trdBuildTransactionRecordFromRow(rowObject, rowNumber);
  trdRequire(transaction.transactionId, `Transaction ID is required on row ${rowNumber}.`);
  trdRequire(transaction.clientEmail, `Client email is required on row ${rowNumber}.`);

  let sourceSelection;
  try {
    sourceSelection = trdResolveSourceFileSelection(rowObject);
  } catch (error) {
    trdInvalidateRowForSource(intakeSheet, rowNumber, rowObject, TRD_CONFIG.statuses.sourceMissing, `Selected source file could not be resolved: ${error.message}`);
    throw error;
  }
  if (!sourceSelection) {
    trdInvalidateRowForSource(intakeSheet, rowNumber, rowObject, TRD_CONFIG.statuses.sourceMissing, 'Select a source file before running extraction.');
    throw new Error('Select a source file before running extraction.');
  }

  const attemptId = trdCreateAttemptId();
  const attemptNumber = trdGetNextAttemptNumber(rowObject);
  const folder = trdCreateOrReuseTransactionFolder(transaction, trdAsString(rowObject['Package Folder Id']));
  const lastRunAt = new Date();
  trdClearExtractedFieldsForRow(intakeSheet, rowNumber);
  trdWriteCommonRowState(intakeSheet, rowNumber, {
    'Processing Status': TRD_CONFIG.statuses.runningExtraction,
    'Source File Link': sourceSelection.link,
    'Source File Id': sourceSelection.fileId,
    'Source File Name': sourceSelection.fileName,
    'Source File Mime Type': sourceSelection.mimeType,
    'Source File Modified At': sourceSelection.modifiedAt,
    'Package Folder Id': folder.getId(),
    'Package Folder Link': trdGetFolderUrl(folder.getId()),
    'Current Attempt Id': attemptId,
    'Current Attempt Number': attemptNumber,
    'Extraction Timestamp': '',
    'Extraction Model Label': '',
    'Extraction Summary': '',
    'Extraction Pass/Fail': '',
    'Missing Field Summary': '',
    'Review Approved At': '',
    'Gmail Draft Link': '',
    'Gmail Draft Id': '',
    'Draft Model Label': '',
    'Trade Record Row': '',
    'Last Result': 'Extraction started',
    'Last Error': '',
    'Last Run At': lastRunAt,
  });
  trdLogAction({
    transactionId: transaction.transactionId,
    attemptId: attemptId,
    attemptNumber: attemptNumber,
    phase: TRD_CONFIG.phases.extraction,
    rowStatus: TRD_CONFIG.statuses.runningExtraction,
    sourceFileId: sourceSelection.fileId,
    sourceFileLink: sourceSelection.link,
    outputReference: folder.getId(),
    resultSummary: 'Extraction started',
  });

  const docSummary = trdUpsertRequiredDocs(transaction);
  const calendarResult = trdCreateOrReuseCalendarEvents(transaction, {
    conditionEventId: trdAsString(rowObject['Condition Event Id']),
    possessionEventId: trdAsString(rowObject['Possession Event Id']),
  });
  trdLogAction({
    transactionId: transaction.transactionId,
    attemptId: attemptId,
    attemptNumber: attemptNumber,
    phase: TRD_CONFIG.phases.extraction,
    rowStatus: TRD_CONFIG.statuses.runningExtraction,
    sourceFileId: sourceSelection.fileId,
    sourceFileLink: sourceSelection.link,
    outputReference: [calendarResult.conditionEventId, calendarResult.possessionEventId].filter(Boolean).join(' | '),
    resultSummary: 'Calendar reminders refreshed',
  });

  try {
    const sourceDocument = trdReadSourceFileForClaude(sourceSelection);
    const extractionResponse = trdRunClaudeExtraction(sourceDocument);
    const extracted = extractionResponse.extracted;
    extracted.condition1 = [trdAsString(extracted.condition1Name), trdNormalizeMaybeDate(extracted.condition1Date)].filter(Boolean).join(' | ');
    extracted.condition2 = [trdAsString(extracted.condition2Name), trdNormalizeMaybeDate(extracted.condition2Date)].filter(Boolean).join(' | ');
    const missingFields = trdGetMissingExtractionFields(extracted);
    const missingSummary = trdMissingFieldsSummary(missingFields);
    const extractionValues = trdGetExtractedRowValues(extracted);
    trdSetRowValuesByHeader(intakeSheet, rowNumber, extractionValues);

    if (missingFields.length) {
      trdPersistExtractionFailure(intakeSheet, rowNumber, transaction, {
        attemptId: attemptId,
        attemptNumber: attemptNumber,
        sourceSelection: sourceSelection,
        folder: folder,
        calendarResult: calendarResult,
        docSummary: docSummary,
        model: extractionResponse.model,
        summary: extracted.summary || 'Extraction failed the minimum-field check.',
        missingSummary: missingSummary,
        errorText: missingSummary,
      });
      throw new Error(missingSummary);
    }

    trdLogAction({
      transactionId: transaction.transactionId,
      attemptId: attemptId,
      attemptNumber: attemptNumber,
      phase: TRD_CONFIG.phases.extraction,
      rowStatus: TRD_CONFIG.statuses.extracted,
      sourceFileId: sourceSelection.fileId,
      sourceFileLink: sourceSelection.link,
      outputReference: '',
      resultSummary: extracted.summary || 'Extraction succeeded',
    });

    const derived = {
      attemptId: attemptId,
      attemptNumber: attemptNumber,
      sourceFileFormula: trdCreateHyperlinkFormula(sourceSelection.link, sourceSelection.fileName),
      sourceFileLabel: sourceDocument.displayLabel,
      packageFolderFormula: trdCreateHyperlinkFormula(trdGetFolderUrl(folder.getId()), 'Open package folder'),
      draftFormula: '',
      extractionSummary: extracted.summary || 'Extraction succeeded',
    };
    const tradeRecordRow = trdUpsertTradeRecord(transaction, extracted, derived);

    trdWriteCommonRowState(intakeSheet, rowNumber, {
      'Processing Status': TRD_CONFIG.statuses.readyForReview,
      'Source File Link': sourceSelection.link,
      'Source File Id': sourceSelection.fileId,
      'Source File Name': sourceSelection.fileName,
      'Source File Mime Type': sourceSelection.mimeType,
      'Source File Modified At': sourceSelection.modifiedAt,
      'Package Folder Id': folder.getId(),
      'Package Folder Link': trdGetFolderUrl(folder.getId()),
      'Condition Event Id': calendarResult.conditionEventId || '',
      'Possession Event Id': calendarResult.possessionEventId || '',
      'Current Attempt Id': attemptId,
      'Current Attempt Number': attemptNumber,
      'Extraction Timestamp': new Date(),
      'Extraction Model Label': extractionResponse.model,
      'Extraction Summary': extracted.summary || 'Extraction succeeded',
      'Extraction Pass/Fail': 'Pass',
      'Missing Field Summary': missingSummary,
      'Review Approved At': '',
      'Trade Record Row': tradeRecordRow,
      'Last Result': 'Extraction complete. Ready for review.',
      'Last Error': '',
    });
    trdUpsertDashboardRow(transaction, {
      status: TRD_CONFIG.statuses.readyForReview,
      sourceLabel: sourceDocument.displayLabel,
      attemptNumber: attemptNumber,
      reviewApproval: 'Pending',
      driveFolderFormula: trdCreateHyperlinkFormula(trdGetFolderUrl(folder.getId()), 'Open package folder'),
      calendarStatus: calendarResult.conditionEventId || calendarResult.possessionEventId ? 'Calendar Ready' : 'No dates available',
      draftStatus: 'Not generated',
      tradeRecordStatus: `Trade Record Row ${tradeRecordRow}`,
      lastResult: extracted.summary || 'Extraction complete. Ready for review.',
    });
    trdLogAction({
      transactionId: transaction.transactionId,
      attemptId: attemptId,
      attemptNumber: attemptNumber,
      phase: TRD_CONFIG.phases.extraction,
      rowStatus: TRD_CONFIG.statuses.readyForReview,
      sourceFileId: sourceSelection.fileId,
      sourceFileLink: sourceSelection.link,
      outputReference: String(tradeRecordRow),
      resultSummary: 'Extraction complete. Ready for review.',
    });
    return {
      transactionId: transaction.transactionId,
      attemptId: attemptId,
      attemptNumber: attemptNumber,
      tradeRecordRow: tradeRecordRow,
      requiredDocsStatus: docSummary,
    };
  } catch (error) {
    if (!trdAsString(trdGetRowObject(intakeSheet, rowNumber)['Extraction Pass/Fail'])) {
      trdPersistExtractionFailure(intakeSheet, rowNumber, transaction, {
        attemptId: attemptId,
        attemptNumber: attemptNumber,
        sourceSelection: sourceSelection,
        folder: folder,
        calendarResult: calendarResult,
        docSummary: docSummary,
        model: '',
        summary: 'Extraction failed',
        missingSummary: '',
        errorText: error.message,
      });
    }
    throw error;
  }
}

function trdApproveReviewForRow(rowNumber) {
  const intakeSheet = trdGetIntakeSheet();
  const rowObject = trdGetRowObject(intakeSheet, rowNumber);
  const transaction = trdBuildTransactionRecordFromRow(rowObject, rowNumber);
  if (trdAsString(rowObject['Processing Status']) !== TRD_CONFIG.statuses.readyForReview) {
    throw new Error('Review can only be approved from Ready For Review.');
  }
  if (!trdAsString(rowObject['Current Attempt Id'])) {
    throw new Error('No current attempt exists on this row.');
  }
  const sourceSelection = trdEnsureSourceStillCurrent(intakeSheet, rowNumber, rowObject);
  const approvedAt = new Date();
  trdWriteCommonRowState(intakeSheet, rowNumber, {
    'Processing Status': TRD_CONFIG.statuses.readyForReview,
    'Review Approved At': approvedAt,
    'Last Result': 'Review approved. Draft generation is now allowed.',
    'Last Error': '',
  });
  trdUpsertDashboardRow(transaction, {
    status: TRD_CONFIG.statuses.readyForReview,
    sourceLabel: trdAsString(rowObject['Source File Name']) || sourceSelection.fileName,
    attemptNumber: rowObject['Current Attempt Number'],
    reviewApproval: `Approved ${trdFormatTimestamp(approvedAt)}`,
    driveFolderFormula: trdCreateHyperlinkFormula(trdAsString(rowObject['Package Folder Link']), 'Open package folder'),
    calendarStatus: trdAsString(rowObject['Condition Event Id']) || trdAsString(rowObject['Possession Event Id']) ? 'Calendar Ready' : 'No dates available',
    draftStatus: trdAsString(rowObject['Gmail Draft Id']) ? 'Draft Ready To Refresh' : 'Not generated',
    tradeRecordStatus: trdAsString(rowObject['Trade Record Row']) ? `Trade Record Row ${rowObject['Trade Record Row']}` : 'Not generated',
    lastResult: 'Review approved. Draft generation is now allowed.',
  });
  trdLogAction({
    transactionId: transaction.transactionId,
    attemptId: trdAsString(rowObject['Current Attempt Id']),
    attemptNumber: trdAsString(rowObject['Current Attempt Number']),
    phase: TRD_CONFIG.phases.review,
    rowStatus: TRD_CONFIG.statuses.readyForReview,
    sourceFileId: sourceSelection.fileId,
    sourceFileLink: sourceSelection.link,
    outputReference: '',
    resultSummary: 'Review approved',
  });
  return {
    transactionId: transaction.transactionId,
    approvedAt: approvedAt,
  };
}

function trdRejectReviewForRow(rowNumber) {
  const intakeSheet = trdGetIntakeSheet();
  const rowObject = trdGetRowObject(intakeSheet, rowNumber);
  const transaction = trdBuildTransactionRecordFromRow(rowObject, rowNumber);
  if (trdAsString(rowObject['Processing Status']) !== TRD_CONFIG.statuses.readyForReview) {
    throw new Error('Review can only be rejected from Ready For Review.');
  }
  const sourceSelection = trdEnsureSourceStillCurrent(intakeSheet, rowNumber, rowObject);
  trdWriteCommonRowState(intakeSheet, rowNumber, {
    'Processing Status': TRD_CONFIG.statuses.reviewRejected,
    'Review Approved At': '',
    'Last Result': 'Review rejected. Run extraction again on the same row after fixing the source context.',
    'Last Error': '',
  });
  trdUpsertDashboardRow(transaction, {
    status: TRD_CONFIG.statuses.reviewRejected,
    sourceLabel: trdAsString(rowObject['Source File Name']) || sourceSelection.fileName,
    attemptNumber: rowObject['Current Attempt Number'],
    reviewApproval: 'Rejected',
    driveFolderFormula: trdCreateHyperlinkFormula(trdAsString(rowObject['Package Folder Link']), 'Open package folder'),
    calendarStatus: trdAsString(rowObject['Condition Event Id']) || trdAsString(rowObject['Possession Event Id']) ? 'Calendar Ready' : 'No dates available',
    draftStatus: 'Blocked by rejected review',
    tradeRecordStatus: trdAsString(rowObject['Trade Record Row']) ? `Trade Record Row ${rowObject['Trade Record Row']}` : 'Not generated',
    lastResult: 'Review rejected. Run extraction again on the same row.',
  });
  trdLogAction({
    transactionId: transaction.transactionId,
    attemptId: trdAsString(rowObject['Current Attempt Id']),
    attemptNumber: trdAsString(rowObject['Current Attempt Number']),
    phase: TRD_CONFIG.phases.review,
    rowStatus: TRD_CONFIG.statuses.reviewRejected,
    sourceFileId: sourceSelection.fileId,
    sourceFileLink: sourceSelection.link,
    outputReference: '',
    resultSummary: 'Review rejected',
  });
  return {
    transactionId: transaction.transactionId,
  };
}

function trdReverseApprovalForRow(rowNumber) {
  const intakeSheet = trdGetIntakeSheet();
  const rowObject = trdGetRowObject(intakeSheet, rowNumber);
  const transaction = trdBuildTransactionRecordFromRow(rowObject, rowNumber);
  if (trdAsString(rowObject['Processing Status']) !== TRD_CONFIG.statuses.readyForReview) {
    throw new Error('Approval can only be reversed while the row is Ready For Review.');
  }
  if (!trdAsString(rowObject['Review Approved At'])) {
    throw new Error('There is no review approval to reverse on this row.');
  }
  const sourceSelection = trdEnsureSourceStillCurrent(intakeSheet, rowNumber, rowObject);
  trdWriteCommonRowState(intakeSheet, rowNumber, {
    'Processing Status': TRD_CONFIG.statuses.readyForReview,
    'Review Approved At': '',
    'Last Result': 'Review approval reversed. Re-approve before generating a draft.',
    'Last Error': '',
  });
  trdUpsertDashboardRow(transaction, {
    status: TRD_CONFIG.statuses.readyForReview,
    sourceLabel: trdAsString(rowObject['Source File Name']) || sourceSelection.fileName,
    attemptNumber: rowObject['Current Attempt Number'],
    reviewApproval: 'Pending',
    driveFolderFormula: trdCreateHyperlinkFormula(trdAsString(rowObject['Package Folder Link']), 'Open package folder'),
    calendarStatus: trdAsString(rowObject['Condition Event Id']) || trdAsString(rowObject['Possession Event Id']) ? 'Calendar Ready' : 'No dates available',
    draftStatus: 'Not generated',
    tradeRecordStatus: trdAsString(rowObject['Trade Record Row']) ? `Trade Record Row ${rowObject['Trade Record Row']}` : 'Not generated',
    lastResult: 'Review approval reversed. Re-approve before generating a draft.',
  });
  trdLogAction({
    transactionId: transaction.transactionId,
    attemptId: trdAsString(rowObject['Current Attempt Id']),
    attemptNumber: trdAsString(rowObject['Current Attempt Number']),
    phase: TRD_CONFIG.phases.review,
    rowStatus: TRD_CONFIG.statuses.readyForReview,
    sourceFileId: sourceSelection.fileId,
    sourceFileLink: sourceSelection.link,
    outputReference: '',
    resultSummary: 'Review approval reversed',
  });
  return {
    transactionId: transaction.transactionId,
  };
}

function trdGenerateDraftForRow(rowNumber) {
  const intakeSheet = trdGetIntakeSheet();
  const rowObject = trdGetRowObject(intakeSheet, rowNumber);
  const transaction = trdBuildTransactionRecordFromRow(rowObject, rowNumber);
  const status = trdAsString(rowObject['Processing Status']);
  const allowedStatuses = [
    TRD_CONFIG.statuses.readyForReview,
    TRD_CONFIG.statuses.draftFailed,
    TRD_CONFIG.statuses.draftGenerated,
  ];
  if (allowedStatuses.indexOf(status) === -1) {
    throw new Error('Draft generation is only allowed from Ready For Review, Draft Failed, or Draft Generated.');
  }
  if (!trdAsString(rowObject['Review Approved At'])) {
    throw new Error('Approve review before generating a draft.');
  }
  const sourceSelection = trdEnsureSourceStillCurrent(intakeSheet, rowNumber, rowObject);
  const extracted = trdBuildExtractedRecordFromRow(rowObject);
  const missingFields = trdGetMissingExtractionFields(extracted);
  if (missingFields.length) {
    throw new Error(`Cannot generate draft because the extracted facts are incomplete: ${trdMissingFieldsSummary(missingFields)}`);
  }

  trdWriteCommonRowState(intakeSheet, rowNumber, {
    'Processing Status': TRD_CONFIG.statuses.runningDraft,
    'Last Result': 'Draft generation started',
    'Last Error': '',
  });
  trdLogAction({
    transactionId: transaction.transactionId,
    attemptId: trdAsString(rowObject['Current Attempt Id']),
    attemptNumber: trdAsString(rowObject['Current Attempt Number']),
    phase: TRD_CONFIG.phases.draft,
    rowStatus: TRD_CONFIG.statuses.runningDraft,
    sourceFileId: sourceSelection.fileId,
    sourceFileLink: sourceSelection.link,
    outputReference: trdAsString(rowObject['Gmail Draft Id']),
    resultSummary: 'Draft generation started',
  });

  try {
    const sourceDocument = trdReadSourceFileForClaude(sourceSelection);
    const draftResponse = trdRunClaudeDraft(sourceDocument, extracted, transaction);
    const draftResult = trdCreateOrReuseDraftFromContent(transaction, trdAsString(rowObject['Gmail Draft Id']), draftResponse.payload);
    const draftLink = trdGetDraftUrl(draftResult.draftId);
    const tradeRecordRow = trdUpsertTradeRecord(transaction, extracted, {
      attemptId: trdAsString(rowObject['Current Attempt Id']),
      attemptNumber: trdAsString(rowObject['Current Attempt Number']),
      sourceFileFormula: trdCreateHyperlinkFormula(sourceSelection.link, sourceSelection.fileName),
      sourceFileLabel: sourceDocument.displayLabel,
      packageFolderFormula: trdCreateHyperlinkFormula(trdAsString(rowObject['Package Folder Link']), 'Open package folder'),
      draftFormula: trdCreateHyperlinkFormula(draftLink, draftResult.updatedExisting ? 'Open refreshed draft' : 'Open draft'),
      extractionSummary: trdAsString(rowObject['Extraction Summary']),
    });
    trdWriteCommonRowState(intakeSheet, rowNumber, {
      'Processing Status': TRD_CONFIG.statuses.draftGenerated,
      'Gmail Draft Link': draftLink,
      'Gmail Draft Id': draftResult.draftId,
      'Draft Model Label': draftResponse.model,
      'Trade Record Row': tradeRecordRow,
      'Last Result': draftResponse.payload.summary || 'Draft generated successfully.',
      'Last Error': '',
    });
    trdUpsertDashboardRow(transaction, {
      status: TRD_CONFIG.statuses.draftGenerated,
      sourceLabel: sourceDocument.displayLabel,
      attemptNumber: rowObject['Current Attempt Number'],
      reviewApproval: `Approved ${trdFormatTimestamp(rowObject['Review Approved At'])}`,
      driveFolderFormula: trdCreateHyperlinkFormula(trdAsString(rowObject['Package Folder Link']), 'Open package folder'),
      calendarStatus: trdAsString(rowObject['Condition Event Id']) || trdAsString(rowObject['Possession Event Id']) ? 'Calendar Ready' : 'No dates available',
      draftStatus: draftResult.updatedExisting ? 'Draft Updated' : draftResult.createdNew ? 'Draft Created' : 'Draft Reused',
      tradeRecordStatus: `Trade Record Row ${tradeRecordRow}`,
      lastResult: draftResponse.payload.summary || 'Draft generated successfully.',
    });
    trdLogAction({
      transactionId: transaction.transactionId,
      attemptId: trdAsString(rowObject['Current Attempt Id']),
      attemptNumber: trdAsString(rowObject['Current Attempt Number']),
      phase: TRD_CONFIG.phases.draft,
      rowStatus: TRD_CONFIG.statuses.draftGenerated,
      sourceFileId: sourceSelection.fileId,
      sourceFileLink: sourceSelection.link,
      outputReference: draftResult.draftId,
      resultSummary: draftResult.updatedExisting ? 'Draft updated in place' : 'Draft generated successfully',
    });
    return {
      transactionId: transaction.transactionId,
      draftId: draftResult.draftId,
      tradeRecordRow: tradeRecordRow,
    };
  } catch (error) {
    trdWriteCommonRowState(intakeSheet, rowNumber, {
      'Processing Status': TRD_CONFIG.statuses.draftFailed,
      'Last Result': 'Draft generation failed',
      'Last Error': error.message,
    });
    trdUpsertDashboardRow(transaction, {
      status: TRD_CONFIG.statuses.draftFailed,
      sourceLabel: trdAsString(rowObject['Source File Name']) || sourceSelection.fileName,
      attemptNumber: rowObject['Current Attempt Number'],
      reviewApproval: `Approved ${trdFormatTimestamp(rowObject['Review Approved At'])}`,
      driveFolderFormula: trdCreateHyperlinkFormula(trdAsString(rowObject['Package Folder Link']), 'Open package folder'),
      calendarStatus: trdAsString(rowObject['Condition Event Id']) || trdAsString(rowObject['Possession Event Id']) ? 'Calendar Ready' : 'No dates available',
      draftStatus: 'Draft Failed',
      tradeRecordStatus: trdAsString(rowObject['Trade Record Row']) ? `Trade Record Row ${rowObject['Trade Record Row']}` : 'Not generated',
      lastResult: error.message,
    });
    trdLogAction({
      transactionId: transaction.transactionId,
      attemptId: trdAsString(rowObject['Current Attempt Id']),
      attemptNumber: trdAsString(rowObject['Current Attempt Number']),
      phase: TRD_CONFIG.phases.draft,
      rowStatus: TRD_CONFIG.statuses.draftFailed,
      sourceFileId: sourceSelection.fileId,
      sourceFileLink: sourceSelection.link,
      outputReference: trdAsString(rowObject['Gmail Draft Id']),
      resultSummary: 'Draft generation failed',
      errorText: error.message,
    });
    throw error;
  }
}

function trdPersistExtractionFailure(sheet, rowNumber, transaction, context) {
  trdWriteCommonRowState(sheet, rowNumber, {
    'Processing Status': TRD_CONFIG.statuses.extractionRequired,
    'Source File Link': context.sourceSelection.link,
    'Source File Id': context.sourceSelection.fileId,
    'Source File Name': context.sourceSelection.fileName,
    'Source File Mime Type': context.sourceSelection.mimeType,
    'Source File Modified At': context.sourceSelection.modifiedAt,
    'Package Folder Id': context.folder.getId(),
    'Package Folder Link': trdGetFolderUrl(context.folder.getId()),
    'Condition Event Id': context.calendarResult.conditionEventId || '',
    'Possession Event Id': context.calendarResult.possessionEventId || '',
    'Current Attempt Id': context.attemptId,
    'Current Attempt Number': context.attemptNumber,
    'Extraction Timestamp': new Date(),
    'Extraction Model Label': context.model || '',
    'Extraction Summary': context.summary,
    'Extraction Pass/Fail': 'Fail',
    'Missing Field Summary': context.missingSummary,
    'Review Approved At': '',
    'Gmail Draft Link': '',
    'Gmail Draft Id': '',
    'Draft Model Label': '',
    'Trade Record Row': '',
    'Last Result': context.summary,
    'Last Error': context.errorText,
  });
  trdUpsertDashboardRow(transaction, {
    status: TRD_CONFIG.statuses.extractionRequired,
    sourceLabel: context.sourceSelection.fileName,
    attemptNumber: context.attemptNumber,
    reviewApproval: 'Pending',
    driveFolderFormula: trdCreateHyperlinkFormula(trdGetFolderUrl(context.folder.getId()), 'Open package folder'),
    calendarStatus: context.calendarResult.conditionEventId || context.calendarResult.possessionEventId ? 'Calendar Ready' : 'No dates available',
    draftStatus: 'Blocked by extraction failure',
    tradeRecordStatus: 'Not generated',
    lastResult: context.errorText,
  });
  trdLogAction({
    transactionId: transaction.transactionId,
    attemptId: context.attemptId,
    attemptNumber: context.attemptNumber,
    phase: TRD_CONFIG.phases.extraction,
    rowStatus: TRD_CONFIG.statuses.extractionRequired,
    sourceFileId: context.sourceSelection.fileId,
    sourceFileLink: context.sourceSelection.link,
    outputReference: '',
    resultSummary: context.summary,
    errorText: context.errorText,
  });
}

function trdEnsureSourceStillCurrent(sheet, rowNumber, rowObject) {
  const status = trdAsString(rowObject['Processing Status']);
  const sourceSelection = trdResolveSourceFileSelection(rowObject);
  if (!sourceSelection) {
    trdInvalidateRowForSource(sheet, rowNumber, rowObject, TRD_CONFIG.statuses.sourceMissing, 'Source selection was cleared. Reselect a source file and rerun extraction.');
    throw new Error('Source selection was cleared. Reselect a source file and rerun extraction.');
  }
  const storedFileId = trdAsString(rowObject['Source File Id']);
  const storedModifiedAt = trdFormatTimestamp(rowObject['Source File Modified At']);
  const currentModifiedAt = trdFormatTimestamp(sourceSelection.modifiedAt);
  if (storedFileId && storedFileId !== sourceSelection.fileId) {
    trdInvalidateRowForSource(sheet, rowNumber, rowObject, TRD_CONFIG.statuses.sourceChanged, 'Source file changed. Run extraction again before continuing.');
    throw new Error('Source file changed. Run extraction again before continuing.');
  }
  if (storedModifiedAt && currentModifiedAt && storedModifiedAt !== currentModifiedAt) {
    trdInvalidateRowForSource(sheet, rowNumber, rowObject, TRD_CONFIG.statuses.sourceChanged, 'Source document was modified after extraction. Run extraction again.');
    throw new Error('Source document was modified after extraction. Run extraction again.');
  }
  if (status === TRD_CONFIG.statuses.sourceChanged || status === TRD_CONFIG.statuses.sourceMissing) {
    throw new Error('Run extraction again before continuing because the source lineage is no longer current.');
  }
  return sourceSelection;
}

function trdHandleSourceSelectionEdit(sheet, rowNumber) {
  const rowObject = trdGetRowObject(sheet, rowNumber);
  const sourceId = trdParseDriveFileId(rowObject['Source File Id'] || rowObject['Source File Link']);
  if (!sourceId) {
    trdInvalidateRowForSource(sheet, rowNumber, rowObject, TRD_CONFIG.statuses.sourceMissing, 'Source selection cleared. Reselect a source file and rerun extraction.');
    return;
  }
  trdSetRowValuesByHeader(sheet, rowNumber, {
    'Source File Id': sourceId,
  });
  const status = trdAsString(rowObject['Processing Status']);
  const invalidates = [
    TRD_CONFIG.statuses.readyForReview,
    TRD_CONFIG.statuses.reviewRejected,
    TRD_CONFIG.statuses.draftGenerated,
    TRD_CONFIG.statuses.draftFailed,
  ];
  if (invalidates.indexOf(status) !== -1) {
    trdInvalidateRowForSource(sheet, rowNumber, rowObject, TRD_CONFIG.statuses.sourceChanged, 'Source selection changed. Run extraction again before review or draft work continues.');
    return;
  }
  trdWriteCommonRowState(sheet, rowNumber, {
    'Processing Status': TRD_CONFIG.statuses.extractionRequired,
    'Last Result': 'Source selection updated. Run extraction to begin the current attempt.',
    'Last Error': '',
  });
}

function trdInvalidateRowForSource(sheet, rowNumber, rowObject, nextStatus, message) {
  trdClearExtractedFieldsForRow(sheet, rowNumber);
  trdWriteCommonRowState(sheet, rowNumber, {
    'Processing Status': nextStatus,
    'Source File Name': '',
    'Source File Mime Type': '',
    'Source File Modified At': '',
    'Extraction Timestamp': '',
    'Extraction Model Label': '',
    'Extraction Summary': '',
    'Extraction Pass/Fail': '',
    'Missing Field Summary': '',
    'Review Approved At': '',
    'Gmail Draft Link': '',
    'Gmail Draft Id': '',
    'Draft Model Label': '',
    'Trade Record Row': '',
    'Last Result': message,
    'Last Error': '',
  });
  trdLogAction({
    transactionId: trdAsString(rowObject['Transaction ID']),
    attemptId: trdAsString(rowObject['Current Attempt Id']),
    attemptNumber: trdAsString(rowObject['Current Attempt Number']),
    phase: TRD_CONFIG.phases.source,
    rowStatus: nextStatus,
    sourceFileId: trdAsString(rowObject['Source File Id']),
    sourceFileLink: trdAsString(rowObject['Source File Link']),
    outputReference: '',
    resultSummary: message,
  });
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
