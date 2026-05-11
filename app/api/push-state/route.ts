import { NextRequest, NextResponse } from "next/server";
import { db } from "@/whatsapp/firebase";

// Client pages POST here whenever their localStorage state changes.
// Stored in Firestore so n8n and MCP servers can read live app data.
export async function POST(req: NextRequest) {
  try {
    const { key, value } = await req.json();
    if (!key) return NextResponse.json({ error: "key required" }, { status: 400 });

    await db.collection("kai_app_state").doc(key).set(
      { value, updatedAt: new Date().toISOString() },
      { merge: true }
    );

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
