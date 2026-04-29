"use client";

import React, { useState } from "react";
import IPhone13Frame from "@/components/iPhone13Frame";
import { useRouter, usePathname } from "next/navigation";
import PixelSnow from "../onboarding/PixelSnow";
import SpotlightCard from "./SpotlightCard";
import Dock from "./bottom widget/Dock";

export default function HomeDashboard() {
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState("home");
  const [isProfileOpen, setIsProfileOpen] = useState(false);

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
        <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[50%] rounded-full bg-yellow-500/10 blur-[120px] mix-blend-screen pointer-events-none" />
        <div className="absolute top-[40%] -right-[20%] w-[60%] h-[40%] rounded-full bg-blue-500/10 blur-[100px] mix-blend-screen pointer-events-none" />
        
        {/* Main Content Area */}
        <div className="relative z-10 h-full w-full pb-24 overflow-y-auto scrollbar-hide">
          
          {/* Header */}
          <header className="flex items-center justify-between px-6 pt-14 pb-4">
            <div className="animate-in fade-in slide-in-from-left-4 duration-700">
              <p className="text-white/50 text-sm font-medium tracking-wide uppercase">Good Morning</p>
              <h1 className="text-2xl font-bold tracking-tight mt-0.5 text-white">
                Angel <span className="text-yellow-400">✨</span>
              </h1>
            </div>
            <div className="relative">
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="h-11 w-11 rounded-full bg-gradient-to-br from-yellow-400/20 to-yellow-600/20 p-0.5 shadow-[0_0_20px_rgba(250,204,21,0.15)] animate-in fade-in slide-in-from-right-4 duration-700 transition-transform active:scale-95"
              >
                <div className="h-full w-full rounded-full bg-white/10 backdrop-blur-[40px] backdrop-saturate-150 flex items-center justify-center border border-white/30 shadow-[0_4px_16px_rgba(0,0,0,0.2),inset_0_1px_1px_rgba(255,255,255,0.4)]">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-400">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
              </button>

              {/* Profile Dropdown */}
              {isProfileOpen && (
                <>
                  {/* Backdrop to close when clicking outside */}
                  <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
                  
                  <div className="absolute right-0 top-14 w-64 z-50 rounded-3xl border border-white/30 bg-black/40 p-4 backdrop-blur-[40px] backdrop-saturate-200 shadow-[0_24px_60px_rgba(0,0,0,0.6),inset_0_1px_2px_rgba(255,255,255,0.4)] animate-in slide-in-from-top-4 fade-in duration-300">
                    <div className="flex items-center gap-3 border-b border-white/10 pb-4 mb-2">
                      <div className="h-10 w-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                        <span className="text-xl">✨</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white drop-shadow-md">Angel</p>
                        <p className="text-xs text-white/50">Primary Caregiver</p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 transition-colors text-white/80 hover:text-white">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><polyline points="16 11 18 13 22 9" /></svg>
                        <span className="text-sm font-medium">Account Details</span>
                      </button>
                      <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 transition-colors text-white/80 hover:text-white">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
                        <span className="text-sm font-medium">Edit Patient Info</span>
                      </button>
                      <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 transition-colors text-white/80 hover:text-white">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z" /></svg>
                        <span className="text-sm font-medium">Settings</span>
                      </button>
                      <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-500/20 transition-colors text-red-400 hover:text-red-300 mt-2">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                        <span className="text-sm font-medium">Log Out</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </header>

          {/* Search Bar */}
          <div className="px-6 py-3 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 transition-colors group-focus-within:text-yellow-400">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
              </div>
              <input 
                type="text" 
                placeholder="Search resources, events..." 
                className="w-full rounded-2xl border border-white/30 bg-white/10 py-3.5 pl-12 pr-4 text-[15px] text-white placeholder-white/40 outline-none backdrop-blur-[40px] backdrop-saturate-150 transition-all focus:border-white/50 focus:bg-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(255,255,255,0.3)]"
              />
              <button className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl bg-white/10 p-1.5 text-white/60 hover:bg-white/20 transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 21v-7" />
                  <path d="M4 10V3" />
                  <path d="M12 21v-9" />
                  <path d="M12 8V3" />
                  <path d="M20 21v-5" />
                  <path d="M20 12V3" />
                  <path d="M1 14h6" />
                  <path d="M9 8h6" />
                  <path d="M17 16h6" />
                </svg>
              </button>
            </div>
          </div>

          {/* Quick Access Categories */}
          <div className="px-6 py-5 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
            <h2 className="text-lg font-semibold text-white/90 mb-4">Quick Access</h2>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Box 1: Patient Caring */}
              <SpotlightCard spotlightColor="rgba(244, 114, 182, 0.2)" className="flex flex-col overflow-hidden rounded-[24px] border border-white/20 bg-black/40 backdrop-blur-[40px] shadow-[0_8px_32px_rgba(0,0,0,0.5)] transition-transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer">
                <div className="h-32 w-full relative bg-white/5">
                  <img src="/homecare_icon.jpg" alt="Patient Caring" className="h-full w-full object-cover" />
                  <div className="absolute top-2 right-2 bg-pink-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-md">
                    Top Rated
                  </div>
                </div>
                <div className="p-3.5 flex flex-col justify-between flex-1">
                  <div>
                    <h3 className="text-sm font-bold text-white mb-0.5 tracking-wide">Patient Caring</h3>
                    <div className="flex items-center text-[11px] text-white/60">
                      <span className="text-yellow-400 mr-1">★ 4.9</span>
                      <span>(128) • Certified</span>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-2.5">
                    <span className="text-[10px] uppercase font-bold text-pink-400 tracking-wider">Available</span>
                    <span className="text-[11px] font-bold text-white bg-white/10 px-2.5 py-1 rounded-full">Book</span>
                  </div>
                </div>
              </SpotlightCard>

              {/* Box 2: Household Management */}
              <SpotlightCard spotlightColor="rgba(56, 189, 248, 0.2)" className="flex flex-col overflow-hidden rounded-[24px] border border-white/20 bg-black/40 backdrop-blur-[40px] shadow-[0_8px_32px_rgba(0,0,0,0.5)] transition-transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer">
                <div className="h-32 w-full relative bg-white/5">
                  <img src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80" alt="Household Management" className="h-full w-full object-cover" />
                </div>
                <div className="p-3.5 flex flex-col justify-between flex-1">
                  <div>
                    <h3 className="text-sm font-bold text-white mb-0.5 tracking-wide leading-tight">Household<br/>Management</h3>
                    <div className="flex items-center text-[11px] text-white/60 mt-1">
                      <span className="text-yellow-400 mr-1">★ 4.7</span>
                      <span>(84) • Cleaning</span>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-2.5">
                    <span className="text-[10px] uppercase font-bold text-sky-400 tracking-wider">Same Day</span>
                    <span className="text-[11px] font-bold text-white bg-white/10 px-2.5 py-1 rounded-full">Book</span>
                  </div>
                </div>
              </SpotlightCard>

              {/* Box 3: Medication */}
              <SpotlightCard spotlightColor="rgba(16, 185, 129, 0.2)" className="flex flex-col overflow-hidden rounded-[24px] border border-white/20 bg-black/40 backdrop-blur-[40px] shadow-[0_8px_32px_rgba(0,0,0,0.5)] transition-transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer">
                <div className="h-32 w-full relative bg-white/5">
                  <img src="/medicine.jpg" alt="Medication" className="h-full w-full object-cover" />
                  <div className="absolute top-2 right-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-md">
                    Reminder
                  </div>
                </div>
                <div className="p-3.5 flex flex-col justify-between flex-1">
                  <div>
                    <h3 className="text-sm font-bold text-white mb-0.5 tracking-wide">Medication</h3>
                    <div className="flex items-center text-[11px] text-white/60">
                      <span className="text-emerald-400 mr-1">●</span>
                      <span>Active Plan</span>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-2.5">
                    <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Track</span>
                    <span className="text-[11px] font-bold text-white bg-white/10 px-2.5 py-1 rounded-full">View</span>
                  </div>
                </div>
              </SpotlightCard>

              {/* Box 4: Appointments */}
              <SpotlightCard spotlightColor="rgba(168, 85, 247, 0.2)" className="flex flex-col overflow-hidden rounded-[24px] border border-white/20 bg-black/40 backdrop-blur-[40px] shadow-[0_8px_32px_rgba(0,0,0,0.5)] transition-transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer">
                <div className="h-32 w-full relative bg-white/5">
                  <img src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80" alt="Appointments" className="h-full w-full object-cover" />
                </div>
                <div className="p-3.5 flex flex-col justify-between flex-1">
                  <div>
                    <h3 className="text-sm font-bold text-white mb-0.5 tracking-wide">Appointments</h3>
                    <div className="flex items-center text-[11px] text-white/60">
                      <span className="text-purple-400 mr-1">📅</span>
                      <span>Next: Tomorrow</span>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-2.5">
                    <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider">Hospital</span>
                    <span className="text-[11px] font-bold text-white bg-white/10 px-2.5 py-1 rounded-full">Manage</span>
                  </div>
                </div>
              </SpotlightCard>
            </div>
          </div>

          {/* Featured Section */}
          <div className="px-6 py-2 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
            <h2 className="text-lg font-semibold mb-4 text-white/90">Daily Updates</h2>
            <div className="space-y-3">
              {[
                { title: "Morning Review", time: "2 hours ago", icon: "sun", color: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-400/20" },
                { title: "New Community Post", time: "4 hours ago", icon: "message", color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/20" },
                { title: "Weekly Report Ready", time: "1 day ago", icon: "file", color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20" }
              ].map((item, i) => (
                <SpotlightCard key={i} spotlightColor="rgba(255, 255, 255, 0.15)" className="group flex items-center gap-4 rounded-2xl border border-white/30 bg-white/10 p-4 backdrop-blur-[40px] backdrop-saturate-150 transition-all hover:bg-white/20 hover:border-white/40 active:scale-[0.98] shadow-[0_8px_32px_rgba(0,0,0,0.2),inset_0_1px_2px_rgba(255,255,255,0.3)]">
                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center border shadow-sm ${item.bg} ${item.color} ${item.border} group-hover:scale-110 transition-transform duration-300`}>
                    {item.icon === "sun" && (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="4" />
                        <path d="M12 2v2" /><path d="M12 20v2" />
                        <path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" />
                        <path d="M2 12h2" /><path d="M20 12h2" />
                        <path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" />
                      </svg>
                    )}
                    {item.icon === "message" && (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                    )}
                    {item.icon === "file" && (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <path d="M14 2v6h6" />
                        <path d="M16 13H8" />
                        <path d="M16 17H8" />
                        <path d="M10 9H8" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-[15px] font-semibold text-white/90 group-hover:text-white transition-colors">{item.title}</h3>
                    <p className="text-xs text-white/50 mt-1 flex items-center gap-1.5">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      {item.time}
                    </p>
                  </div>
                  <div className="text-white/30 group-hover:text-white/80 transition-colors">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </SpotlightCard>
              ))}
            </div>
          </div>
        </div>

        {/* Floating Bottom Navigation Bar */}
        <div className="absolute bottom-0 inset-x-0 w-full z-50 pointer-events-none">
          <div className="pointer-events-auto flex justify-center w-full">
            <Dock 
              items={navItems.map(item => ({
                icon: <div className="text-white/70">{item.icon}</div>,
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
