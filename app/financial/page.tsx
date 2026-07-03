"use client";

import { useState, useEffect } from "react";
import IPhone13Frame from "@/components/iPhone13Frame";
import { useRouter, usePathname } from "next/navigation";
import PixelSnow from "../onboarding/PixelSnow";
import Dock from "../home/bottom widget/Dock";
import { load, hydrate, KEYS } from "@/app/lib/store";

// ── types matching what each page stores ──────────────────────────────────────

type ReceiptItem   = { name: string; qty?: number; price: number };
type ReceiptResult = { store: string; date: string; items: ReceiptItem[]; subtotal: number; tax: number; total: number; currency: string; claimSummary: string };
type HouseLog      = { label: string; time: string; image?: string; receipt?: ReceiptResult };
type HouseTask     = { id: string; name: string; icon: string; logs: HouseLog[] };

type ReportLineItem    = { description: string; amount: number };
type MedicalReportResult = { hospital: string; patientName: string; visitDate: string; items: ReportLineItem[]; subtotal: number; tax: number; total: number; currency: string; diagnosis: string; claimSummary: string };
type AppointmentDoc    = { image: string; report?: MedicalReportResult; analyzing: boolean; scannedAt?: string };
type Appointment       = { id: string; hospital: string; date: string; time: string; notes: string; doc?: AppointmentDoc };

type Transaction = {
  id: string;
  title: string;
  date: string;
  amount: number;
  currency: string;
  category: "groceries" | "medical";
  items: { label: string; amount: number }[];
  claimNote: string;
  image?: string;
};

// ─────────────────────────────────────────────────────────────────────────────

function buildTransactions(householdTasks: HouseTask[], appointments: Appointment[]): Transaction[] {
  const txns: Transaction[] = [];

  // Grocery receipts
  const groceries = householdTasks.find(t => t.id === "groceries");
  if (groceries) {
    groceries.logs.forEach((log, idx) => {
      if (!log.receipt) return;
      const r = log.receipt;
      txns.push({
        id: `grocery-${idx}`,
        title: (r.store && r.store !== "Unknown") ? r.store : "Grocery Receipt",
        date: r.date || log.time,
        amount: r.total,
        currency: r.currency || "MYR",
        category: "groceries",
        items: r.items.map(i => ({ label: `${i.qty && i.qty > 1 ? `${i.qty}x ` : ""}${i.name}`, amount: i.price })),
        claimNote: r.claimSummary,
        image: log.image,
      });
    });
  }

  // Medical receipts from appointments
  appointments.forEach((a, idx) => {
    if (!a.doc?.report) return;
    const r = a.doc.report;
    txns.push({
      id: `medical-${idx}`,
      title: r.hospital || a.hospital,
      date: a.doc?.scannedAt || a.date,
      amount: r.total,
      currency: r.currency || "MYR",
      category: "medical",
      items: r.items.map(i => ({ label: i.description, amount: i.amount })),
      claimNote: r.claimSummary,
    });
  });

  return txns.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
}

function fmt(n: number) { return n.toFixed(2); }

function formatDisplayDate(d: string) {
  if (!d) return "—";
  if (d.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return new Date(d + "T00:00:00").toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" });
  }
  return d;
}

// ─────────────────────────────────────────────────────────────────────────────

