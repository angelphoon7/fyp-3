"use client";

import { useEffect, useState } from "react";
import IPhone13Frame from "@/components/iPhone13Frame";
import Galaxy from "./Galaxy";
import { load, KEYS } from "@/app/lib/store";
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
  const [careTasks,      setCareTasks]      = useState<CareTask[]>([]);
  const [medications,    setMedications]    = useState<Medication[]>([]);
  const [appointments,   setAppointments]   = useState<Appointment[]>([]);
  const [householdTasks, setHouseholdTasks] = useState<HouseTask[]>([]);

  const [aiSummary,    setAiSummary]   = useState<HealthSummaryResult | null>(null);
  const [generating,   setGenerating]  = useState(false);
  const [aiError,      setAiError]     = useState<string | null>(null);
  const [downloading,  setDownloading] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    setCareTasks(load<CareTask[]>(KEYS.careTasks, []));
    setMedications(load<Medication[]>(KEYS.medications, []));
    setAppointments(load<Appointment[]>(KEYS.appointments, []));
    setHouseholdTasks(load<HouseTask[]>(KEYS.householdTasks, []));
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
        section("AI Health Summary");
        row("Status", aiSummary.overallStatus);
        row("Score",  `${aiSummary.score}/100`);
        nl(1);
        body(aiSummary.summary); nl(1);
        if (aiSummary.highlights.length > 0) {
          doc.setFontSize(8).setTextColor(60, 60, 60).setFont("helvetica", "bold");
          doc.text("Highlights:", margin, y); nl();
          aiSummary.highlights.forEach(h => { body(`• ${h}`); });
        }
        if (aiSummary.concerns.length > 0) {
          nl(1);
          doc.setFontSize(8).setTextColor(60, 60, 60).setFont("helvetica", "bold");
          doc.text("Concerns:", margin, y); nl();
          aiSummary.concerns.forEach(c => { body(`• ${c}`); });
        }
        nl(1);
        doc.setFontSize(8).setTextColor(60, 60, 60).setFont("helvetica", "bold");
        doc.text("Recommendation:", margin, y); nl();
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
      <div className="flex min-h-full flex-col bg-slate-900 relative text-white font-sans">

        {/* Galaxy Background */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <Galaxy density={0.8} glowIntensity={0.4} twinkleIntensity={0.5} speed={0.5} />
        </div>

        <div className="relative z-10 flex flex-col flex-1 overflow-y-auto pb-10">

          {/* Header */}
          <div className="bg-slate-900/70 backdrop-blur-lg px-5 pb-5 pt-12 border-b border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-white tracking-wide">Health Report</h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  {new Date().toLocaleDateString("en-MY", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>
              <button
                onClick={downloadPDF}
                disabled={!hasAnyData || downloading}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-yellow-400/10 border border-yellow-400/30 text-yellow-300 text-xs font-bold hover:bg-yellow-400/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {downloading ? (
                  <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                ) : (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                )}
                {downloading ? "Generating…" : "Export PDF"}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-4 p-4">

            {/* Overall Score */}
            <div className={`rounded-2xl border p-4 flex items-center gap-4 ${scoreBg(overallScore)}`}>
              <div className="relative h-16 w-16 shrink-0">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
                  <circle
                    cx="18" cy="18" r="15.9" fill="none"
                    stroke={overallScore >= 80 ? "#34d399" : overallScore >= 55 ? "#facc15" : "#f87171"}
                    strokeWidth="3"
                    strokeDasharray={`${overallScore}, 100`}
                    strokeLinecap="round"
                  />
                </svg>
                <span className={`absolute inset-0 flex items-center justify-center text-lg font-bold ${scoreColor(overallScore)}`}>
                  {hasAnyData ? overallScore : "—"}
                </span>
              </div>
              <div>
                <p className="text-xs text-white/40 font-bold uppercase tracking-wider">Overall Care Score</p>
                <p className={`text-2xl font-bold mt-0.5 ${scoreColor(overallScore)}`}>
                  {!hasAnyData ? "No data yet" : overallScore >= 80 ? "Good" : overallScore >= 55 ? "Fair" : "Needs Attention"}
                </p>
                <p className="text-xs text-white/40 mt-0.5">Based on today's logged activity</p>
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3">

              {/* Care Tasks */}
              <div className="rounded-2xl border border-slate-700 bg-slate-800/60 backdrop-blur-md p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">🏥</span>
                  <p className="text-xs text-white/50 font-bold uppercase tracking-wider">Patient Care</p>
                </div>
                {careTotal > 0 ? (
                  <>
                    <p className={`text-2xl font-bold ${scoreColor(Math.round((careCompleted / careTotal) * 100))}`}>
                      {careCompleted}/{careTotal}
                    </p>
                    <p className="text-[11px] text-white/40 mt-0.5">tasks completed</p>
                    <div className="mt-2 space-y-1">
                      {careTasks.map(t => (
                        <div key={t.id} className="flex items-center justify-between text-[11px]">
                          <span className="text-white/50">{t.icon} {t.name}</span>
                          <span className={t.logs.length > 0 ? "text-emerald-400 font-bold" : "text-white/20"}>
                            {t.logs.length > 0 ? `✓ ${t.logs.length}x` : "—"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-white/20 italic">No care tasks logged</p>
                )}
              </div>

              {/* Medication */}
              <div className="rounded-2xl border border-slate-700 bg-slate-800/60 backdrop-blur-md p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">💊</span>
                  <p className="text-xs text-white/50 font-bold uppercase tracking-wider">Medication</p>
                </div>
                {medTotal > 0 ? (
                  <>
                    <p className={`text-2xl font-bold ${scoreColor(medPct)}`}>{medPct}%</p>
                    <p className="text-[11px] text-white/40 mt-0.5">{medTaken}/{medTotal} doses taken</p>
                    <div className="mt-2 space-y-1">
                      {medications.map(m => (
                        <div key={m.id} className="flex items-center justify-between text-[11px]">
                          <span className="text-white/50 truncate pr-1">{m.name}</span>
                          <span className={m.schedules.every(s => s.taken) ? "text-emerald-400 font-bold" : "text-yellow-400"}>
                            {m.schedules.filter(s => s.taken).length}/{m.schedules.length}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-white/20 italic">No medications added</p>
                )}
              </div>

              {/* Household */}
              <div className="rounded-2xl border border-slate-700 bg-slate-800/60 backdrop-blur-md p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">🏠</span>
                  <p className="text-xs text-white/50 font-bold uppercase tracking-wider">Household</p>
                </div>
                {houseTotal > 0 ? (
                  <>
                    <p className={`text-2xl font-bold ${scoreColor(Math.round((houseCompleted / houseTotal) * 100))}`}>
                      {houseCompleted}/{houseTotal}
                    </p>
                    <p className="text-[11px] text-white/40 mt-0.5">tasks done</p>
                    <div className="mt-2 space-y-1">
                      {householdTasks.map(t => (
                        <div key={t.id} className="flex items-center justify-between text-[11px]">
                          <span className="text-white/50">{t.icon} {t.name}</span>
                          <span className={t.logs.length > 0 ? "text-emerald-400 font-bold" : "text-white/20"}>
                            {t.logs.length > 0 ? "✓" : "—"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-white/20 italic">No tasks logged</p>
                )}
              </div>

              {/* Appointments */}
              <div className="rounded-2xl border border-slate-700 bg-slate-800/60 backdrop-blur-md p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">📅</span>
                  <p className="text-xs text-white/50 font-bold uppercase tracking-wider">Appointments</p>
                </div>
                {upcomingAppts.length > 0 ? (
                  <div className="space-y-2">
                    {upcomingAppts.map(a => (
                      <div key={a.id}>
                        <p className="text-[11px] font-bold text-white/80 truncate">{a.hospital}</p>
                        <p className="text-[10px] text-yellow-300/70">{formatDate(a.date)} · {formatTime(a.time)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-white/20 italic">No upcoming visits</p>
                )}
              </div>
            </div>

            {/* Medication detail */}
            {medications.some(m => m.schedules.some(s => !s.taken)) && (
              <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-4">
                <p className="text-xs text-yellow-300/70 font-bold uppercase tracking-wider mb-3">Pending Doses</p>
                <div className="space-y-2">
                  {medications.flatMap(m =>
                    m.schedules
                      .filter(s => !s.taken)
                      .map(s => (
                        <div key={s.id} className="flex justify-between items-center text-[12px]">
                          <span className="text-white/70">{m.name} <span className="text-white/30">{m.dosage}</span></span>
                          <span className="text-yellow-300/70 font-medium">{s.period} · {s.time}</span>
                        </div>
                      ))
                  )}
                </div>
              </div>
            )}

            {/* AI Health Summary */}
            <div className="rounded-2xl border border-slate-700 bg-slate-800/60 backdrop-blur-md p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-white/50 font-bold uppercase tracking-wider">AI Health Summary</p>
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

                  {aiSummary.concerns.length > 0 && (
                    <div className="space-y-1">
                      {aiSummary.concerns.map((c, i) => (
                        <div key={i} className="flex items-start gap-2 text-[12px] text-yellow-400">
                          <span className="mt-0.5 shrink-0">⚠</span><span>{c}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 px-3 py-2.5">
                    <p className="text-[10px] text-blue-400/70 font-bold uppercase tracking-wider mb-1">Recommendation</p>
                    <p className="text-[12px] text-white/60 leading-relaxed">{aiSummary.recommendation}</p>
                  </div>

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
              <div className="text-center py-6">
                <p className="text-4xl mb-3">📋</p>
                <p className="text-sm text-white/40">No activity logged yet.</p>
                <p className="text-xs text-white/25 mt-1">Use Patient Caring, Medication, or Household pages to start tracking.</p>
              </div>
            )}

            <p className="text-center text-[10px] text-slate-600">
              KAI · {new Date().toLocaleDateString("en-MY", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
        </div>
      </div>
    </IPhone13Frame>
  );
}
