"use client";

import React, { useState } from "react";
import IPhone13Frame from "@/components/iPhone13Frame";
import { useRouter, usePathname } from "next/navigation";
import PixelSnow from "../onboarding/PixelSnow";
import Dock from "../home/bottom widget/Dock";
import PostCard, { PostProps } from "./PostCard";

const mockPosts: PostProps[] = [
  {
    id: "1",
    user: {
      name: "Sarah Jenkins",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&q=80"
    },
    time: "2 hours ago",
    imageUrl: "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=800&q=80",
    caption: "Had a breakthrough with my dad today. We finally found a daily routine that keeps him calm and comfortable. Small wins mean everything on this journey! ❤️",
    likes: 124,
    comments: [
      { id: "c1", user: "Sam Dev", text: "So happy for you Sarah! Small wins add up." },
      { id: "c2", user: "Maria G.", text: "Routine is definitely key, it took us months to figure it out." }
    ]
  },
  {
    id: "2",
    user: {
      name: "Michael Chen",
      avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=100&q=80"
    },
    time: "5 hours ago",
    imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80",
    caption: "Organizing medications is half the battle. Just spent the morning setting up the new pill organizers for the month. Does anyone have recommendations for good tracking apps? 💊",
    likes: 89,
    comments: [
      { id: "c3", user: "Lisa Wong", text: "I use Medisafe and it's been a lifesaver!" }
    ]
  },
  {
    id: "3",
    user: {
      name: "Elena Rivera",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80"
    },
    time: "1 day ago",
    imageUrl: "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=800&q=80",
    caption: "Remember to take care of yourself too. Took an hour today just to walk in the park while my sister watched over mom. Caregiver burnout is real, please prioritize your own health when you can. 🌿",
    likes: 210,
    comments: []
  }
];

const communityGroups = [
  { id: '1', name: 'Morning Shift', icon: '🌅', color: 'from-orange-400 to-yellow-400' },
  { id: '2', name: 'Night Shift', icon: '🌙', color: 'from-indigo-400 to-purple-500' },
  { id: '3', name: 'Penang Area', icon: '🏙️', color: 'from-blue-400 to-cyan-400' },
  { id: '4', name: 'Dementia Care', icon: '🧠', color: 'from-pink-400 to-rose-400' },
  { id: '5', name: 'Newbies', icon: '🌱', color: 'from-emerald-400 to-teal-400' },
];

export default function CommunityPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState("community");

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
          <rect x="2" y="6" width="20" height="12" rx="2" />
          <circle cx="12" cy="12" r="2" />
          <path d="M6 12h.01M18 12h.01" />
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
          <header className="sticky top-0 z-20 bg-black/40 backdrop-blur-3xl border-b border-white/10 flex items-center justify-between px-6 py-4 pt-14">
            <h1 className="text-2xl font-bold tracking-tight text-white drop-shadow-md">
              Community
            </h1>
            <div className="flex gap-4">
              <button className="text-white/80 hover:text-white transition-transform active:scale-90">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14" />
                  <path d="M5 12h14" />
                </svg>
              </button>
              <button className="text-white/80 hover:text-white transition-transform active:scale-90">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </button>
            </div>
          </header>

          {/* Group Chat Communities (Stories Style) */}
          <div className="w-full border-b border-white/5 bg-black/10 backdrop-blur-md pt-4 pb-2">
            <div className="flex gap-4 overflow-x-auto scrollbar-hide px-4 pb-2">
              {communityGroups.map((group) => (
                <div key={group.id} className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer group">
                  <div className={`p-[2px] rounded-full bg-gradient-to-tr ${group.color} transition-transform group-active:scale-95 shadow-[0_0_15px_rgba(255,255,255,0.1)]`}>
                    <div className="h-16 w-16 rounded-full bg-[#121212] flex items-center justify-center border-2 border-black relative overflow-hidden shadow-[inset_0_1px_5px_rgba(255,255,255,0.1)]">
                      <div className="absolute inset-0 bg-white/5" />
                      <span className="text-3xl drop-shadow-md z-10">{group.icon}</span>
                    </div>
                  </div>
                  <span className="text-[11px] font-medium text-white/80 tracking-wide">{group.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Feed */}
          <div className="px-4 py-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {mockPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </div>

        {/* Floating Bottom Navigation Bar */}
        <div className="absolute bottom-0 inset-x-0 w-full z-50 pointer-events-none">
          <div className="pointer-events-auto flex justify-center w-full">
            <Dock 
              items={navItems.map(item => ({
                icon: <div className={activeTab === item.id ? "text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.6)]" : "text-white/70"}>{item.icon}</div>,
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