export default function FinancialPage() {
  const router   = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState("financial");

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [expanded,     setExpanded]     = useState<string | null>(null);
  const [viewMode,     setViewMode]     = useState<"daily" | "monthly">("monthly");

  const [downloading, setDownloading] = useState(false);

  const [contacts,           setContacts]           = useState<{id:string;name:string;chatId:string;relation:string}[]>([]);
  const [sendOpen,           setSendOpen]           = useState(false);
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [sending,            setSending]            = useState(false);
  const [sent,               setSent]               = useState(false);
  const [sendError,          setSendError]          = useState<string | null>(null);

  useEffect(() => {
    // Load from localStorage immediately, then sync from Supabase
    const fromLocal = buildTransactions(
      load<HouseTask[]>(KEYS.householdTasks, []),
      load<Appointment[]>(KEYS.appointments, [])
    );
    if (fromLocal.length > 0) setTransactions(fromLocal);

    const localContacts = load<{id:string;name:string;chatId:string;relation:string}[]>(KEYS.contacts, []);
    if (localContacts.length) setContacts(localContacts);

    hydrate().then((remote) => {
      const householdTasks = remote[KEYS.householdTasks] ?? load<HouseTask[]>(KEYS.householdTasks, []);
      const appointments   = remote[KEYS.appointments]   ?? load<Appointment[]>(KEYS.appointments, []);
      setTransactions(buildTransactions(householdTasks, appointments));
      if (remote[KEYS.contacts]?.length) setContacts(remote[KEYS.contacts]);
    });
  }, []);

  // All-time totals (used for PDF export & Send)
  const groceryTxns = transactions.filter(t => t.category === "groceries");
  const medicalTxns = transactions.filter(t => t.category === "medical");
  const groceryTotal = groceryTxns.reduce((s, t) => s + t.amount, 0);
  const medicalTotal = medicalTxns.reduce((s, t) => s + t.amount, 0);
  const grandTotal   = groceryTotal + medicalTotal;
  const hasData      = transactions.length > 0;

  // Display-filtered transactions: Daily = today, Monthly = this month
  const currentYearMonth = new Date().toISOString().slice(0, 7);
  const currentDate      = new Date().toISOString().slice(0, 10);
  const displayTransactions = viewMode === "monthly"
    ? transactions.filter(t => (t.date ?? "").startsWith(currentYearMonth))
    : transactions.filter(t => (t.date ?? "").startsWith(currentDate));
  const displayGroceryTxns  = displayTransactions.filter(t => t.category === "groceries");
  const displayMedicalTxns  = displayTransactions.filter(t => t.category === "medical");
  const displayGroceryTotal = displayGroceryTxns.reduce((s, t) => s + t.amount, 0);
  const displayMedicalTotal = displayMedicalTxns.reduce((s, t) => s + t.amount, 0);
  const displayGrandTotal   = displayGroceryTotal + displayMedicalTotal;

  // ── Send to Family ────────────────────────────────────────────────────────

  const sendToFamily = async () => {
    if (!selectedContactIds.length) return;
    setSending(true);
    const today = new Date().toLocaleDateString("en-MY", { day: "numeric", month: "long", year: "numeric" });
    const groceryLines = groceryTxns.map(t => `  • ${t.title} — ${t.currency} ${fmt(t.amount)}`).join("\n");
    const medicalLines = medicalTxns.map(t => `  • ${t.title} — ${t.currency} ${fmt(t.amount)}`).join("\n");
    const lines = [
      `💰 KAI Financial Report — ${today}`,
      "",
      `Total Spending: MYR ${fmt(grandTotal)}`,
      `  🛒 Groceries: MYR ${fmt(groceryTotal)}`,
      `  🏥 Medical: MYR ${fmt(medicalTotal)}`,
      groceryLines ? `\nGrocery receipts:\n${groceryLines}` : null,
      medicalLines ? `\nMedical receipts:\n${medicalLines}` : null,
      "",
      "— KAI Caregiving App",
    ].filter(Boolean);
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

  // ── PDF export ────────────────────────────────────────────────────────────

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
      const checkPage = () => { if (y > 265) { doc.addPage(); y = 20; } };
      const section = (title: string) => {
        checkPage();
        doc.setFillColor(240, 253, 244);
        doc.rect(margin, y - 4, colW, 8, "F");
        doc.setFontSize(8).setTextColor(22, 101, 52).setFont("helvetica", "bold");
        doc.text(title.toUpperCase(), margin + 2, y + 1);
        y += 8;
      };
      const row = (label: string, value: string, bold = false) => {
        checkPage();
        doc.setFontSize(9).setTextColor(80, 80, 80).setFont("helvetica", "normal");
        doc.text(label, margin, y);
        doc.setFont("helvetica", bold ? "bold" : "normal").setTextColor(30, 30, 30);
        doc.text(value, margin + 70, y);
        nl();
      };

      const monthLabel = new Date().toLocaleDateString("en-MY", { month: "long", year: "numeric" });
      const pdfGroceryTxns = displayGroceryTxns;
      const pdfMedicalTxns = displayMedicalTxns;
      const pdfGroceryTotal = displayGroceryTotal;
      const pdfMedicalTotal = displayMedicalTotal;
      const pdfGrandTotal = displayGrandTotal;

      // Title
      doc.setFontSize(18).setTextColor(20, 20, 20).setFont("helvetica", "bold");
      doc.text("KAI Monthly Financial Report", margin, y); nl(2);
      doc.setFontSize(9).setTextColor(120, 120, 120).setFont("helvetica", "normal");
      doc.text(monthLabel, margin, y);
      nl(6);

      // Summary
      section("Monthly Summary");
      row("Total Spending", `MYR ${fmt(pdfGrandTotal)}`, true);
      row("Groceries", `MYR ${fmt(pdfGroceryTotal)} (${pdfGroceryTxns.length} receipt${pdfGroceryTxns.length !== 1 ? "s" : ""})`);
      row("Medical", `MYR ${fmt(pdfMedicalTotal)} (${pdfMedicalTxns.length} receipt${pdfMedicalTxns.length !== 1 ? "s" : ""})`);
      nl(2);

      // Grocery receipts
      if (pdfGroceryTxns.length > 0) {
        section("Grocery Receipts");
        pdfGroceryTxns.forEach(t => {
          checkPage();
          doc.setFontSize(10).setTextColor(30, 30, 30).setFont("helvetica", "bold");
          doc.text(`${t.title}  —  ${formatDisplayDate(t.date)}`, margin, y); nl();
          t.items.forEach(i => {
            doc.setFontSize(8.5).setTextColor(80, 80, 80).setFont("helvetica", "normal");
            doc.text(`  ${i.label}`, margin, y);
            doc.text(`MYR ${fmt(i.amount)}`, margin + 110, y); nl();
          });
          doc.setFontSize(9).setTextColor(30, 30, 30).setFont("helvetica", "bold");
          doc.text(`  Total`, margin, y);
          doc.text(`MYR ${fmt(t.amount)}`, margin + 110, y); nl(1);
          if (t.claimNote) {
            doc.setFontSize(8).setTextColor(120, 120, 120).setFont("helvetica", "italic");
            const lines = doc.splitTextToSize(`Claim: ${t.claimNote}`, colW - 4) as string[];
            doc.text(lines, margin + 2, y);
            y += lines.length * 4.5;
          }
          nl(2);
        });
      }

      // Medical receipts
      if (pdfMedicalTxns.length > 0) {
        section("Medical Receipts");
        pdfMedicalTxns.forEach(t => {
          checkPage();
          doc.setFontSize(10).setTextColor(30, 30, 30).setFont("helvetica", "bold");
          doc.text(`${t.title}  —  ${formatDisplayDate(t.date)}`, margin, y); nl();
          t.items.forEach(i => {
            doc.setFontSize(8.5).setTextColor(80, 80, 80).setFont("helvetica", "normal");
            doc.text(`  ${i.label}`, margin, y);
            doc.text(`MYR ${fmt(i.amount)}`, margin + 110, y); nl();
          });
          doc.setFontSize(9).setTextColor(30, 30, 30).setFont("helvetica", "bold");
          doc.text(`  Total`, margin, y);
          doc.text(`MYR ${fmt(t.amount)}`, margin + 110, y); nl(1);
          if (t.claimNote) {
            doc.setFontSize(8).setTextColor(120, 120, 120).setFont("helvetica", "italic");
            const lines = doc.splitTextToSize(`Claim: ${t.claimNote}`, colW - 4) as string[];
            doc.text(lines, margin + 2, y);
            y += lines.length * 4.5;
          }
          nl(2);
        });
      }

      // Footer
      const pages = doc.getNumberOfPages();
      for (let i = 1; i <= pages; i++) {
        doc.setPage(i);
        doc.setFontSize(7).setTextColor(160, 160, 160).setFont("helvetica", "normal");
        doc.text(`Generated by KAI · ${monthLabel} · Page ${i} of ${pages}`, margin, 287);
      }

      const monthSlug = new Date().toISOString().slice(0, 7);
      doc.save(`KAI_Financial_Report_${monthSlug}.pdf`);
    } catch (e) {
      console.error("PDF error:", e);
    } finally {
      setDownloading(false);
    }
  };

  // ── grouped view ─────────────────────────────────────────────────────────

  const groupedTransactions: [string, Transaction[]][] = (() => {
    const groups: Record<string, Transaction[]> = {};
    displayTransactions.forEach(t => {
      const raw = t.date ?? "";
      const key = viewMode === "daily"
        ? (raw.match(/^\d{4}-\d{2}-\d{2}$/) ? raw : "Unknown")
        : (raw.match(/^\d{4}-\d{2}/) ? raw.slice(0, 7) : "Unknown");
      if (!groups[key]) groups[key] = [];
      groups[key].push(t);
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  })();

  const formatGroupLabel = (key: string, mode: "daily" | "monthly") => {
    if (key === "Unknown") return "Unknown Date";
    if (mode === "daily") {
      return new Date(key + "T00:00:00").toLocaleDateString("en-MY", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
    }
    const [y, m] = key.split("-");
    return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("en-MY", { month: "long", year: "numeric" });
  };

  // ── nav ───────────────────────────────────────────────────────────────────

  const navItems = [
    { id: "home",      label: "Home",      path: "/home",      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
    { id: "community", label: "Community", path: "/community", icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
    { id: "report",    label: "Report",    path: "/report",    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg> },
    { id: "financial", label: "Financial", path: "/financial", icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 18V6"/></svg> },
  ];

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <IPhone13Frame>
      <div className="relative h-dvh w-full flex-1 overflow-hidden bg-black text-white font-sans">

        {/* Send to Family sheet */}
        {sendOpen && (
          <div className="absolute inset-0 z-50 flex items-end" onClick={() => setSendOpen(false)}>
            <div className="w-full bg-[#111] border-t border-white/10 rounded-t-3xl p-5 pb-10 space-y-4 animate-in slide-in-from-bottom-4 duration-200" onClick={e => e.stopPropagation()}>
              <div className="w-10 h-1 bg-white/20 rounded-full mx-auto" />
              <p className="text-sm font-bold text-white text-center">Send Financial Report</p>
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

        <div className="absolute inset-0 bg-[#0a0a0a]" />
        <PixelSnow color="#ffffff" flakeSize={0.015} minFlakeSize={1.0} density={0.35} speed={0.8} variant="round" className="opacity-40 mix-blend-screen" />
        <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[50%] rounded-full bg-emerald-500/10 blur-[120px] mix-blend-screen pointer-events-none" />
        <div className="absolute top-[40%] -right-[20%] w-[60%] h-[40%] rounded-full bg-blue-500/10 blur-[100px] mix-blend-screen pointer-events-none" />

        <div className="relative z-10 h-full w-full pb-28 overflow-y-auto scrollbar-hide">

          {/* Header */}
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
              <button onClick={() => router.push("/home")} className="flex items-center justify-center w-7 h-7 rounded-full shrink-0" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-white/40 text-[9px] font-semibold tracking-[0.22em] uppercase mb-0.5">Financial</p>
                <h1 className="text-[20px] font-bold tracking-tight text-white leading-none">Overview</h1>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => { setSendOpen(true); setSent(false); }}
                  disabled={!hasData || !contacts.length}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-blue-300 text-[11px] font-bold transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)' }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 3 2 12l7 3"/><path d="m9 15 5 7 8-19"/></svg>
                  Share
                </button>
                <button
                  onClick={downloadPDF}
                  disabled={!hasData || downloading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-emerald-400 text-[11px] font-bold transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)' }}
                >
                  {downloading
                    ? <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                    : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  }
                  {downloading ? "Generating…" : "PDF"}
                </button>
              </div>
            </div>
          </div>

          <div className="px-6 py-5 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* Daily / Monthly toggle */}
            {hasData && (
              <div className="flex items-center justify-between ml-1">
                <p className="text-xs text-white/40 font-bold uppercase tracking-wider">View</p>
                <div className="flex items-center gap-0.5 rounded-xl p-0.5" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <button
                    onClick={() => setViewMode("daily")}
                    className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${viewMode === "daily" ? "bg-white/15 text-white" : "text-white/30 hover:text-white/50"}`}
                  >Daily</button>
                  <button
                    onClick={() => setViewMode("monthly")}
                    className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${viewMode === "monthly" ? "bg-white/15 text-white" : "text-white/30 hover:text-white/50"}`}
                  >Monthly</button>
                </div>
              </div>
            )}

            {/* Pie Chart */}
            {hasData && (
              <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-4">
                <p className="text-xs text-white/50 font-bold uppercase tracking-wider mb-4">
                  {viewMode === "monthly"
                    ? `Spending Breakdown · ${new Date().toLocaleDateString("en-MY", { month: "long", year: "numeric" })}`
                    : `Spending Breakdown · ${new Date().toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" })}`
                  }
                </p>
                <div className="flex items-center gap-4">
                  {(() => {
                    const r = 15.9;
                    const circ = 2 * Math.PI * r;
                    const grocPct = displayGrandTotal > 0 ? (displayGroceryTotal / displayGrandTotal) * circ : 0;
                    const medPct  = displayGrandTotal > 0 ? (displayMedicalTotal / displayGrandTotal) * circ : 0;
                    return (
                      <svg viewBox="0 0 36 36" className="w-20 h-20 shrink-0 -rotate-90">
                        <circle cx="18" cy="18" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
                        {grocPct > 0 && (
                          <circle cx="18" cy="18" r={r} fill="none"
                            stroke="#f97316"
                            strokeWidth="4"
                            strokeDasharray={`${grocPct} ${circ}`}
                            strokeLinecap="butt"
                          />
                        )}
                        {medPct > 0 && (
                          <circle cx="18" cy="18" r={r} fill="none"
                            stroke="#60a5fa"
                            strokeWidth="4"
                            strokeDasharray={`${medPct} ${circ}`}
                            strokeDashoffset={-grocPct}
                            strokeLinecap="butt"
                          />
                        )}
                      </svg>
                    );
                  })()}
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-orange-500 shrink-0" />
                        <span className="text-[12px] text-white/60">Groceries</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-white/35">{displayGrandTotal > 0 ? Math.round((displayGroceryTotal / displayGrandTotal) * 100) : 0}%</span>
                        <span className="text-[13px] font-semibold text-white">RM {displayGroceryTotal.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-blue-400 shrink-0" />
                        <span className="text-[12px] text-white/60">Medical</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-white/35">{displayGrandTotal > 0 ? Math.round((displayMedicalTotal / displayGrandTotal) * 100) : 0}%</span>
                        <span className="text-[13px] font-semibold text-white">RM {displayMedicalTotal.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="border-t border-white/10 pt-2 flex justify-between items-center">
                      <span className="text-[11px] text-white/40">Total</span>
                      <span className="text-[13px] font-bold text-white">RM {displayGrandTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Transaction list */}
            {hasData ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between ml-1">
                  <p className="text-xs text-white/40 font-bold uppercase tracking-wider">All Receipts</p>
                  {displayTransactions.length === 0 && transactions.length > 0 && (
                    <p className="text-[10px] text-white/25 italic">
                      {viewMode === "monthly" ? "No receipts this month" : "No receipts today"}
                    </p>
                  )}
                </div>

                {groupedTransactions.map(([groupKey, groupTxns]) => (
                  <div key={groupKey} className="space-y-2">
                    <div className="flex items-center justify-between px-1 pt-1">
                      <p className="text-[11px] text-white/50 font-semibold">{formatGroupLabel(groupKey, viewMode)}</p>
                      <p className="text-[11px] text-white/40 font-semibold">RM {fmt(groupTxns.reduce((s, t) => s + t.amount, 0))}</p>
                    </div>
                    {groupTxns.map(t => (
                      <div key={t.id} className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
                        <button
                          className="w-full flex items-center justify-between p-4 text-left"
                          onClick={() => setExpanded(expanded === t.id ? null : t.id)}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`h-10 w-10 rounded-xl overflow-hidden shrink-0 border ${t.category === "groceries" ? "border-orange-500/20" : "border-blue-500/20"}`}>
                              {t.image ? (
                                <img src={t.image} alt="Receipt" className="h-full w-full object-cover" />
                              ) : (
                                <div className={`h-full w-full flex items-center justify-center text-lg ${t.category === "groceries" ? "bg-orange-500/10" : "bg-blue-500/10"}`}>
                                  {t.category === "groceries" ? "🛒" : "🏥"}
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-white text-sm">{t.title}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-bold text-white text-sm">RM {fmt(t.amount)}</span>
                            <svg className={`transition-transform ${expanded === t.id ? "rotate-180" : ""}`} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity={0.3}><polyline points="6 9 12 15 18 9"/></svg>
                          </div>
                        </button>

                        {expanded === t.id && (
                          <div className="border-t border-white/10 px-4 pb-4 pt-3 space-y-2">
                            {t.image && (
                              <div className="w-full h-32 rounded-xl overflow-hidden mb-3 border border-white/10">
                                <img src={t.image} alt="Receipt photo" className="w-full h-full object-cover" />
                              </div>
                            )}
                            {t.items.map((item, i) => (
                              <div key={i} className="flex justify-between text-[12px]">
                                <span className="text-white/50">{item.label}</span>
                                <span className="text-white/70 font-medium">RM {fmt(item.amount)}</span>
                              </div>
                            ))}
                            {t.claimNote && (
                              <div className="mt-2 pt-2 border-t border-white/5">
                                <p className="text-[10px] text-white/30 font-bold uppercase tracking-wider mb-1">Claim Note</p>
                                <p className="text-[11px] text-white/40 italic leading-relaxed">{t.claimNote}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-4xl mb-3">🧾</p>
                <p className="text-sm text-white/40">No receipts yet</p>
                <p className="text-xs text-white/25 mt-1">Scan grocery or hospital receipts to track spending here.</p>
              </div>
            )}

          </div>
        </div>

        {/* Floating Bottom Nav */}
        <div className="absolute bottom-0 inset-x-0 w-full z-50 pointer-events-none">
          <div className="pointer-events-auto flex justify-center w-full">
            <Dock
              items={navItems.map(item => ({
                icon: <div className={activeTab === item.id ? "text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.6)]" : "text-white/70"}>{item.icon}</div>,
                label: item.label,
                onClick: () => { setActiveTab(item.id); if (item.path !== pathname) router.push(item.path); },
              }))}
              panelHeight={56}
              baseItemSize={44}
              magnification={54}
            />
          </div>
        </div>

      </div>
    </IPhone13Frame>
  );
}
