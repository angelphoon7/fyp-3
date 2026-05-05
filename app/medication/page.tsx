"use client";

import { useState, useEffect } from "react";
import IPhone13Frame from "@/components/iPhone13Frame";
import { useRouter } from "next/navigation";
import ReflectiveCard from "@/app/patient_caring/ReflectiveCard";
import { save, KEYS } from "@/app/lib/store";

type Schedule = {
  id: string;
  period: "Morning" | "Afternoon" | "Evening" | "Night";
  time: string;
  taken: boolean;
  takenAt?: string;
};

type Medication = {
  id: string;
  name: string;
  dosage: string;
  schedules: Schedule[];
};

const PERIOD_META: Record<Schedule["period"], { icon: string; default: string }> = {
  Morning:   { icon: "🌅", default: "08:00" },
  Afternoon: { icon: "☀️", default: "13:00" },
  Evening:   { icon: "🌆", default: "18:00" },
  Night:     { icon: "🌙", default: "21:00" },
};

const ALL_PERIODS = Object.keys(PERIOD_META) as Schedule["period"][];

function uid() {
  return Math.random().toString(36).slice(2);
}

export default function MedicationPage() {
  const router = useRouter();

  const [medications, setMedications] = useState<Medication[]>([
    {
      id: uid(),
      name: "Metformin",
      dosage: "500mg",
      schedules: [
        { id: uid(), period: "Morning",   time: "08:00", taken: false },
        { id: uid(), period: "Evening",   time: "18:00", taken: false },
      ],
    },
    {
      id: uid(),
      name: "Amlodipine",
      dosage: "5mg",
      schedules: [
        { id: uid(), period: "Morning",   time: "08:00", taken: false },
      ],
    },
  ]);

  // --- add medication sheet ---
  const [addOpen, setAddOpen]           = useState(false);
  const [newName, setNewName]           = useState("");
  const [newDosage, setNewDosage]       = useState("");
  const [selectedPeriods, setSelectedPeriods] = useState<Set<Schedule["period"]>>(new Set(["Morning"]));
  const [periodTimes, setPeriodTimes]   = useState<Record<string, string>>({
    Morning: "08:00", Afternoon: "13:00", Evening: "18:00", Night: "21:00",
  });

  const togglePeriod = (p: Schedule["period"]) => {
    setSelectedPeriods(prev => {
      const next = new Set(prev);
      next.has(p) ? next.delete(p) : next.add(p);
      return next;
    });
  };

  const addMedication = () => {
    if (!newName.trim() || selectedPeriods.size === 0) return;
    const schedules: Schedule[] = ALL_PERIODS
      .filter(p => selectedPeriods.has(p))
      .map(p => ({ id: uid(), period: p, time: periodTimes[p], taken: false }));
    setMedications(prev => [...prev, { id: uid(), name: newName.trim(), dosage: newDosage.trim(), schedules }]);
    setNewName("");
    setNewDosage("");
    setSelectedPeriods(new Set(["Morning"]));
    setAddOpen(false);
  };

  // --- mark taken ---
  const markTaken = (medId: string, schedId: string) => {
    const takenAt = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setMedications(prev => prev.map(m => {
      if (m.id !== medId) return m;
      return { ...m, schedules: m.schedules.map(s => s.id === schedId ? { ...s, taken: true, takenAt } : s) };
    }));
  };

  // --- adjust time ---
  const adjustTime = (medId: string, schedId: string, time: string) => {
    setMedications(prev => prev.map(m => {
      if (m.id !== medId) return m;
      return { ...m, schedules: m.schedules.map(s => s.id === schedId ? { ...s, time } : s) };
    }));
  };

  // --- delete medication ---
  const deleteMedication = (medId: string) => {
    setMedications(prev => prev.filter(m => m.id !== medId));
  };

  useEffect(() => { save(KEYS.medications, medications); }, [medications]);

  const totalSlots  = medications.reduce((s, m) => s + m.schedules.length, 0);
  const takenSlots  = medications.reduce((s, m) => s + m.schedules.filter(sc => sc.taken).length, 0);
  const progressPct = totalSlots > 0 ? Math.round((takenSlots / totalSlots) * 100) : 0;

  return (
    <IPhone13Frame>
      <div className="relative h-dvh w-full flex-1 overflow-hidden bg-black text-white font-sans p-4 pt-10 pb-6 flex flex-col justify-center">

        {/* Add medication bottom sheet */}
        {addOpen && (
          <div className="absolute inset-0 z-50 flex items-end" onClick={() => setAddOpen(false)}>
            <div
              className="w-full bg-[#111] border-t border-white/10 rounded-t-3xl p-5 pb-10 space-y-4 animate-in slide-in-from-bottom-4 duration-200"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-10 h-1 bg-white/20 rounded-full mx-auto" />
              <p className="text-sm font-bold text-white text-center">Add Medication</p>

              {/* Name */}
              <div className="space-y-1">
                <label className="text-[11px] text-white/40 font-bold uppercase tracking-wider">Medication Name</label>
                <input
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-yellow-400/50"
                  placeholder="e.g. Metformin"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                />
              </div>

              {/* Dosage */}
              <div className="space-y-1">
                <label className="text-[11px] text-white/40 font-bold uppercase tracking-wider">Dosage</label>
                <input
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-yellow-400/50"
                  placeholder="e.g. 500mg"
                  value={newDosage}
                  onChange={e => setNewDosage(e.target.value)}
                />
              </div>

              {/* Period selector + time */}
              <div className="space-y-1">
                <label className="text-[11px] text-white/40 font-bold uppercase tracking-wider">Timing</label>
                <div className="space-y-2">
                  {ALL_PERIODS.map(p => {
                    const active = selectedPeriods.has(p);
                    return (
                      <div key={p} className={`flex items-center justify-between rounded-xl border px-4 py-3 transition-colors ${active ? "bg-yellow-400/10 border-yellow-400/30" : "bg-white/5 border-white/10"}`}>
                        <button className="flex items-center gap-2 flex-1" onClick={() => togglePeriod(p)}>
                          <span className="text-base">{PERIOD_META[p].icon}</span>
                          <span className={`text-sm font-medium ${active ? "text-yellow-100" : "text-white/50"}`}>{p}</span>
                        </button>
                        {active && (
                          <input
                            type="time"
                            value={periodTimes[p]}
                            onChange={e => setPeriodTimes(prev => ({ ...prev, [p]: e.target.value }))}
                            className="bg-transparent text-yellow-300 text-sm font-bold outline-none"
                            onClick={e => e.stopPropagation()}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={addMedication}
                disabled={!newName.trim() || selectedPeriods.size === 0}
                className="w-full py-3.5 rounded-xl bg-yellow-400 text-black font-bold text-sm disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
              >
                Add Medication
              </button>
            </div>
          </div>
        )}

        {/* Card */}
        <div className="relative max-h-full flex flex-col">
          <ReflectiveCard
            overlayColor="rgba(0, 0, 0, 0.4)"
            blurStrength={16}
            glassDistortion={50}
            metalness={1}
            roughness={0.75}
            displacementStrength={37}
            noiseScale={2.1}
            specularConstant={5}
            grayscale={0.85}
            color="#ffffff"
            className="h-fit max-h-full w-full shadow-[0_20px_50px_rgba(234,179,8,0.2)]"
          >
            <div className="flex flex-col h-fit max-h-[80vh] overflow-hidden p-5">

              {/* Header */}
              <div className="flex items-center justify-between pb-5 border-b border-white/20 shrink-0">
                <div className="flex items-center gap-3">
                  <button onClick={() => router.push('/home')} className="shrink-0 text-white/50 hover:text-white transition-colors">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                  </button>
                  <div>
                    <h2 className="text-xl font-bold text-white drop-shadow-md">Medication</h2>
                    <p className="text-xs text-white/70 mt-0.5">Daily medication schedule</p>
                  </div>
                </div>
              </div>

              <div className="overflow-y-auto pt-5 space-y-4 scrollbar-hide pb-2">

                {/* Progress */}
                <div className="p-4 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md shadow-inner">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs text-white/70 font-bold uppercase tracking-wider mb-1">Today's Doses</p>
                      <p className="text-lg font-bold text-white drop-shadow-md">
                        {takenSlots} <span className="text-sm text-white/50 font-normal">/ {totalSlots} taken</span>
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-full border-[3px] border-white/20 flex items-center justify-center relative shadow-[0_0_15px_rgba(234,179,8,0.2)]">
                      <svg className="absolute inset-0 h-full w-full -rotate-90 transform" viewBox="0 0 36 36">
                        <path
                          className="text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]"
                          strokeDasharray={`${progressPct}, 100`}
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none" stroke="currentColor" strokeWidth="3"
                        />
                      </svg>
                      <span className="text-xs font-bold text-white relative z-10 drop-shadow-md">{progressPct}%</span>
                    </div>
                  </div>
                </div>

                {/* Medication cards */}
                <div className="space-y-3">
                  {medications.map(med => {
                    const allTaken = med.schedules.every(s => s.taken);
                    return (
                      <div
                        key={med.id}
                        className={`flex flex-col rounded-xl border shadow-lg backdrop-blur-sm overflow-hidden transition-all ${allTaken ? "bg-yellow-400/20 border-yellow-400/40" : "bg-black/50 border-white/10"}`}
                      >
                        {/* Med header */}
                        <div className="flex items-center justify-between px-4 pt-4 pb-3">
                          <div className="flex items-center gap-3">
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center text-xl shadow-inner ${allTaken ? "bg-yellow-400/30" : "bg-white/10"}`}>
                              💊
                            </div>
                            <div>
                              <p className={`font-bold text-[15px] drop-shadow-sm ${allTaken ? "text-yellow-100" : "text-white"}`}>{med.name}</p>
                              {med.dosage && <p className="text-[11px] text-white/40">{med.dosage}</p>}
                            </div>
                          </div>
                          <button
                            onClick={() => deleteMedication(med.id)}
                            className="h-7 w-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/30 hover:text-red-400 hover:border-red-400/30 transition-colors"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                          </button>
                        </div>

                        {/* Schedule slots */}
                        <div className="border-t border-white/10 divide-y divide-white/5">
                          {med.schedules.map(sched => (
                            <div key={sched.id} className="flex items-center gap-3 px-4 py-3">
                              <span className="text-base shrink-0">{PERIOD_META[sched.period].icon}</span>

                              <div className="flex-1 min-w-0">
                                <p className="text-[12px] font-semibold text-white/70">{sched.period}</p>
                                {sched.taken && sched.takenAt ? (
                                  <p className="text-[11px] text-yellow-300/70">Taken at {sched.takenAt}</p>
                                ) : (
                                  /* Adjustable time input */
                                  <input
                                    type="time"
                                    value={sched.time}
                                    onChange={e => adjustTime(med.id, sched.id, e.target.value)}
                                    className="bg-transparent text-white/40 text-[11px] font-medium outline-none mt-0.5 w-full"
                                  />
                                )}
                              </div>

                              {sched.taken ? (
                                <div className="h-7 w-7 rounded-full bg-yellow-400/20 border border-yellow-400/40 flex items-center justify-center shrink-0">
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgb(250 204 21)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                </div>
                              ) : (
                                <button
                                  onClick={() => markTaken(med.id, sched.id)}
                                  className="shrink-0 px-3 py-1.5 rounded-lg bg-yellow-400/10 border border-yellow-400/30 text-yellow-300 text-[11px] font-bold hover:bg-yellow-400/20 transition-colors"
                                >
                                  Take
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add medication button */}
                <button
                  onClick={() => setAddOpen(true)}
                  className="w-full mt-2 py-4 rounded-xl border border-dashed border-white/30 text-white/70 text-sm font-bold hover:bg-white/10 hover:text-white transition-colors flex items-center justify-center gap-2 backdrop-blur-sm"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Add Medication
                </button>

              </div>
            </div>
          </ReflectiveCard>
        </div>

      </div>
    </IPhone13Frame>
  );
}
