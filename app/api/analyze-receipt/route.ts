import { NextRequest, NextResponse } from "next/server";
import { ai } from "@/whatsapp/genkit";

export interface ReceiptItem {
  name: string;
  qty?: number;
  price: number;
}

export interface ReceiptResult {
  store: string;
  date: string;
  items: ReceiptItem[];
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  claimSummary: string;
}

const PROMPT = `You are a receipt parser. Look at this receipt image and return structured JSON.

Return ONLY valid JSON with no markdown or extra text:
{
  "store": "Store name or Unknown",
  "date": "YYYY-MM-DD or empty string if not found",
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
- claimSummary should be professional, suitable for a family expense claim`;

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();
    if (!image) return NextResponse.json({ error: "image required" }, { status: 400 });

    const base64 = image.includes(",") ? image.split(",")[1] : image;

    const response = await ai.generate({
      model: "googleai/gemini-2.5-flash",
      prompt: [
        { media: { url: `data:image/jpeg;base64,${base64}` } },
        { text: PROMPT },
      ],
    });

    const raw     = response.text?.trim() ?? "";
    const jsonStr = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
    const receipt = JSON.parse(jsonStr) as ReceiptResult;

    return NextResponse.json(receipt);
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Unexpected error" }, { status: 500 });
  }
}
