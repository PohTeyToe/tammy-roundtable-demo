const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

const SYSTEM_PROMPT =
  "You read signed real-estate agreements and extract structured facts. Return only valid JSON.";

const EXTRACTION_SCHEMA_HINT = `JSON schema:
{
  "transactionId": "",
  "dealAddress": "",
  "buyerName": "",
  "sellerName": "",
  "soldPrice": "",
  "saleDate": "",
  "possessionDate": "",
  "listingRealtor": "",
  "sellingRealtor": "",
  "condition1Name": "",
  "condition1Date": "",
  "condition2Name": "",
  "condition2Date": "",
  "buyerLawyer": "",
  "sellerLawyer": "",
  "mlsNumber": "",
  "contractNumber": "",
  "side": "buyer | seller",
  "propertyType": "residential | condo",
  "summary": ""
}`;

export type ExtractedAgreement = {
  transactionId: string;
  dealAddress: string;
  buyerName: string;
  sellerName: string;
  soldPrice: string;
  saleDate: string;
  possessionDate: string;
  listingRealtor: string;
  sellingRealtor: string;
  condition1Name: string;
  condition1Date: string;
  condition2Name: string;
  condition2Date: string;
  buyerLawyer: string;
  sellerLawyer: string;
  mlsNumber: string;
  contractNumber: string;
  side: "buyer" | "seller";
  propertyType: "residential" | "condo";
  summary: string;
};

function token() {
  const t = process.env.CC_OAUTH_TOKEN || process.env.ANTHROPIC_OAUTH_TOKEN;
  if (!t) throw new Error("CC_OAUTH_TOKEN not set on the server.");
  return t;
}

function isOAuth(t: string) {
  return t.startsWith("sk-ant-oat");
}

export async function extractAgreement(pdfBytes: Uint8Array): Promise<ExtractedAgreement> {
  const t = token();
  const base64 = Buffer.from(pdfBytes).toString("base64");

  const body = {
    model: process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001",
    max_tokens: 2200,
    temperature: 0,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "document",
            source: { type: "base64", media_type: "application/pdf", data: base64 },
          },
          {
            type: "text",
            text:
              "Read the attached signed real-estate agreement and extract the facts below. " +
              "Use empty strings for anything not clearly supported by the document. " +
              "Dates must be yyyy-mm-dd if explicit. " +
              "Decide side: 'buyer' if it is a buyer/exclusive-buyer agreement, 'seller' for a listing/seller agreement. " +
              "Decide propertyType: 'condo' if the property is a condominium / strata / apartment-style unit (look for 'condo', 'condominium', 'strata', unit/suite numbers, condo-fee mentions). Otherwise 'residential'. " +
              EXTRACTION_SCHEMA_HINT,
          },
        ],
      },
    ],
  };

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "anthropic-version": "2023-06-01",
  };
  if (isOAuth(t)) {
    headers["Authorization"] = `Bearer ${t}`;
    headers["anthropic-beta"] = "oauth-2025-04-20";
  } else {
    headers["x-api-key"] = t;
  }

  const res = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Anthropic API ${res.status}: ${text}`);
  }
  const json = (await res.json()) as { content: { type: string; text?: string }[] };
  const text = json.content.filter((b) => b.type === "text").map((b) => b.text).join("\n");

  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error(`Claude did not return JSON. Raw text: ${text.slice(0, 500)}`);
  const parsed = JSON.parse(match[0]);

  const norm = (key: keyof ExtractedAgreement) =>
    typeof parsed[key] === "string" ? parsed[key] : "";

  return {
    transactionId: norm("transactionId"),
    dealAddress: norm("dealAddress"),
    buyerName: norm("buyerName"),
    sellerName: norm("sellerName"),
    soldPrice: norm("soldPrice"),
    saleDate: norm("saleDate"),
    possessionDate: norm("possessionDate"),
    listingRealtor: norm("listingRealtor"),
    sellingRealtor: norm("sellingRealtor"),
    condition1Name: norm("condition1Name"),
    condition1Date: norm("condition1Date"),
    condition2Name: norm("condition2Name"),
    condition2Date: norm("condition2Date"),
    buyerLawyer: norm("buyerLawyer"),
    sellerLawyer: norm("sellerLawyer"),
    mlsNumber: norm("mlsNumber"),
    contractNumber: norm("contractNumber"),
    side: parsed.side === "seller" ? "seller" : "buyer",
    propertyType: parsed.propertyType === "condo" ? "condo" : "residential",
    summary: norm("summary"),
  };
}

