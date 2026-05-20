function trdEnsureDemoFolder() {
  const existingId = trdGetProperty(TRD_CONFIG.propertyKeys.demoFolderId);
  if (existingId) {
    try {
      return DriveApp.getFolderById(existingId);
    } catch (error) {
      trdLogAction({
        phase: TRD_CONFIG.phases.setup,
        rowStatus: '',
        outputReference: existingId,
        resultSummary: 'Demo folder lookup warning',
        errorText: error.message,
      });
    }
  }

  const spreadsheetFile = DriveApp.getFileById(trdGetSpreadsheet().getId());
  const parents = spreadsheetFile.getParents();
  const parentFolder = parents.hasNext() ? parents.next() : DriveApp.getRootFolder();
  const matchingFolders = parentFolder.getFoldersByName(TRD_CONFIG.demoFolderName);
  const folder = matchingFolders.hasNext() ? matchingFolders.next() : parentFolder.createFolder(TRD_CONFIG.demoFolderName);
  trdSetProperty(TRD_CONFIG.propertyKeys.demoFolderId, folder.getId());
  trdMoveFileToFolderIfNeeded(spreadsheetFile, folder);
  return folder;
}

function trdMoveFileToFolderIfNeeded(file, folder) {
  try {
    const parents = file.getParents();
    let alreadyInFolder = false;
    while (parents.hasNext()) {
      if (parents.next().getId() === folder.getId()) {
        alreadyInFolder = true;
        break;
      }
    }
    if (!alreadyInFolder) {
      file.moveTo(folder);
    }
  } catch (error) {
    trdLogAction({
      phase: TRD_CONFIG.phases.setup,
      rowStatus: '',
      outputReference: file.getId(),
      resultSummary: 'Move file warning',
      errorText: error.message,
    });
  }
}

function trdEnsureFormAndIntakeSheet() {
  const existingId = trdGetProperty(TRD_CONFIG.propertyKeys.formId);
  let form = null;

  if (existingId) {
    try {
      form = FormApp.openById(existingId);
    } catch (error) {
      trdLogAction({
        phase: TRD_CONFIG.phases.setup,
        rowStatus: '',
        outputReference: existingId,
        resultSummary: 'Demo form lookup warning',
        errorText: error.message,
      });
    }
  }

  if (!form) {
    form = FormApp.create(TRD_CONFIG.formTitle);
    trdSetProperty(TRD_CONFIG.propertyKeys.formId, form.getId());
  }

  form.setTitle(TRD_CONFIG.formTitle);
  form.setDescription(TRD_CONFIG.formDescription);
  form.setCollectEmail(false);
  form.setLimitOneResponsePerUser(false);
  trdSyncFormItems(form);

  const spreadsheetId = trdGetSpreadsheet().getId();
  if (form.getDestinationId() !== spreadsheetId) {
    form.setDestination(FormApp.DestinationType.SPREADSHEET, spreadsheetId);
  }

  Utilities.sleep(1200);
  trdEnsureTransactionIntakeSheetExists();
  trdEnsureTransactionIntakeColumns();
  const demoFolder = trdEnsureDemoFolder();
  trdMoveFileToFolderIfNeeded(DriveApp.getFileById(form.getId()), demoFolder);
  return form;
}

function trdSyncFormItems(form) {
  const currentTitles = form.getItems().map(function (item) {
    return item.getTitle();
  });
  const expectedTitles = TRD_CONFIG.formFields.map(function (field) {
    return field.title;
  });
  const sameShape =
    currentTitles.length === expectedTitles.length &&
    currentTitles.every(function (title, index) {
      return title === expectedTitles[index];
    });

  if (sameShape) {
    return;
  }

  if (form.getResponses().length > 0) {
    throw new Error('Form shape drift detected after responses already exist. Preserve the current demo form or relink a fresh test form.');
  }

  while (form.getItems().length) {
    form.deleteItem(0);
  }

  TRD_CONFIG.formFields.forEach(function (field) {
    let item;
    if (field.type === 'paragraph') {
      item = form.addParagraphTextItem();
    } else if (field.type === 'date') {
      item = form.addDateItem();
      item.setIncludesYear(true);
    } else {
      item = form.addTextItem();
    }
    item.setTitle(field.title).setRequired(Boolean(field.required));
  });
}

