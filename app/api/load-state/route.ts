import { NextResponse } from "next/server";
import { db } from "@/whatsapp/firebase";

const STATE_KEYS = [
  "kai_care_tasks",
  "kai_medications",
  "kai_appointments",
  "kai_household_tasks",
  "kai_contacts",
  "kai_shift_requests",
  "kai_shift_offers",
  "kai_community_posts",
];

export async function GET() {
  const result: Record<string, any> = {};
  await Promise.all(
    STATE_KEYS.map(async (key) => {
      const doc = await db.collection("kai_app_state").doc(key).get();
      if (doc.exists) result[key] = doc.data()?.value ?? null;
    })
  );
  return NextResponse.json(result);
}
