function trdGetSpreadsheet() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function trdGetSheet(name) {
  return trdGetSpreadsheet().getSheetByName(name);
}

function trdEnsureSheet(name) {
  const spreadsheet = trdGetSpreadsheet();
  return spreadsheet.getSheetByName(name) || spreadsheet.insertSheet(name);
}

function trdGetScriptProperties() {
  return PropertiesService.getScriptProperties();
}

function trdSetProperty(key, value) {
  trdGetScriptProperties().setProperty(key, value);
}

function trdGetProperty(key) {
  return trdGetScriptProperties().getProperty(key);
}

function trdDeleteProperty(key) {
  trdGetScriptProperties().deleteProperty(key);
}

function trdRequire(value, message) {
  if (value === null || value === undefined || value === '') {
    throw new Error(message);
  }
  return value;
}

function trdAsString(value) {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value).trim();
}

function trdNormalizeKey(value) {
  return trdAsString(value).toLowerCase();
}

function trdFormatDate(value) {
  const date = trdParseDate(value);
  if (!date) {
    return '';
  }
  return Utilities.formatDate(date, TRD_CONFIG.timeZone, 'yyyy-MM-dd');
}

function trdFormatTimestamp(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return Utilities.formatDate(date, TRD_CONFIG.timeZone, 'yyyy-MM-dd HH:mm:ss');
}

function trdParseDate(value) {
  if (!value) {
    return null;
  }
  if (Object.prototype.toString.call(value) === '[object Date]' && !Number.isNaN(value.getTime())) {
    return value;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
}

function trdCreateHyperlinkFormula(url, label) {
  if (!url) {
    return '';
  }
  const safeLabel = label || url;
  return `=HYPERLINK("${url.replace(/"/g, '""')}", "${safeLabel.replace(/"/g, '""')}")`;
}

function trdGetHeaderMap(sheet) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const headerMap = {};
  headers.forEach(function (header, index) {
    if (header) {
      headerMap[String(header)] = index + 1;
    }
  });
  return headerMap;
}

function trdGetRowObject(sheet, rowNumber) {
  const headerMap = trdGetHeaderMap(sheet);
  const row = sheet.getRange(rowNumber, 1, 1, sheet.getLastColumn()).getValues()[0];
  const record = {};
  Object.keys(headerMap).forEach(function (header) {
    record[header] = row[headerMap[header] - 1];
  });
  return record;
}

function trdSetRowValuesByHeader(sheet, rowNumber, valuesByHeader) {
  const headerMap = trdGetHeaderMap(sheet);
  Object.keys(valuesByHeader).forEach(function (header) {
    if (headerMap[header]) {
      sheet.getRange(rowNumber, headerMap[header]).setValue(valuesByHeader[header]);
    }
  });
}

function trdEnsureHeaders(sheet, rowNumber, headers) {
  const range = sheet.getRange(rowNumber, 1, 1, headers.length);
  range.setValues([headers]);
  range.setFontWeight('bold');
  range.setBackground('#dfe7ef');
  sheet.setFrozenRows(Math.max(sheet.getFrozenRows(), rowNumber));
}

