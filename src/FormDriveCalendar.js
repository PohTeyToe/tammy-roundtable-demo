function trdEnsureDemoFolder() {
  const existingId = trdGetProperty(TRD_CONFIG.propertyKeys.demoFolderId);
  if (existingId) {
    try {
      return DriveApp.getFolderById(existingId);
    } catch (error) {
      trdLogAction('', 'Resolve Demo Folder', 'warning', existingId, error.message);
    }
  }

  const spreadsheetFile = DriveApp.getFileById(trdGetSpreadsheet().getId());
  const parents = spreadsheetFile.getParents();
  let parentFolder = null;
  if (parents.hasNext()) {
    parentFolder = parents.next();
  } else {
    parentFolder = DriveApp.getRootFolder();
  }

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
    trdLogAction('', 'Move File To Demo Folder', 'warning', file.getId(), error.message);
  }
}

function trdEnsureFormAndIntakeSheet() {
  const existingId = trdGetProperty(TRD_CONFIG.propertyKeys.formId);
  let form = null;

  if (existingId) {
    try {
      form = FormApp.openById(existingId);
    } catch (error) {
      trdLogAction('', 'Resolve Demo Form', 'warning', existingId, error.message);
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
      trdLogAction('', 'Resolve Demo Calendar', 'warning', existingId, error.message);
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
      trdLogAction(transaction.transactionId, 'Resolve Existing Transaction Folder', 'warning', existingFolderId, error.message);
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

function trdCreateOrReuseDraft(transaction, existingDraftId) {
  const payload = trdBuildDraftPayload(transaction);
  if (existingDraftId) {
    try {
      const existingDraft = GmailApp.getDraft(existingDraftId);
      if (existingDraft) {
        existingDraft.update(payload.recipient, payload.subject, payload.body);
        return { draftId: existingDraftId, createdNew: false, updatedExisting: true };
      }
    } catch (error) {
      trdLogAction(transaction.transactionId, 'Resolve Existing Draft', 'warning', existingDraftId, error.message);
    }
  }

  const draft = GmailApp.createDraft(payload.recipient, payload.subject, payload.body);
  return { draftId: draft.getId(), createdNew: true, updatedExisting: false };
}

function trdBuildDraftPayload(transaction) {
  return {
    recipient: transaction.clientEmail,
    subject: `[Review Draft] Next steps for ${transaction.dealAddress}`,
    body: [
      `Hi ${transaction.buyer1},`,
      '',
      'This is a review draft for the next-step transaction email.',
      '',
      `Property: ${transaction.dealAddress}`,
      `Transaction ID: ${transaction.transactionId}`,
      `Sold Price: ${transaction.soldPrice}`,
      `Possession Date: ${trdFormatDate(transaction.possessionDate)}`,
      '',
      'Next steps we are tracking in this demo package:',
      '- accepted offer package review',
      '- deposit and required-doc follow-up',
      '- condition-date reminder tracking',
      '- lawyer/contact confirmation',
      '',
      'This draft stays in review and does not auto-send.',
      '',
      'Regards,',
      'MaxWell Canyon Creek',
    ].join('\n'),
  };
}

function trdUpsertAllDayEvent(calendar, existingEventId, title, date, description) {
  let existingEvent = null;
  if (existingEventId) {
    try {
      existingEvent = calendar.getEventById(existingEventId);
    } catch (error) {
      trdLogAction('', 'Resolve Calendar Event', 'warning', existingEventId, error.message);
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
