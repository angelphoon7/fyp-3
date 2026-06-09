"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import IPhone13Frame from "@/components/iPhone13Frame";
import { load, hydrate, KEYS } from "@/app/lib/store";
import type { HealthSummaryResult } from "@/app/api/health-summary/route";

// ── types mirroring each feature page ────────────────────────────────────────

type CareLog  = { label: string; time: string; image?: string };
type CareTask = { id: string; name: string; icon: string; logs: CareLog[] };

type MedSchedule = { id: string; period: string; time: string; taken: boolean; takenAt?: string };
type Medication  = { id: string; name: string; dosage: string; schedules: MedSchedule[] };

type Appointment = { id: string; hospital: string; date: string; time: string; notes: string };

type HouseLog  = { label: string; time: string; image?: string };
type HouseTask = { id: string; name: string; icon: string; logs: HouseLog[] };

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

  useEffect(() => {
    hydrate().then((remote) => {
      setCareTasks(remote[KEYS.careTasks]      ?? load<CareTask[]>(KEYS.careTasks, []));
      setMedications(remote[KEYS.medications]  ?? load<Medication[]>(KEYS.medications, []));
      setAppointments(remote[KEYS.appointments] ?? load<Appointment[]>(KEYS.appointments, []));
      setHouseholdTasks(remote[KEYS.householdTasks] ?? load<HouseTask[]>(KEYS.householdTasks, []));
    });
  }, []);

  // ── derived stats ─────────────────────────────────────────────────────────

  const careCompleted  = careTasks.filter(t => t.logs.length > 0).length;
  const careTotal      = careTasks.length;

  const medTotal  = medications.reduce((s, m) => s + m.schedules.length, 0);
  const medTaken  = medications.reduce((s, m) => s + m.schedules.filter(sc => sc.taken).length, 0);
  const medPct    = medTotal > 0 ? Math.round((medTaken / medTotal) * 100) : 0;

  const upcomingAppts = appointments
    .filter(a => new Date(a.date + "T" + a.time) >= new Date())
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3);

  const houseCompleted = householdTasks.filter(t => t.logs.length > 0).length;
  const houseTotal     = householdTasks.length;

  // Simple overall score: care 40% + medication 40% + household 20%
  const overallScore = Math.round(
    (careTotal  > 0 ? (careCompleted  / careTotal)  * 40 : 0) +
    (medTotal   > 0 ? (medPct / 100) * 40            : 0) +
    (houseTotal > 0 ? (houseCompleted / houseTotal) * 20 : 0)
  );

  const hasAnyData = careTotal > 0 || medTotal > 0 || appointments.length > 0 || houseTotal > 0;

  // ── AI summary ────────────────────────────────────────────────────────────

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
      const res  = await fetch("/api/health-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ careTasks, medications, appointments, householdTasks }),
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

        <div className="flex flex-col flex-1 overflow-y-auto pb-10">

          {/* Header — glass pill matching Home Dashboard */}
          <div className="relative mx-4 mt-12 mb-1 rounded-[22px]"
            style={{
              background: 'linear-gradient(135deg, rgba(180,180,180,0.13) 0%, rgba(120,120,120,0.08) 100%)',
              backdropFilter: 'blur(40px) saturate(180%)',
              WebkitBackdropFilter: 'blur(40px) saturate(180%)',
              border: '1px solid rgba(255,255,255,0.18)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.35), inset 0 1px 1px rgba(255,255,255,0.25), inset 0 -1px 1px rgba(0,0,0,0.15)'
            }}
          >
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
            <div className="relative flex items-center gap-3 px-5 py-4">
              <button
                onClick={() => router.push("/home")}
                className="h-8 w-8 rounded-full bg-white/8 border border-white/15 flex items-center justify-center shrink-0 active:bg-white/15 transition-colors"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-white/40 text-[9px] font-semibold tracking-[0.22em] uppercase mb-0.5">Report</p>
                <h1 className="text-[20px] font-bold tracking-tight text-white leading-none">Health Report</h1>
              </div>
              <button
                onClick={downloadPDF}
                disabled={!hasAnyData || downloading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/8 border border-white/15 text-white/60 text-xs font-medium active:bg-white/15 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
              >
                {downloading ? (
                  <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                ) : (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                )}
                {downloading ? "Saving…" : "Export PDF"}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3 p-4">

            {/* Overall Score */}
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4 flex items-center gap-4">
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
                <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-white/70">
                  {hasAnyData ? overallScore : "—"}
                </span>
              </div>
              <div>
                <p className="text-[10px] text-white/35 font-medium mb-0.5">Overall Care Score</p>
                <p className="text-lg font-semibold text-white">
                  {!hasAnyData ? "No data yet" : overallScore >= 80 ? "Looking good" : overallScore >= 55 ? "On track" : "Getting started"}
                </p>
                <p className="text-[11px] text-white/30 mt-0.5">Based on today's activity</p>
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3">

              {/* Care Tasks */}
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-3.5">
                <div className="flex items-center gap-1.5 mb-2.5">
                  <span className="text-base">🏥</span>
                  <p className="text-[11px] text-white/40 font-medium">Patient Care</p>
                </div>
                {careTotal > 0 ? (
                  <>
                    <p className="text-xl font-semibold text-white">{careCompleted}<span className="text-white/30 text-sm font-normal">/{careTotal}</span></p>
                    <p className="text-[10px] text-white/30 mt-0.5 mb-2">tasks completed</p>
                    <div className="space-y-1">
                      {careTasks.map(t => (
                        <div key={t.id} className="flex items-center justify-between text-[11px]">
                          <span className="text-white/45">{t.icon} {t.name}</span>
                          <span className={t.logs.length > 0 ? "text-emerald-400" : "text-white/20"}>
                            {t.logs.length > 0 ? `✓` : "—"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-[11px] text-white/20 italic mt-1">No tasks yet</p>
                )}
              </div>

              {/* Medication */}
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-3.5">
                <div className="flex items-center gap-1.5 mb-2.5">
                  <span className="text-base">💊</span>
                  <p className="text-[11px] text-white/40 font-medium">Medication</p>
                </div>
                {medTotal > 0 ? (
                  <>
                    <p className="text-xl font-semibold text-white">{medPct}<span className="text-white/30 text-sm font-normal">%</span></p>
                    <p className="text-[10px] text-white/30 mt-0.5 mb-2">{medTaken}/{medTotal} doses taken</p>
                    <div className="space-y-1">
                      {medications.map(m => (
                        <div key={m.id} className="flex items-center justify-between text-[11px]">
                          <span className="text-white/45 truncate pr-1">{m.name}</span>
                          <span className={m.schedules.every(s => s.taken) ? "text-emerald-400" : "text-white/40"}>
                            {m.schedules.filter(s => s.taken).length}/{m.schedules.length}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-[11px] text-white/20 italic mt-1">No medications</p>
                )}
              </div>

              {/* Household */}
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-3.5">
                <div className="flex items-center gap-1.5 mb-2.5">
                  <span className="text-base">🏠</span>
                  <p className="text-[11px] text-white/40 font-medium">Household</p>
                </div>
                {houseTotal > 0 ? (
                  <>
                    <p className="text-xl font-semibold text-white">{houseCompleted}<span className="text-white/30 text-sm font-normal">/{houseTotal}</span></p>
                    <p className="text-[10px] text-white/30 mt-0.5 mb-2">tasks done</p>
                    <div className="space-y-1">
                      {householdTasks.map(t => (
                        <div key={t.id} className="flex items-center justify-between text-[11px]">
                          <span className="text-white/45">{t.icon} {t.name}</span>
                          <span className={t.logs.length > 0 ? "text-emerald-400" : "text-white/20"}>
                            {t.logs.length > 0 ? "✓" : "—"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-[11px] text-white/20 italic mt-1">No tasks yet</p>
                )}
              </div>

              {/* Appointments */}
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-3.5">
                <div className="flex items-center gap-1.5 mb-2.5">
                  <span className="text-base">📅</span>
                  <p className="text-[11px] text-white/40 font-medium">Appointments</p>
                </div>
                {upcomingAppts.length > 0 ? (
                  <div className="space-y-2">
                    {upcomingAppts.map(a => (
                      <div key={a.id}>
                        <p className="text-[11px] font-medium text-white/75 truncate">{a.hospital}</p>
                        <p className="text-[10px] text-white/35 mt-0.5">{formatDate(a.date)} · {formatTime(a.time)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-white/20 italic mt-1">No upcoming visits</p>
                )}
              </div>
            </div>

            {/* Pending doses */}
            {medications.some(m => m.schedules.some(s => !s.taken)) && (
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-3.5">
                <p className="text-[11px] text-white/40 font-medium mb-2.5">Pending doses</p>
                <div className="space-y-2">
                  {medications.flatMap(m =>
                    m.schedules
                      .filter(s => !s.taken)
                      .map(s => (
                        <div key={s.id} className="flex justify-between items-center text-[11px]">
                          <span className="text-white/60">{m.name} <span className="text-white/25">{m.dosage}</span></span>
                          <span className="text-white/40">{s.period} · {s.time}</span>
                        </div>
                      ))
                  )}
                </div>
              </div>
            )}

            {/* AI Health Summary */}
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-3.5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] text-white/40 font-medium">Care summary</p>
                <span className="text-[10px] text-white/20">Gemini 2.5</span>
              </div>

              {!aiSummary && !generating && (
                <button
                  onClick={generateSummary}
                  disabled={!hasAnyData}
                  className="w-full py-3 rounded-xl border border-yellow-400/30 bg-yellow-400/10 text-yellow-300 text-sm font-bold hover:bg-yellow-400/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Generate Report Summary
                </button>
              )}

              {generating && (
                <div className="flex items-center gap-2 py-3">
                  <svg className="animate-spin shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgb(250 204 21)" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                  <span className="text-sm text-white/50">Analysing health data...</span>
                </div>
              )}

              {aiError && <p className="text-xs text-red-400">{aiError}</p>}

              {aiSummary && (
                <div className="space-y-3">
                  {/* Status badge */}
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-bold ${scoreBg(aiSummary.score)}`}>
                    <span className={scoreColor(aiSummary.score)}>●</span>
                    <span className={scoreColor(aiSummary.score)}>{aiSummary.overallStatus}</span>
                    <span className="text-white/30">· {aiSummary.score}/100</span>
                  </div>

                  <p className="text-sm text-white/70 leading-relaxed">{aiSummary.summary}</p>

                  {aiSummary.highlights.length > 0 && (
                    <div className="space-y-1">
                      {aiSummary.highlights.map((h, i) => (
                        <div key={i} className="flex items-start gap-2 text-[12px] text-emerald-400">
                          <span className="mt-0.5 shrink-0">✓</span><span>{h}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Meal Recommendations */}
                  {aiSummary.meals?.length > 0 && (
                    <div>
                      <p className="text-[10px] text-white/30 font-bold uppercase tracking-wider mb-2.5">Suggested Meals Today</p>
                      <div className="-mx-4 px-4">
                        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
                          {aiSummary.meals.map((meal, i) => (
                            <div key={i} className="flex-none w-[185px] rounded-xl overflow-hidden border border-white/10 bg-slate-800/80">
                              <div className="h-[110px] w-full overflow-hidden bg-slate-700/50">
                                <img
                                  src={meal.imageUrl}
                                  alt={meal.name}
                                  className="h-full w-full object-cover"
                                  onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                                />
                              </div>
                              <div className="p-3">
                                <p className="text-[13px] font-bold text-white leading-snug">{meal.name}</p>
                                <p className="text-[10px] text-white/40 mt-1 leading-relaxed line-clamp-2">{meal.description}</p>
                                <div className="mt-2 pt-2 border-t border-white/[0.07]">
                                  <p className="text-[10px] text-emerald-400/80 leading-relaxed">{meal.why}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* General tip */}
                  {aiSummary.recommendation && (
                    <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
                      <p className="text-[10px] text-white/30 font-bold uppercase tracking-wider mb-1">Today's Tip</p>
                      <p className="text-[12px] text-white/55 leading-relaxed">{aiSummary.recommendation}</p>
                    </div>
                  )}

                  <button
                    onClick={generateSummary}
                    className="text-[11px] text-white/30 hover:text-white/60 transition-colors"
                  >
                    Regenerate
                  </button>
                </div>
              )}
            </div>

            {!hasAnyData && (
              <div className="text-center py-8">
                <p className="text-3xl mb-3">📋</p>
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
