"use client";

import React, { useState, useRef } from "react";
import IPhone13Frame from "@/components/iPhone13Frame";
import { useRouter, usePathname } from "next/navigation";
import PixelSnow from "../onboarding/PixelSnow";
import Dock from "../home/bottom widget/Dock";
import PostCard, { PostProps } from "./PostCard";

const mockPosts: PostProps[] = [
  {
    id: "1",
    user: {
      name: "Mei Ling",
      avatar: "/aunty.avif"
    },
    time: "2 hours ago",
    imageUrl: "/caregiver1.jpg",
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
      name: "Satiyah",
      avatar: "/india.webp"
    },
    time: "5 hours ago",
    imageUrl: "/give_medicine.png",
    caption: "Organizing medications is half the battle. Just spent the morning setting up the new pill organizers for the month. Does anyone have recommendations for good tracking apps? 💊",
    likes: 89,
    comments: [
      { id: "c3", user: "Lisa Wong", text: "I use Medisafe and it's been a lifesaver!" }
    ]
  },
  {
    id: "3",
    user: {
      name: "Natasha",
      avatar: "/malay_caregiver.webp",
      trustRating: "⭐ 4.9 (120 Shifts)"
    },
    time: "1 day ago",
    type: "help",
    helpDetails: {
      date: "Sat, Nov 14",
      time: "08:00 AM - 02:00 PM",
      location: "Bayan Lepas, Penang",
      patientAge: "72",
      condition: "Dementia (Stage 2) • Mobility Assist"
    },
    caption: "Need someone to cover my morning shift this weekend. My son is graduating so I can't be there. Very calm patient, just needs help with breakfast and light walking.",
    likes: 12,
    comments: []
  }
];

const communityGroups = [
  { id: '1', name: 'Morning Shift', image: '/morning.jpeg', color: 'from-orange-400 to-yellow-400' },
  { id: '3', name: 'Penang Area', image: '/penang.jpeg', color: 'from-blue-400 to-cyan-400' },
  { id: '4', name: 'Dementia Care', image: '/dementia.jpg', color: 'from-pink-400 to-rose-400' },
  { id: 'bakery', name: 'Bakery', image: '/cake.jpeg', color: 'from-amber-500 to-orange-400' },
  { id: 'add', name: 'New Group', icon: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white">
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  ), color: 'from-white/20 to-white/5' },
];

const mockChats: Record<string, { sender: string; text: string; isMe: boolean; time: string; avatar?: string }[]> = {
  '1': [
    { sender: "Satiyah", avatar: "/india.webp", text: "Morning everyone! Did anyone else's patient refuse breakfast today?", isMe: false, time: "08:15 AM" },
    { sender: "You", text: "Yes! Dad wouldn't eat his oatmeal. I had to blend it into a smoothie instead.", isMe: true, time: "08:20 AM" },
    { sender: "Mei Ling", avatar: "/aunty.avif", text: "Smoothie is a great trick. I sometimes add a bit of honey.", isMe: false, time: "08:25 AM" },
  ],
  '3': [
    { sender: "You", text: "Hi, does anyone know a good pharmacy around Georgetown that stocks liquid thickeners?", isMe: true, time: "Yesterday" },
    { sender: "Natasha", avatar: "/malay_caregiver.webp", text: "Check out the one near the general hospital, they usually have stock.", isMe: false, time: "Yesterday" },
  ],
  '4': [
    { sender: "Mei Ling", avatar: "/aunty.avif", text: "Mom wandered again last night. The door alarms are a lifesaver.", isMe: false, time: "10:00 AM" },
    { sender: "You", text: "That's so stressful. What kind of alarm are you using?", isMe: true, time: "10:05 AM" },
  ],
  'bakery': [
    { sender: "Satiyah", avatar: "/india.webp", text: "Made some sugar-free cookies for the weekend. Trying to keep the carbs low!", isMe: false, time: "Friday" },
    { sender: "Natasha", avatar: "/malay_caregiver.webp", text: "Ooh, recipe please! 🤤", isMe: false, time: "Friday" },
  ]
};

