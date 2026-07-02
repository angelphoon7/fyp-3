import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/whatsapp/openai-client";

export const maxDuration = 30;

export interface ReceiptItem {
  name: string;
  qty?: number;
  price: number;
}

export interface ReceiptResult {
  isGroceries: boolean;
  store: string;
  date: string;
  items: ReceiptItem[];
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  claimSummary: string;
}

const PROMPT = `You are a precise grocery receipt OCR parser. Read the receipt image character-by-character — do NOT guess or paraphrase item names.

STEP 1 — Classify: Is this a receipt from a grocery store, supermarket, hypermarket, mini-market, wet market, or convenience store? Set "isGroceries" to true only for these. False for restaurants, cafés, clinics, pharmacies, hardware stores, clothing, electronics, petrol stations.

STEP 2 — Extract every line item following these exact rules:

ITEM EXTRACTION RULES:
1. Read each item name EXACTLY as printed — preserve abbreviations like "INSP", "EXTR", "PIL", "CHAI". Do not rename, correct spelling, or combine words differently.
2. For items with "N @ X.XX = Y.YY" format (e.g. "2 @ 19.90  39.80"): set qty=N, price=Y.YY (the TOTAL amount, not unit price).
3. For repeated barcode lines (same barcode appearing multiple times): create ONE item entry with qty = number of repetitions and price = unit price × qty.
4. Each distinct line item on the receipt must appear as exactly one entry in the items array — never skip items.
5. price field must always be the TOTAL cost for that line (qty × unit). If only unit price is shown with qty=1, price = unit price.

VALIDATION (do this before returning):
- Sum all item prices. If the sum does not match the receipt TOTAL, recheck each item's price — you likely swapped two prices or missed an item.
- Common mistake: swapping prices between adjacent items (e.g. 59.90 and 9.90 assigned to wrong items). Read each price on the SAME line as its item name.

Return ONLY valid JSON with no markdown or extra text:
{
  "isGroceries": true,
  "store": "Store name or Unknown",
  "date": "",
  "items": [
    { "name": "Item name exactly as on receipt", "qty": 1, "price": 5.90 }
  ],
  "subtotal": 0.00,
  "tax": 0.00,
  "total": 0.00,
  "currency": "MYR",
  "claimSummary": "2-3 sentence summary: what was bought, total spent, and why it should be reimbursed"
}

Additional rules:
- All prices as numbers (not strings)
- Omit qty if 1 and not explicitly shown
- currency defaults to MYR unless clearly stated otherwise
- Always set "date" to empty string — date will be set by the user
- If isGroceries is false, you may leave items empty and set totals to 0
- claimSummary should be professional, suitable for a family expense claim`;

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();
    if (!image) return NextResponse.json({ error: "image required" }, { status: 400 });

    const base64 = image.includes(",") ? image.split(",")[1] : image;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{
        role: "user",
        content: [
          { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64}` } },
          { type: "text", text: PROMPT },
        ],
      }],
    });

    const raw     = response.choices[0]?.message?.content?.trim() ?? "";
    const jsonStr = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
    const receipt = JSON.parse(jsonStr) as ReceiptResult;

    return NextResponse.json(receipt);
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Unexpected error" }, { status: 500 });
  }
}
