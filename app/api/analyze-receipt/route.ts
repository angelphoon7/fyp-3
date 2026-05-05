import { NextRequest, NextResponse } from "next/server";
import { ai } from "@/whatsapp/genkit";
import { GoogleAuth } from "google-auth-library";

const VISION_API = "https://vision.googleapis.com/v1/images:annotate";

let _authClient: any = null;

async function getAccessToken(): Promise<string> {
  if (!_authClient) {
    const auth = new GoogleAuth({ scopes: ["https://www.googleapis.com/auth/cloud-platform"] });
    _authClient = await auth.getClient();
  }
  const token = await _authClient.getAccessToken();
  if (!token.token) throw new Error("Failed to get access token");
  return token.token;
}

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

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();
    if (!image) return NextResponse.json({ error: "image required" }, { status: 400 });

    const base64 = image.includes(",") ? image.split(",")[1] : image;

    // DOCUMENT_TEXT_DETECTION gives the best OCR accuracy for receipts
    const token = await getAccessToken();
    const visionRes = await fetch(VISION_API, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: [{
          image: { content: base64 },
          features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
        }],
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!visionRes.ok) {
      const body = await visionRes.text().catch(() => "");
      throw new Error(`Cloud Vision error: ${body.substring(0, 150)}`);
    }

    const visionData = await visionRes.json();
    const rawText: string =
      visionData.responses?.[0]?.fullTextAnnotation?.text ??
      visionData.responses?.[0]?.textAnnotations?.[0]?.description ??
      "";

    const prompt = `You are a receipt parser and financial analyst. Parse the following receipt OCR text and return a structured JSON.

OCR TEXT:
${rawText || "(no text extracted — analyze the image directly)"}

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
  "claimSummary": "2-3 sentence family claim summary: what was bought, total spent, and why it should be reimbursed"
}

Rules:
- All prices as numbers (not strings)
- If qty is not shown, omit it
- currency defaults to MYR (Malaysian Ringgit) unless clearly stated otherwise
- claimSummary should be professional and suitable for a family expense claim`;

    const response = await ai.generate({
      model: "googleai/gemini-2.5-flash",
      prompt: [
        { media: { url: `data:image/jpeg;base64,${base64}` } },
        { text: prompt },
      ],
    });

    const raw = response.text?.trim() ?? "";
    const jsonStr = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
    const receipt = JSON.parse(jsonStr) as ReceiptResult;

    return NextResponse.json(receipt);
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Unexpected error" }, { status: 500 });
  }
}