export default function CommunityPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState("community");
  const [activeChatGroupId, setActiveChatGroupId] = useState<string | null>(null);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [isRequestingHelp, setIsRequestingHelp] = useState(false);
  const [feedFilter, setFeedFilter] = useState<"all" | "help">("all");

  const [groupPhoto, setGroupPhoto] = useState<string | null>(null);
  const [postPhotos, setPostPhotos] = useState<string[]>([]);
  
  const groupPhotoInputRef = useRef<HTMLInputElement>(null);
  const postPhotoInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string | null>>) => {
    if (e.target.files && e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      setter(url);
    }
  };

  const handleMultiplePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const urls = Array.from(e.target.files).map(f => URL.createObjectURL(f));
      setPostPhotos(prev => [...prev, ...urls]);
    }
  };

  const activeChatData = activeChatGroupId ? communityGroups.find(g => g.id === activeChatGroupId) : null;
  const activeMessages = activeChatGroupId ? (mockChats[activeChatGroupId] || []) : [];

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
          <header className="sticky top-0 z-20 bg-black/40 backdrop-blur-3xl border-b border-white/10 flex items-center justify-between px-6 py-4 pt-14">
            <h1 className="text-2xl font-bold tracking-tight text-white drop-shadow-md">
              Community
            </h1>
            <div className="flex gap-4">
              <button onClick={() => setIsRequestingHelp(true)} className="text-amber-400 hover:text-amber-300 transition-transform active:scale-90 flex items-center justify-center bg-amber-500/10 h-8 w-8 rounded-full border border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>
              </button>
              <button onClick={() => setIsCreatingPost(true)} className="text-white/80 hover:text-white transition-transform active:scale-90">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14" />
                  <path d="M5 12h14" />
                </svg>
              </button>
            </div>
          </header>

          {/* Group Chat Communities (Stories Style) */}
          <div className="w-full border-b border-white/5 bg-black/10 backdrop-blur-md pt-4 pb-2">
            <div className="flex gap-4 overflow-x-auto scrollbar-hide px-4 pb-2">
              {communityGroups.map((group) => (
                <div 
                  key={group.id} 
                  onClick={() => {
                    if (group.id === 'add') setIsCreatingGroup(true);
                    else setActiveChatGroupId(group.id);
                  }} 
                  className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer group"
                >
                  <div className={`p-[2px] rounded-full bg-gradient-to-tr ${group.color} transition-transform group-active:scale-95 shadow-[0_0_15px_rgba(255,255,255,0.1)]`}>
                    <div className="h-16 w-16 rounded-full bg-[#121212] flex items-center justify-center border-2 border-black relative overflow-hidden shadow-[inset_0_1px_5px_rgba(255,255,255,0.1)]">
                      <div className="absolute inset-0 bg-white/5" />
                      {(group as any).image ? (
                        <img src={(group as any).image} alt={group.name} className={`h-full w-full object-cover z-10 ${(group as any).imagePosition || 'object-center'}`} />
                      ) : (
                        <span className="text-3xl drop-shadow-md z-10">{group.icon}</span>
                      )}
                    </div>
                  </div>
                  <span className="text-[11px] font-medium text-white/80 tracking-wide">{group.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Feed Filter Segmented Control */}
          <div className="px-4 pt-4 pb-2">
            <div className="flex p-1 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]">
              <button 
                onClick={() => setFeedFilter("all")}
                className={`flex-1 py-2 text-[13px] font-bold rounded-full transition-all duration-300 ${feedFilter === "all" ? "bg-white/15 text-white shadow-sm border border-white/10" : "text-white/50 hover:text-white/80"}`}
              >
                All Posts
              </button>
              <button 
                onClick={() => setFeedFilter("help")}
                className={`flex-1 py-2 text-[13px] font-bold rounded-full transition-all duration-300 flex items-center justify-center gap-1.5 ${feedFilter === "help" ? "bg-amber-500/20 text-amber-400 shadow-[inset_0_1px_2px_rgba(255,255,255,0.1)] border border-amber-500/30" : "text-white/50 hover:text-amber-400/70"}`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>
                Shift Covers
              </button>
            </div>
          </div>

          {/* Feed */}
          <div className="px-4 py-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {mockPosts
              .filter(post => feedFilter === "all" ? true : post.type === "help")
              .map((post) => (
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

        {/* Chat Overlay */}
        {activeChatGroupId && activeChatData && (
          <div className="absolute inset-0 z-[100] flex flex-col bg-black/90 backdrop-blur-3xl animate-in slide-in-from-bottom duration-300">
            {/* Chat Header */}
            <header className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10 pt-12 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
              <div className="flex items-center gap-3">
                <button onClick={() => setActiveChatGroupId(null)} className="p-2 -ml-2 text-white/80 hover:text-white transition-colors">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m15 18-6-6 6-6"/>
                  </svg>
                </button>
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-full bg-gradient-to-tr ${activeChatData.color} p-[2px]`}>
                    <img src={(activeChatData as any).image} alt="" className="h-full w-full rounded-full object-cover" />
                  </div>
                  <div>
                    <h2 className="text-white font-bold text-sm tracking-wide">{activeChatData.name}</h2>
                    <p className="text-[10px] text-white/50">{activeMessages.length + 5} participants</p>
                  </div>
                </div>
              </div>
              <button className="p-2 text-white/80 hover:text-white">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
              </button>
            </header>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide pb-24">
              <div className="text-center">
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider bg-white/5 px-3 py-1 rounded-full border border-white/5">
                  Today
                </span>
              </div>
              
              {activeMessages.map((msg, i) => (
                <div key={i} className={`flex w-full ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex gap-2 max-w-[80%] ${msg.isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                    {!msg.isMe && msg.avatar && (
                      <img src={msg.avatar} alt="" className="h-8 w-8 rounded-full object-cover shrink-0 mt-auto shadow-sm" />
                    )}
                    <div className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}>
                      {!msg.isMe && (
                        <span className="text-[11px] font-medium text-white/50 ml-1 mb-1">{msg.sender}</span>
                      )}
                      <div className={`px-4 py-2.5 rounded-2xl ${msg.isMe ? 'bg-gradient-to-br from-pink-500 to-rose-600 text-white rounded-br-sm shadow-[0_4px_15px_rgba(244,114,182,0.3)]' : 'bg-white/10 backdrop-blur-md text-white/90 rounded-bl-sm border border-white/10 shadow-sm'}`}>
                        <p className="text-sm leading-snug">{msg.text}</p>
                      </div>
                      <span className="text-[10px] text-white/40 mt-1">{msg.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Chat Input */}
            <div className="absolute bottom-0 inset-x-0 p-4 bg-black/60 border-t border-white/10 backdrop-blur-xl pb-8 z-10">
              <div className="flex items-center gap-2">
                <button className="p-2 text-white/50 hover:text-white transition-colors shrink-0">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
                </button>
                <div className="flex-1 relative">
                  <input type="text" placeholder="Message..." className="w-full bg-white/10 border border-white/10 rounded-full pl-4 pr-10 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-white/30 focus:bg-white/15 transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]" />
                  <button className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 bg-pink-500 hover:bg-pink-400 transition-colors rounded-full text-white shadow-md">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Group Overlay */}
        {isCreatingGroup && (
          <div className="absolute inset-0 z-[100] flex flex-col bg-black/90 backdrop-blur-3xl animate-in slide-in-from-bottom duration-300">
            {/* Header */}
            <header className="flex items-center justify-between px-6 py-4 bg-white/5 border-b border-white/10 pt-14 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
              <button onClick={() => setIsCreatingGroup(false)} className="text-white/60 hover:text-white transition-colors text-sm font-medium">
                Cancel
              </button>
              <h2 className="text-white font-bold text-base tracking-wide">New Group</h2>
              <div className="w-12" /> {/* Spacer for centering */}
            </header>

            {/* Form */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-32 scrollbar-hide">
              {/* Image Upload Area */}
              <div className="flex flex-col items-center gap-3">
                <input type="file" ref={groupPhotoInputRef} hidden accept="image/*" onChange={e => handlePhotoUpload(e, setGroupPhoto)} />
                <div 
                  onClick={() => groupPhotoInputRef.current?.click()}
                  className="h-28 w-28 rounded-full border-2 border-dashed border-white/20 bg-white/5 flex items-center justify-center cursor-pointer hover:bg-white/10 transition-colors shadow-[inset_0_4px_20px_rgba(0,0,0,0.4)] overflow-hidden"
                >
                  {groupPhoto ? (
                    <img src={groupPhoto} alt="Group" className="h-full w-full object-cover" />
                  ) : (
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/40">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21"/>
                    </svg>
                  )}
                </div>
                <span className="text-xs text-white/50 font-medium tracking-wide">Add Group Photo</span>
              </div>

              {/* Inputs */}
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-white/40 uppercase tracking-wider pl-1">Group Name</label>
                  <input type="text" placeholder="e.g., Weekend Respite Care" className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-white/30 focus:outline-none focus:border-yellow-400/50 focus:bg-white/10 transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]" />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-white/40 uppercase tracking-wider pl-1">Category</label>
                  <div className="relative">
                    <select className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white focus:outline-none focus:border-yellow-400/50 focus:bg-white/10 transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] appearance-none">
                      <option value="" className="bg-slate-900">Select a category...</option>
                      <option value="medical" className="bg-slate-900">Medical Support</option>
                      <option value="casual" className="bg-slate-900">Casual / Social</option>
                      <option value="local" className="bg-slate-900">Local Meetups</option>
                      <option value="advice" className="bg-slate-900">Tips & Advice</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/40">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-white/40 uppercase tracking-wider pl-1">Description</label>
                  <textarea placeholder="What is this group about?" rows={4} className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-white/30 focus:outline-none focus:border-yellow-400/50 focus:bg-white/10 transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] resize-none" />
                </div>
              </div>
            </div>

            {/* Footer Action */}
            <div className="absolute bottom-0 inset-x-0 p-6 bg-black/60 border-t border-white/10 backdrop-blur-xl z-10">
              <button 
                onClick={() => setIsCreatingGroup(false)}
                className="w-full bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-bold text-[15px] py-4 rounded-2xl shadow-[0_0_20px_rgba(250,204,21,0.3)] transition-all active:scale-[0.98]"
              >
                Create Group
              </button>
            </div>
          </div>
        )}

        {/* Create Post Overlay */}
        {isCreatingPost && (
          <div className="absolute inset-0 z-[100] flex flex-col bg-black/90 backdrop-blur-3xl animate-in slide-in-from-bottom duration-300">
            {/* Header */}
            <header className="flex items-center justify-between px-6 py-4 bg-white/5 border-b border-white/10 pt-14 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
              <button onClick={() => setIsCreatingPost(false)} className="text-white/60 hover:text-white transition-colors text-sm font-medium">
                Cancel
              </button>
              <h2 className="text-white font-bold text-base tracking-wide">New Post</h2>
              <div className="w-12 text-right">
                <button 
                  onClick={() => setIsCreatingPost(false)}
                  className="text-yellow-400 font-bold text-[15px] hover:text-yellow-300 transition-colors drop-shadow-[0_0_8px_rgba(250,204,21,0.3)]"
                >
                  Post
                </button>
              </div>
            </header>

            {/* Form */}
            <div className="flex-1 p-6 space-y-6 flex flex-col">
              {/* User Info */}
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-full p-[2px] border border-white/20 shadow-[inset_0_2px_10px_rgba(255,255,255,0.1)]">
                  <img src="/avatar.jpg" alt="Angel" className="h-full w-full rounded-full object-cover" />
                </div>
                <span className="text-white font-bold text-[15px] tracking-wide">Angel</span>
              </div>
              
              {/* Text Input */}
              <textarea 
                placeholder="Share your caregiving journey, ask a question, or post an update..." 
                rows={6} 
                autoFocus
                className="w-full bg-transparent text-white text-[17px] placeholder:text-white/30 focus:outline-none resize-none leading-relaxed flex-shrink-0" 
              />
              
              {/* Photo Upload Area (Shopee/Instagram Style) */}
              <div>
                <input type="file" ref={postPhotoInputRef} hidden multiple accept="image/*" onChange={handleMultiplePhotoUpload} />
                <div className="flex flex-wrap gap-3">
                  {postPhotos.map((url, idx) => (
                    <div key={idx} className="relative h-24 w-24 shrink-0 rounded-xl overflow-hidden border border-white/10 shadow-sm animate-in zoom-in-95 duration-200">
                      <img src={url} alt={`preview ${idx}`} className="h-full w-full object-cover" />
                      <button 
                        onClick={() => setPostPhotos(prev => prev.filter((_, i) => i !== idx))}
                        className="absolute top-1 right-1 p-1 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-black/80 transition-colors"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                      </button>
                    </div>
                  ))}
                  
                  {/* Add Photo Tile */}
                  <button 
                    onClick={() => postPhotoInputRef.current?.click()}
                    className="h-24 w-24 shrink-0 rounded-xl border border-dashed border-white/30 bg-white/5 hover:bg-white/10 flex flex-col items-center justify-center gap-1.5 transition-colors"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/60"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                    <span className="text-[10px] font-medium text-white/60">{postPhotos.length > 0 ? "Add More" : "Add Photo"}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Request Help Overlay */}
        {isRequestingHelp && (
          <div className="absolute inset-0 z-[100] flex flex-col bg-black/90 backdrop-blur-3xl animate-in slide-in-from-bottom duration-300">
            {/* Header */}
            <header className="flex items-center justify-between px-6 py-4 bg-amber-500/10 border-b border-amber-500/20 pt-14 shadow-[0_4px_30px_rgba(245,158,11,0.1)]">
              <button onClick={() => setIsRequestingHelp(false)} className="text-amber-100 hover:text-white transition-colors text-sm font-medium">
                Cancel
              </button>
              <h2 className="text-amber-400 font-bold text-base tracking-wide flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                Request Cover
              </h2>
              <div className="w-12 text-right" />
            </header>

            {/* Form */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-32 scrollbar-hide">
              {/* User Reputation Preview */}
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 flex items-center gap-4">
                <div className="h-12 w-12 rounded-full p-[2px] border border-amber-500/30">
                  <img src="/avatar.jpg" alt="Angel" className="h-full w-full rounded-full object-cover" />
                </div>
                <div>
                  <p className="text-xs text-amber-200/70 uppercase tracking-widest font-bold mb-0.5">Your Trust Rating</p>
                  <p className="text-[15px] font-bold text-amber-400 flex items-center gap-1.5">
                    ⭐ 5.0 <span className="text-xs text-amber-400/60 font-medium">(Senior Caregiver)</span>
                  </p>
                </div>
              </div>

              {/* Form Inputs */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-white/40 uppercase tracking-wider pl-1">Date</label>
                    <input type="date" className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white focus:outline-none focus:border-amber-400/50 transition-all appearance-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-white/40 uppercase tracking-wider pl-1">Time</label>
                    <input type="time" className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white focus:outline-none focus:border-amber-400/50 transition-all appearance-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-white/40 uppercase tracking-wider pl-1">Location</label>
                  <input type="text" placeholder="e.g., Bayan Lepas, Penang" className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-white/30 focus:outline-none focus:border-amber-400/50 transition-all" />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2 col-span-1">
                    <label className="text-[11px] font-bold text-white/40 uppercase tracking-wider pl-1">Age</label>
                    <input type="number" placeholder="72" className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-white/30 focus:outline-none focus:border-amber-400/50 transition-all" />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <label className="text-[11px] font-bold text-white/40 uppercase tracking-wider pl-1">Main Condition</label>
                    <input type="text" placeholder="e.g., Dementia Stage 2" className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-white/30 focus:outline-none focus:border-amber-400/50 transition-all" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-white/40 uppercase tracking-wider pl-1">Specific Needs / Details</label>
                  <textarea placeholder="Any specific instructions for the shift..." rows={4} className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-white/30 focus:outline-none focus:border-amber-400/50 transition-all resize-none" />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="absolute bottom-0 inset-x-0 p-6 bg-black/60 border-t border-white/10 backdrop-blur-xl z-10">
              <button 
                onClick={() => setIsRequestingHelp(false)}
                className="w-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-bold text-[15px] py-4 rounded-2xl shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all active:scale-[0.98]"
              >
                Post Request
              </button>
            </div>
          </div>
        )}

      </div>
    </IPhone13Frame>
  );
}
