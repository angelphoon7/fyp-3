import { NextResponse } from "next/server";
import { db } from "@/whatsapp/firebase";

async function loadKey(key: string) {
  const doc = await db.collection("kai_app_state").doc(key).get();
  return doc.exists ? doc.data()?.value ?? [] : [];
}

export async function GET() {
  try {
    const [careTasks, medications, appointments, householdTasks] = await Promise.all([
      loadKey("kai_care_tasks"),
      loadKey("kai_medications"),
      loadKey("kai_appointments"),
      loadKey("kai_household_tasks"),
    ]);

    // Care summary
    const careCompleted = careTasks.filter((t: any) => t.logs?.length > 0).length;
    const careTotal     = careTasks.length;

    // Medication summary
    const allSchedules  = medications.flatMap((m: any) => m.schedules ?? []);
    const medTaken      = allSchedules.filter((s: any) => s.taken).length;
    const medTotal      = allSchedules.length;
    const medPending    = medications.flatMap((m: any) =>
      (m.schedules ?? []).filter((s: any) => !s.taken).map((s: any) => ({
        name: m.name, dosage: m.dosage, period: s.period, time: s.time,
      }))
    );

    // Upcoming appointments
    const now             = new Date();
    const upcomingAppts   = (appointments as any[])
      .filter(a => new Date(`${a.date}T${a.time}`) >= now)
      .sort((a: any, b: any) => a.date.localeCompare(b.date))
      .slice(0, 3)
      .map(a => ({ hospital: a.hospital, date: a.date, time: a.time, notes: a.notes }));

    // Household summary
    const houseCompleted  = householdTasks.filter((t: any) => t.logs?.length > 0).length;
    const houseTotal      = householdTasks.length;

    // Overall score
    const score = Math.round(
      (careTotal  > 0 ? (careCompleted  / careTotal)  * 40 : 0) +
      (medTotal   > 0 ? (medTaken / medTotal)         * 40 : 0) +
      (houseTotal > 0 ? (houseCompleted / houseTotal) * 20 : 0)
    );

    return NextResponse.json({
      date: new Date().toISOString().split("T")[0],
      score,
      care: { completed: careCompleted, total: careTotal, tasks: careTasks.map((t: any) => ({ name: t.name, icon: t.icon, done: t.logs?.length > 0, logs: t.logs?.length ?? 0 })) },
      medication: { taken: medTaken, total: medTotal, pending: medPending },
      appointments: { upcoming: upcomingAppts },
      household: { completed: houseCompleted, total: houseTotal },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