function trdEnsureTransactionIntakeSheetExists() {
  const spreadsheet = trdGetSpreadsheet();
  let intakeSheet = spreadsheet.getSheetByName(TRD_CONFIG.sheetNames.intake);
  if (intakeSheet) {
    return intakeSheet;
  }

  const formResponseSheet = spreadsheet
    .getSheets()
    .filter(function (sheet) {
      return sheet.getName().indexOf('Form Responses') === 0;
    })[0];

  if (formResponseSheet) {
    formResponseSheet.setName(TRD_CONFIG.sheetNames.intake);
    intakeSheet = formResponseSheet;
  } else {
    intakeSheet = spreadsheet.insertSheet(TRD_CONFIG.sheetNames.intake);
    intakeSheet.getRange(1, 1, 1, 1).setValue('Timestamp');
  }
  return intakeSheet;
}

function trdEnsureDemoCalendar() {
  const existingId = trdGetProperty(TRD_CONFIG.propertyKeys.calendarId);
  if (existingId) {
    try {
      return CalendarApp.getCalendarById(existingId);
    } catch (error) {
      trdLogAction({
        phase: TRD_CONFIG.phases.setup,
        rowStatus: '',
        outputReference: existingId,
        resultSummary: 'Demo calendar lookup warning',
        errorText: error.message,
      });
    }
  }

  const matching = CalendarApp.getAllOwnedCalendars().filter(function (calendar) {
    return calendar.getName() === TRD_CONFIG.calendarName;
  });
  const calendar = matching.length ? matching[0] : CalendarApp.createCalendar(TRD_CONFIG.calendarName, { timeZone: TRD_CONFIG.timeZone });
  trdSetProperty(TRD_CONFIG.propertyKeys.calendarId, calendar.getId());
  return calendar;
}

function trdCreateOrReuseTransactionFolder(transaction, existingFolderId) {
  if (existingFolderId) {
    try {
      return DriveApp.getFolderById(existingFolderId);
    } catch (error) {
      trdLogAction({
        transactionId: transaction.transactionId,
        phase: TRD_CONFIG.phases.source,
        rowStatus: '',
        outputReference: existingFolderId,
        resultSummary: 'Existing transaction folder lookup warning',
        errorText: error.message,
      });
    }
  }

  const demoFolder = trdEnsureDemoFolder();
  const folderName = trdSanitizeFileName(`${transaction.transactionId} - ${transaction.buyer1} - ${transaction.dealAddress}`);
  const matchingFolders = demoFolder.getFoldersByName(folderName);
  const folder = matchingFolders.hasNext() ? matchingFolders.next() : demoFolder.createFolder(folderName);
  trdEnsureFolderTree(folder);
  return folder;
}

function trdEnsureFolderTree(rootFolder) {
  TRD_CONFIG.folderTemplatePaths.forEach(function (path) {
    trdFindOrCreateFolderByPath(rootFolder, path);
  });
}

function trdFindOrCreateFolderByPath(rootFolder, path) {
  const parts = path.split('/');
  let currentFolder = rootFolder;
  parts.forEach(function (part) {
    const matching = currentFolder.getFoldersByName(part);
    currentFolder = matching.hasNext() ? matching.next() : currentFolder.createFolder(part);
  });
  return currentFolder;
}

