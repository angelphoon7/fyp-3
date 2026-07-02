"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import IPhone13Frame from "@/components/iPhone13Frame";
import { load, hydrate, KEYS } from "@/app/lib/store";
import type { HealthSummaryResult } from "@/app/api/health-summary/route";

// ── types mirroring each feature page ────────────────────────────────────────

type CareLog  = { label: string; time: string; image?: string };
type CareTask = { id: string; name: string; icon: string; logs: CareLog[]; targetLogs?: number };

type MedSchedule = { id: string; period: string; time: string; taken: boolean; takenAt?: string };
type Medication  = { id: string; name: string; dosage: string; schedules: MedSchedule[] };

type Appointment = { id: string; hospital: string; date: string; time: string; notes: string };

type HouseLog  = { label: string; time: string; image?: string };
type HouseTask = { id: string; name: string; icon: string; logs: HouseLog[]; targetLogs?: number };

// ── helpers ───────────────────────────────────────────────────────────────────

function scoreColor(s: number) {
  if (s >= 80) return "text-emerald-400";
  if (s >= 55) return "text-yellow-400";
  return "text-red-400";
}

function scoreBg(s: number) {
  if (s >= 80) return "border-emerald-500/30 bg-emerald-500/10";
  if (s >= 55) return "border-yellow-500/30 bg-yellow-500/10";
  return "border-red-500/30 bg-red-500/10";
}

function formatDate(d: string) {
  if (!d) return "";
  return new Date(d + "T00:00:00").toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" });
}

function formatTime(t: string) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

// ── component ─────────────────────────────────────────────────────────────────

type Contact = { id: string; name: string; chatId: string; relation: string };

