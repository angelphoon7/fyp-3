import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/whatsapp/openai-client";

export interface MealRecommendation {
  name: string;
  description: string;
  why: string;
  imageUrl: string;
}

export interface HealthSummaryResult {
  overallStatus: "Good" | "Fair" | "Needs Attention";
  score: number;
  summary: string;
  highlights: string[];
  recommendation: string;
  meals: MealRecommendation[];
}

const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1547592180-85f173990554?w=400&h=250&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=250&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=250&fit=crop&auto=format",
];

async function fetchMealImage(name: string, idx: number): Promise<string> {
  try {
    const res = await fetch(
      `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(name)}`,
      { signal: AbortSignal.timeout(3000) }
    );
    const data = await res.json();
    const thumb = data.meals?.[0]?.strMealThumb;
    if (thumb) return `${thumb}/preview`;
  } catch {}
  return FALLBACK_IMAGES[idx % FALLBACK_IMAGES.length];
}

export async function POST(req: NextRequest) {
  try {
    const { careTasks, medications, appointments, householdTasks } = await req.json();

    const hasCareTasks   = Array.isArray(careTasks)      && careTasks.length > 0;
    const hasMedications = Array.isArray(medications)     && medications.length > 0;
    const hasAppts       = Array.isArray(appointments)    && appointments.length > 0;
    const hasHouseTasks  = Array.isArray(householdTasks)  && householdTasks.length > 0;
    const hasLimitedData = !hasCareTasks && !hasMedications && !hasAppts && !hasHouseTasks;

    const prompt = `You are a warm, caring companion helping a family caregiver look after their elderly loved one. You write like a supportive friend — natural, kind, and grounded. You do NOT give medical advice, medication instructions, or act like a doctor. Never recommend specific drugs, doses, or supplements.

Here is today's caregiving activity data:

CARE TASKS (bathing, dressing, feeding, mobility support):
${JSON.stringify(careTasks ?? [], null, 2)}

MEDICATIONS (reference only — do NOT advise on medications):
${JSON.stringify(medications ?? [], null, 2)}

APPOINTMENTS:
${JSON.stringify(appointments ?? [], null, 2)}

HOUSEHOLD TASKS:
${JSON.stringify(householdTasks ?? [], null, 2)}

${hasLimitedData ? "NOTE: Very little activity has been logged today. Generate general elderly-friendly meal suggestions that are safe and nourishing for most elderly patients." : "Use the care tasks and daily activity above to personalise the meal recommendations to the patient's needs today."}

Write a short daily check-in and recommend EXACTLY 3 meals for the caregiver to prepare for their loved one today.

Meal selection rules:
- Base each meal on the patient's health condition and today's caregiving activity (e.g. if the patient had physiotherapy, suggest high-protein meals; if they seem low-energy, suggest warming, easily digestible foods)
- If data is limited, default to general elderly-friendly soft meals that are safe and nourishing
- All meals must be soft, easy-to-chew, easy-to-digest, and appropriate for an elderly person
- Each meal's "why" must explain specifically why it suits this patient's condition or today's activity
- Meal names must be plain English searchable names (e.g. "Steamed Fish", "Pumpkin Soup", "Oatmeal Porridge")

Return ONLY valid JSON with no markdown:
{
  "overallStatus": "Good",
  "score": 85,
  "summary": "2-3 sentences like a friend checking in — what went well, what to keep an eye on. Use 'they' for the patient.",
  "highlights": ["A warm note about something that went well", "Another positive observation"],
  "recommendation": "One small, friendly caregiving tip for today — not clinical",
  "meals": [
    {
      "name": "Chicken Congee",
      "description": "Silky rice porridge simmered with ginger and shredded chicken, finished with sesame oil.",
      "why": "Gentle on the stomach and easy to swallow — great for low-energy or recovery days."
    },
    { "name": "...", "description": "...", "why": "..." },
    { "name": "...", "description": "...", "why": "..." }
  ]
}

Rules:
- overallStatus must be exactly "Good", "Fair", or "Needs Attention"
- score is 0–100
- Exactly 3 meals — no more, no less
- Max 3 highlights
- Never mention medications, drugs, supplements, or clinical terms
- Write as if texting a caring friend, not writing a clinical report`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });

    const raw     = response.choices[0]?.message?.content?.trim() ?? "";
    const jsonStr = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
    const parsed  = JSON.parse(jsonStr) as Omit<HealthSummaryResult, "meals"> & {
      meals: Omit<MealRecommendation, "imageUrl">[];
    };

    const meals: MealRecommendation[] = await Promise.all(
      (parsed.meals ?? []).map(async (meal, idx) => ({
        ...meal,
        imageUrl: await fetchMealImage(meal.name, idx),
      }))
    );

    return NextResponse.json({ ...parsed, meals });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Unexpected error" }, { status: 500 });
  }
}