function trdCreateOrReuseCalendarEvents(transaction, existingIds) {
  const calendar = trdEnsureDemoCalendar();
  const earliestConditionDate = [transaction.condition1Date, transaction.condition2Date]
    .map(trdParseDate)
    .filter(Boolean)
    .sort(function (left, right) {
      return left.getTime() - right.getTime();
    })[0];
  const possessionDate = trdParseDate(transaction.possessionDate);
  const conditionEvent = trdUpsertAllDayEvent(
    calendar,
    existingIds.conditionEventId,
    `${transaction.transactionId} - Condition Reminder`,
    earliestConditionDate,
    `Demo reminder for ${transaction.transactionName}`
  );
  const possessionEvent = trdUpsertAllDayEvent(
    calendar,
    existingIds.possessionEventId,
    `${transaction.transactionId} - Possession Reminder`,
    possessionDate,
    `Demo possession reminder for ${transaction.transactionName}`
  );

  return {
    conditionEventId: conditionEvent.eventId,
    possessionEventId: possessionEvent.eventId,
    updatedExisting: conditionEvent.updatedExisting || possessionEvent.updatedExisting,
    recreated: conditionEvent.recreated || possessionEvent.recreated,
    deleted: conditionEvent.deleted || possessionEvent.deleted,
  };
}

function trdCreateOrReuseDraftFromContent(transaction, existingDraftId, payload) {
  if (existingDraftId) {
    try {
      const existingDraft = GmailApp.getDraft(existingDraftId);
      if (existingDraft) {
        existingDraft.update(payload.recipient, payload.subject, payload.body);
        return { draftId: existingDraftId, createdNew: false, updatedExisting: true };
      }
    } catch (error) {
      trdLogAction({
        transactionId: transaction.transactionId,
        phase: TRD_CONFIG.phases.draft,
        rowStatus: '',
        outputReference: existingDraftId,
        resultSummary: 'Existing draft lookup warning',
        errorText: error.message,
      });
    }
  }

  const draft = GmailApp.createDraft(payload.recipient, payload.subject, payload.body);
  return { draftId: draft.getId(), createdNew: true, updatedExisting: false };
}

function trdUpsertAllDayEvent(calendar, existingEventId, title, date, description) {
  let existingEvent = null;
  if (existingEventId) {
    try {
      existingEvent = calendar.getEventById(existingEventId);
    } catch (error) {
      trdLogAction({
        phase: TRD_CONFIG.phases.source,
        rowStatus: '',
        outputReference: existingEventId,
        resultSummary: 'Calendar event lookup warning',
        errorText: error.message,
      });
    }
  }

  if (!date) {
    if (existingEvent) {
      existingEvent.deleteEvent();
      return { eventId: '', deleted: true, updatedExisting: false, recreated: false };
    }
    return { eventId: '', deleted: false, updatedExisting: false, recreated: false };
  }

  if (existingEvent) {
    existingEvent.setTitle(title);
    existingEvent.setDescription(description);
    existingEvent.setAllDayDate(date);
    return { eventId: existingEvent.getId(), deleted: false, updatedExisting: true, recreated: false };
  }

  const createdEvent = calendar.createAllDayEvent(title, date, { description: description });
  return { eventId: createdEvent.getId(), deleted: false, updatedExisting: false, recreated: Boolean(existingEventId) };
}

function trdEnsureSampleSourceFiles(transaction, folder) {
  const sourceFolder = trdFindOrCreateFolderByPath(folder, 'Full Info Prospects Folder/Source Documents');
  const description = trdBuildSampleSourceDocumentText(transaction);
  const docBaseName = `${transaction.transactionId} - accepted-offer`;
  const docFile = trdFindOrCreateGoogleDoc(sourceFolder, `${docBaseName}.gdoc`, description);
  const pdfFile = trdFindOrCreatePdfCopy(sourceFolder, docFile, `${docBaseName}.pdf`);
  const imageFile = trdFindOrCreateImageSource(sourceFolder, transaction, `${docBaseName}.png`);
  const unsupportedSheet = trdFindOrCreateUnsupportedSource(sourceFolder, transaction, `${docBaseName}-unsupported`);
  return {
    googleDocId: docFile.getId(),
    pdfId: pdfFile.getId(),
    imageId: imageFile.getId(),
    unsupportedSheetId: unsupportedSheet.getId(),
  };
}

