"use client";

import React, { useState } from "react";
import IPhone13Frame from "@/components/iPhone13Frame";
import { useRouter, usePathname } from "next/navigation";
import PixelSnow from "../onboarding/PixelSnow";
import Dock from "../home/bottom widget/Dock";

export default function FinancialPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState("financial");

  const navItems = [
    {
      id: "home",
      label: "Home",
      path: "/home",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      )
    },
    {
      id: "report",
      label: "Report",
      path: "/report",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6" />
          <path d="M16 13H8" />
          <path d="M16 17H8" />
          <path d="M10 9H8" />
        </svg>
      )
    },
    {
      id: "community",
      label: "Community",
      path: "/community",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      )
    },
    {
      id: "financial",
      label: "Financial",
      path: "/financial",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
          <path d="M12 18V6" />
        </svg>
      )
    }
  ];

  const transactions = [
    { id: 1, title: "Dr. Lim Cardiology", date: "Today", amount: 150.00, category: "doctor", icon: "👨‍⚕️" },
    { id: 2, title: "Tesco Groceries", date: "Yesterday", amount: 345.50, category: "groceries", icon: "🛒" },
    { id: 3, title: "Jaya Grocer", date: "Mon, 28 Apr", amount: 120.00, category: "groceries", icon: "🛒" },
    { id: 4, title: "Penang General Hospital", date: "Wed, 23 Apr", amount: 45.00, category: "doctor", icon: "🏥" }
  ];

  const totalSpent = 660.50;
  const budgetLimit = 1000.00;
  
  const doctorSpent = 195.00;
  const doctorBudget = 300.00;
  
  const groceriesSpent = 465.50;
  const groceriesBudget = 700.00;

  return (
    <IPhone13Frame>
      <div className="relative h-dvh w-full flex-1 overflow-hidden bg-black text-white font-sans">
        
        {/* Animated Background Snow */}
        <div className="absolute inset-0 bg-[#0a0a0a]" />
        <PixelSnow 
          color="#ffffff" 
          flakeSize={0.015} 
          minFlakeSize={1.0}
          density={0.35} 
          speed={0.8} 
          variant="round" 
          className="opacity-40 mix-blend-screen" 
        />
        <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[50%] rounded-full bg-emerald-500/10 blur-[120px] mix-blend-screen pointer-events-none" />
        <div className="absolute top-[40%] -right-[20%] w-[60%] h-[40%] rounded-full bg-blue-500/10 blur-[100px] mix-blend-screen pointer-events-none" />
        
        {/* Main Content Area */}
        <div className="relative z-10 h-full w-full pb-28 overflow-y-auto scrollbar-hide">
          
          {/* Header */}
          <header className="sticky top-0 z-20 bg-black/40 backdrop-blur-3xl border-b border-white/10 flex items-center justify-between px-6 py-4 pt-14">
            <h1 className="text-2xl font-bold tracking-tight text-white drop-shadow-md">
              Financial
            </h1>
            <button className="text-white/80 hover:text-white transition-transform active:scale-90">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18" />
                <path d="M7 12h10" />
                <path d="M10 18h4" />
              </svg>
            </button>
          </header>

          <div className="px-6 py-5 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            
            {/* Total Spending Card */}
            <div className="relative rounded-[32px] overflow-hidden border border-white/20 bg-gradient-to-br from-emerald-500/20 to-teal-900/40 p-6 backdrop-blur-[40px] shadow-[0_16px_40px_rgba(16,185,129,0.15)]">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              </div>
              <p className="text-sm text-emerald-100/70 font-medium tracking-wide uppercase mb-1">Total Spending (May)</p>
              <h2 className="text-4xl font-black text-white tracking-tight mb-4 drop-shadow-md">
                <span className="text-xl text-white/60 mr-1">RM</span>{totalSpent.toFixed(2)}
              </h2>
              
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-bold text-white/60">
                  <span>{((totalSpent/budgetLimit)*100).toFixed(0)}% of Budget</span>
                  <span>RM {budgetLimit.toFixed(2)}</span>
                </div>
                <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden border border-white/5 shadow-inner">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.5)]" 
                    style={{ width: `${(totalSpent/budgetLimit)*100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Breakdown Categories */}
            <div>
              <h3 className="text-sm font-bold text-white/80 uppercase tracking-widest mb-4 ml-1">Spending Breakdown</h3>
              
              <div className="space-y-3">
                {/* Doctor Appointments */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-3 backdrop-blur-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-lg border border-blue-500/30">
                        👨‍⚕️
                      </div>
                      <div>
                        <p className="font-bold text-white text-sm">Doctor Appointments</p>
                        <p className="text-[11px] text-white/50">{transactions.filter(t => t.category === "doctor").length} transactions</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-white text-sm">RM {doctorSpent.toFixed(2)}</p>
                      <p className="text-[11px] text-white/50">/ RM {doctorBudget}</p>
                    </div>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-400 rounded-full" 
                      style={{ width: `${(doctorSpent/doctorBudget)*100}%` }}
                    />
                  </div>
                </div>

                {/* Groceries */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-3 backdrop-blur-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center text-lg border border-orange-500/30">
                        🛒
                      </div>
                      <div>
                        <p className="font-bold text-white text-sm">Groceries</p>
                        <p className="text-[11px] text-white/50">{transactions.filter(t => t.category === "groceries").length} transactions</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-white text-sm">RM {groceriesSpent.toFixed(2)}</p>
                      <p className="text-[11px] text-white/50">/ RM {groceriesBudget}</p>
                    </div>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-orange-400 rounded-full" 
                      style={{ width: `${(groceriesSpent/groceriesBudget)*100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Transactions */}
            <div>
              <div className="flex items-center justify-between mb-4 ml-1">
                <h3 className="text-sm font-bold text-white/80 uppercase tracking-widest">Recent Activity</h3>
                <button className="text-xs font-bold text-emerald-400 hover:text-emerald-300">View All</button>
              </div>
              
              <div className="space-y-2">
                {transactions.map(t => (
                  <div key={t.id} className="flex items-center justify-between p-3.5 rounded-xl bg-black/40 border border-white/5 hover:border-white/10 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center text-lg shadow-inner">
                        {t.icon}
                      </div>
                      <div>
                        <p className="font-bold text-white text-sm">{t.title}</p>
                        <p className="text-xs text-white/50">{t.date}</p>
                      </div>
                    </div>
                    <p className="font-bold text-white text-sm">-RM {t.amount.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Floating Add Button */}
        <button className="absolute bottom-24 right-6 h-14 w-14 rounded-full bg-emerald-500 text-black flex items-center justify-center shadow-[0_8px_30px_rgba(16,185,129,0.5)] transition-transform active:scale-90 hover:bg-emerald-400 z-30">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </button>

        {/* Floating Bottom Navigation Bar */}
        <div className="absolute bottom-0 inset-x-0 w-full z-50 pointer-events-none">
          <div className="pointer-events-auto flex justify-center w-full">
            <Dock 
              items={navItems.map(item => ({
                icon: <div className={activeTab === item.id ? "text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.6)]" : "text-white/70"}>{item.icon}</div>,
                label: item.label,
                onClick: () => {
                  setActiveTab(item.id);
                  if (item.path !== pathname) {
                    router.push(item.path);
                  }
                }
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
