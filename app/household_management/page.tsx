"use client";

import { useState, useRef, useEffect } from "react";
import IPhone13Frame from "@/components/iPhone13Frame";
import { useRouter } from "next/navigation";
import ReflectiveCard from "@/app/patient_caring/ReflectiveCard";
import type { ReceiptResult } from "@/app/api/analyze-receipt/route";
import { save, KEYS } from "@/app/lib/store";

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
};

export default function HouseholdManagementPage() {
  const router = useRouter();

  const [tasks, setTasks] = useState<Task[]>([
    { id: "cooking",   name: "Cooking Meal",      subtitle: "Tap to photograph the meal",     icon: "🍳", logs: [], hasCamera: true  },
    { id: "cleaning",  name: "Cleaning Room",      subtitle: "Log when room is cleaned",       icon: "🧹", logs: [], hasCamera: false },
    { id: "groceries", name: "Managing Groceries", subtitle: "Snap receipt for expense claim", icon: "🛒", logs: [], hasCamera: true  },
  ]);

  // which task triggered the picker / camera
  const [pickerTaskId, setPickerTaskId]   = useState<string | null>(null);
  const [activeCameraTask, setActiveCameraTask] = useState<string | null>(null);
  const [cameraError, setCameraError]     = useState<string | null>(null);

  const videoRef     = useRef<HTMLVideoElement>(null);
  const streamRef    = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- picker ---
  const openPicker = (taskId: string) => setPickerTaskId(taskId);
  const closePicker = () => setPickerTaskId(null);

  // --- camera ---
  const openCamera = async () => {
    const taskId = pickerTaskId;
    closePicker();
    setCameraError(null);
    setActiveCameraTask(taskId);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      setCameraError("Camera access denied. Please allow camera permission.");
      setActiveCameraTask(null);
    }
  };

  const closeCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setActiveCameraTask(null);
    setCameraError(null);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !activeCameraTask) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    const imageUrl = canvas.toDataURL("image/jpeg", 0.85);
    const taskId = activeCameraTask;
    closeCamera();
    addLog(taskId, imageUrl);
  };

  // --- gallery upload ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    // pickerTaskId is null at this point (picker was closed), so we store it before closing
    const taskId = pendingUploadTaskRef.current;
    if (!taskId) return;
    const reader = new FileReader();
    reader.onload = (ev) => addLog(taskId, ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  // store the task id before the picker closes so the file handler still knows it
  const pendingUploadTaskRef = useRef<string | null>(null);

  const openGalleryForTask = (taskId: string) => {
    pendingUploadTaskRef.current = taskId;
    closePicker();
    fileInputRef.current?.click();
  };

  // --- log + receipt analysis ---
  const addLog = (taskId: string, imageUrl?: string) => {
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      const labels = ["First check in", "Second check in", "Third check in", "Fourth check in"];
      const label  = labels[t.logs.length] ?? `Check in ${t.logs.length + 1}`;
      const analyzing = taskId === "groceries" && !!imageUrl;
      return { ...t, logs: [...t.logs, { label, time, image: imageUrl, analyzing }] };
    }));
    if (taskId === "groceries" && imageUrl) analyzeReceipt(imageUrl);
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
      setTasks(prev => {
        const updated = prev.map(t => {
          if (t.id !== "groceries") return t;
          return { ...t, logs: t.logs.map(log => log.image === imageUrl ? { ...log, receipt: data, analyzing: false } : log) };
        });
        save(KEYS.householdTasks, updated);
        return updated;
      });
      // Trigger n8n workflow 5 — receipt scanned → family notification
      fireReceiptWebhook({ store: data.store, total: data.total, currency: data.currency, items: data.items, claimNote: data.claimSummary });
      router.push("/financial");
    } catch {
      setTasks(prev => prev.map(t => {
        if (t.id !== "groceries") return t;
        return { ...t, logs: t.logs.map(log => log.image === imageUrl ? { ...log, analyzing: false } : log) };
      }));
    }
  };

  useEffect(() => { save(KEYS.householdTasks, tasks); }, [tasks]);

  useEffect(() => {
    return () => { streamRef.current?.getTracks().forEach(t => t.stop()); };
  }, []);

  const completedCount = tasks.filter(t => t.logs.length > 0).length;
  const progressPct    = Math.round((completedCount / tasks.length) * 100);

  const pickerLabel = pickerTaskId === "groceries" ? "Receipt Photo" : "Meal Photo";

  return (
    <IPhone13Frame>
      <div className="relative h-dvh w-full flex-1 overflow-hidden bg-black text-white font-sans p-4 pt-10 pb-6 flex flex-col justify-center">

        {/* Hidden file input */}
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />

        {/* Photo picker action sheet */}
        {pickerTaskId && (
          <div className="absolute inset-0 z-50 flex items-end" onClick={closePicker}>
            <div
              className="w-full bg-black/90 backdrop-blur-xl border-t border-white/10 rounded-t-3xl p-4 pb-10 space-y-2 animate-in slide-in-from-bottom-4 duration-200"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4" />
              <p className="text-[11px] text-white/40 font-bold uppercase tracking-wider text-center mb-3">Add {pickerLabel}</p>

              <button
                onClick={openCamera}
                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
              >
                <div className="h-10 w-10 rounded-full bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center shrink-0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgb(250 204 21)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-white">Take Photo</p>
                  <p className="text-xs text-white/40">Open camera</p>
                </div>
              </button>

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

        {/* Camera modal */}
        {activeCameraTask && (
          <div className="absolute inset-0 z-50 bg-black flex flex-col">
            <video ref={videoRef} autoPlay playsInline muted className="flex-1 w-full object-cover" />
            <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-lg">
              <span className="text-xs text-white/70 font-medium">{activeCameraTask === "groceries" ? "Receipt" : "Meal"}</span>
            </div>
            <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-lg">
              <span className="text-xs text-yellow-300 font-bold tracking-wider">
                {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
            <div className="absolute bottom-0 left-0 right-0 pb-10 pt-6 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-center gap-10">
              <button onClick={closeCamera} className="h-12 w-12 rounded-full bg-white/10 border border-white/30 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
              <button onClick={capturePhoto} className="h-20 w-20 rounded-full bg-white border-4 border-white/40 shadow-[0_0_20px_rgba(255,255,255,0.3)] active:scale-95 transition-transform" />
            </div>
          </div>
        )}

        {cameraError && (
          <div className="absolute top-14 left-4 right-4 z-50 bg-red-500/90 backdrop-blur-sm rounded-xl px-4 py-3">
            <p className="text-xs text-white font-medium">{cameraError}</p>
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
                      className={`relative flex flex-col p-4 rounded-xl border cursor-pointer transition-all shadow-lg backdrop-blur-sm ${task.logs.length > 0 ? "bg-yellow-400/20 border-yellow-400/40" : "bg-black/50 border-white/10 hover:border-white/30"}`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-4">
                          <div className={`h-12 w-12 rounded-full flex items-center justify-center text-2xl transition-colors shadow-inner ${task.logs.length > 0 ? "bg-yellow-400/30" : "bg-white/10"}`}>
                            {task.icon}
                          </div>
                          <div>
                            <p className={`font-bold text-[15px] drop-shadow-sm ${task.logs.length > 0 ? "text-yellow-100" : "text-white"}`}>{task.name}</p>
                            <p className="text-[11px] text-white/40 mt-0.5">{task.subtitle}</p>
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
                                <span className="text-yellow-300 font-bold drop-shadow-md">{log.time}</span>
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
                                  <span className="text-[11px] text-white/50">Reading receipt...</span>
                                </div>
                              )}
                              {log.receipt && (
                                <div className="rounded-lg border border-yellow-400/20 bg-yellow-400/5 p-3 space-y-3">
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <p className="text-[10px] text-yellow-300/70 font-bold uppercase tracking-wider">Expense Breakdown</p>
                                      <p className="text-[13px] font-bold text-white mt-0.5">{log.receipt.store || "Unknown Store"}</p>
                                    </div>
                                    {log.receipt.date && <span className="text-[10px] text-white/40 mt-1">{log.receipt.date}</span>}
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

                <button className="w-full mt-6 py-4 rounded-xl border border-dashed border-white/30 text-white/70 text-sm font-bold hover:bg-white/10 hover:text-white transition-colors flex items-center justify-center gap-2 backdrop-blur-sm">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Add Custom Task
                </button>

              </div>
            </div>
          </ReflectiveCard>
        </div>

      </div>
    </IPhone13Frame>
  );
}