function trdSanitizeFileName(value) {
  return trdAsString(value).replace(/[\\/:*?"<>|]/g, '-').replace(/\s+/g, ' ').trim();
}

function trdFindRowByValue(sheet, columnHeader, lookupValue) {
  const headerMap = trdGetHeaderMap(sheet);
  const column = headerMap[columnHeader];
  if (!column) {
    return -1;
  }
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return -1;
  }
  const values = sheet.getRange(2, column, lastRow - 1, 1).getValues();
  const target = trdNormalizeKey(lookupValue);
  for (let index = 0; index < values.length; index += 1) {
    if (trdNormalizeKey(values[index][0]) === target) {
      return index + 2;
    }
  }
  return -1;
}

function trdTryGetUi() {
  try {
    return SpreadsheetApp.getUi();
  } catch (error) {
    return null;
  }
}

function trdAlert(message) {
  const ui = trdTryGetUi();
  if (ui) {
    ui.alert(message);
  }
}

function trdLogAction(event) {
  const sheet = trdEnsureSheet(TRD_CONFIG.sheetNames.actionLog);
  if (sheet.getLastRow() === 0) {
    trdEnsureHeaders(sheet, 1, TRD_CONFIG.actionLogHeaders);
  }
  sheet.appendRow([
    event.timestamp || new Date(),
    event.transactionId || '',
    event.attemptId || '',
    event.attemptNumber || '',
    event.phase || '',
    event.rowStatus || '',
    event.sourceFileId || '',
    event.sourceFileLink || '',
    event.outputReference || '',
    event.resultSummary || '',
    event.errorText || '',
  ]);
}

function trdGetTransactionName(transaction) {
  return `${transaction.buyer1} - ${transaction.dealAddress}`;
}

function trdBuildTransactionRecordFromRow(rowObject, rowNumber) {
  const values = {};
  TRD_CONFIG.formFields.forEach(function (field) {
    values[field.key] = rowObject[field.title];
  });
  values.rowNumber = rowNumber;
  if (trdNormalizeKey(values.transactionId) === trdNormalizeKey(TRD_CONFIG.sampleTransactions.completed.transactionId)) {
    values.sampleProfile = 'completed';
  } else if (trdNormalizeKey(values.transactionId) === trdNormalizeKey(TRD_CONFIG.sampleTransactions.live.transactionId)) {
    values.sampleProfile = 'live';
  } else {
    values.sampleProfile = '';
  }
  values.condition1 = [trdAsString(values.condition1Name), trdFormatDate(values.condition1Date)].filter(Boolean).join(' | ');
  values.condition2 = [trdAsString(values.condition2Name), trdFormatDate(values.condition2Date)].filter(Boolean).join(' | ');
  values.transactionName = trdGetTransactionName(values);
  return values;
}

function trdBuildExtractedRecordFromRow(rowObject) {
  const extracted = {};
  TRD_CONFIG.extractedFieldColumns.forEach(function (column) {
    extracted[column.key] = rowObject[column.header];
  });
  extracted.condition1 = [trdAsString(extracted.condition1Name), trdFormatDate(extracted.condition1Date)].filter(Boolean).join(' | ');
  extracted.condition2 = [trdAsString(extracted.condition2Name), trdFormatDate(extracted.condition2Date)].filter(Boolean).join(' | ');
  return extracted;
}

function trdGetSelectedRowNumber() {
  const sheet = trdGetSheet(TRD_CONFIG.sheetNames.intake);
  const activeRange = sheet ? sheet.getActiveRange() : null;
  if (!activeRange) {
    throw new Error('Select a row in TransactionIntake first.');
  }
  return activeRange.getRow();
}

function trdGetIntakeSheet() {
  const sheet = trdGetSheet(TRD_CONFIG.sheetNames.intake);
  return trdRequire(sheet, 'TransactionIntake sheet does not exist yet. Run setup first.');
}

function trdFindIntakeRowByTransactionId(transactionId) {
  return trdFindRowByValue(trdGetIntakeSheet(), 'Transaction ID', transactionId);
}

function trdGetReferenceValue(key) {
  const sheet = trdEnsureSheet(TRD_CONFIG.sheetNames.referenceData);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return '';
  }
  const values = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
  const target = trdNormalizeKey(key);
  for (let index = 0; index < values.length; index += 1) {
    if (trdNormalizeKey(values[index][0]) === target) {
      return values[index][1];
    }
  }
  return '';
}

function trdGetFileUrl(fileId) {
  return fileId ? `https://drive.google.com/file/d/${fileId}/view` : '';
}

function trdGetFolderUrl(folderId) {
  return folderId ? `https://drive.google.com/drive/folders/${folderId}` : '';
}

function trdGetDraftUrl(draftId) {
  return draftId ? `https://mail.google.com/mail/u/0/#drafts?compose=${draftId}` : '';
}

function trdCountStatuses(rows) {
  const counts = { Expected: 0, Received: 0, Missing: 0 };
  rows.forEach(function (row) {
    const status = trdAsString(row[3]) || 'Expected';
    if (Object.prototype.hasOwnProperty.call(counts, status)) {
      counts[status] += 1;
    }
  });
  return counts;
}

function trdUpsertRowsByFirstColumn(sheet, rows, startRow) {
  const rowStart = startRow || 2;
  const existing = {};
  const lastRow = sheet.getLastRow();
  if (lastRow >= rowStart) {
    const values = sheet.getRange(rowStart, 1, lastRow - rowStart + 1, Math.max(sheet.getLastColumn(), 1)).getValues();
    values.forEach(function (row, index) {
      if (trdAsString(row[0])) {
        existing[trdNormalizeKey(row[0])] = rowStart + index;
      }
    });
  }

  rows.forEach(function (row) {
    const key = trdNormalizeKey(row[0]);
    const targetRow = existing[key] || sheet.getLastRow() + 1;
    sheet.getRange(targetRow, 1, 1, row.length).setValues([row]);
  });
}

function trdCreateAttemptId() {
  return Utilities.getUuid();
}

function trdGetNextAttemptNumber(rowObject) {
  const current = Number(rowObject['Current Attempt Number'] || 0);
  return Number.isFinite(current) && current > 0 ? current + 1 : 1;
}

function trdDeriveNotesPhaseCue(status) {
  const statuses = TRD_CONFIG.statuses;
  if (status === statuses.readyForReview || status === statuses.reviewRejected) {
    return 'Review';
  }
  if (status === statuses.draftGenerated) {
    return 'Draft';
  }
  if (status === statuses.draftFailed) {
    return 'Draft Failed';
  }
  if (status === statuses.sourceMissing || status === statuses.sourceChanged) {
    return 'Source';
  }
  return 'Extraction';
}

