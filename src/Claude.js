function trdGetClaudeConfig() {
  const apiKey = trdGetProperty(TRD_CONFIG.propertyKeys.claudeApiKey) || '';
  const isOAuth = apiKey.indexOf('sk-ant-oat') === 0;
  return {
    apiKey: apiKey,
    isOAuth: isOAuth,
    apiUrl: trdGetProperty(TRD_CONFIG.propertyKeys.claudeApiUrl) || TRD_CONFIG.defaultClaudeConfig.apiUrl,
    apiVersion: trdGetProperty(TRD_CONFIG.propertyKeys.claudeApiVersion) || TRD_CONFIG.defaultClaudeConfig.apiVersion,
    defaultModel: trdGetProperty(TRD_CONFIG.propertyKeys.claudeModel) || TRD_CONFIG.defaultClaudeConfig.model,
    extractionModel: trdGetProperty(TRD_CONFIG.propertyKeys.claudeExtractionModel) || '',
    draftModel: trdGetProperty(TRD_CONFIG.propertyKeys.claudeDraftModel) || '',
  };
}

function trdRequireClaudeApiKey() {
  const config = trdGetClaudeConfig();
  if (!config.apiKey) {
    throw new Error('Claude API key is missing. Set the TRD_CLAUDE_API_KEY script property before running the live AI flow.');
  }
  return config;
}

function trdCallClaudeJson(task, contentBlocks, promptText) {
  const config = trdRequireClaudeApiKey();
  const model =
    task === 'extraction'
      ? config.extractionModel || config.defaultModel
      : config.draftModel || config.defaultModel;
  const maxTokens =
    task === 'extraction' ? TRD_CONFIG.defaultClaudeConfig.extractionMaxTokens : TRD_CONFIG.defaultClaudeConfig.draftMaxTokens;
  const payload = {
    model: model,
    max_tokens: maxTokens,
    temperature: 0,
    messages: [
      {
        role: 'user',
        content: contentBlocks.concat([
          {
            type: 'text',
            text: promptText,
          },
        ]),
      },
    ],
  };
  const headers = { 'anthropic-version': config.apiVersion };
  if (config.isOAuth) {
    headers['Authorization'] = 'Bearer ' + config.apiKey;
    headers['anthropic-beta'] = 'oauth-2025-04-20';
  } else {
    headers['x-api-key'] = config.apiKey;
  }
  const response = UrlFetchApp.fetch(config.apiUrl, {
    method: 'post',
    contentType: 'application/json',
    muteHttpExceptions: true,
    headers: headers,
    payload: JSON.stringify(payload),
  });
  const responseText = response.getContentText();
  const statusCode = response.getResponseCode();
  if (statusCode < 200 || statusCode >= 300) {
    throw new Error(`Claude API request failed (${statusCode}): ${responseText}`);
  }
  const body = JSON.parse(responseText);
  const text = (body.content || [])
    .map(function (block) {
      return block.type === 'text' ? block.text : '';
    })
    .join('\n')
    .trim();
  return {
    text: text,
    model: body.model || model,
  };
}

function trdRunClaudeExtraction(sourceDocument) {
  const promptText = [
    'Read only the attached source document.',
    'Return JSON only.',
    'Do not invent fields that are not clearly supported by the document.',
    'If a value is unknown or not visible, return an empty string.',
    'Use yyyy-mm-dd for dates when the date is explicit in the source.',
    'JSON schema:',
    '{',
    '  "transactionId": "",',
    '  "dealAddress": "",',
    '  "buyerName": "",',
    '  "sellerName": "",',
    '  "soldPrice": "",',
    '  "saleDate": "",',
    '  "possessionDate": "",',
    '  "listingRealtor": "",',
    '  "sellingRealtor": "",',
    '  "condition1Name": "",',
    '  "condition1Date": "",',
    '  "condition2Name": "",',
    '  "condition2Date": "",',
    '  "buyerLawyer": "",',
    '  "sellerLawyer": "",',
    '  "mlsNumber": "",',
    '  "contractNumber": "",',
    '  "summary": "",',
    '  "notes": ""',
    '}',
  ].join('\n');
  const response = trdCallClaudeJson('extraction', sourceDocument.contentBlocks, promptText);
  return {
    extracted: trdNormalizeExtractionOutput(trdParseJsonObjectFromText(response.text)),
    model: response.model,
  };
}

function trdRunClaudeDraft(sourceDocument, extractedFields, transaction) {
  const promptText = [
    'Use the attached source document and the normalized extracted fields below to write a concise next-step email draft.',
    'The email must stay review-safe and must not claim any action has already been taken beyond preparing the deal for follow-up.',
    'Return JSON only.',
    'JSON schema:',
    '{',
    '  "subject": "",',
    '  "body": "",',
    '  "summary": ""',
    '}',
    '',
    'Normalized extracted fields:',
    JSON.stringify(extractedFields, null, 2),
    '',
    `Recipient context: ${transaction.clientEmail}`,
  ].join('\n');
  const response = trdCallClaudeJson('draft', sourceDocument.contentBlocks, promptText);
  const parsed = trdParseJsonObjectFromText(response.text);
  return {
    payload: {
      recipient: transaction.clientEmail,
      subject: trdAsString(parsed.subject),
      body: trdAsString(parsed.body),
      summary: trdAsString(parsed.summary),
    },
    model: response.model,
  };
}
