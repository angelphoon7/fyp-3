"use client";

import { useState, useRef, useEffect } from "react";
import IPhone13Frame from "@/components/iPhone13Frame";
import { useRouter } from "next/navigation";
import ReflectiveCard from "@/app/patient_caring/ReflectiveCard";
import type { MedicalReportResult } from "@/app/api/analyze-medical-report/route";
import { save, load, hydrate, KEYS } from "@/app/lib/store";
import { ScrollPickerColumn, PICKER_H } from "@/components/ScrollPickerColumn";

type Contact = {
  id: string;
  name: string;
  chatId: string;
  relation: string;
};

type AppointmentDoc = {
  image: string;
  report?: MedicalReportResult;
  analyzing: boolean;
  error?: string;
  scannedAt?: string; // YYYY-MM-DD when the receipt was uploaded
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

  const [hydrated, setHydrated] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);

  // --- add appointment sheet ---
  const [addOpen, setAddOpen]         = useState(false);
  const [newHospital, setNewHospital] = useState("");
  const [newDate, setNewDate]         = useState("");
  const [newTime, setNewTime]         = useState("09:00");
  const [newNotes, setNewNotes]       = useState("");
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);

  // --- scroll pickers ---
  const MONTHS   = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const MONTH_KEYS = ["01","02","03","04","05","06","07","08","09","10","11","12"];
  const YEARS    = Array.from({ length: 10 }, (_, i) => String(new Date().getFullYear() + i));
  const HOURS    = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
  const MINUTES  = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"));

  const [datePicker, setDatePicker] = useState<{ day: string; month: string; year: string } | null>(null);
  const [timePicker, setTimePicker] = useState<{ hour: string; minute: string } | null>(null);

  const openDatePicker = () => {
    const today = new Date();
    if (newDate) {
      const [y, m, d] = newDate.split("-");
      setDatePicker({ year: y, month: m, day: d });
    } else {
      setDatePicker({
        year: String(today.getFullYear()),
        month: String(today.getMonth() + 1).padStart(2, "0"),
        day:   String(today.getDate()).padStart(2, "0"),
      });
    }
  };

  const confirmDate = () => {
    if (!datePicker) return;
    setNewDate(`${datePicker.year}-${datePicker.month}-${datePicker.day}`);
    setDatePicker(null);
  };

  const openTimePicker = () => {
    const [h, m] = newTime.split(":");
    const snapped = MINUTES.reduce((p, c) => Math.abs(Number(c) - Number(m)) < Math.abs(Number(p) - Number(m)) ? c : p);
    setTimePicker({ hour: h, minute: snapped });
  };

  const confirmTime = () => {
    if (!timePicker) return;
    setNewTime(`${timePicker.hour}:${timePicker.minute}`);
    setTimePicker(null);
  };

  // --- contacts sheet ---
  const [contactsOpen, setContactsOpen]         = useState(false);
  const [newContactName, setNewContactName]     = useState("");
  const [newContactChatId, setNewContactChatId] = useState("");
  const [newContactRelation, setNewContactRelation] = useState("");

  const addContact = () => {
    if (!newContactName.trim() || !newContactChatId.trim()) return;
    const contact: Contact = {
      id: uid(),
      name: newContactName.trim(),
      chatId: newContactChatId.trim(),
      relation: newContactRelation.trim() || "Family",
    };
    setContacts(prev => [...prev, contact]);
    setNewContactName(""); setNewContactChatId(""); setNewContactRelation("");
  };

  const removeContact = (id: string) => {
    setContacts(prev => prev.filter(c => c.id !== id));
    setSelectedContactIds(prev => prev.filter(cid => cid !== id));
  };

  const toggleContactSelect = (id: string) => {
    setSelectedContactIds(prev =>
      prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]
    );
  };

  const addAppointment = () => {
    if (!newHospital.trim() || !newDate) return;
    const newAppt = { id: uid(), hospital: newHospital.trim(), date: newDate, time: newTime, notes: newNotes.trim() };
    setAppointments(prev => [...prev, newAppt]);
    setNewHospital(""); setNewDate(""); setNewTime("09:00"); setNewNotes("");
    setAddOpen(false);

    // Fire one webhook per selected contact
    const n8nUrl = process.env.NEXT_PUBLIC_N8N_URL;
    if (n8nUrl && selectedContactIds.length > 0) {
      const selected = contacts.filter(c => selectedContactIds.includes(c.id));
      selected.forEach(contact => {
        fetch(`${n8nUrl}/webhook/kai-new-appointment`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...newAppt,
            to: contact.chatId,
            contactName: contact.name,
          }),
        }).catch(() => {});
      });
    }
    setSelectedContactIds([]);
  };

  const deleteAppointment = (id: string) => {
    setAppointments(prev => prev.filter(a => a.id !== id));
  };

  const clearDoc = (id: string) => {
    setAppointments(prev => prev.map(a => a.id !== id ? a : { ...a, doc: undefined }));
  };

  // --- photo picker ---
  const [pickerApptId, setPickerApptId] = useState<string | null>(null);
  const [scanWarning, setScanWarning]   = useState<string | null>(null);

  const fileInputRef        = useRef<HTMLInputElement>(null);
  const pendingUploadIdRef  = useRef<string | null>(null);

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

  const attachDoc = (apptId: string, imageUrl: string) => {
    const scannedAt = new Date().toISOString().slice(0, 10);
    setAppointments(prev => prev.map(a =>
      a.id !== apptId ? a : { ...a, doc: { image: imageUrl, analyzing: true, error: undefined, scannedAt } }
    ));
    analyzeReport(apptId, imageUrl);
  };

  const fireReceiptWebhook = (receiptData: object) => {
    const n8nUrl = process.env.NEXT_PUBLIC_N8N_URL;
    if (n8nUrl) {
      fetch(`${n8nUrl}/webhook/kai-receipt-scanned`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "medical", ...receiptData }),
      }).catch(() => {});
    }
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

      if (data.isMedicalReceipt === false) {
        setAppointments(prev => prev.map(a =>
          a.id !== apptId ? a : { ...a, doc: undefined }
        ));
        setScanWarning("This doesn't look like a medical receipt. Please scan a hospital bill or clinic invoice.");
        return;
      }

      setAppointments(prev => prev.map(a =>
        a.id !== apptId ? a : { ...a, doc: { ...a.doc!, report: data, analyzing: false } }
      ));
      fireReceiptWebhook({ hospital: data.hospital, total: data.total, currency: data.currency, items: data.items, claimNote: data.claimSummary });
    } catch (err: any) {
      const msg: string = err?.message ?? "Analysis failed";
      setAppointments(prev => prev.map(a =>
        a.id !== apptId ? a : { ...a, doc: { ...a.doc!, analyzing: false, error: msg } }
      ));
    }
  };

  // Strip docs where the report has no items and zero total — these are bad scans from before validation was added
  const sanitizeAppts = (appts: Appointment[]): Appointment[] =>
    appts.map(a => {
      if (!a.doc?.report) return a;
      if (a.doc.report.items.length === 0 && a.doc.report.total === 0) return { ...a, doc: undefined };
      return a;
    });

  useEffect(() => {
    const localAppts = load(KEYS.appointments, []);
    const localContacts = load(KEYS.contacts, []);
    if (localAppts.length) setAppointments(sanitizeAppts(localAppts));
    if (localContacts.length) setContacts(localContacts);

    hydrate().then((data) => {
      if (data[KEYS.appointments]?.length) setAppointments(sanitizeAppts(data[KEYS.appointments]));
      if (data[KEYS.contacts]?.length)     setContacts(data[KEYS.contacts]);
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    save(KEYS.appointments, appointments);
  }, [appointments, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    save(KEYS.contacts, contacts);
  }, [contacts, hydrated]);

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

  const upcoming = hydrated ? appointments.filter(a => new Date(a.date + "T" + a.time) >= new Date()).sort((a, b) => a.date.localeCompare(b.date)) : appointments;
  const past     = hydrated ? appointments.filter(a => new Date(a.date + "T" + a.time) < new Date()) : [];

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

        {scanWarning && (
          <div className="absolute top-14 left-4 right-4 z-50 bg-amber-500/95 backdrop-blur-sm rounded-xl px-4 py-3 flex items-start gap-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <p className="text-xs text-white font-medium flex-1">{scanWarning}</p>
            <button onClick={() => setScanWarning(null)} className="shrink-0 text-white/70 hover:text-white">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>
        )}

        {/* Contacts management sheet */}
        {contactsOpen && (
          <div className="absolute inset-0 z-50 flex items-end" onClick={() => setContactsOpen(false)}>
            <div
              className="w-full bg-[#111] border-t border-white/10 rounded-t-3xl p-5 pb-10 space-y-4 animate-in slide-in-from-bottom-4 duration-200 max-h-[85vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-10 h-1 bg-white/20 rounded-full mx-auto" />
              <p className="text-sm font-bold text-white text-center">Family Contacts</p>
              <p className="text-[11px] text-white/40 text-center -mt-2">These contacts will receive Telegram notifications</p>

              {/* Existing contacts */}
              {contacts.length > 0 && (
                <div className="space-y-2">
                  {contacts.map(c => (
                    <div key={c.id} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                      <div className="h-9 w-9 rounded-full bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center shrink-0 text-sm font-bold text-yellow-300">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{c.name}</p>
                        <p className="text-[11px] text-white/40 truncate">{c.relation} · Telegram {c.chatId}</p>
                      </div>
                      <button
                        onClick={() => removeContact(c.id)}
                        className="h-7 w-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/30 hover:text-red-400 hover:border-red-400/30 transition-colors shrink-0"
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add new contact */}
              <div className="border-t border-white/10 pt-4 space-y-3">
                <p className="text-[11px] text-white/40 font-bold uppercase tracking-wider">Add New Contact</p>
                <input
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-yellow-400/50"
                  placeholder="Name (e.g. Mum)"
                  value={newContactName}
                  onChange={e => setNewContactName(e.target.value)}
                />
                <input
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-yellow-400/50"
                  placeholder="Telegram Chat ID (e.g. 1663087310)"
                  value={newContactChatId}
                  onChange={e => setNewContactChatId(e.target.value)}
                  type="number"
                />
                <input
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-yellow-400/50"
                  placeholder="Relation (e.g. Mother, Sibling)"
                  value={newContactRelation}
                  onChange={e => setNewContactRelation(e.target.value)}
                />
                <button
                  onClick={addContact}
                  disabled={!newContactName.trim() || !newContactChatId.trim()}
                  className="w-full py-3 rounded-xl bg-yellow-400 text-black font-bold text-sm disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Add Contact
                </button>
              </div>

              <button onClick={() => setContactsOpen(false)} className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white/50 text-sm font-medium">
                Done
              </button>
            </div>
          </div>
        )}

        {/* Date picker bottom sheet */}
        {datePicker && (() => {
          const daysInMonth = new Date(Number(datePicker.year), Number(datePicker.month), 0).getDate();
          const dayItems = Array.from({ length: daysInMonth }, (_, i) => String(i + 1).padStart(2, "0"));
          return (
            <div className="absolute inset-0 z-[60] flex items-end" onClick={() => setDatePicker(null)}>
              <div className="w-full bg-[#111] border-t border-white/10 rounded-t-3xl p-5 pb-10 space-y-4 animate-in slide-in-from-bottom-4 duration-200" onClick={e => e.stopPropagation()}>
                <div className="w-10 h-1 bg-white/20 rounded-full mx-auto" />
                <p className="text-sm font-bold text-white text-center">Select Date</p>
                <div style={{ display: "flex", flexDirection: "row", gap: 8, alignItems: "flex-start" }}>
                  {([
                    { label: "Day",   items: dayItems,   display: undefined, key: "day"   as const },
                    { label: "Month", items: MONTH_KEYS, display: MONTHS,    key: "month" as const },
                    { label: "Year",  items: YEARS,      display: undefined, key: "year"  as const },
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
                <button onClick={confirmDate} className="w-full py-3 rounded-xl bg-yellow-400 text-black font-bold text-sm">Confirm</button>
                <button onClick={() => setDatePicker(null)} className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white/50 text-sm">Cancel</button>
              </div>
            </div>
          );
        })()}

        {/* Time picker bottom sheet */}
        {timePicker && (
          <div className="absolute inset-0 z-[60] flex items-end" onClick={() => setTimePicker(null)}>
            <div className="w-full bg-[#111] border-t border-white/10 rounded-t-3xl p-5 pb-10 space-y-4 animate-in slide-in-from-bottom-4 duration-200" onClick={e => e.stopPropagation()}>
              <div className="w-10 h-1 bg-white/20 rounded-full mx-auto" />
              <p className="text-sm font-bold text-white text-center">Select Time</p>
              <div style={{ display: "flex", flexDirection: "row", gap: 8, alignItems: "flex-start" }}>
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>Hour</span>
                  <ScrollPickerColumn items={HOURS} value={timePicker.hour} onChange={h => setTimePicker(p => p && ({ ...p, hour: h }))} />
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: PICKER_H, paddingTop: 22, color: "#fff", fontSize: 24, fontWeight: 700 }}>:</div>
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>Minute</span>
                  <ScrollPickerColumn items={MINUTES} value={timePicker.minute} onChange={m => setTimePicker(p => p && ({ ...p, minute: m }))} />
                </div>
              </div>
              <button onClick={confirmTime} className="w-full py-3 rounded-xl bg-yellow-400 text-black font-bold text-sm">Confirm</button>
              <button onClick={() => setTimePicker(null)} className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white/50 text-sm">Cancel</button>
            </div>
          </div>
        )}

        {/* Add appointment bottom sheet */}
        {addOpen && (
          <div className="absolute inset-0 z-50 flex items-end" onClick={() => setAddOpen(false)}>
            <div
              className="w-full bg-[#111] border-t border-white/10 rounded-t-3xl p-5 pb-10 space-y-4 animate-in slide-in-from-bottom-4 duration-200 max-h-[90vh] overflow-y-auto"
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
                  <button
                    onClick={openDatePicker}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-left outline-none flex items-center justify-between"
                  >
                    <span className={newDate ? "text-white" : "text-white/30"}>
                      {newDate ? new Date(newDate + "T00:00:00").toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" }) : "Select date"}
                    </span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  </button>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-white/40 font-bold uppercase tracking-wider">Time</label>
                  <button
                    onClick={openTimePicker}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white text-left outline-none flex items-center justify-between"
                  >
                    <span>{formatTime(newTime)}</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  </button>
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

              {/* Notify section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] text-white/40 font-bold uppercase tracking-wider">Notify via Telegram</label>
                  <button
                    onClick={(e) => { e.stopPropagation(); setAddOpen(false); setContactsOpen(true); }}
                    className="text-[11px] text-yellow-400 font-bold"
                  >
                    + Manage contacts
                  </button>
                </div>

                {contacts.length === 0 ? (
                  <div className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[12px] text-white/30 text-center">
                    No contacts yet — tap "Manage contacts" to add family members
                  </div>
                ) : (
                  <div className="space-y-2">
                    {contacts.map(c => {
                      const selected = selectedContactIds.includes(c.id);
                      return (
                        <button
                          key={c.id}
                          onClick={() => toggleContactSelect(c.id)}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors ${
                            selected
                              ? "bg-yellow-400/10 border-yellow-400/40"
                              : "bg-white/5 border-white/10"
                          }`}
                        >
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold transition-colors ${
                            selected ? "bg-yellow-400 text-black" : "bg-white/10 text-white/50"
                          }`}>
                            {selected ? (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                            ) : (
                              c.name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="flex-1 text-left">
                            <p className={`text-sm font-semibold ${selected ? "text-yellow-100" : "text-white/70"}`}>{c.name}</p>
                            <p className="text-[11px] text-white/30">{c.relation} · Telegram {c.chatId}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <button
                onClick={addAppointment}
                disabled={!newHospital.trim() || !newDate}
                className="w-full py-3.5 rounded-xl bg-yellow-400 text-black font-bold text-sm disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
              >
                Save Appointment
                {selectedContactIds.length > 0 && ` · Notify ${selectedContactIds.length}`}
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
                {/* Contacts button */}
                <button
                  onClick={() => setContactsOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-300"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  <span className="text-[11px] text-yellow-300 font-bold" suppressHydrationWarning>
                    Contacts {hydrated && contacts.length > 0 && `(${contacts.length})`}
                  </span>
                </button>
              </div>

              <div className="overflow-y-auto pt-5 space-y-5 scrollbar-hide pb-2">

                {/* Upcoming */}
                {upcoming.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-[11px] text-white/40 font-bold uppercase tracking-wider">Upcoming</p>
                    {upcoming.map(appt => <AppointmentCard key={appt.id} appt={appt} onDelete={deleteAppointment} onScanReceipt={(id) => { setScanWarning(null); setPickerApptId(id); }} onClearDoc={clearDoc} formatDate={formatDate} formatTime={formatTime} isPast={false} />)}
                  </div>
                )}

                {/* Past */}
                {past.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-[11px] text-white/40 font-bold uppercase tracking-wider">Past Visits</p>
                    {past.map(appt => <AppointmentCard key={appt.id} appt={appt} onDelete={deleteAppointment} onScanReceipt={(id) => { setScanWarning(null); setPickerApptId(id); }} onClearDoc={clearDoc} formatDate={formatDate} formatTime={formatTime} isPast={true} />)}
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
  appt, onDelete, onScanReceipt, onClearDoc, formatDate, formatTime, isPast,
}: {
  appt: Appointment;
  onDelete: (id: string) => void;
  onScanReceipt: (id: string) => void;
  onClearDoc: (id: string) => void;
  formatDate: (d: string) => string;
  formatTime: (t: string) => string;
  isPast: boolean;
}) {

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
            <span className="text-[12px] text-white/30 font-medium">Tap to scan receipt </span>
          </button>
        ) : (
          <div className="space-y-3">
            {/* Receipt thumbnail */}
            <div className="h-20 w-full rounded-lg overflow-hidden border border-white/10 relative">
              <img src={appt.doc.image} alt="Receipt" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between">
                <span className="text-[9px] text-white/60 font-medium">Medical Receipt</span>
                {!appt.doc.report && !appt.doc.analyzing && (
                  <button
                    onClick={() => onScanReceipt(appt.id)}
                    className="text-[10px] text-yellow-300 font-bold bg-black/40 px-2 py-0.5 rounded-md border border-yellow-400/20"
                  >
                    Rescan
                  </button>
                )}
                {appt.doc.report && (
                  <button
                    onClick={() => onClearDoc(appt.id)}
                    className="h-6 w-6 rounded-full bg-black/50 border border-white/20 flex items-center justify-center text-white/50 hover:text-red-400 hover:border-red-400/30 transition-colors"
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/></svg>
                  </button>
                )}
              </div>
            </div>

            {/* Analyzing */}
            {appt.doc.analyzing && (
              <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 flex items-center gap-2">
                <svg className="animate-spin shrink-0" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgb(250 204 21)" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                <span className="text-[11px] text-white/50">Analysing report...</span>
              </div>
            )}

            {/* Error state */}
            {!appt.doc.analyzing && !appt.doc.report && appt.doc.error && (
              <div className="rounded-lg border border-red-400/30 bg-red-400/5 px-3 py-2.5 space-y-1.5">
                <div className="flex items-center gap-2">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgb(248 113 113)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  <span className="text-[11px] text-red-300/80">Could not analyse receipt</span>
                </div>
                {appt.doc.error && appt.doc.error !== "Analysis failed" && (
                  <p className="text-[10px] text-red-300/50 pl-5 leading-relaxed">{appt.doc.error}</p>
                )}
                <button
                  onClick={() => onScanReceipt(appt.id)}
                  className="w-full py-1.5 rounded-lg bg-white/5 border border-white/10 text-[11px] text-yellow-300 font-bold hover:bg-white/10 transition-colors"
                >
                  Tap to Rescan
                </button>
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
