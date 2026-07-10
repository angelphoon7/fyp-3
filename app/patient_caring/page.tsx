"use client";

import { useState, useRef, useEffect } from "react";
import IPhone13Frame from "@/components/iPhone13Frame";
import { useRouter } from "next/navigation";
import ReflectiveCard from "./ReflectiveCard";
import type { NutritionResult } from "@/app/api/analyze-meal/route";
import { save, load, hydrate, resetDailyData, KEYS } from "@/app/lib/store";

type Log = {
  label: string;
  time: string;
  completedAt: string;   // ISO 8601 timestamp — REQ_F304
  image?: string;
  nutrition?: NutritionResult;
  analyzing?: boolean;
};

type Task = {
  id: string;
  name: string;
  logs: Log[];
  icon: string;
  targetLogs: number; // how many check-ins count as "done"
};

export default function PatientCaringPage() {
  const router = useRouter();

  const [hydrated, setHydrated] = useState(false);
  const defaultTasks: Task[] = [
    { id: "bathing",  name: "Bathing",  logs: [], icon: "🛁", targetLogs: 1 },
    { id: "dressing", name: "Dressing", logs: [], icon: "👕", targetLogs: 1 },
    { id: "feeding",  name: "Feeding",  logs: [], icon: "🥣", targetLogs: 1 },
  ];
  const [patientTasks, setPatientTasks] = useState<Task[]>(defaultTasks);

  const [pickerOpen, setPickerOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- gallery upload ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    const reader = new FileReader();
    reader.onload = (ev) => addMealLog(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const openGallery = () => {
    setPickerOpen(false);
    fileInputRef.current?.click();
  };

  // --- meal log + nutrition ---
  const addMealLog = (imageUrl: string) => {
    const now  = new Date();
    const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const completedAt = now.toISOString();
    setPatientTasks(prev => prev.map(t => {
      if (t.id !== "feeding") return t;
      const labels = ["First check in", "Second check in", "Third check in", "Fourth check in"];
      const label  = labels[t.logs.length] ?? `Check in ${t.logs.length + 1}`;
      return { ...t, logs: [...t.logs, { label, time, completedAt, image: imageUrl, analyzing: true }] };
    }));
    analyzeNutrition(imageUrl);
  };

  const analyzeNutrition = async (imageUrl: string) => {
    try {
      const res  = await fetch("/api/analyze-meal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Analysis failed");
      setPatientTasks(prev => prev.map(t => {
        if (t.id !== "feeding") return t;
        return { ...t, logs: t.logs.map(log => log.image === imageUrl ? { ...log, nutrition: data, analyzing: false } : log) };
      }));
    } catch {
      setPatientTasks(prev => prev.map(t => {
        if (t.id !== "feeding") return t;
        return { ...t, logs: t.logs.map(log => log.image === imageUrl ? { ...log, analyzing: false } : log) };
      }));
    }
  };

  const removeLogFromTask = (taskId: string, logIdx: number) => {
    const LABELS = ["First check in", "Second check in", "Third check in", "Fourth check in"];
    setPatientTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      const newLogs = t.logs.filter((_, i) => i !== logIdx)
        .map((log, i) => ({ ...log, label: LABELS[i] ?? `Check in ${i + 1}` }));
      return { ...t, logs: newLogs };
    }));
  };

  const addLogToTask = (taskId: string) => {
    setPatientTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      const now  = new Date();
      const labels = ["First check in", "Second check in", "Third check in", "Fourth check in"];
      const label  = labels[t.logs.length] ?? `Check in ${t.logs.length + 1}`;
      const time   = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const completedAt = now.toISOString();
      return { ...t, logs: [...t.logs, { label, time, completedAt }] };
    }));
  };

  useEffect(() => {
    resetDailyData();
    const local = load(KEYS.careTasks, defaultTasks);
    if (local.length) setPatientTasks(local);
    hydrate().then((data) => {
      if (data[KEYS.careTasks]?.length) setPatientTasks(data[KEYS.careTasks]);
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    save(KEYS.careTasks, patientTasks);
  }, [patientTasks, hydrated]);


  return (
    <IPhone13Frame>
      <div className="relative h-dvh w-full flex-1 overflow-hidden bg-black text-white font-sans p-4 pt-10 pb-6 flex flex-col justify-center">

        {/* Hidden file input for gallery */}
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />

        {/* Photo picker action sheet */}
        {pickerOpen && (
          <div className="absolute inset-0 z-50 flex items-end" onClick={() => setPickerOpen(false)}>
            <div
              className="w-full bg-black/90 backdrop-blur-xl border-t border-white/10 rounded-t-3xl p-4 pb-10 space-y-2 animate-in slide-in-from-bottom-4 duration-200"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4" />
              <p className="text-[11px] text-white/40 font-bold uppercase tracking-wider text-center mb-3">Add Meal Photo</p>

              <button
                onClick={openGallery}
                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
              >
                <div className="h-10 w-10 rounded-full bg-blue-400/10 border border-blue-400/30 flex items-center justify-center shrink-0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgb(96 165 250)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-white">Upload Image</p>
                  <p className="text-xs text-white/40">Choose from gallery</p>
                </div>
              </button>

              <button
                onClick={() => setPickerOpen(false)}
                className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-white/50 text-sm font-medium mt-1"
              >
                Cancel
              </button>
            </div>
          </div>
        )}


        {/* Reflective Card Content */}
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
              <div className="flex items-center justify-between pb-5 border-b border-white/20 shrink-0">
                <div className="flex items-center gap-3">
                  <button onClick={() => router.push('/home')} className="shrink-0 text-white/50 hover:text-white transition-colors">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                  </button>
                  <div>
                    <h2 className="text-xl font-bold text-white drop-shadow-md">Patient Caring</h2>
                    <p className="text-xs text-white/70 mt-0.5">Log daily care activities</p>
                  </div>
                </div>
              </div>

              <div className="overflow-y-auto pt-5 space-y-4 scrollbar-hide pb-2">

                {/* Progress Overview */}
                <div className="mb-6 p-4 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md shadow-inner">
                  <div className="flex justify-between items-end mb-2">
                    <div>
                      <p className="text-xs text-white/70 font-bold uppercase tracking-wider mb-1">Today's Progress</p>
                      <p className="text-lg font-bold text-white drop-shadow-md">
                        {patientTasks.filter(t => t.logs.length >= (t.targetLogs ?? 1)).length}{" "}
                        <span className="text-sm text-white/50 font-normal">/ {patientTasks.length} tasks</span>
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-full border-[3px] border-white/20 flex items-center justify-center relative shadow-[0_0_15px_rgba(234,179,8,0.2)]">
                      <svg className="absolute inset-0 h-full w-full -rotate-90 transform" viewBox="0 0 36 36">
                        <path
                          className="text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]"
                          strokeDasharray={`${(patientTasks.filter(t => t.logs.length >= (t.targetLogs ?? 1)).length / patientTasks.length) * 100}, 100`}
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                        />
                      </svg>
                      <span className="text-xs font-bold text-white relative z-10 drop-shadow-md">
                        {Math.round((patientTasks.filter(t => t.logs.length >= (t.targetLogs ?? 1)).length / patientTasks.length) * 100)}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {patientTasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => task.id === "feeding" ? setPickerOpen(true) : addLogToTask(task.id)}
                      className={`relative flex flex-col p-4 rounded-xl border cursor-pointer transition-all shadow-lg backdrop-blur-sm ${task.logs.length >= task.targetLogs ? "bg-yellow-400/20 border-yellow-400/40" : "bg-black/50 border-white/10 hover:border-white/30"}`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-4">
                          <div className={`h-12 w-12 rounded-full flex items-center justify-center text-2xl transition-colors shadow-inner ${task.logs.length >= (task.targetLogs ?? 1) ? "bg-yellow-400/30 text-yellow-300" : "bg-white/10 text-white/60"}`}>
                            {task.icon}
                          </div>
                          <div>
                            <p className={`font-bold text-[15px] transition-colors drop-shadow-sm ${task.logs.length >= (task.targetLogs ?? 1) ? "text-yellow-100" : "text-white"}`}>{task.name}</p>
                            {/* Stepper inline with progress */}
                            <div className="flex items-center gap-1.5 mt-0.5" onClick={e => e.stopPropagation()}>
                              <button
                                onClick={() => setPatientTasks(prev => prev.map(t => t.id === task.id ? { ...t, targetLogs: Math.max(1, (t.targetLogs ?? 1) - 1) } : t))}
                                className="h-4 w-4 rounded-full bg-white/10 border border-white/20 text-white/50 text-[10px] flex items-center justify-center hover:bg-white/20 transition-colors"
                              >−</button>
                              <p className="text-[11px] text-white/40">
                                {task.logs.length}/{task.targetLogs ?? 1} check-in{(task.targetLogs ?? 1) !== 1 ? "s" : ""}
                              </p>
                              <button
                                onClick={() => setPatientTasks(prev => prev.map(t => t.id === task.id ? { ...t, targetLogs: (t.targetLogs ?? 1) + 1 } : t))}
                                className="h-4 w-4 rounded-full bg-white/10 border border-white/20 text-white/50 text-[10px] flex items-center justify-center hover:bg-white/20 transition-colors"
                              >+</button>
                            </div>
                          </div>
                        </div>
                        <div className={`h-8 w-8 shrink-0 rounded-full border flex items-center justify-center transition-colors ${task.id === "feeding" ? "border-yellow-400/40 bg-yellow-400/10" : "border-white/20 bg-white/5 hover:bg-white/10"}`}>
                          {task.id === "feeding" ? (
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgb(250 204 21)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                          ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                          )}
                        </div>
                      </div>

                      {task.logs.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-yellow-400/20 w-full flex flex-col gap-4">
                          {task.logs.map((log, idx) => (
                            <div key={idx} className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-1">
                              <div className="flex justify-between items-start text-xs">
                                <div className="flex items-center gap-1.5">
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgb(250 204 21 / 0.6)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                  <span className="text-yellow-100/70 font-medium tracking-wide">{log.label}</span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0 ml-2">
                                  <div className="text-right">
                                    <p className="text-yellow-300 font-bold drop-shadow-md leading-none">{log.time}</p>
                                    <p className="text-white/30 text-[9px] mt-0.5">
                                      {log.completedAt
                                        ? new Date(log.completedAt).toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" })
                                        : ""}
                                    </p>
                                  </div>
                                  <button
                                    onClick={e => { e.stopPropagation(); removeLogFromTask(task.id, idx); }}
                                    className="h-5 w-5 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white/40 hover:bg-red-500/20 hover:border-red-500/30 hover:text-red-400 transition-colors shrink-0"
                                  >
                                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                                  </button>
                                </div>
                              </div>
                              {log.image && (
                                <div className="h-24 w-full rounded-lg overflow-hidden border border-white/10 relative">
                                  <img src={log.image} alt="Meal Photo" className="h-full w-full object-cover" />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                                    <span className="text-[9px] text-white/60 font-medium">Meal Photo</span>
                                    <span className="text-[10px] text-yellow-300 font-bold drop-shadow">
                                      {log.completedAt
                                        ? new Date(log.completedAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
                                        : log.time}
                                    </span>
                                  </div>
                                </div>
                              )}
                              {log.analyzing && (
                                <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 flex items-center gap-2">
                                  <svg className="animate-spin shrink-0" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgb(250 204 21)" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                                  <span className="text-[11px] text-white/50">Estimating nutrition...</span>
                                </div>
                              )}
                              {log.nutrition && (
                                <div className="rounded-lg border border-yellow-400/20 bg-yellow-400/5 p-3 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <p className="text-[10px] text-yellow-300/70 font-bold uppercase tracking-wider">Nutrition Estimate</p>
                                  </div>
                                  {log.nutrition.foods.length > 0 && (
                                    <p className="text-[11px] text-white/60 leading-relaxed">{log.nutrition.foods.join(", ")}</p>
                                  )}
                                  <div className="grid grid-cols-4 gap-1.5">
                                    {[
                                      { label: "Cal",    value: log.nutrition.calories, unit: "kcal" },
                                      { label: "Protein",value: log.nutrition.protein,  unit: "g"    },
                                      { label: "Carbs",  value: log.nutrition.carbs,    unit: "g"    },
                                      { label: "Fat",    value: log.nutrition.fat,      unit: "g"    },
                                    ].map(({ label, value, unit }) => (
                                      <div key={label} className="bg-black/30 rounded-md p-1.5 text-center">
                                        <p className="text-[10px] text-white/40">{label}</p>
                                        <p className="text-[12px] font-bold text-white leading-tight">{value}</p>
                                        <p className="text-[9px] text-white/30">{unit}</p>
                                      </div>
                                    ))}
                                  </div>
                                  {log.nutrition.summary && (
                                    <p className="text-[10px] text-white/40 italic leading-relaxed">{log.nutrition.summary}</p>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

              </div>
            </div>
          </ReflectiveCard>
        </div>

      </div>
    </IPhone13Frame>
  );
}
