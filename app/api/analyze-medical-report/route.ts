import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/whatsapp/openai-client";

export const maxDuration = 60;

export interface ReportLineItem {
  description: string;
  amount: number;
}

export interface MedicalReportResult {
  isMedicalReceipt: boolean;
  hospital: string;
  patientName: string;
  items: ReportLineItem[];
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  diagnosis: string;
  claimSummary: string;
}

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();
    if (!image) return NextResponse.json({ error: "image required" }, { status: 400 });

    const base64 = image.includes(",") ? image.split(",")[1] : image;

    const prompt = `You are a medical billing analyst. Examine this image carefully.

STEP 1 — Classify: Is this a medical receipt, hospital bill, clinic invoice, pharmacy receipt, or any official medical/healthcare billing document? Set "isMedicalReceipt" to true ONLY for these. Set it to false for food photos, grocery receipts, restaurant bills, selfies, scenery, or any non-medical document.

STEP 2 — If isMedicalReceipt is true, extract the billing details. If false, leave all other fields as empty/zero.

Return ONLY valid JSON with no markdown or extra text:
{
  "isMedicalReceipt": true,
  "hospital": "Hospital or clinic name, or Unknown",
  "patientName": "Patient name if visible, or empty string",
  "items": [
    { "description": "Consultation Fee", "amount": 50.00 },
    { "description": "Lab Test - Blood Panel", "amount": 120.00 }
  ],
  "subtotal": 0.00,
  "tax": 0.00,
  "total": 0.00,
  "currency": "MYR",
  "diagnosis": "Brief diagnosis or reason for visit if mentioned, or empty string",
  "claimSummary": "2-3 sentence professional claim note suitable for family reimbursement or insurance submission"
}

Rules:
- All amounts as numbers
- currency defaults to MYR unless clearly stated otherwise
- claimSummary must be professional and concise`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{
        role: "user",
        content: [
          { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64}` } },
          { type: "text", text: prompt },
        ],
      }],
    });

    const raw = response.choices[0]?.message?.content?.trim() ?? "";
    const jsonStr = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
    const result = JSON.parse(jsonStr) as MedicalReportResult;

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Unexpected error" }, { status: 500 });
  }
}
