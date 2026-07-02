import { NextRequest, NextResponse } from "next/server";
import { db } from "@/whatsapp/firebase";

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("name")?.trim();
  if (!raw) return NextResponse.json({ taken: false });

  const lower = raw.toLowerCase();

  try {
    const [byLower, byExact] = await Promise.all([
      db.collection("users").where("caregiverNameLower", "==", lower).get(),
      db.collection("users").where("caregiverName", "==", raw).get(),
    ]);
    return NextResponse.json({ taken: byLower.docs.length > 0 || byExact.docs.length > 0 });
  } catch (err) {
    console.error("[onboard GET]", err);
    return NextResponse.json({ taken: false });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { phone, ...profile } = body;

  const caregiverNameLower = (profile.caregiverName ?? "").trim().toLowerCase();
  const docId = phone?.trim() || `user:${caregiverNameLower}`;

  await db.collection("users").doc(docId).set({
    phone: phone?.trim() || null,
    onboarded: false,
    step: 1,
    ...profile,
    caregiverNameLower,
  }, { merge: true });

  return NextResponse.json({ ok: true });
}