export default function ReportPage() {
  const router = useRouter();

  const [careTasks,      setCareTasks]      = useState<CareTask[]>([]);
  const [medications,    setMedications]    = useState<Medication[]>([]);
  const [appointments,   setAppointments]   = useState<Appointment[]>([]);
  const [householdTasks, setHouseholdTasks] = useState<HouseTask[]>([]);

  const [aiSummary,    setAiSummary]   = useState<HealthSummaryResult | null>(null);
  const [generating,   setGenerating]  = useState(false);
  const [aiError,      setAiError]     = useState<string | null>(null);
  const [downloading,  setDownloading] = useState(false);

  const [contacts,          setContacts]          = useState<Contact[]>([]);
  const [sendOpen,          setSendOpen]          = useState(false);
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [sending,           setSending]           = useState(false);
  const [sent,              setSent]              = useState(false);
  const [sendError,         setSendError]         = useState<string | null>(null);

  useEffect(() => {
    // Load from localStorage immediately so page isn't blank while Firebase fetches
    const localCareTasks = load<CareTask[]>(KEYS.careTasks, []);
    const localMeds      = load<Medication[]>(KEYS.medications, []);
    const localAppts     = load<Appointment[]>(KEYS.appointments, []);
    const localHouse     = load<HouseTask[]>(KEYS.householdTasks, []);
    if (localCareTasks.length)  setCareTasks(localCareTasks);
    if (localMeds.length)       setMedications(localMeds);
    if (localAppts.length)      setAppointments(localAppts);
    if (localHouse.length)      setHouseholdTasks(localHouse);

    const localContacts = load<Contact[]>(KEYS.contacts, []);
    if (localContacts.length) setContacts(localContacts);

    hydrate().then((remote) => {
      if (remote[KEYS.careTasks]?.length)      setCareTasks(remote[KEYS.careTasks]);
      if (remote[KEYS.medications]?.length)    setMedications(remote[KEYS.medications]);
      if (remote[KEYS.appointments]?.length)   setAppointments(remote[KEYS.appointments]);
      if (remote[KEYS.householdTasks]?.length) setHouseholdTasks(remote[KEYS.householdTasks]);
      if (remote[KEYS.contacts]?.length)       setContacts(remote[KEYS.contacts]);
    });
  }, []);

  // ── derived stats ─────────────────────────────────────────────────────────

  const careCompleted  = careTasks.filter(t => t.logs.length >= (t.targetLogs ?? 1)).length;
  const careTotal      = careTasks.length;

  const medTotal  = medications.reduce((s, m) => s + m.schedules.length, 0);
  const medTaken  = medications.reduce((s, m) => s + m.schedules.filter(sc => sc.taken).length, 0);
  const medPct    = medTotal > 0 ? Math.round((medTaken / medTotal) * 100) : 0;

  const upcomingAppts = appointments
    .filter(a => new Date(a.date + "T" + a.time) >= new Date())
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3);

  const houseCompleted = householdTasks.filter(t => t.logs.length >= (t.targetLogs ?? 1)).length;
  const houseTotal     = householdTasks.length;

  // Simple overall score: care 40% + medication 40% + household 20%
  const overallScore = Math.round(
    (careTotal  > 0 ? (careCompleted  / careTotal)  * 40 : 0) +
    (medTotal   > 0 ? (medPct / 100) * 40            : 0) +
    (houseTotal > 0 ? (houseCompleted / houseTotal) * 20 : 0)
  );

  const hasAnyData = careTotal > 0 || medTotal > 0 || appointments.length > 0 || houseTotal > 0;

  // ── AI summary ────────────────────────────────────────────────────────────

  const sendToFamily = async () => {
    if (!selectedContactIds.length) return;
    setSending(true);
    const today = new Date().toLocaleDateString("en-MY", { day: "numeric", month: "long", year: "numeric" });
    const nextAppt = appointments
      .filter(a => new Date(a.date + "T" + a.time) >= new Date())
      .sort((a, b) => a.date.localeCompare(b.date))[0];

    const lines = [
      `📊 KAI Health Report — ${today}`,
      "",
      `Overall Score: ${hasAnyData ? `${overallScore}/100` : "No data yet"}`,
      "",
      careTotal > 0   ? `🏥 Patient Care: ${careCompleted}/${careTotal} tasks done` : "🏥 Patient Care: No tasks",
      medTotal > 0    ? `💊 Medication: ${medPct}% (${medTaken}/${medTotal} doses taken)` : "💊 Medication: No medications",
      nextAppt        ? `📅 Next Appointment: ${nextAppt.hospital} — ${formatDate(nextAppt.date)}` : "📅 No upcoming appointments",
      houseTotal > 0  ? `🏠 Household: ${houseCompleted}/${houseTotal} tasks done` : "🏠 Household: No tasks",
      "",
      "— KAI Caregiving App",
    ];
    const message = lines.join("\n");
    const chatIds = contacts.filter(c => selectedContactIds.includes(c.id)).map(c => c.chatId);
    setSendError(null);
    try {
      const res = await fetch("/api/send-telegram-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatIds, message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to send");
      setSent(true);
      setTimeout(() => { setSent(false); setSendOpen(false); setSelectedContactIds([]); setSendError(null); }, 1500);
    } catch (e: any) {
      setSendError(e.message ?? "Failed to send");
    } finally {
      setSending(false);
    }
  };

  const downloadPDF = async () => {
    setDownloading(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      const pageW = doc.internal.pageSize.getWidth();
      const margin = 16;
      const colW   = pageW - margin * 2;
      let y = 20;

      const nl = (extra = 0) => { y += 6 + extra; };
      const section = (title: string) => {
        if (y > 250) { doc.addPage(); y = 20; }
        doc.setFillColor(30, 30, 30);
        doc.rect(margin, y - 4, colW, 8, "F");
        doc.setFontSize(8).setTextColor(180, 180, 180).setFont("helvetica", "bold");
        doc.text(title.toUpperCase(), margin + 2, y + 1);
        y += 8;
      };
      const row = (label: string, value: string, color?: [number, number, number]) => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.setFontSize(9).setTextColor(80, 80, 80).setFont("helvetica", "normal");
        doc.text(label, margin, y);
        doc.setTextColor(...(color ?? [30, 30, 30] as [number,number,number])).setFont("helvetica", "bold");
        doc.text(value, margin + 55, y);
        nl();
      };
      const body = (text: string) => {
        if (y > 270) { doc.addPage(); y = 20; }
        const lines = doc.splitTextToSize(text, colW) as string[];
        doc.setFontSize(9).setTextColor(60, 60, 60).setFont("helvetica", "normal");
        doc.text(lines, margin, y);
        y += lines.length * 5;
      };

      // ── Title ──────────────────────────────────────────────────────────
      doc.setFontSize(18).setTextColor(20, 20, 20).setFont("helvetica", "bold");
      doc.text("KAI Health Report", margin, y); nl(2);
      doc.setFontSize(9).setTextColor(120, 120, 120).setFont("helvetica", "normal");
      doc.text(new Date().toLocaleDateString("en-MY", { day: "numeric", month: "long", year: "numeric" }), margin, y);
      nl(6);

      // ── Overall Score ──────────────────────────────────────────────────
      section("Overall Care Score");
      row("Score", `${overallScore}/100`);
      row("Status", overallScore >= 80 ? "Good" : overallScore >= 55 ? "Fair" : "Needs Attention",
        overallScore >= 80 ? [16, 185, 129] : overallScore >= 55 ? [234, 179, 8] : [239, 68, 68]);
      nl(2);

      // ── Care Tasks ─────────────────────────────────────────────────────
      if (careTasks.length > 0) {
        section("Patient Care");
        row("Completed", `${careCompleted} / ${careTotal} tasks`);
        careTasks.forEach(t => row(`  ${t.name}`, t.logs.length > 0 ? `✓ ${t.logs.length} check-in(s)` : "Not logged"));
        nl(2);
      }

      // ── Medication ─────────────────────────────────────────────────────
      if (medications.length > 0) {
        section("Medication");
        row("Adherence", `${medPct}% (${medTaken}/${medTotal} doses)`);
        medications.forEach(m => {
          const taken = m.schedules.filter(s => s.taken).length;
          row(`  ${m.name} ${m.dosage}`, `${taken}/${m.schedules.length} taken`);
          m.schedules.forEach(s => {
            doc.setFontSize(8).setTextColor(120, 120, 120).setFont("helvetica", "normal");
            const info = s.taken ? `✓ Taken at ${s.takenAt}` : `○ ${s.time} — not yet taken`;
            doc.text(`       ${s.period}: ${info}`, margin, y);
            nl();
          });
        });
        nl(2);
      }

      // ── Appointments ───────────────────────────────────────────────────
      if (appointments.length > 0) {
        section("Appointments");
        appointments.forEach(a => {
          row(`  ${a.hospital}`, `${formatDate(a.date)}  ${formatTime(a.time)}`);
          if (a.notes) {
            doc.setFontSize(8).setTextColor(130, 130, 130).setFont("helvetica", "italic");
            doc.text(`       ${a.notes}`, margin, y); nl();
          }
        });
        nl(2);
      }

      // ── Household ──────────────────────────────────────────────────────
      if (householdTasks.length > 0) {
        section("Household Tasks");
        row("Completed", `${houseCompleted} / ${houseTotal} tasks`);
        householdTasks.forEach(t => row(`  ${t.name}`, t.logs.length > 0 ? `✓ Done` : "Not done"));
        nl(2);
      }

      // ── AI Summary ─────────────────────────────────────────────────────
      if (aiSummary) {
        section("Care Summary");
        row("Status", aiSummary.overallStatus);
        row("Score",  `${aiSummary.score}/100`);
        nl(1);
        body(aiSummary.summary); nl(1);
        if (aiSummary.highlights.length > 0) {
          doc.setFontSize(8).setTextColor(60, 60, 60).setFont("helvetica", "bold");
          doc.text("Highlights:", margin, y); nl();
          aiSummary.highlights.forEach(h => { body(`• ${h}`); });
        }
        if (aiSummary.meals?.length > 0) {
          nl(1);
          doc.setFontSize(8).setTextColor(60, 60, 60).setFont("helvetica", "bold");
          doc.text("Suggested Meals:", margin, y); nl();
          aiSummary.meals.forEach(m => {
            body(`• ${m.name} — ${m.description}`);
            doc.setFontSize(7.5).setTextColor(100, 100, 100).setFont("helvetica", "italic");
            const lines = doc.splitTextToSize(`  ${m.why}`, colW) as string[];
            doc.text(lines, margin, y);
            y += lines.length * 4.5;
          });
        }
        nl(1);
        doc.setFontSize(8).setTextColor(60, 60, 60).setFont("helvetica", "bold");
        doc.text("Today's Tip:", margin, y); nl();
        body(aiSummary.recommendation);
        nl(2);
      }

      // ── Footer ─────────────────────────────────────────────────────────
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7).setTextColor(160, 160, 160).setFont("helvetica", "normal");
        doc.text(`Generated by KAI · Page ${i} of ${pageCount}`, margin, 287);
      }

      doc.save(`KAI_Health_Report_${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (e: any) {
      console.error("PDF error:", e);
    } finally {
      setDownloading(false);
    }
  };

  const generateSummary = async () => {
    setGenerating(true);
    setAiError(null);
    try {
      const stripImages = (tasks: CareTask[]) =>
        tasks.map(t => ({ ...t, logs: t.logs.map(({ image: _img, ...log }) => log) }));
      const stripHouseImages = (tasks: HouseTask[]) =>
        tasks.map(t => ({ ...t, logs: t.logs.map(({ image: _img, ...log }) => log) }));

      const res  = await fetch("/api/health-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          careTasks: stripImages(careTasks),
          medications,
          appointments,
          householdTasks: stripHouseImages(householdTasks),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setAiSummary(data);
    } catch (e: any) {
      setAiError(e.message ?? "Could not generate summary");
    } finally {
      setGenerating(false);
    }
  };

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <IPhone13Frame>
      <div className="flex min-h-full flex-col bg-[#0f1117] relative text-white font-sans">

        {/* Send to Family sheet */}
        {sendOpen && (
          <div className="absolute inset-0 z-50 flex items-end" onClick={() => setSendOpen(false)}>
            <div className="w-full bg-[#111] border-t border-white/10 rounded-t-3xl p-5 pb-10 space-y-4 animate-in slide-in-from-bottom-4 duration-200" onClick={e => e.stopPropagation()}>
              <div className="w-10 h-1 bg-white/20 rounded-full mx-auto" />
              <p className="text-sm font-bold text-white text-center">Send Health Report</p>
              <p className="text-[11px] text-white/40 text-center -mt-2">Select contacts to notify via Telegram</p>
              <div className="space-y-2">
                {contacts.map(c => {
                  const selected = selectedContactIds.includes(c.id);
                  return (
                    <button key={c.id} onClick={() => setSelectedContactIds(prev => prev.includes(c.id) ? prev.filter(x => x !== c.id) : [...prev, c.id])}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors ${selected ? "bg-blue-500/10 border-blue-500/30" : "bg-white/5 border-white/10"}`}>
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold ${selected ? "bg-blue-400 text-white" : "bg-white/10 text-white/50"}`}>
                        {selected ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> : c.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 text-left">
                        <p className={`text-sm font-semibold ${selected ? "text-blue-100" : "text-white/70"}`}>{c.name}</p>
                        <p className="text-[11px] text-white/30">{c.relation} · Telegram {c.chatId}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
              {sendError && <p className="text-xs text-red-400 text-center">{sendError}</p>}
              <button onClick={sendToFamily} disabled={!selectedContactIds.length || sending || sent}
                className="w-full py-3 rounded-xl bg-blue-500 text-white font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-opacity">
                {sent ? "✓ Sent!" : sending ? "Sending…" : selectedContactIds.length > 0 ? `Send to ${selectedContactIds.length} contact${selectedContactIds.length !== 1 ? "s" : ""}` : "Select a contact"}
              </button>
              <button onClick={() => setSendOpen(false)} className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white/50 text-sm">Cancel</button>
            </div>
          </div>
        )}

        <div className="flex flex-col flex-1 overflow-y-auto pb-10">

          {/* Header — glass pill matching Home Dashboard */}
          <div className="relative mx-4 mt-12 mb-1 rounded-[22px] bg-white border border-gray-100 shadow-sm">
            <div className="relative flex items-center gap-3 px-5 py-4">
              <button
                onClick={() => router.push("/home")}
                className="h-8 w-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0 active:bg-gray-200 transition-colors"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-gray-400 text-[9px] font-semibold tracking-[0.22em] uppercase mb-0.5">Report</p>
                <h1 className="text-[20px] font-bold tracking-tight text-gray-900 leading-none">Health Report</h1>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => { setSendOpen(true); setSent(false); }}
                  disabled={!hasAnyData || !contacts.length}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 text-xs font-medium active:bg-blue-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 3 2 12l7 3"/><path d="m9 15 5 7 8-19"/></svg>
                  Share
                </button>
                <button
                  onClick={downloadPDF}
                  disabled={!hasAnyData || downloading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 border border-gray-200 text-gray-600 text-xs font-medium active:bg-gray-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {downloading ? (
                    <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                  ) : (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  )}
                  {downloading ? "Saving…" : "PDF"}
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 p-4">

            {/* Overall Score */}
            <div className="rounded-2xl border border-gray-100 bg-white p-4 flex items-center gap-4">
              <div className="relative h-14 w-14 shrink-0">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
                  <circle
                    cx="18" cy="18" r="15.9" fill="none"
                    stroke={overallScore >= 80 ? "#34d399" : overallScore >= 55 ? "#fbbf24" : "#94a3b8"}
                    strokeWidth="3"
                    strokeDasharray={`${overallScore}, 100`}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-gray-700">
                  {hasAnyData ? overallScore : "—"}
                </span>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-medium mb-0.5">Overall Care Score</p>
                <p className="text-lg font-semibold text-gray-900">
                  {!hasAnyData ? "No data yet" : overallScore >= 80 ? "Looking good" : overallScore >= 55 ? "On track" : "Getting started"}
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">Based on today's activity</p>
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3">

              {/* Care Tasks */}
              <div className="rounded-2xl border border-gray-100 bg-gradient-to-b from-rose-50 to-white p-3.5 shadow-sm">
                <div className="flex items-center mb-3">
                  <p className="text-sm text-rose-600 font-bold tracking-[0.08em] uppercase">Patient Care</p>
                </div>
                {careTotal > 0 ? (
                  <>
                    <p className="text-xl font-semibold text-gray-900">{careCompleted}<span className="text-gray-400 text-sm font-normal">/{careTotal}</span></p>
                    <p className="text-[10px] text-gray-400 mt-0.5 mb-2">tasks completed</p>
                    <div className="space-y-1">
                      {careTasks.map(t => (
                        <div key={t.id} className="flex items-center justify-between text-[11px]">
                          <span className="text-gray-600 font-medium">{t.name}</span>
                          <span className={t.logs.length >= (t.targetLogs ?? 1) ? "text-emerald-500" : "text-gray-300"}>
                            {t.logs.length >= (t.targetLogs ?? 1) ? `✓` : `${t.logs.length}/${t.targetLogs ?? 1}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-[11px] text-gray-300 italic mt-1">No tasks yet</p>
                )}
              </div>

              {/* Medication */}
              <div className="rounded-2xl border border-gray-100 bg-gradient-to-b from-indigo-50 to-white p-3.5 shadow-sm">
                <div className="flex items-center mb-3">
                  <p className="text-sm text-indigo-600 font-bold tracking-[0.08em] uppercase">Medication</p>
                </div>
                {medTotal > 0 ? (
                  <>
                    <p className="text-xl font-semibold text-gray-900">{medPct}<span className="text-gray-400 text-sm font-normal">%</span></p>
                    <p className="text-[10px] text-gray-400 mt-0.5 mb-2">{medTaken}/{medTotal} doses taken</p>
                    <div className="space-y-1">
                      {medications.map(m => (
                        <div key={m.id} className="flex items-center justify-between text-[11px]">
                          <span className="text-gray-600 truncate pr-1">{m.name}</span>
                          <span className={m.schedules.every(s => s.taken) ? "text-emerald-500" : "text-gray-500"}>
                            {m.schedules.filter(s => s.taken).length}/{m.schedules.length}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-[11px] text-gray-300 italic mt-1">No medications</p>
                )}
              </div>

              {/* Household */}
              <div className="rounded-2xl border border-gray-100 bg-gradient-to-b from-amber-50 to-white p-3.5 shadow-sm">
                <div className="flex items-center mb-3">
                  <p className="text-sm text-amber-600 font-bold tracking-[0.08em] uppercase">Household</p>
                </div>
                {houseTotal > 0 ? (
                  <>
                    <p className="text-xl font-semibold text-gray-900">{houseCompleted}<span className="text-gray-400 text-sm font-normal">/{houseTotal}</span></p>
                    <p className="text-[10px] text-gray-400 mt-0.5 mb-2">tasks done</p>
                    <div className="space-y-1">
                      {householdTasks.map(t => (
                        <div key={t.id} className="flex items-center justify-between text-[11px]">
                          <span className="text-gray-600 font-medium">{t.name}</span>
                          <span className={t.logs.length >= (t.targetLogs ?? 1) ? "text-emerald-500" : "text-gray-300"}>
                            {t.logs.length >= (t.targetLogs ?? 1) ? "✓" : `${t.logs.length}/${t.targetLogs ?? 1}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-[11px] text-gray-300 italic mt-1">No tasks yet</p>
                )}
              </div>

              {/* Appointments */}
              <div className="rounded-2xl border border-gray-100 bg-gradient-to-b from-cyan-50 to-white p-3.5 shadow-sm">
                <div className="flex items-center mb-3">
                  <p className="text-sm text-cyan-600 font-bold tracking-[0.08em] uppercase">Appointments</p>
                </div>
                {upcomingAppts.length > 0 ? (
                  <div className="space-y-2">
                    {upcomingAppts.map(a => (
                      <div key={a.id}>
                        <p className="text-[11px] font-medium text-gray-800 truncate">{a.hospital}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">{formatDate(a.date)} · {formatTime(a.time)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-gray-300 italic mt-1">No upcoming visits</p>
                )}
              </div>
            </div>

            {/* Pending doses */}
            {medications.some(m => m.schedules.some(s => !s.taken)) && (
              <div className="rounded-2xl border border-gray-100 bg-gradient-to-b from-yellow-50 to-white p-3.5 shadow-sm">
                <div className="flex items-center mb-3">
                  <p className="text-sm text-yellow-600 font-bold tracking-[0.08em] uppercase">Pending doses</p>
                </div>
                <div className="space-y-2">
                  {medications.flatMap(m =>
                    m.schedules
                      .filter(s => !s.taken)
                      .map(s => (
                        <div key={s.id} className="flex justify-between items-center text-[11px]">
                          <span className="text-gray-700">{m.name} <span className="text-gray-400">{m.dosage}</span></span>
                          <span className="text-gray-500">{s.period} · {s.time}</span>
                        </div>
                      ))
                  )}
                </div>
              </div>
            )}

            {/* AI Health Summary */}
            <div className="rounded-2xl border border-gray-100 bg-gradient-to-b from-emerald-50 to-white p-3.5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-emerald-600 font-bold tracking-[0.08em] uppercase">Care summary</p>
              </div>

              {!aiSummary && !generating && (
                <button
                  onClick={generateSummary}
                  disabled={!hasAnyData}
                  className="w-full py-3 rounded-xl border border-yellow-500/40 bg-yellow-400/10 text-yellow-600 text-sm font-bold hover:bg-yellow-400/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Generate Report Summary
                </button>
              )}

              {generating && (
                <div className="flex items-center gap-2 py-3">
                  <svg className="animate-spin shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgb(250 204 21)" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                  <span className="text-sm text-gray-500">Analysing health data...</span>
                </div>
              )}

              {aiError && <p className="text-xs text-red-400">{aiError}</p>}

              {aiSummary && (
                <div className="space-y-3">
                  {/* Status badge */}
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-bold ${scoreBg(aiSummary.score)}`}>
                    <span className={scoreColor(aiSummary.score)}>●</span>
                    <span className={scoreColor(aiSummary.score)}>{aiSummary.overallStatus}</span>
                    <span className="text-gray-400">· {aiSummary.score}/100</span>
                  </div>

                  <p className="text-sm text-gray-700 leading-relaxed">{aiSummary.summary}</p>

                  {aiSummary.highlights.length > 0 && (
                    <div className="space-y-1">
                      {aiSummary.highlights.map((h, i) => (
                        <div key={i} className="flex items-start gap-2 text-[12px] text-emerald-700">
                          <span className="mt-0.5 shrink-0">✓</span><span>{h}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Meal Recommendations */}
                  {aiSummary.meals?.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Suggested Meals Today</p>
                      {aiSummary.meals.map((meal, i) => (
                        <div key={i} className="rounded-xl border border-gray-100 bg-white overflow-hidden shadow-sm">
                          <div className="flex gap-3 p-3">
                            <div className="h-16 w-16 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                              <img
                                src={meal.imageUrl}
                                alt={meal.name}
                                className="h-full w-full object-cover"
                                onError={e => {
                                  const el = e.target as HTMLImageElement;
                                  el.style.display = "none";
                                  el.parentElement!.innerHTML = `<div class="h-full w-full flex items-center justify-center text-2xl">🍽️</div>`;
                                }}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-full px-1.5 py-0.5">Meal {i + 1}</span>
                              </div>
                              <p className="text-[13px] font-bold text-gray-900 leading-snug">{meal.name}</p>
                              <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{meal.description}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-1.5 px-3 py-2 bg-emerald-50 border-t border-emerald-100/60">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
                            <p className="text-[11px] text-emerald-700 leading-relaxed">{meal.why}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

<button
                    onClick={generateSummary}
                    className="text-[11px] text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    Regenerate
                  </button>
                </div>
              )}
            </div>

            {!hasAnyData && (
              <div className="text-center py-8">
                <div className="flex justify-center mb-3">
                  <div className="h-12 w-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>
                  </div>
                </div>
                <p className="text-sm text-white/40">No activity logged yet.</p>
                <p className="text-xs text-white/25 mt-1">Start tracking from Patient Caring, Medication, or Household.</p>
              </div>
            )}

            <p className="text-center text-[10px] text-white/15">
              KAI · {new Date().toLocaleDateString("en-MY", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
        </div>
      </div>
    </IPhone13Frame>
  );
}
