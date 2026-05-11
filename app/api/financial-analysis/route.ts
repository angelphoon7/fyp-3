import { NextRequest, NextResponse } from "next/server";
import { ai } from "@/whatsapp/genkit";

export interface FinancialAnalysisResult {
  insight: string;
  topCategory: string;
  groceriesTip: string;
  medicalTip: string;
  claimNote: string;
}

export async function POST(req: NextRequest) {
  try {
    const { groceryReceipts, medicalReceipts, groceryTotal, medicalTotal } = await req.json();

    const prompt = `You are a friendly budgeting companion helping a family caregiver track care-related expenses. Write in a warm, plain, conversational tone — like a helpful friend, not a financial advisor.

Here is the spending data:

GROCERY / HOUSEHOLD RECEIPTS:
${JSON.stringify(groceryReceipts, null, 2)}
Grocery total: MYR ${groceryTotal.toFixed(2)}

MEDICAL / APPOINTMENT RECEIPTS:
${JSON.stringify(medicalReceipts, null, 2)}
Medical total: MYR ${medicalTotal.toFixed(2)}

Return ONLY valid JSON with no markdown:
{
  "insight": "2-3 warm, friendly sentences summarising the overall spending — mention the totals naturally, point out the biggest category, keep it encouraging",
  "topCategory": "Groceries or Medical — whichever is higher",
  "groceriesTip": "One friendly, practical tip about the grocery spending — e.g. what was bought most, whether it looks reasonable",
  "medicalTip": "One friendly note about the medical expenses — remind them these are claimable, keep it supportive",
  "claimNote": "A short, friendly reminder about keeping these receipts for family reimbursement — 1 sentence"
}

Rules:
- No financial jargon, no medical advice
- Sound like you're texting a caring friend
- Never say 'I recommend', 'you should', 'consult', 'advise'
- If a category has no data, say something encouraging like 'Nothing logged here yet!'`;

    const response = await ai.generate({
      model: "googleai/gemini-2.5-flash",
      prompt: [{ text: prompt }],
    });

    const raw     = response.text?.trim() ?? "";
    const jsonStr = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
    const result  = JSON.parse(jsonStr) as FinancialAnalysisResult;

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Unexpected error" }, { status: 500 });
  }
}
