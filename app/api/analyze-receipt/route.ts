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

const PROMPT = `You are a grocery receipt parser. Examine this receipt image carefully.

STEP 1 — Classify: Is this a receipt from a grocery store, supermarket, hypermarket, mini-market, wet market, or convenience store (places that sell household food & daily necessities)? Set "isGroceries" to true only for these. Set it to false for restaurants, food courts, cafés, medical clinics, pharmacies, hardware stores, clothing shops, electronics stores, petrol stations, and any other non-grocery establishment.

STEP 2 — Parse: Extract the receipt details.

Return ONLY valid JSON with no markdown or extra text:
{
  "isGroceries": true,
  "store": "Store name or Unknown",
  "date": "",
  "items": [
    { "name": "Item name", "qty": 1, "price": 5.90 }
  ],
  "subtotal": 0.00,
  "tax": 0.00,
  "total": 0.00,
  "currency": "MYR",
  "claimSummary": "2-3 sentence summary: what was bought, total spent, and why it should be reimbursed"
}

Rules:
- All prices as numbers (not strings)
- Omit qty if not shown
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
      model: "gpt-4o-mini",
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
