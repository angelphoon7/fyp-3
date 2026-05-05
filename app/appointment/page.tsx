"use client";

import { useState, useRef, useEffect } from "react";
import IPhone13Frame from "@/components/iPhone13Frame";
import { useRouter } from "next/navigation";
import ReflectiveCard from "@/app/patient_caring/ReflectiveCard";
import type { MedicalReportResult } from "@/app/api/analyze-medical-report/route";
import { save, KEYS } from "@/app/lib/store";

type AppointmentDoc = {
  image: string;
  report?: MedicalReportResult;
  analyzing: boolean;
};

type Appointment = {
  id: string;
  hospital: string;
  date: string;
  time: string;
  notes: string;
  doc?: AppointmentDoc;
};

function uid() {
  return Math.random().toString(36).slice(2);
}

export default function AppointmentPage() {
  const router = useRouter();

  const [appointments, setAppointments] = useState<Appointment[]>([
    {
      id: uid(),
      hospital: "Hospital Kuala Lumpur",
      date: "2026-05-10",
      time: "09:30",
      notes: "Follow-up for blood pressure",
    },
  ]);

  // --- add appointment sheet ---
  const [addOpen, setAddOpen]       = useState(false);
  const [newHospital, setNewHospital] = useState("");
  const [newDate, setNewDate]       = useState("");
  const [newTime, setNewTime]       = useState("09:00");
  const [newNotes, setNewNotes]     = useState("");

  const addAppointment = () => {
    if (!newHospital.trim() || !newDate) return;
    setAppointments(prev => [...prev, {
      id: uid(),
      hospital: newHospital.trim(),
      date: newDate,
      time: newTime,
      notes: newNotes.trim(),
    }]);
    setNewHospital(""); setNewDate(""); setNewTime("09:00"); setNewNotes("");
    setAddOpen(false);
  };

  const deleteAppointment = (id: string) => {
    setAppointments(prev => prev.filter(a => a.id !== id));
  };

  // --- photo picker ---
  const [pickerApptId, setPickerApptId] = useState<string | null>(null);
  const [cameraApptId, setCameraApptId] = useState<string | null>(null);
  const [cameraError, setCameraError]   = useState<string | null>(null);

  const videoRef            = useRef<HTMLVideoElement>(null);
  const streamRef           = useRef<MediaStream | null>(null);
  const fileInputRef        = useRef<HTMLInputElement>(null);
  const pendingUploadIdRef  = useRef<string | null>(null);

  const openCamera = async () => {
    const id = pickerApptId;
    setPickerApptId(null);
    setCameraError(null);
    setCameraApptId(id);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      setCameraError("Camera access denied. Please allow camera permission.");
      setCameraApptId(null);
    }
  };

  const closeCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setCameraApptId(null);
    setCameraError(null);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !cameraApptId) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    const imageUrl = canvas.toDataURL("image/jpeg", 0.85);
    const id = cameraApptId;
    closeCamera();
    attachDoc(id, imageUrl);
  };

  const openGallery = () => {
    pendingUploadIdRef.current = pickerApptId;
    setPickerApptId(null);
    fileInputRef.current?.click();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const id   = pendingUploadIdRef.current;
    if (!file || !id) return;
    e.target.value = "";
    const reader = new FileReader();
    reader.onload = ev => attachDoc(id, ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  // --- attach doc + analyze ---
  const attachDoc = (apptId: string, imageUrl: string) => {
    setAppointments(prev => prev.map(a =>
      a.id !== apptId ? a : { ...a, doc: { image: imageUrl, analyzing: true } }
    ));
    analyzeReport(apptId, imageUrl);
  };

  const analyzeReport = async (apptId: string, imageUrl: string) => {
    try {
      const res  = await fetch("/api/analyze-medical-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Analysis failed");
      setAppointments(prev => prev.map(a =>
        a.id !== apptId ? a : { ...a, doc: { image: imageUrl, report: data, analyzing: false } }
      ));
    } catch {
      setAppointments(prev => prev.map(a =>
        a.id !== apptId ? a : { ...a, doc: { ...a.doc!, analyzing: false } }
      ));
    }
  };

  useEffect(() => { save(KEYS.appointments, appointments); }, [appointments]);

  useEffect(() => {
    return () => { streamRef.current?.getTracks().forEach(t => t.stop()); };
  }, []);

  const formatDate = (d: string) => {
    if (!d) return "";
    const dt = new Date(d + "T00:00:00");
    return dt.toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" });
  };

  const formatTime = (t: string) => {
    if (!t) return "";
    const [h, m] = t.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ampm}`;
  };

  const upcoming = appointments.filter(a => new Date(a.date + "T" + a.time) >= new Date()).sort((a, b) => a.date.localeCompare(b.date));
  const past     = appointments.filter(a => new Date(a.date + "T" + a.time) < new Date());

  return (
    <IPhone13Frame>
      <div className="relative h-dvh w-full flex-1 overflow-hidden bg-black text-white font-sans p-4 pt-10 pb-6 flex flex-col justify-center">

        {/* Hidden file input */}
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />

        {/* Photo picker action sheet */}
        {pickerApptId && (
          <div className="absolute inset-0 z-50 flex items-end" onClick={() => setPickerApptId(null)}>
            <div
              className="w-full bg-black/90 backdrop-blur-xl border-t border-white/10 rounded-t-3xl p-4 pb-10 space-y-2 animate-in slide-in-from-bottom-4 duration-200"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4" />
              <p className="text-[11px] text-white/40 font-bold uppercase tracking-wider text-center mb-3">Scan Medical Receipt / Report</p>

              <button onClick={openCamera} className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                <div className="h-10 w-10 rounded-full bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center shrink-0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgb(250 204 21)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-white">Take Photo</p>
                  <p className="text-xs text-white/40">Open camera</p>
                </div>
              </button>

              <button onClick={openGallery} className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                <div className="h-10 w-10 rounded-full bg-blue-400/10 border border-blue-400/30 flex items-center justify-center shrink-0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgb(96 165 250)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-white">Upload Image</p>
                  <p className="text-xs text-white/40">Choose from gallery</p>
                </div>
              </button>

              <button onClick={() => setPickerApptId(null)} className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-white/50 text-sm font-medium mt-1">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Camera modal */}
        {cameraApptId && (
          <div className="absolute inset-0 z-50 bg-black flex flex-col">
            <video ref={videoRef} autoPlay playsInline muted className="flex-1 w-full object-cover" />
            <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-lg">
              <span className="text-xs text-white/70 font-medium">Medical Receipt</span>
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

        {/* Add appointment bottom sheet */}
        {addOpen && (
          <div className="absolute inset-0 z-50 flex items-end" onClick={() => setAddOpen(false)}>
            <div
              className="w-full bg-[#111] border-t border-white/10 rounded-t-3xl p-5 pb-10 space-y-4 animate-in slide-in-from-bottom-4 duration-200"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-10 h-1 bg-white/20 rounded-full mx-auto" />
              <p className="text-sm font-bold text-white text-center">New Appointment</p>

              <div className="space-y-1">
                <label className="text-[11px] text-white/40 font-bold uppercase tracking-wider">Hospital / Clinic</label>
                <input
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-yellow-400/50"
                  placeholder="e.g. Hospital Kuala Lumpur"
                  value={newHospital}
                  onChange={e => setNewHospital(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] text-white/40 font-bold uppercase tracking-wider">Date</label>
                  <input
                    type="date"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-yellow-400/50"
                    value={newDate}
                    onChange={e => setNewDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-white/40 font-bold uppercase tracking-wider">Time</label>
                  <input
                    type="time"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-yellow-400/50"
                    value={newTime}
                    onChange={e => setNewTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-white/40 font-bold uppercase tracking-wider">Notes (optional)</label>
                <input
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-yellow-400/50"
                  placeholder="e.g. Blood pressure follow-up"
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                />
              </div>

              <button
                onClick={addAppointment}
                disabled={!newHospital.trim() || !newDate}
                className="w-full py-3.5 rounded-xl bg-yellow-400 text-black font-bold text-sm disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
              >
                Save Appointment
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
                    <h2 className="text-xl font-bold text-white drop-shadow-md">Appointments</h2>
                    <p className="text-xs text-white/70 mt-0.5">Hospital visits & receipts</p>
                  </div>
                </div>
              </div>

              <div className="overflow-y-auto pt-5 space-y-5 scrollbar-hide pb-2">

                {/* Upcoming */}
                {upcoming.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-[11px] text-white/40 font-bold uppercase tracking-wider">Upcoming</p>
                    {upcoming.map(appt => <AppointmentCard key={appt.id} appt={appt} onDelete={deleteAppointment} onScanReceipt={setPickerApptId} formatDate={formatDate} formatTime={formatTime} />)}
                  </div>
                )}

                {/* Past */}
                {past.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-[11px] text-white/40 font-bold uppercase tracking-wider">Past Visits</p>
                    {past.map(appt => <AppointmentCard key={appt.id} appt={appt} onDelete={deleteAppointment} onScanReceipt={setPickerApptId} formatDate={formatDate} formatTime={formatTime} />)}
                  </div>
                )}

                {appointments.length === 0 && (
                  <div className="py-10 text-center">
                    <p className="text-4xl mb-3">🏥</p>
                    <p className="text-sm text-white/40">No appointments yet</p>
                  </div>
                )}

                <button
                  onClick={() => setAddOpen(true)}
                  className="w-full py-4 rounded-xl border border-dashed border-white/30 text-white/70 text-sm font-bold hover:bg-white/10 hover:text-white transition-colors flex items-center justify-center gap-2 backdrop-blur-sm"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Add Appointment
                </button>

              </div>
            </div>
          </ReflectiveCard>
        </div>

      </div>
    </IPhone13Frame>
  );
}

// --- appointment card sub-component ---
function AppointmentCard({
  appt, onDelete, onScanReceipt, formatDate, formatTime,
}: {
  appt: Appointment;
  onDelete: (id: string) => void;
  onScanReceipt: (id: string) => void;
  formatDate: (d: string) => string;
  formatTime: (t: string) => string;
}) {
  const isPast = new Date(appt.date + "T" + appt.time) < new Date();

  return (
    <div className={`rounded-xl border overflow-hidden shadow-lg backdrop-blur-sm ${isPast ? "bg-white/5 border-white/10" : "bg-yellow-400/10 border-yellow-400/30"}`}>

      {/* Visit info */}
      <div className="p-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={`h-10 w-10 rounded-full flex items-center justify-center text-xl shrink-0 shadow-inner ${isPast ? "bg-white/5" : "bg-yellow-400/20"}`}>
            🏥
          </div>
          <div className="min-w-0">
            <p className={`font-bold text-[14px] drop-shadow-sm truncate ${isPast ? "text-white/60" : "text-yellow-100"}`}>{appt.hospital}</p>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-[11px] text-white/40">{formatDate(appt.date)}</span>
              <span className="text-[11px] text-yellow-300/70 font-bold">{formatTime(appt.time)}</span>
            </div>
            {appt.notes && <p className="text-[11px] text-white/30 mt-1 truncate">{appt.notes}</p>}
          </div>
        </div>
        <button
          onClick={() => onDelete(appt.id)}
          className="h-7 w-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/30 hover:text-red-400 hover:border-red-400/30 transition-colors shrink-0"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 18l12-12"/></svg>
        </button>
      </div>

      {/* Receipt section */}
      <div className="border-t border-white/10 px-4 py-3">
        {!appt.doc ? (
          <button
            onClick={() => onScanReceipt(appt.id)}
            className="w-full flex items-center gap-3 py-2 text-left"
          >
            <div className="h-8 w-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-40"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
            </div>
            <span className="text-[12px] text-white/30 font-medium">Tap to scan receipt / medical report</span>
          </button>
        ) : (
          <div className="space-y-3">
            {/* Receipt thumbnail */}
            <div className="h-20 w-full rounded-lg overflow-hidden border border-white/10 relative">
              <img src={appt.doc.image} alt="Receipt" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between">
                <span className="text-[9px] text-white/60 font-medium">Medical Receipt</span>
                <button
                  onClick={() => onScanReceipt(appt.id)}
                  className="text-[9px] text-yellow-300/70 font-bold"
                >
                  Rescan
                </button>
              </div>
            </div>

            {/* Analyzing */}
            {appt.doc.analyzing && (
              <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 flex items-center gap-2">
                <svg className="animate-spin shrink-0" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgb(250 204 21)" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                <span className="text-[11px] text-white/50">Analysing report...</span>
              </div>
            )}

            {/* Report breakdown */}
            {appt.doc.report && (
              <div className="rounded-lg border border-yellow-400/20 bg-yellow-400/5 p-3 space-y-3">

                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] text-yellow-300/70 font-bold uppercase tracking-wider">Medical Expense Breakdown</p>
                    <p className="text-[13px] font-bold text-white mt-0.5">{appt.doc.report.hospital || appt.hospital}</p>
                  </div>
                  {appt.doc.report.visitDate && <span className="text-[10px] text-white/40 mt-1 shrink-0">{appt.doc.report.visitDate}</span>}
                </div>

                {appt.doc.report.diagnosis && (
                  <div className="bg-black/20 rounded-lg px-3 py-2">
                    <p className="text-[10px] text-white/40 uppercase tracking-wider font-bold mb-0.5">Diagnosis / Reason</p>
                    <p className="text-[11px] text-white/70">{appt.doc.report.diagnosis}</p>
                  </div>
                )}

                {appt.doc.report.items.length > 0 && (
                  <div className="space-y-1.5">
                    {appt.doc.report.items.map((item, i) => (
                      <div key={i} className="flex justify-between items-center text-[11px]">
                        <span className="text-white/60 flex-1 pr-2">{item.description}</span>
                        <span className="text-white/80 font-medium shrink-0">
                          {appt.doc!.report!.currency} {item.amount.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="border-t border-white/10 pt-2 space-y-1">
                  {appt.doc.report.tax > 0 && (
                    <div className="flex justify-between text-[11px] text-white/40">
                      <span>Tax / GST</span>
                      <span>{appt.doc.report.currency} {appt.doc.report.tax.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[13px] font-bold">
                    <span className="text-yellow-300">Total</span>
                    <span className="text-yellow-300">{appt.doc.report.currency} {appt.doc.report.total.toFixed(2)}</span>
                  </div>
                </div>

                {appt.doc.report.claimSummary && (
                  <div className="border-t border-white/10 pt-2">
                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider mb-1">Claim Note</p>
                    <p className="text-[11px] text-white/60 leading-relaxed italic">{appt.doc.report.claimSummary}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
