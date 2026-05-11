import { NextRequest, NextResponse } from "next/server";
import { ai } from "@/whatsapp/genkit";

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

    const prompt = `You are a warm, caring companion helping a family caregiver look after their loved one. You write like a supportive friend — natural, kind, and grounded. You do NOT give medical advice, medication instructions, or act like a doctor. Never recommend specific drugs, doses, or supplements.

Here is today's activity data:

CARE TASKS (bathing, dressing, feeding):
${JSON.stringify(careTasks ?? [], null, 2)}

MEDICATIONS (reference only — do NOT advise on medications):
${JSON.stringify(medications ?? [], null, 2)}

APPOINTMENTS:
${JSON.stringify(appointments ?? [], null, 2)}

HOUSEHOLD TASKS:
${JSON.stringify(householdTasks ?? [], null, 2)}

Write a short daily check-in and recommend 3 meals for the caregiver to cook for their loved one today. Meals should be soft, easy-to-digest, and nourishing — suitable for an elderly person or someone who needs daily care. Be warm and practical.

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
- Max 3 highlights
- Never mention medications, drugs, supplements, or clinical terms
- Meal names must be in plain English so they can be searched in a food database (e.g. "Steamed Fish", "Pumpkin Soup", "Oatmeal Porridge")
- Write as if texting a caring friend, not writing a report`;

    const response = await ai.generate({
      model: "googleai/gemini-2.5-flash",
      prompt: [{ text: prompt }],
    });

    const raw     = response.text?.trim() ?? "";
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
