import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/whatsapp/openai-client";
import { analyzeWithCloudVision } from "@/whatsapp/cloud-vision";

export interface NutritionResult {
  isMeal: boolean;
  foods: string[];
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  summary: string;
}

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();
    if (!image) return NextResponse.json({ error: "image required" }, { status: 400 });

    const base64 = image.includes(",") ? image.split(",")[1] : image;

    let visionLabels = "";
    try {
      const cvResult = await analyzeWithCloudVision(base64);
      const relevant = cvResult.labels.filter(l => l.confidence >= 60);
      if (relevant.length > 0) {
        visionLabels = relevant.map(l => `${l.name} (${l.confidence}%)`).join(", ");
      }
    } catch {
      // non-fatal
    }

    const prompt = `You are a nutrition analysis assistant.
${visionLabels ? `Google Cloud Vision identified: ${visionLabels}\n` : ""}
STEP 1 — Classify: Is this image a photo of a cooked meal, plated food, or food dish? Set "isMeal" to true for prepared/cooked food. Set it to false for receipts, documents, raw ingredients only, objects, scenery, people without food, etc.

STEP 2 — If isMeal is true, estimate nutritional content. If false, set all numbers to 0 and leave foods/summary empty.

Return ONLY a valid JSON object with no markdown or extra text:
{
  "isMeal": true,
  "foods": ["food item 1", "food item 2"],
  "calories": 450,
  "protein": 25,
  "carbs": 55,
  "fat": 12,
  "fiber": 5,
  "summary": "One sentence describing the meal and overall healthiness"
}

All numeric values are estimates per the portion visible in the image. Use typical Malaysian/Asian meal portion sizes as reference.`;

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

    const raw      = response.choices[0]?.message?.content?.trim() ?? "";
    const jsonStr  = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
    const nutrition = JSON.parse(jsonStr) as NutritionResult;

    return NextResponse.json(nutrition);
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Unexpected error" }, { status: 500 });
  }
}