function trdBuildAttemptContext(rowObject) {
  return {
    attemptId: trdAsString(rowObject['Current Attempt Id']),
    attemptNumber: trdAsString(rowObject['Current Attempt Number']),
    sourceFileId: trdAsString(rowObject['Source File Id']),
    sourceFileLink: trdAsString(rowObject['Source File Link']),
  };
}

function trdNormalizeMaybeDate(value) {
  const parsed = trdParseDate(value);
  return parsed ? trdFormatDate(parsed) : trdAsString(value);
}

function trdGetExtractedFieldHeaders() {
  return TRD_CONFIG.extractedFieldColumns.map(function (column) {
    return column.header;
  });
}

function trdGetExtractedRowValues(extractedFields) {
  const values = {};
  TRD_CONFIG.extractedFieldColumns.forEach(function (column) {
    let value = extractedFields[column.key];
    if (column.key.toLowerCase().indexOf('date') !== -1) {
      value = trdNormalizeMaybeDate(value);
    }
    values[column.header] = value || '';
  });
  return values;
}

function trdClearExtractedFieldsForRow(sheet, rowNumber) {
  const blankValues = {};
  trdGetExtractedFieldHeaders().forEach(function (header) {
    blankValues[header] = '';
  });
  trdSetRowValuesByHeader(sheet, rowNumber, blankValues);
}

function trdParseDriveFileId(value) {
  const raw = trdAsString(value);
  if (!raw) {
    return '';
  }
  const matched = raw.match(/[-\w]{25,}/);
  return matched ? matched[0] : raw;
}

function trdParseJsonObjectFromText(text) {
  const raw = trdAsString(text);
  if (!raw) {
    throw new Error('Claude returned an empty response.');
  }
  try {
    return JSON.parse(raw);
  } catch (error) {
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) {
      throw new Error('Claude did not return valid JSON.');
    }
    return JSON.parse(raw.slice(start, end + 1));
  }
}

function trdHtmlDecode(value) {
  return trdAsString(value)
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function trdDocxXmlToText(xmlText) {
  return trdHtmlDecode(
    trdAsString(xmlText)
      .replace(/<w:p[^>]*>/g, '\n')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+\n/g, '\n')
      .replace(/\n\s+/g, '\n')
      .replace(/[ \t]{2,}/g, ' ')
      .trim()
  );
}

function trdFindDocxDocumentXml(blobs) {
  for (let index = 0; index < blobs.length; index += 1) {
    if (blobs[index].getName() === 'word/document.xml') {
      return blobs[index];
    }
  }
  return null;
}

function trdNormalizeExtractionOutput(parsed) {
  return {
    transactionId: trdAsString(parsed.transactionId),
    dealAddress: trdAsString(parsed.dealAddress),
    buyerName: trdAsString(parsed.buyerName),
    sellerName: trdAsString(parsed.sellerName),
    soldPrice: trdAsString(parsed.soldPrice),
    saleDate: trdNormalizeMaybeDate(parsed.saleDate),
    possessionDate: trdNormalizeMaybeDate(parsed.possessionDate),
    listingRealtor: trdAsString(parsed.listingRealtor),
    sellingRealtor: trdAsString(parsed.sellingRealtor),
    condition1Name: trdAsString(parsed.condition1Name),
    condition1Date: trdNormalizeMaybeDate(parsed.condition1Date),
    condition2Name: trdAsString(parsed.condition2Name),
    condition2Date: trdNormalizeMaybeDate(parsed.condition2Date),
    buyerLawyer: trdAsString(parsed.buyerLawyer),
    sellerLawyer: trdAsString(parsed.sellerLawyer),
    mlsNumber: trdAsString(parsed.mlsNumber),
    contractNumber: trdAsString(parsed.contractNumber),
    summary: trdAsString(parsed.summary),
    notes: trdAsString(parsed.notes),
  };
}

function trdGetMissingExtractionFields(extracted) {
  const missing = [];
  TRD_CONFIG.extractionMinimumFieldKeys.forEach(function (key) {
    if (!trdAsString(extracted[key])) {
      missing.push(key);
    }
  });
  return missing;
}

function trdMissingFieldsSummary(missingFields) {
  if (!missingFields.length) {
    return 'All required extraction fields present';
  }
  return `Missing required fields: ${missingFields.join(', ')}`;
}

function trdGetCurrentSourceFingerprint(rowObject) {
  return {
    fileId: trdAsString(rowObject['Source File Id']),
    modifiedAt: trdAsString(rowObject['Source File Modified At']),
  };
}

function trdWriteCommonRowState(sheet, rowNumber, values) {
  const payload = Object.assign({}, values, {
    'Derived Notes Phase Cue': trdDeriveNotesPhaseCue(values['Processing Status'] || trdAsString(trdGetRowObject(sheet, rowNumber)['Processing Status'])),
    'Last Run At': values['Last Run At'] || new Date(),
  });
  trdSetRowValuesByHeader(sheet, rowNumber, payload);
}
