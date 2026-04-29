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
        { id: 101, name: "Sarah Jenkins", experience: "5 yrs", rating: 4.9, avatar: "👩‍⚕️", fee: "$25/hr" },
        { id: 102, name: "Michael Torres", experience: "3 yrs", rating: 4.7, avatar: "👨‍⚕️", fee: "$22/hr" }
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
                    
                    {/* Shift Requests Summary Section */}
                    <div className="mb-2 pb-2 border-b border-white/10">
                      <button 
                        onClick={() => {
                          setIsProfileOpen(false);
                          setIsShiftRequestsModalOpen(true);
                        }}
                        className="w-full flex flex-col gap-1.5 px-3 py-2.5 rounded-xl hover:bg-white/10 transition-colors"
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-400">
                              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                            </svg>
                            <span className="text-sm font-bold text-white">Shift Requests</span>
                          </div>
                          <span className="bg-yellow-400 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                            {shiftRequests.length} Active
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-white/60">
                          <span className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                            {shiftRequests.filter(r => r.status === "responses").length} Replies
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400"></span>
                            {shiftRequests.filter(r => r.status === "pending").length} Pending
                          </span>
                        </div>
                      </button>
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



          {/* Quick Access Categories */}
          <div className="px-6 py-5 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
            <h2 className="text-lg font-semibold text-white/90 mb-4">Home Dashboard</h2>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Box 1: Patient Caring */}
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

              {/* Box 2: Household Management */}
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
                  </div>
                </div>
              </SpotlightCard>
            </div>
          </div>


        </div>

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
          <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsShiftRequestsModalOpen(false)} />
            <div className="relative w-full max-h-[85vh] h-full sm:h-auto sm:max-w-md bg-[#111] rounded-t-3xl sm:rounded-3xl border-t sm:border border-white/10 shadow-2xl flex flex-col animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-8 sm:zoom-in-95 duration-300">
              
              <div className="flex items-center justify-between p-5 border-b border-white/10 shrink-0">
                <div>
                  <h2 className="text-xl font-bold text-white">Shift Requests</h2>
                  <p className="text-xs text-white/50 mt-0.5">Manage your caregiving requests</p>
                </div>
                <button 
                  onClick={() => setIsShiftRequestsModalOpen(false)}
                  className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors text-white/50 hover:text-white"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
              </div>

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
                              <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-xl">
                                {caregiver.avatar}
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
                                <div className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center text-lg">
                                  {caregiver.avatar}
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
