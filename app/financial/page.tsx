"use client";

import { useState, useEffect } from "react";
import IPhone13Frame from "@/components/iPhone13Frame";
import { useRouter, usePathname } from "next/navigation";
import PixelSnow from "../onboarding/PixelSnow";
import Dock from "../home/bottom widget/Dock";
import { load, KEYS } from "@/app/lib/store";
import type { FinancialAnalysisResult } from "@/app/api/financial-analysis/route";

// ── types matching what each page stores ──────────────────────────────────────

type ReceiptItem   = { name: string; qty?: number; price: number };
type ReceiptResult = { store: string; date: string; items: ReceiptItem[]; subtotal: number; tax: number; total: number; currency: string; claimSummary: string };
type HouseLog      = { label: string; time: string; image?: string; receipt?: ReceiptResult };
type HouseTask     = { id: string; name: string; icon: string; logs: HouseLog[] };

type ReportLineItem    = { description: string; amount: number };
type MedicalReportResult = { hospital: string; patientName: string; visitDate: string; items: ReportLineItem[]; subtotal: number; tax: number; total: number; currency: string; diagnosis: string; claimSummary: string };
type AppointmentDoc    = { image: string; report?: MedicalReportResult; analyzing: boolean };
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
        title: r.store || "Grocery Store",
        date: r.date || log.time,
        amount: r.total,
        currency: r.currency || "MYR",
        category: "groceries",
        items: r.items.map(i => ({ label: `${i.qty && i.qty > 1 ? `${i.qty}x ` : ""}${i.name}`, amount: i.price })),
        claimNote: r.claimSummary,
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
      date: r.visitDate || a.date,
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

  const [analysis,    setAnalysis]    = useState<FinancialAnalysisResult | null>(null);
  const [generating,  setGenerating]  = useState(false);
  const [genError,    setGenError]    = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const householdTasks = load<HouseTask[]>(KEYS.householdTasks, []);
    const appointments   = load<Appointment[]>(KEYS.appointments, []);
    setTransactions(buildTransactions(householdTasks, appointments));
  }, []);

  const groceryTxns = transactions.filter(t => t.category === "groceries");
  const medicalTxns = transactions.filter(t => t.category === "medical");
  const groceryTotal = groceryTxns.reduce((s, t) => s + t.amount, 0);
  const medicalTotal = medicalTxns.reduce((s, t) => s + t.amount, 0);
  const grandTotal   = groceryTotal + medicalTotal;
  const hasData      = transactions.length > 0;

  // ── AI analysis ───────────────────────────────────────────────────────────

  const generateAnalysis = async () => {
    setGenerating(true);
    setGenError(null);
    try {
      const res  = await fetch("/api/financial-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groceryReceipts: groceryTxns.map(t => ({ store: t.title, date: t.date, total: t.amount, items: t.items })),
          medicalReceipts: medicalTxns.map(t => ({ hospital: t.title, date: t.date, total: t.amount, items: t.items })),
          groceryTotal,
          medicalTotal,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setAnalysis(data);
    } catch (e: any) {
      setGenError(e.message ?? "Could not generate analysis");
    } finally {
      setGenerating(false);
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
      const bodyText = (text: string) => {
        checkPage();
        const lines = doc.splitTextToSize(text, colW) as string[];
        doc.setFontSize(9).setTextColor(60, 60, 60).setFont("helvetica", "normal");
        doc.text(lines, margin, y);
        y += lines.length * 5;
      };

      // Title
      doc.setFontSize(18).setTextColor(20, 20, 20).setFont("helvetica", "bold");
      doc.text("KAI Financial Report", margin, y); nl(2);
      doc.setFontSize(9).setTextColor(120, 120, 120).setFont("helvetica", "normal");
      doc.text(new Date().toLocaleDateString("en-MY", { day: "numeric", month: "long", year: "numeric" }), margin, y);
      nl(6);

      // Summary
      section("Summary");
      row("Total Spending", `MYR ${fmt(grandTotal)}`, true);
      row("Groceries", `MYR ${fmt(groceryTotal)} (${groceryTxns.length} receipt${groceryTxns.length !== 1 ? "s" : ""})`);
      row("Medical", `MYR ${fmt(medicalTotal)} (${medicalTxns.length} receipt${medicalTxns.length !== 1 ? "s" : ""})`);
      nl(2);

      // Grocery receipts
      if (groceryTxns.length > 0) {
        section("Grocery Receipts");
        groceryTxns.forEach(t => {
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
      if (medicalTxns.length > 0) {
        section("Medical Receipts");
        medicalTxns.forEach(t => {
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

      // AI Analysis
      if (analysis) {
        section("AI Spending Analysis");
        bodyText(analysis.insight); nl(1);
        if (analysis.groceriesTip) { row("Groceries", analysis.groceriesTip); }
        if (analysis.medicalTip)   { row("Medical",   analysis.medicalTip);   }
        if (analysis.claimNote)    { nl(1); bodyText(`Note: ${analysis.claimNote}`); }
        nl(2);
      }

      // Footer
      const pages = doc.getNumberOfPages();
      for (let i = 1; i <= pages; i++) {
        doc.setPage(i);
        doc.setFontSize(7).setTextColor(160, 160, 160).setFont("helvetica", "normal");
        doc.text(`Generated by KAI · Page ${i} of ${pages}`, margin, 287);
      }

      doc.save(`KAI_Financial_Report_${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (e) {
      console.error("PDF error:", e);
    } finally {
      setDownloading(false);
    }
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

        <div className="absolute inset-0 bg-[#0a0a0a]" />
        <PixelSnow color="#ffffff" flakeSize={0.015} minFlakeSize={1.0} density={0.35} speed={0.8} variant="round" className="opacity-40 mix-blend-screen" />
        <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[50%] rounded-full bg-emerald-500/10 blur-[120px] mix-blend-screen pointer-events-none" />
        <div className="absolute top-[40%] -right-[20%] w-[60%] h-[40%] rounded-full bg-blue-500/10 blur-[100px] mix-blend-screen pointer-events-none" />

        <div className="relative z-10 h-full w-full pb-28 overflow-y-auto scrollbar-hide">

          {/* Header */}
          <header className="sticky top-0 z-20 bg-black/40 backdrop-blur-3xl border-b border-white/10 flex items-center justify-between px-6 py-4 pt-14">
            <h1 className="text-2xl font-bold tracking-tight text-white drop-shadow-md">Financial</h1>
            <button
              onClick={downloadPDF}
              disabled={!hasData || downloading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {downloading
                ? <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              }
              {downloading ? "Generating…" : "Export PDF"}
            </button>
          </header>

          <div className="px-6 py-5 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* Total Spending Card */}
            <div className="relative rounded-[32px] overflow-hidden border border-white/20 bg-gradient-to-br from-emerald-500/20 to-teal-900/40 p-6 backdrop-blur-[40px] shadow-[0_16px_40px_rgba(16,185,129,0.15)]">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              </div>
              <p className="text-sm text-emerald-100/70 font-medium tracking-wide uppercase mb-1">Total from Receipts</p>
              {hasData ? (
                <h2 className="text-4xl font-black text-white tracking-tight mb-4 drop-shadow-md">
                  <span className="text-xl text-white/60 mr-1">RM</span>{fmt(grandTotal)}
                </h2>
              ) : (
                <p className="text-lg font-bold text-white/30 mb-4">No receipts scanned yet</p>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-black/20 border border-white/10 px-3 py-2.5">
                  <p className="text-[10px] text-white/40 uppercase tracking-wider font-bold mb-0.5">🛒 Groceries</p>
                  <p className="text-base font-bold text-white">RM {fmt(groceryTotal)}</p>
                  <p className="text-[10px] text-white/40">{groceryTxns.length} receipt{groceryTxns.length !== 1 ? "s" : ""}</p>
                </div>
                <div className="rounded-xl bg-black/20 border border-white/10 px-3 py-2.5">
                  <p className="text-[10px] text-white/40 uppercase tracking-wider font-bold mb-0.5">🏥 Medical</p>
                  <p className="text-base font-bold text-white">RM {fmt(medicalTotal)}</p>
                  <p className="text-[10px] text-white/40">{medicalTxns.length} receipt{medicalTxns.length !== 1 ? "s" : ""}</p>
                </div>
              </div>
            </div>

            {/* AI Analysis */}
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-white/50 font-bold uppercase tracking-wider">Spending Analysis</p>
                <span className="text-[10px] text-white/20">Gemini AI</span>
              </div>

              {!analysis && !generating && (
                <button
                  onClick={generateAnalysis}
                  disabled={!hasData}
                  className="w-full py-3 rounded-xl border border-emerald-400/30 bg-emerald-400/10 text-emerald-300 text-sm font-bold hover:bg-emerald-400/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Analyse My Spending
                </button>
              )}

              {generating && (
                <div className="flex items-center gap-2 py-2">
                  <svg className="animate-spin shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgb(52 211 153)" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                  <span className="text-sm text-white/50">Reading your receipts...</span>
                </div>
              )}

              {genError && <p className="text-xs text-red-400">{genError}</p>}

              {analysis && (
                <div className="space-y-3">
                  <p className="text-sm text-white/75 leading-relaxed">{analysis.insight}</p>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-xl bg-orange-500/5 border border-orange-500/20 p-3">
                      <p className="text-[10px] text-orange-300/60 font-bold uppercase tracking-wider mb-1">🛒 Groceries</p>
                      <p className="text-[12px] text-white/60 leading-relaxed">{analysis.groceriesTip}</p>
                    </div>
                    <div className="rounded-xl bg-blue-500/5 border border-blue-500/20 p-3">
                      <p className="text-[10px] text-blue-300/60 font-bold uppercase tracking-wider mb-1">🏥 Medical</p>
                      <p className="text-[12px] text-white/60 leading-relaxed">{analysis.medicalTip}</p>
                    </div>
                  </div>

                  {analysis.claimNote && (
                    <div className="flex items-start gap-2 rounded-xl bg-emerald-500/5 border border-emerald-500/20 px-3 py-2.5">
                      <span className="text-emerald-400 text-sm shrink-0">💡</span>
                      <p className="text-[12px] text-white/60 leading-relaxed">{analysis.claimNote}</p>
                    </div>
                  )}

                  <button onClick={generateAnalysis} className="text-[11px] text-white/25 hover:text-white/50 transition-colors">
                    Refresh analysis
                  </button>
                </div>
              )}
            </div>

            {/* Transaction list */}
            {hasData ? (
              <div className="space-y-3">
                <p className="text-xs text-white/40 font-bold uppercase tracking-wider ml-1">All Receipts</p>
                {transactions.map(t => (
                  <div key={t.id} className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
                    <button
                      className="w-full flex items-center justify-between p-4 text-left"
                      onClick={() => setExpanded(expanded === t.id ? null : t.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center text-lg border ${t.category === "groceries" ? "bg-orange-500/10 border-orange-500/20" : "bg-blue-500/10 border-blue-500/20"}`}>
                          {t.category === "groceries" ? "🛒" : "🏥"}
                        </div>
                        <div>
                          <p className="font-bold text-white text-sm">{t.title}</p>
                          <p className="text-[11px] text-white/40">{formatDisplayDate(t.date)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-bold text-white text-sm">RM {fmt(t.amount)}</span>
                        <svg className={`transition-transform ${expanded === t.id ? "rotate-180" : ""}`} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity={0.3}><polyline points="6 9 12 15 18 9"/></svg>
                      </div>
                    </button>

                    {expanded === t.id && (
                      <div className="border-t border-white/10 px-4 pb-4 pt-3 space-y-2">
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
