import { NextResponse } from "next/server";
import { db } from "@/whatsapp/firebase";

async function loadKey(key: string) {
  const doc = await db.collection("kai_app_state").doc(key).get();
  return doc.exists ? doc.data()?.value ?? [] : [];
}

export async function GET() {
  try {
    const [householdTasks, appointments] = await Promise.all([
      loadKey("kai_household_tasks"),
      loadKey("kai_appointments"),
    ]);

    // Grocery receipts from household groceries task
    const groceries    = (householdTasks as any[]).find(t => t.id === "groceries");
    const groceryReceipts = (groceries?.logs ?? [])
      .filter((l: any) => l.receipt)
      .map((l: any) => ({
        store:    l.receipt.store,
        date:     l.receipt.date || l.time,
        total:    l.receipt.total,
        currency: l.receipt.currency ?? "MYR",
        items:    l.receipt.items ?? [],
        claimNote: l.receipt.claimSummary,
      }));

    // Medical receipts from appointments
    const medicalReceipts = (appointments as any[])
      .filter(a => a.doc?.report)
      .map(a => ({
        hospital:  a.doc.report.hospital || a.hospital,
        date:      a.doc.report.visitDate || a.date,
        total:     a.doc.report.total,
        currency:  a.doc.report.currency ?? "MYR",
        items:     a.doc.report.items ?? [],
        diagnosis: a.doc.report.diagnosis,
        claimNote: a.doc.report.claimSummary,
      }));

    const groceryTotal = groceryReceipts.reduce((s: number, r: any) => s + (r.total ?? 0), 0);
    const medicalTotal = medicalReceipts.reduce((s: number, r: any) => s + (r.total ?? 0), 0);

    return NextResponse.json({
      generatedAt:     new Date().toISOString(),
      groceryReceipts,
      medicalReceipts,
      groceryTotal,
      medicalTotal,
      grandTotal:      groceryTotal + medicalTotal,
      currency:        "MYR",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
