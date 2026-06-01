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
  const [isShiftRequestsModalOpen, setIsShiftRequestsModalOpen] = useState(false);

  // Mock data for shift requests
  const [shiftRequests, setShiftRequests] = useState([
    {
      id: 1,
      date: "Today, 8:00 PM - 2:00 AM",
      patient: "Grandma Rose",
      status: "responses",
      responses: [
        { id: 101, name: "Natasha", experience: "5 yrs", rating: 4.9, avatar: "/malay_caregiver.webp", fee: "$25/hr" },
        { id: 102, name: "Mei Ling", experience: "8 yrs", rating: 5.0, avatar: "/aunty.avif", fee: "$30/hr" }
      ],
      selectedCaregiver: null as number | null
    },
    {
      id: 2,
      date: "Tomorrow, 9:00 AM - 5:00 PM",
      patient: "Grandpa Joe",
      status: "pending",
      responses: [],
      selectedCaregiver: null as number | null
    }
  ]);

  const handleSelectCaregiver = (requestId: number, caregiverId: number) => {
    setShiftRequests(prev => prev.map(req => 
      req.id === requestId ? { ...req, selectedCaregiver: caregiverId, status: "confirmed" } : req
    ));
  };

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
          
          {/* Header Banner — iOS fluid glass */}
          <div className="relative mx-4 mt-12 mb-1 rounded-[22px]"
            style={{
              background: 'linear-gradient(135deg, rgba(180,180,180,0.13) 0%, rgba(120,120,120,0.08) 100%)',
              backdropFilter: 'blur(40px) saturate(180%)',
              WebkitBackdropFilter: 'blur(40px) saturate(180%)',
              border: '1px solid rgba(255,255,255,0.18)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.35), inset 0 1px 1px rgba(255,255,255,0.25), inset 0 -1px 1px rgba(0,0,0,0.15)'
            }}
          >
            {/* inner highlight strip at top */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
          <header className="relative flex items-center justify-between px-5 py-4">
            <div>
              <p className="text-white/40 text-[9px] font-semibold tracking-[0.22em] uppercase mb-0.5">Overview</p>
              <h1 className="text-[20px] font-bold tracking-tight text-white">
                Home Dashboard
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

            </div>
          </header>
          </div>

          {/* Quick Access Categories */}
          <div className="px-6 py-5 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
            
            <div className="grid grid-cols-2 gap-4">
              {/* Box 1: Patient Caring */}
              <div onClick={() => router.push('/patient_caring')}>
                <SpotlightCard spotlightColor="rgba(244, 114, 182, 0.2)" className="flex flex-col overflow-hidden rounded-[24px] border border-white/20 bg-black/40 backdrop-blur-[40px] shadow-[0_8px_32px_rgba(0,0,0,0.5)] transition-transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer">
                  <div className="h-32 w-full relative bg-white/5">
                    <img src="/homecare_icon.jpg" alt="Patient Caring" className="h-full w-full object-cover object-center" />
                  </div>
                  <div className="p-3.5 flex flex-col justify-between flex-1">
                    <div>
                      <h3 className="text-sm font-bold text-white mb-0.5 tracking-wide">Patient Caring</h3>
                    </div>
                  </div>
                </SpotlightCard>
              </div>

              {/* Box 2: Household Management */}
              <div onClick={() => router.push('/household_management')}>
              <SpotlightCard spotlightColor="rgba(56, 189, 248, 0.2)" className="flex flex-col overflow-hidden rounded-[24px] border border-white/20 bg-black/40 backdrop-blur-[40px] shadow-[0_8px_32px_rgba(0,0,0,0.5)] transition-transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer">
                <div className="h-32 w-full relative bg-white/5">
                  <img src="/household.jpg" alt="Household Management" className="h-full w-full object-cover object-center" />
                </div>
                <div className="p-3.5 flex flex-col justify-between flex-1">
                  <div>
                    <h3 className="text-sm font-bold text-white mb-0.5 tracking-wide leading-tight">Household<br/>Management</h3>
                  </div>
                </div>
              </SpotlightCard>
              </div>

              {/* Box 3: Medication */}
              <div onClick={() => router.push('/medication')}>
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
                  </div>
                </div>
              </SpotlightCard>
              </div>

              {/* Box 4: Appointments */}
              <div onClick={() => router.push('/appointment')}>
              <SpotlightCard spotlightColor="rgba(168, 85, 247, 0.2)" className="flex flex-col overflow-hidden rounded-[24px] border border-white/20 bg-black/40 backdrop-blur-[40px] shadow-[0_8px_32px_rgba(0,0,0,0.5)] transition-transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer">
                <div className="h-32 w-full relative bg-white/5">
                  <img src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80" alt="Appointments" className="h-full w-full object-cover" />
                </div>
                <div className="p-3.5 flex flex-col justify-between flex-1">
                  <div>
                    <h3 className="text-sm font-bold text-white mb-0.5 tracking-wide">Appointments</h3>
                  </div>
                </div>
              </SpotlightCard>
              </div>
            </div>
          </div>


        </div>

        {/* Profile Dropdown */}
        {isProfileOpen && (
          <>
            <div className="absolute inset-0 z-50" onClick={() => setIsProfileOpen(false)} />
            <div className="absolute right-3 top-32 w-44 z-[60] rounded-xl overflow-hidden border border-white/15 backdrop-blur-2xl animate-in slide-in-from-top-1 fade-in duration-150" style={{ background: 'rgba(28,28,28,0.72)' }}>
              <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/10">
                <div className="h-6 w-6 rounded-full bg-yellow-500/20 flex items-center justify-center text-xs shrink-0">✨</div>
                <div>
                  <p className="text-[11px] font-semibold text-white leading-none">Angel</p>
                  <p className="text-[9px] text-white/40 mt-0.5">Primary Caregiver</p>
                </div>
              </div>
              <button onClick={() => { setIsProfileOpen(false); setIsShiftRequestsModalOpen(true); }} className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-white/8 transition-colors">
                <span className="text-[11px] text-white/75">Shift Requests</span>
                <span className="text-[9px] font-bold bg-yellow-400 text-black px-1.5 py-0.5 rounded">{shiftRequests.length}</span>
              </button>
              <div className="h-px bg-white/10 mx-2" />
              {["Account Details", "Edit Patient Info", "Settings"].map(label => (
                <button key={label} className="w-full text-left px-3 py-1.5 text-[11px] text-white/70 hover:bg-white/8 hover:text-white transition-colors">{label}</button>
              ))}
              <div className="h-px bg-white/10 mx-2" />
              <button className="w-full text-left px-3 py-1.5 text-[11px] text-red-400/75 hover:bg-red-500/10 transition-colors">Log Out</button>
            </div>
          </>
        )}

        {/* Floating Bottom Navigation Bar */}
        <div className="absolute bottom-0 inset-x-0 w-full z-40 pointer-events-none">
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

        {/* Shift Requests Modal */}
        {isShiftRequestsModalOpen && (
          <div className="absolute inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsShiftRequestsModalOpen(false)} />
            <div className="relative w-full max-h-[85%] h-full sm:h-auto sm:max-w-md bg-[#111] rounded-t-3xl sm:rounded-3xl border-t sm:border border-white/10 shadow-2xl flex flex-col animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-8 sm:zoom-in-95 duration-300">
              
              <div className="p-5 overflow-y-auto flex-1 space-y-4">
                {shiftRequests.map((request) => (
                  <div key={request.id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                    <div className="p-4 border-b border-white/10 bg-white/[0.02]">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-white text-sm">{request.patient}</h3>
                          <p className="text-xs text-white/60 mt-0.5">{request.date}</p>
                        </div>
                        {request.status === "confirmed" ? (
                          <span className="bg-green-500/20 text-green-400 border border-green-500/30 text-[10px] px-2 py-0.5 rounded-full font-medium">Confirmed</span>
                        ) : request.responses.length > 0 ? (
                          <span className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 text-[10px] px-2 py-0.5 rounded-full font-medium">{request.responses.length} Replies</span>
                        ) : (
                          <span className="bg-white/10 text-white/60 border border-white/10 text-[10px] px-2 py-0.5 rounded-full font-medium">Pending</span>
                        )}
                      </div>
                    </div>

                    {request.status === "confirmed" && request.selectedCaregiver ? (
                      <div className="p-4 bg-green-500/5">
                        <p className="text-xs text-green-400 font-medium mb-3">Caregiver Assigned</p>
                        {(() => {
                          const caregiver = request.responses.find(c => c.id === request.selectedCaregiver);
                          return caregiver && (
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-xl overflow-hidden shrink-0">
                                <img src={caregiver.avatar} alt={caregiver.name} className="h-full w-full object-cover" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-white">{caregiver.name}</p>
                                <p className="text-xs text-white/60">{caregiver.experience} exp • {caregiver.fee}</p>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    ) : request.responses.length > 0 ? (
                      <div className="p-4">
                        <p className="text-xs text-white/50 mb-3 font-medium uppercase tracking-wider">Available Caregivers</p>
                        <div className="space-y-2">
                          {request.responses.map(caregiver => (
                            <div key={caregiver.id} className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/5 hover:border-yellow-500/30 transition-colors">
                              <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center text-lg overflow-hidden shrink-0">
                                  <img src={caregiver.avatar} alt={caregiver.name} className="h-full w-full object-cover" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-white">{caregiver.name}</p>
                                  <div className="flex items-center gap-2 text-[10px] text-white/50 mt-0.5">
                                    <span className="flex items-center"><svg className="w-3 h-3 text-yellow-400 mr-0.5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>{caregiver.rating}</span>
                                    <span>•</span>
                                    <span>{caregiver.experience}</span>
                                    <span>•</span>
                                    <span>{caregiver.fee}</span>
                                  </div>
                                </div>
                              </div>
                              <button 
                                onClick={() => handleSelectCaregiver(request.id, caregiver.id)}
                                className="px-3 py-1.5 bg-yellow-400 text-black text-xs font-bold rounded-lg hover:bg-yellow-300 transition-colors"
                              >
                                Accept
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 flex flex-col items-center justify-center text-center">
                        <div className="h-12 w-12 rounded-full bg-white/5 flex items-center justify-center mb-3 text-white/20">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        </div>
                        <p className="text-sm text-white/70">Waiting for responses...</p>
                        <p className="text-xs text-white/40 mt-1">Caregivers in your community will be notified</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </IPhone13Frame>
  );
}
