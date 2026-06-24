"use client";

import { useState, useRef, useEffect } from "react";
import IPhone13Frame from "@/components/iPhone13Frame";
import { useRouter } from "next/navigation";
import ReflectiveCard from "@/app/patient_caring/ReflectiveCard";
import type { ReceiptResult } from "@/app/api/analyze-receipt/route";
import { save, load, hydrate, resetDailyData, KEYS } from "@/app/lib/store";
import { ScrollPickerColumn, PICKER_H } from "@/components/ScrollPickerColumn";

type Log = {
  label: string;
  time: string;
  image?: string;
  receipt?: ReceiptResult;
  analyzing?: boolean;
};

type Task = {
  id: string;
  name: string;
  subtitle: string;
  icon: string;
  logs: Log[];
  hasCamera: boolean;
  targetLogs: number;
};

export default function HouseholdManagementPage() {
  const router = useRouter();

  const [hydrated, setHydrated] = useState(false);
  const defaultTasks: Task[] = [
    { id: "cooking",   name: "Cooking Meal",      subtitle: "Tap to photograph the meal",     icon: "🍳", logs: [], hasCamera: true,  targetLogs: 1 },
    { id: "cleaning",  name: "Cleaning Room",      subtitle: "Log when room is cleaned",       icon: "🧹", logs: [], hasCamera: false, targetLogs: 1 },
    { id: "groceries", name: "Managing Groceries", subtitle: "Snap receipt for expense claim", icon: "🛒", logs: [], hasCamera: true,  targetLogs: 1 },
  ];
  const [tasks, setTasks] = useState<Task[]>(defaultTasks);

  // which task triggered the picker
  const [pickerTaskId, setPickerTaskId] = useState<string | null>(null);
  const [scanWarning, setScanWarning]   = useState<string | null>(null);

  type DatePickerTarget = { taskId: string; logIdx: number; day: string; month: string; year: string };
  const [datePicker, setDatePicker] = useState<DatePickerTarget | null>(null);

  const openDatePicker = (taskId: string, logIdx: number, currentDate: string) => {
    const [y, m, d] = (currentDate || new Date().toISOString().split("T")[0]).split("-");
    setDatePicker({ taskId, logIdx, year: y || String(new Date().getFullYear()), month: m || "01", day: d || "01" });
  };

  const confirmDatePicker = () => {
    if (!datePicker) return;
    const { taskId, logIdx, year, month, day } = datePicker;
    updateReceiptDate(taskId, logIdx, `${year}-${month}-${day}`);
    setDatePicker(null);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- picker ---
  const openPicker = (taskId: string) => { setPickerTaskId(taskId); setScanWarning(null); };
  const closePicker = () => setPickerTaskId(null);

  // Shrink any image to ≤640px wide at 0.65 quality so it always fits in localStorage
  const compressImage = (dataUrl: string, maxW = 640, quality = 0.65): Promise<string> =>
    new Promise(resolve => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxW / img.width);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const c = document.createElement("canvas");
        c.width = w; c.height = h;
        c.getContext("2d")?.drawImage(img, 0, 0, w, h);
        resolve(c.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });

  // --- gallery upload ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    // pickerTaskId is null at this point (picker was closed), so we store it before closing
    const taskId = pendingUploadTaskRef.current;
    if (!taskId) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const raw      = ev.target?.result as string;
      const imageUrl = await compressImage(raw);
      addLog(taskId, imageUrl);
    };
    reader.readAsDataURL(file);
  };

  // store the task id before the picker closes so the file handler still knows it
  const pendingUploadTaskRef = useRef<string | null>(null);

  const openGalleryForTask = (taskId: string) => {
    pendingUploadTaskRef.current = taskId;
    closePicker();
    fileInputRef.current?.click();
  };

  // --- log + receipt/meal analysis ---
  const addLog = (taskId: string, imageUrl?: string) => {
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      const labels = ["First check in", "Second check in", "Third check in", "Fourth check in"];
      const label  = labels[t.logs.length] ?? `Check in ${t.logs.length + 1}`;
      const analyzing = (taskId === "groceries" || taskId === "cooking") && !!imageUrl;
      return { ...t, logs: [...t.logs, { label, time, image: imageUrl, analyzing }] };
    }));
    if (taskId === "groceries" && imageUrl) analyzeReceipt(imageUrl);
    if (taskId === "cooking"   && imageUrl) analyzeMeal(imageUrl);
  };

  const fireReceiptWebhook = (receiptData: object) => {
    const n8nUrl = process.env.NEXT_PUBLIC_N8N_URL;
    if (n8nUrl) {
      fetch(`${n8nUrl}/webhook/kai-receipt-scanned`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "grocery", ...receiptData }),
      }).catch(() => {});
    }
  };

  const analyzeReceipt = async (imageUrl: string) => {
    try {
      const res  = await fetch("/api/analyze-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Analysis failed");

      // Reject non-grocery receipts — remove the log and prompt a rescan
      if (!data.isGroceries) {
        setTasks(prev => prev.map(t =>
          t.id !== "groceries" ? t : { ...t, logs: t.logs.filter(log => log.image !== imageUrl) }
        ));
        setScanWarning("This doesn't look like a grocery receipt. Please scan a supermarket or grocery store receipt.");
        return;
      }

      // Use today's date — don't trust the date extracted from the image
      data.date = new Date().toISOString().split("T")[0];

      // Compute updated tasks directly so we can await the Supabase sync
      setTasks(prev => {
        const updated = prev.map(t => {
          if (t.id !== "groceries") return t;
          return { ...t, logs: t.logs.map(log => log.image === imageUrl ? { ...log, receipt: data, analyzing: false } : log) };
        });

        // Write to localStorage immediately
        localStorage.setItem(KEYS.householdTasks, JSON.stringify(updated));

        // Sync to Supabase in background so financial page reads fresh data when opened
        fetch("/api/push-state", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: KEYS.householdTasks, value: updated }),
        }).then(() => {
          fireReceiptWebhook({ store: data.store, total: data.total, currency: data.currency, items: data.items, claimNote: data.claimSummary });
        }).catch(() => {});

        return updated;
      });
    } catch (err: any) {
      setTasks(prev => prev.map(t => {
        if (t.id !== "groceries") return t;
        return { ...t, logs: t.logs.map(log => log.image === imageUrl ? { ...log, analyzing: false } : log) };
      }));
      setCameraError(err?.message ?? "Receipt analysis failed. Please try again.");
    }
  };

  const updateReceiptDate = (taskId: string, logIdx: number, newDate: string) => {
    setTasks(prev => {
      const updated = prev.map(t => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          logs: t.logs.map((log, i) => {
            if (i !== logIdx || !log.receipt) return log;
            return { ...log, receipt: { ...log.receipt, date: newDate } };
          }),
        };
      });
      localStorage.setItem(KEYS.householdTasks, JSON.stringify(updated));
      fetch("/api/push-state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: KEYS.householdTasks, value: updated }),
      }).catch(() => {});
      return updated;
    });
  };

  const analyzeMeal = async (imageUrl: string) => {
    try {
      const res  = await fetch("/api/analyze-meal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Analysis failed");

      if (!data.isMeal) {
        setTasks(prev => prev.map(t =>
          t.id !== "cooking" ? t : { ...t, logs: t.logs.filter(log => log.image !== imageUrl) }
        ));
        setScanWarning("This doesn't look like a meal photo. Please take a photo of the cooked meal.");
        return;
      }

      setTasks(prev => prev.map(t =>
        t.id !== "cooking" ? t : { ...t, logs: t.logs.map(log => log.image === imageUrl ? { ...log, analyzing: false } : log) }
      ));
    } catch {
      setTasks(prev => prev.map(t =>
        t.id !== "cooking" ? t : { ...t, logs: t.logs.map(log => log.image === imageUrl ? { ...log, analyzing: false } : log) }
      ));
    }
  };

  useEffect(() => {
    resetDailyData();
    const local = load(KEYS.householdTasks, []);
    if (local.length) setTasks(local);
    hydrate().then((data) => {
      if (data[KEYS.householdTasks]?.length) setTasks(data[KEYS.householdTasks]);
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    save(KEYS.householdTasks, tasks);
  }, [tasks, hydrated]);


  const completedCount = tasks.filter(t => t.logs.length >= (t.targetLogs ?? 1)).length;
  const progressPct    = Math.round((completedCount / tasks.length) * 100);

  const pickerLabel = pickerTaskId === "groceries" ? "Receipt Photo" : "Meal Photo";

  return (
    <IPhone13Frame>
      <div className="relative h-dvh w-full flex-1 overflow-hidden bg-black text-white font-sans p-4 pt-10 pb-6 flex flex-col justify-center">

        {/* Hidden file input */}
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />

        {/* Photo picker action sheet */}
        {/* Date picker bottom sheet */}
        {datePicker && (() => {
          const monthKeys  = ["01","02","03","04","05","06","07","08","09","10","11","12"];
          const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
          const daysInMonth = new Date(Number(datePicker.year), Number(datePicker.month), 0).getDate();
          const dayItems  = Array.from({ length: daysInMonth }, (_, i) => String(i + 1).padStart(2, "0"));
          const yearItems = Array.from({ length: 10 }, (_, i) => String(new Date().getFullYear() - i));
          return (
            <div className="absolute inset-0 z-[60] flex items-end" onClick={() => setDatePicker(null)}>
              <div className="w-full bg-[#111] border-t border-white/10 rounded-t-3xl p-5 pb-10 space-y-4 animate-in slide-in-from-bottom-4 duration-200" onClick={e => e.stopPropagation()}>
                <div className="w-10 h-1 bg-white/20 rounded-full mx-auto" />
                <p className="text-sm font-bold text-white text-center">Select Date</p>
                {/* row of 3 columns — each column is flex:1 wide, label on top, picker below */}
                <div style={{ display: "flex", flexDirection: "row", gap: 8, alignItems: "flex-start" }}>
                  {([
                    { label: "Day",   items: dayItems,  display: undefined,  key: "day"   as const },
                    { label: "Month", items: monthKeys, display: monthNames, key: "month" as const },
                    { label: "Year",  items: yearItems, display: undefined,  key: "year"  as const },
                  ] as const).map(col => (
                    <div key={col.key} style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>{col.label}</span>
                      <ScrollPickerColumn
                        items={col.items as unknown as string[]}
                        displayItems={col.display as unknown as string[] | undefined}
                        value={datePicker[col.key]}
                        onChange={v => setDatePicker(p => p && ({ ...p, [col.key]: v }))}
                      />
                    </div>
                  ))}
                </div>
                <button onClick={confirmDatePicker} className="w-full py-3 rounded-xl bg-yellow-400 text-black font-bold text-sm">Confirm</button>
                <button onClick={() => setDatePicker(null)} className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white/50 text-sm">Cancel</button>
              </div>
            </div>
          );
        })()}

        {pickerTaskId && (
          <div className="absolute inset-0 z-50 flex items-end" onClick={closePicker}>
            <div
              className="w-full bg-black/90 backdrop-blur-xl border-t border-white/10 rounded-t-3xl p-4 pb-10 space-y-2 animate-in slide-in-from-bottom-4 duration-200"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4" />
              <p className="text-[11px] text-white/40 font-bold uppercase tracking-wider text-center mb-3">Add {pickerLabel}</p>

              <button
                onClick={() => openGalleryForTask(pickerTaskId)}
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

              <button onClick={closePicker} className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-white/50 text-sm font-medium mt-1">
                Cancel
              </button>
            </div>
          </div>
        )}

        {scanWarning && (
          <div className="absolute top-14 left-4 right-4 z-50 bg-amber-500/95 backdrop-blur-sm rounded-xl px-4 py-3 flex items-start gap-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <p className="text-xs text-white font-medium flex-1">{scanWarning}</p>
            <button onClick={() => setScanWarning(null)} className="shrink-0 text-white/70 hover:text-white">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
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
                    <h2 className="text-xl font-bold text-white drop-shadow-md">Household</h2>
                    <p className="text-xs text-white/70 mt-0.5">Daily household tasks</p>
                  </div>
                </div>
              </div>

              <div className="overflow-y-auto pt-5 space-y-4 scrollbar-hide pb-2">

                {/* Progress */}
                <div className="mb-6 p-4 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md shadow-inner">
                  <div className="flex justify-between items-end mb-2">
                    <div>
                      <p className="text-xs text-white/70 font-bold uppercase tracking-wider mb-1">Today's Progress</p>
                      <p className="text-lg font-bold text-white drop-shadow-md">
                        {completedCount}{" "}
                        <span className="text-sm text-white/50 font-normal">/ {tasks.length} tasks</span>
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-full border-[3px] border-white/20 flex items-center justify-center relative shadow-[0_0_15px_rgba(234,179,8,0.2)]">
                      <svg className="absolute inset-0 h-full w-full -rotate-90 transform" viewBox="0 0 36 36">
                        <path
                          className="text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]"
                          strokeDasharray={`${progressPct}, 100`}
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                        />
                      </svg>
                      <span className="text-xs font-bold text-white relative z-10 drop-shadow-md">{progressPct}%</span>
                    </div>
                  </div>
                </div>

                {/* Tasks */}
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => task.hasCamera ? openPicker(task.id) : addLog(task.id)}
                      className={`relative flex flex-col p-4 rounded-xl border cursor-pointer transition-all shadow-lg backdrop-blur-sm ${task.logs.length >= (task.targetLogs ?? 1) ? "bg-yellow-400/20 border-yellow-400/40" : "bg-black/50 border-white/10 hover:border-white/30"}`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-4">
                          <div className={`h-12 w-12 rounded-full flex items-center justify-center text-2xl transition-colors shadow-inner ${task.logs.length >= (task.targetLogs ?? 1) ? "bg-yellow-400/30" : "bg-white/10"}`}>
                            {task.icon}
                          </div>
                          <div>
                            <p className={`font-bold text-[15px] drop-shadow-sm ${task.logs.length >= (task.targetLogs ?? 1) ? "text-yellow-100" : "text-white"}`}>{task.name}</p>
                            <div className="flex items-center gap-1.5 mt-0.5" onClick={e => e.stopPropagation()}>
                              <button
                                onClick={() => setTasks(prev => prev.map(t => t.id === task.id ? { ...t, targetLogs: Math.max(1, (t.targetLogs ?? 1) - 1) } : t))}
                                className="h-4 w-4 rounded-full bg-white/10 border border-white/20 text-white/50 text-[10px] flex items-center justify-center hover:bg-white/20 transition-colors"
                              >−</button>
                              <p className="text-[11px] text-white/40">
                                {task.logs.length}/{task.targetLogs ?? 1} check-in{(task.targetLogs ?? 1) !== 1 ? "s" : ""}
                              </p>
                              <button
                                onClick={() => setTasks(prev => prev.map(t => t.id === task.id ? { ...t, targetLogs: (t.targetLogs ?? 1) + 1 } : t))}
                                className="h-4 w-4 rounded-full bg-white/10 border border-white/20 text-white/50 text-[10px] flex items-center justify-center hover:bg-white/20 transition-colors"
                              >+</button>
                            </div>
                          </div>
                        </div>
                        <div className={`h-8 w-8 shrink-0 rounded-full border flex items-center justify-center transition-colors ${task.hasCamera ? "border-yellow-400/40 bg-yellow-400/10" : "border-white/20 bg-white/5 hover:bg-white/10"}`}>
                          {task.hasCamera ? (
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
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-yellow-100/70 font-medium tracking-wide">{log.label}</span>
                                <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                  <span className="text-yellow-300 font-bold drop-shadow-md">{log.time}</span>
                                  <button
                                    onClick={() => setTasks(prev => prev.map(t => t.id === task.id ? { ...t, logs: t.logs.filter((_, i) => i !== idx) } : t))}
                                    className="h-5 w-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/30 hover:text-red-400 hover:border-red-400/30 transition-colors"
                                  >
                                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                                  </button>
                                </div>
                              </div>
                              {log.image && (
                                <div className="h-24 w-full rounded-lg overflow-hidden border border-white/10 relative">
                                  <img src={log.image} alt="Photo" className="h-full w-full object-cover" />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                                    <span className="text-[9px] text-white/60 font-medium">{task.id === "groceries" ? "Receipt" : "Cooked Meal"}</span>
                                    <span className="text-[10px] text-yellow-300 font-bold drop-shadow">{log.time}</span>
                                  </div>
                                </div>
                              )}
                              {log.analyzing && (
                                <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 flex items-center gap-2">
                                  <svg className="animate-spin shrink-0" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgb(250 204 21)" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                                  <span className="text-[11px] text-white/50">{task.id === "cooking" ? "Verifying meal photo..." : "Reading receipt..."}</span>
                                </div>
                              )}
                              {log.receipt && (
                                <div className="rounded-lg border border-yellow-400/20 bg-yellow-400/5 p-3 space-y-3">
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <p className="text-[10px] text-yellow-300/70 font-bold uppercase tracking-wider">Expense Breakdown</p>
                                      <p className="text-[13px] font-bold text-white mt-0.5">{log.receipt.store || "Unknown Store"}</p>
                                    </div>
                                    <button
                                      onClick={e => { e.stopPropagation(); openDatePicker(task.id, idx, log.receipt!.date); }}
                                      className="flex items-center gap-1 mt-1 border-b border-white/20 pb-0.5 text-[10px] text-white/40"
                                    >
                                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                                      {log.receipt.date || "Set date"}
                                    </button>
                                  </div>
                                  {log.receipt.items.length > 0 && (
                                    <div className="space-y-1">
                                      {log.receipt.items.map((item, i) => (
                                        <div key={i} className="flex justify-between items-center text-[11px]">
                                          <span className="text-white/60 flex-1 pr-2 truncate">
                                            {item.qty && item.qty > 1 ? `${item.qty}x ` : ""}{item.name}
                                          </span>
                                          <span className="text-white/80 font-medium shrink-0">{log.receipt!.currency} {item.price.toFixed(2)}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  <div className="border-t border-white/10 pt-2 space-y-1">
                                    {log.receipt.tax > 0 && (
                                      <div className="flex justify-between text-[11px] text-white/40">
                                        <span>Tax</span>
                                        <span>{log.receipt.currency} {log.receipt.tax.toFixed(2)}</span>
                                      </div>
                                    )}
                                    <div className="flex justify-between text-[13px] font-bold">
                                      <span className="text-yellow-300">Total</span>
                                      <span className="text-yellow-300">{log.receipt.currency} {log.receipt.total.toFixed(2)}</span>
                                    </div>
                                  </div>
                                  {log.receipt.claimSummary && (
                                    <div className="border-t border-white/10 pt-2">
                                      <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider mb-1">Claim Note</p>
                                      <p className="text-[11px] text-white/60 leading-relaxed italic">{log.receipt.claimSummary}</p>
                                    </div>
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
