import { NextRequest, NextResponse } from "next/server";
import { GoogleAuth } from "google-auth-library";

export interface HealthSummaryResult {
  overallStatus: "Good" | "Fair" | "Needs Attention";
  score: number;
  summary: string;
  highlights: string[];
  concerns: string[];
  recommendation: string;
}

let _auth: GoogleAuth | null = null;

function getAuth() {
  if (!_auth) {
    _auth = new GoogleAuth({ scopes: ["https://www.googleapis.com/auth/cloud-platform"] });
  }
  return _auth;
}

export async function POST(req: NextRequest) {
  try {
    const { careTasks, medications, appointments, householdTasks } = await req.json();

    const auth      = getAuth();
    const projectId = await auth.getProjectId();
    const client    = await auth.getClient();
    const { token } = await client.getAccessToken();
    if (!token) throw new Error("Failed to get access token from ADC.");

    const location = "us-central1";
    const model    = "gemini-2.5-flash";
    const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:generateContent`;

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
  "overallStatus": "Good",
  "score": 85,
  "summary": "2-3 sentence plain-language summary of the patient's overall care status today",
  "highlights": ["Positive finding 1", "Positive finding 2"],
  "concerns": ["Concern 1 if any"],
  "recommendation": "One actionable recommendation for the caregiver"
}

Rules:
- overallStatus must be exactly one of: "Good", "Fair", "Needs Attention"
- score is 0-100
- highlights and concerns are short bullet strings (max 3 each)
- If no concerns, return empty array
- Be encouraging but honest`;

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" },
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Vertex AI error ${res.status}: ${body.substring(0, 200)}`);
    }

    const data    = await res.json();
    const raw     = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const jsonStr = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
    const result  = JSON.parse(jsonStr) as HealthSummaryResult;

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Unexpected error" }, { status: 500 });
  }
}
