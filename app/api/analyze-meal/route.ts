import { NextRequest, NextResponse } from "next/server";
import { ai } from "@/whatsapp/genkit";
import { analyzeWithCloudVision } from "@/whatsapp/cloud-vision";

export interface NutritionResult {
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

    const prompt = `You are a nutrition analysis assistant. Analyze this meal photo and estimate its nutritional content.
${visionLabels ? `\nGoogle Cloud Vision identified: ${visionLabels}\n` : ""}
Return ONLY a valid JSON object with no markdown or extra text:
{
  "foods": ["food item 1", "food item 2"],
  "calories": 450,
  "protein": 25,
  "carbs": 55,
  "fat": 12,
  "fiber": 5,
  "summary": "One sentence describing the meal and overall healthiness"
}

All numeric values are estimates per the portion visible in the image. Use typical Malaysian/Asian meal portion sizes as reference.`;

    const response = await ai.generate({
      model: "googleai/gemini-2.5-flash",
      prompt: [
        { media: { url: `data:image/jpeg;base64,${base64}` } },
        { text: prompt },
      ],
    });

    const raw      = response.text?.trim() ?? "";
    const jsonStr  = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
    const nutrition = JSON.parse(jsonStr) as NutritionResult;

    return NextResponse.json(nutrition);
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Unexpected error" }, { status: 500 });
  }
}