function trdBuildSampleSourceDocumentText(transaction) {
  return [
    'Accepted Offer Summary',
    `Transaction ID: ${transaction.transactionId}`,
    `Property Address: ${transaction.dealAddress}`,
    `Buyer: ${transaction.buyer1}`,
    `Seller: ${transaction.seller1}`,
    `Sold Price: ${transaction.soldPrice}`,
    `Sale Date: ${trdFormatDate(transaction.saleDate)}`,
    `Possession Date: ${trdFormatDate(transaction.possessionDate)}`,
    `Listing Realtor: ${transaction.listingRealtor}`,
    `Selling Realtor: ${transaction.sellingRealtor}`,
    `Condition 1: ${transaction.condition1Name} on ${trdFormatDate(transaction.condition1Date)}`,
    `Condition 2: ${transaction.condition2Name} on ${trdFormatDate(transaction.condition2Date)}`,
    `Buyer Lawyer: ${transaction.buyerLawyer}`,
    `Seller Lawyer: ${transaction.sellerLawyer}`,
    `MLS Number: ${transaction.mlsNumber}`,
    `Contract Number: ${transaction.contractNumber}`,
  ].join('\n');
}

function trdFindOrCreateGoogleDoc(folder, name, content) {
  const matching = folder.getFilesByName(name);
  let file;
  if (matching.hasNext()) {
    file = matching.next();
    const document = DocumentApp.openById(file.getId());
    document.getBody().setText(content);
    document.saveAndClose();
    return file;
  }

  const document = DocumentApp.create(name);
  document.getBody().setText(content);
  document.saveAndClose();
  file = DriveApp.getFileById(document.getId());
  trdMoveFileToFolderIfNeeded(file, folder);
  return file;
}

function trdFindOrCreatePdfCopy(folder, docFile, name) {
  const matching = folder.getFilesByName(name);
  if (matching.hasNext()) {
    const existing = matching.next();
    existing.setTrashed(true);
  }
  const pdfBlob = docFile.getBlob().getAs(MimeType.PDF).setName(name);
  return folder.createFile(pdfBlob);
}

function trdFindOrCreateImageSource(folder, transaction, name) {
  const matching = folder.getFilesByName(name);
  while (matching.hasNext()) {
    matching.next().setTrashed(true);
  }
  const table = Charts.newDataTable()
    .addColumn(Charts.ColumnType.STRING, 'Field')
    .addColumn(Charts.ColumnType.STRING, 'Value')
    .addRow(['Transaction ID', transaction.transactionId])
    .addRow(['Address', transaction.dealAddress])
    .addRow(['Buyer', transaction.buyer1])
    .addRow(['Seller', transaction.seller1])
    .addRow(['Sold Price', transaction.soldPrice])
    .addRow(['Sale Date', trdFormatDate(transaction.saleDate)])
    .addRow(['Possession', trdFormatDate(transaction.possessionDate)])
    .addRow(['Listing Realtor', transaction.listingRealtor])
    .addRow(['Selling Realtor', transaction.sellingRealtor])
    .addRow(['Condition', `${transaction.condition1Name} ${trdFormatDate(transaction.condition1Date)}`])
    .addRow(['Buyer Lawyer', transaction.buyerLawyer])
    .addRow(['Seller Lawyer', transaction.sellerLawyer])
    .build();
  const chart = Charts.newTableChart()
    .setDataTable(table)
    .setDimensions(1400, 900)
    .build();
  const imageBlob = chart.getAs('image/png').setName(name);
  return folder.createFile(imageBlob);
}

