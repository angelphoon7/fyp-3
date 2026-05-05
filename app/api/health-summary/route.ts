import { NextRequest, NextResponse } from "next/server";
import { ai } from "@/whatsapp/genkit";

export interface HealthSummaryResult {
  overallStatus: "Good" | "Fair" | "Needs Attention";
  score: number;
  summary: string;
  highlights: string[];
  concerns: string[];
  recommendation: string;
}

export async function POST(req: NextRequest) {
  try {
    const { careTasks, medications, appointments, householdTasks } = await req.json();

    const prompt = `You are a warm, caring companion helping a family caregiver keep track of their loved one's daily routine. You write like a supportive friend — natural, kind, and grounded. You do NOT give medical advice, diagnoses, or act like a doctor.

Here is today's activity data from the caregiver app:

CARE TASKS (bathing, dressing, feeding):
${JSON.stringify(careTasks ?? [], null, 2)}

MEDICATIONS (taken or pending):
${JSON.stringify(medications ?? [], null, 2)}

APPOINTMENTS:
${JSON.stringify(appointments ?? [], null, 2)}

HOUSEHOLD TASKS:
${JSON.stringify(householdTasks ?? [], null, 2)}

Write a short daily check-in summary for the caregiver. Sound like a caring friend catching up — warm, real, and simple. No clinical language, no medical terms, no advice that sounds like it comes from a doctor.

Return ONLY valid JSON with no markdown:
{
  "overallStatus": "Good",
  "score": 85,
  "summary": "2-3 sentences written like a friend checking in — mention what went well today and any small things to keep an eye on. Use 'they' for the patient.",
  "highlights": ["A warm, simple note about something that went well today", "Another positive observation"],
  "concerns": ["A gentle, non-alarming note if something was missed — no drama"],
  "recommendation": "One small, practical thing the caregiver can do — phrased like friendly advice, not a prescription"
}

Rules:
- overallStatus must be exactly "Good", "Fair", or "Needs Attention"
- score is 0-100
- Max 3 highlights, max 2 concerns
- If nothing was missed, return empty concerns array
- Never say things like "consult a doctor", "seek medical attention", "clinical", "diagnosis", "symptoms"
- Write as if texting a friend, not writing a report`;

    const response = await ai.generate({
      model: "googleai/gemini-2.5-flash",
      prompt: [{ text: prompt }],
    });

    const raw     = response.text?.trim() ?? "";
    const jsonStr = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
    const result  = JSON.parse(jsonStr) as HealthSummaryResult;

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Unexpected error" }, { status: 500 });
  }
}
