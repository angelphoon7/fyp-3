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
    const body = await req.json();
    const { careTasks, medications, appointments, householdTasks } = body;

    const prompt = `You are a home-care health analyst. Based on the following activity data logged by a caregiver app, generate a concise health status report.

CARE TASKS (bathing, dressing, feeding logs today):
${JSON.stringify(careTasks ?? [], null, 2)}

MEDICATIONS (schedule + taken status):
${JSON.stringify(medications ?? [], null, 2)}

APPOINTMENTS (upcoming hospital visits):
${JSON.stringify(appointments ?? [], null, 2)}

HOUSEHOLD TASKS (cooking, cleaning, groceries logs):
${JSON.stringify(householdTasks ?? [], null, 2)}

Return ONLY valid JSON with no markdown:
{
  "overallStatus": "Good" | "Fair" | "Needs Attention",
  "score": 85,
  "summary": "2-3 sentence plain-language summary of the patient's overall care status today",
  "highlights": ["Positive finding 1", "Positive finding 2"],
  "concerns": ["Concern 1 if any"],
  "recommendation": "One actionable recommendation for the caregiver"
}

Rules:
- score is 0-100
- highlights and concerns are short bullet strings (max 3 each)
- If no concerns, return empty array
- Be encouraging but honest`;

    const response = await ai.generate({
      model: "googleai/gemini-2.5-flash",
      prompt: [{ text: prompt }],
    });

    const raw = response.text?.trim() ?? "";
    const jsonStr = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
    const result = JSON.parse(jsonStr) as HealthSummaryResult;

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Unexpected error" }, { status: 500 });
  }
}