function trdFindOrCreateUnsupportedSource(folder, transaction, name) {
  const matching = folder.getFilesByName(name);
  let file;
  if (matching.hasNext()) {
    file = matching.next();
    const spreadsheet = SpreadsheetApp.openById(file.getId());
    spreadsheet.getSheets()[0].clear();
    spreadsheet.getSheets()[0].getRange(1, 1, 4, 2).setValues([
      ['Transaction ID', transaction.transactionId],
      ['Address', transaction.dealAddress],
      ['Buyer', transaction.buyer1],
      ['Unsupported', 'Spreadsheet source should fail extraction'],
    ]);
    return file;
  }

  const spreadsheet = SpreadsheetApp.create(name);
  const sheet = spreadsheet.getSheets()[0];
  sheet.getRange(1, 1, 4, 2).setValues([
    ['Transaction ID', transaction.transactionId],
    ['Address', transaction.dealAddress],
    ['Buyer', transaction.buyer1],
    ['Unsupported', 'Spreadsheet source should fail extraction'],
  ]);
  file = DriveApp.getFileById(spreadsheet.getId());
  trdMoveFileToFolderIfNeeded(file, folder);
  return file;
}

function trdResolveSourceFileSelection(rowObject) {
  const rawLink = trdAsString(rowObject['Source File Link']);
  const rawId = trdParseDriveFileId(rowObject['Source File Id'] || rawLink);
  if (!rawId) {
    return null;
  }
  const file = DriveApp.getFileById(rawId);
  const mimeType = file.getMimeType();
  return {
    file: file,
    fileId: file.getId(),
    fileName: file.getName(),
    mimeType: mimeType,
    link: rawLink || file.getUrl() || trdGetFileUrl(file.getId()),
    modifiedAt: file.getLastUpdated(),
  };
}

function trdReadSourceFileForClaude(sourceSelection) {
  const mimeType = sourceSelection.mimeType;
  const supported = TRD_CONFIG.supportedSourceMimeTypes;
  if (mimeType === supported.pdf) {
    const blob = sourceSelection.file.getBlob();
    return {
      kind: 'pdf',
      displayLabel: `${sourceSelection.fileName} (PDF)`,
      contentBlocks: [
        {
          type: 'document',
          source: {
            type: 'base64',
            media_type: 'application/pdf',
            data: Utilities.base64Encode(blob.getBytes()),
          },
        },
      ],
    };
  }

  if (mimeType === supported.jpeg || mimeType === supported.png) {
    const blob = sourceSelection.file.getBlob();
    return {
      kind: 'image',
      displayLabel: `${sourceSelection.fileName} (${mimeType})`,
      contentBlocks: [
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: mimeType,
            data: Utilities.base64Encode(blob.getBytes()),
          },
        },
      ],
    };
  }

  if (mimeType === supported.googleDoc) {
    const text = DocumentApp.openById(sourceSelection.fileId).getBody().getText();
    return {
      kind: 'google-doc',
      displayLabel: `${sourceSelection.fileName} (Google Doc)`,
      contentBlocks: [
        {
          type: 'document',
          source: {
            type: 'text',
            media_type: 'text/plain',
            data: text,
          },
        },
      ],
    };
  }

  if (mimeType === supported.docx) {
    const docxBlob = sourceSelection.file.getBlob();
    const documentXml = trdFindDocxDocumentXml(Utilities.unzip(docxBlob));
    const text = documentXml ? trdDocxXmlToText(documentXml.getDataAsString()) : '';
    return {
      kind: 'docx',
      displayLabel: `${sourceSelection.fileName} (DOCX text export)`,
      contentBlocks: [
        {
          type: 'document',
          source: {
            type: 'text',
            media_type: 'text/plain',
            data: text,
          },
        },
      ],
    };
  }

  if (mimeType === supported.plainText) {
    const textBlob = sourceSelection.file.getBlob();
    return {
      kind: 'plain-text',
      displayLabel: `${sourceSelection.fileName} (Plain text)`,
      contentBlocks: [
        {
          type: 'document',
          source: {
            type: 'text',
            media_type: 'text/plain',
            data: textBlob.getDataAsString(),
          },
        },
      ],
    };
  }

  throw new Error(`Unsupported source file type: ${mimeType}`);
}
