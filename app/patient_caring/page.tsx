"use client";

import React, { useState, useRef } from "react";
import IPhone13Frame from "@/components/iPhone13Frame";
import { useRouter } from "next/navigation";
import ReflectiveCard from "./ReflectiveCard";

export default function PatientCaringPage() {
  const router = useRouter();

  const [patientTasks, setPatientTasks] = useState([
    { id: "bathing", name: "Bathing", logs: [] as { label: string, time: string, image?: string }[], icon: "🛁" },
    { id: "dressing", name: "Dressing", logs: [] as { label: string, time: string, image?: string }[], icon: "👕" },
    { id: "feeding", name: "Feeding", logs: [] as { label: string, time: string, image?: string }[], icon: "🥣" }
  ]);

  const toggleTask = (taskId: string) => {
    addLogToTask(taskId);
  };

  const addLogToTask = (taskId: string, imageUrl?: string) => {
    setPatientTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const labels = ["First check in", "Second check in", "Third check in", "Fourth check in"];
        const newLogLabel = labels[t.logs.length] || `Check in ${t.logs.length + 1}`;
        const newLogTime = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        return { ...t, logs: [...t.logs, { label: newLogLabel, time: newLogTime, image: imageUrl }] };
      }
      return t;
    }));
  };

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        addLogToTask("feeding", imageUrl);
      };
      reader.readAsDataURL(file);
    }
    // Reset input so the same file can be selected again if needed
    e.target.value = '';
  };

  return (
    <IPhone13Frame>
      <div className="relative h-dvh w-full flex-1 overflow-hidden bg-black text-white font-sans p-4 pt-10 pb-6 flex flex-col justify-center">
        
        {/* Reflective Card Content */}
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
              <div className="flex items-center justify-between pb-5 border-b border-white/20 shrink-0">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => router.push('/home')}
                    className="shrink-0 text-white/50 hover:text-white transition-colors"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                  </button>
                  <div>
                    <h2 className="text-xl font-bold text-white drop-shadow-md">Patient Caring</h2>
                    <p className="text-xs text-white/70 mt-0.5">Log daily care activities</p>
                  </div>
                </div>
              </div>

              <div className="overflow-y-auto pt-5 space-y-4 scrollbar-hide pb-2">
                
                {/* Progress Overview */}
                <div className="mb-6 p-4 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md shadow-inner">
                  <div className="flex justify-between items-end mb-2">
                    <div>
                      <p className="text-xs text-white/70 font-bold uppercase tracking-wider mb-1">Today's Progress</p>
                      <p className="text-lg font-bold text-white drop-shadow-md">
                        {patientTasks.filter(t => t.logs.length > 0).length} <span className="text-sm text-white/50 font-normal">/ {patientTasks.length} tasks</span>
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-full border-[3px] border-white/20 flex items-center justify-center relative shadow-[0_0_15px_rgba(234,179,8,0.2)]">
                      <svg className="absolute inset-0 h-full w-full -rotate-90 transform" viewBox="0 0 36 36">
                        <path
                          className="text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]"
                          strokeDasharray={`${(patientTasks.filter(t => t.logs.length > 0).length / patientTasks.length) * 100}, 100`}
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                        />
                      </svg>
                      <span className="text-xs font-bold text-white relative z-10 drop-shadow-md">{Math.round((patientTasks.filter(t => t.logs.length > 0).length / patientTasks.length) * 100)}%</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {patientTasks.map((task) => (
                    <div 
                      key={task.id} 
                      onClick={() => task.id !== "feeding" && toggleTask(task.id)}
                      className={`relative flex flex-col p-4 rounded-xl border cursor-pointer transition-all shadow-lg backdrop-blur-sm ${task.logs.length > 0 ? 'bg-yellow-400/20 border-yellow-400/40' : 'bg-black/50 border-white/10 hover:border-white/30'}`}
                    >
                      {task.id === "feeding" && (
                        <input 
                          type="file" 
                          accept="image/*" 
                          capture="environment" 
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" 
                          onChange={handlePhotoCapture} 
                          onClick={(e) => e.stopPropagation()}
                        />
                      )}
                      <div className="flex items-center justify-between w-full relative z-10 pointer-events-none">
                        <div className="flex items-center gap-4">
                          <div className={`h-12 w-12 rounded-full flex items-center justify-center text-2xl transition-colors shadow-inner ${task.logs.length > 0 ? 'bg-yellow-400/30 text-yellow-300' : 'bg-white/10 text-white/60'}`}>
                            {task.icon}
                          </div>
                          <div>
                            <p className={`font-bold text-[15px] transition-colors drop-shadow-sm ${task.logs.length > 0 ? 'text-yellow-100' : 'text-white'}`}>{task.name}</p>
                          </div>
                        </div>
                        
                        <div className={`h-8 w-8 shrink-0 rounded-full border border-white/20 flex items-center justify-center transition-colors bg-white/5 hover:bg-white/10`}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                        </div>
                      </div>

                      {task.logs.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-yellow-400/20 w-full flex flex-col gap-3 relative z-10 pointer-events-none">
                          {task.logs.map((log, idx) => (
                            <div key={idx} className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-1">
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-yellow-100/70 font-medium tracking-wide">{log.label}</span>
                                <span className="text-yellow-300 font-bold drop-shadow-md">{log.time}</span>
                              </div>
                              {log.image && (
                                <div className="h-20 w-full rounded-lg overflow-hidden border border-white/10 relative">
                                  <img src={log.image} alt="Task Capture" className="h-full w-full object-cover" />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                                  <span className="absolute bottom-1.5 right-2 text-[9px] text-white/80 font-bold tracking-wider">PHOTO LOGGED</span>
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
