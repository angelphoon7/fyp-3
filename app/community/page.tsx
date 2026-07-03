"use client";

import React, { useState, useRef, useEffect } from "react";
import IPhone13Frame from "@/components/iPhone13Frame";
import { useRouter, usePathname } from "next/navigation";
import { save, load, hydrate, KEYS } from "@/app/lib/store";
import PixelSnow from "../onboarding/PixelSnow";
import Dock from "../home/bottom widget/Dock";
import PostCard, { PostProps } from "./PostCard";
import { ScrollPickerColumn, PICKER_H } from "@/components/ScrollPickerColumn";

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
    imageUrl: "/india.png",
    caption: "Tried out a traditional Ayurvedic oil massage for my patient's stiff joints today. It really seemed to soothe the pain and help with mobility! Does anyone else incorporate traditional remedies into their care routine? 🌿✨",
    likes: 12,
    comments: [
      { id: "c4", user: "Mei Ling", text: "That's wonderful! I use some herbal patches for my dad's knees, they help a lot." }
    ]
  },
  {
    id: "4",
    user: {
      name: "Ahmad Family",
      avatar: "/avatar.jpg",
      trustRating: "⭐ 5.0 (New)"
    },
    time: "2 hours ago",
    type: "help",
    helpDetails: {
      date: "Sat, Nov 14",
      time: "08:00 AM - 02:00 PM",
      location: "Bayan Lepas, Penang",
      patientAge: "72",
      condition: "Dementia (Stage 2) • Mobility Assist"
    },
    caption: "Need someone to cover our morning shift this weekend. Very calm patient, just needs help with breakfast and light walking.",
    likes: 5,
    comments: []
  }
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
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [isRequestingHelp, setIsRequestingHelp] = useState(false);
  const [feedFilter, setFeedFilter] = useState<"all" | "help">("all");

  const [posts, setPosts] = useState<PostProps[]>(mockPosts);
  const [postPhotos, setPostPhotos] = useState<string[]>([]);
  const [postText, setPostText] = useState("");

  const [reqDay, setReqDay] = useState("");
  const [reqMonth, setReqMonth] = useState("");
  const [reqYear, setReqYear] = useState("");
  const [reqHour, setReqHour] = useState("");
  const [reqMin, setReqMin] = useState("");
  const [reqAmPm, setReqAmPm] = useState("AM");
  const [reqLocation, setReqLocation] = useState("");

  // scroll pickers
  const COM_MONTHS   = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const COM_MONTH_KEYS = ["1","2","3","4","5","6","7","8","9","10","11","12"];
  const COM_YEARS    = ["2025","2026","2027","2028"];
  const COM_HOURS    = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));
  const COM_MINUTES  = ["00","15","30","45"];
  const COM_AMPM     = ["AM","PM"];

  const [comDatePicker, setComDatePicker] = useState<{ day: string; month: string; year: string } | null>(null);
  const [comTimePicker, setComTimePicker] = useState<{ hour: string; minute: string; ampm: string } | null>(null);

  const openComDatePicker = () => {
    const today = new Date();
    setComDatePicker({
      day:   reqDay   || String(today.getDate()).padStart(2, "0"),
      month: reqMonth || String(today.getMonth() + 1),
      year:  reqYear  || String(today.getFullYear()),
    });
  };
  const confirmComDate = () => {
    if (!comDatePicker) return;
    setReqDay(String(Number(comDatePicker.day)));
    setReqMonth(comDatePicker.month);
    setReqYear(comDatePicker.year);
    setComDatePicker(null);
  };

  const openComTimePicker = () => {
    setComTimePicker({
      hour:   reqHour  || "09",
      minute: reqMin   || "00",
      ampm:   reqAmPm  || "AM",
    });
  };
  const confirmComTime = () => {
    if (!comTimePicker) return;
    setReqHour(String(Number(comTimePicker.hour)));
    setReqMin(comTimePicker.minute);
    setReqAmPm(comTimePicker.ampm);
    setComTimePicker(null);
  };

  const comDateLabel = reqDay && reqMonth && reqYear
    ? `${String(reqDay).padStart(2,"0")} ${COM_MONTHS[Number(reqMonth)-1]} ${reqYear}`
    : "Select date";
  const comTimeLabel = reqHour && reqMin
    ? `${String(reqHour).padStart(2,"0")}:${reqMin} ${reqAmPm}`
    : "Select time";
  const [reqAge, setReqAge] = useState("");
  const [reqCondition, setReqCondition] = useState("");
  const [reqDetails, setReqDetails] = useState("");

  const handlePostRequest = () => {
    if (!reqDay || !reqMonth || !reqYear || !reqHour || !reqMin || !reqLocation || !reqAge || !reqCondition) return;
    const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    const dateStr = `${months[Number(reqMonth)-1]} ${reqDay}, ${reqYear}`;
    const timeStr = `${String(reqHour).padStart(2,"0")}:${reqMin} ${reqAmPm}`;
    const newPost: PostProps = {
      id: String(Date.now()),
      user: { name: "Angel", avatar: "", trustRating: undefined },
      time: "Just now",
      type: "help",
      helpDetails: {
        date: dateStr,
        time: timeStr,
        location: reqLocation,
        patientAge: reqAge,
        condition: reqCondition,
      },
      caption: reqDetails || "Looking for shift cover.",
      likes: 0,
      comments: [],
    };
    setPosts(prev => {
      const updated = [newPost, ...prev];
      const userPosts = updated.filter(p => p.type === "help" && p.user.name === "Angel");
      save(KEYS.shiftRequests, userPosts);
      return updated;
    });
    setFeedFilter("help");
    setIsRequestingHelp(false);
    setReqDay(""); setReqMonth(""); setReqYear(""); setReqHour(""); setReqMin(""); setReqAmPm("AM");
    setReqLocation(""); setReqAge(""); setReqCondition(""); setReqDetails("");
  };
  
  useEffect(() => {
    const mockIds = new Set(mockPosts.map(p => p.id));
    // Load from localStorage first (instant, no flash)
    const localShifts = load<PostProps[]>(KEYS.shiftRequests, []);
    const localPosts  = load<PostProps[]>(KEYS.communityPosts, []);
    const localUser = [...localPosts, ...localShifts].filter(p => !mockIds.has(p.id));
    if (localUser.length) {
      setPosts(prev => {
        const prevIds = new Set(prev.map(p => p.id));
        const fresh = localUser.filter(p => !prevIds.has(p.id));
        return fresh.length ? [...fresh, ...prev] : prev;
      });
    }
    // Then sync from Supabase
    hydrate().then(remote => {
      const remoteShifts = (remote[KEYS.shiftRequests] as PostProps[] | undefined) ?? [];
      const remotePosts  = (remote[KEYS.communityPosts] as PostProps[] | undefined) ?? [];
      const allRemote = [...remotePosts, ...remoteShifts].filter(p => !mockIds.has(p.id));
      if (allRemote.length) {
        setPosts(prev => {
          const prevIds = new Set(prev.map(p => p.id));
          const fresh = allRemote.filter(p => !prevIds.has(p.id));
          return fresh.length ? [...fresh, ...prev] : prev;
        });
      }
    });
  }, []);

  const postPhotoInputRef = useRef<HTMLInputElement>(null);

  const handleMultiplePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    Array.from(e.target.files).forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => {
        if (ev.target?.result) setPostPhotos(prev => [...prev, ev.target!.result as string]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const handlePost = () => {
    if (!postText.trim() && postPhotos.length === 0) return;
    const newPost: PostProps = {
      id: String(Date.now()),
      user: { name: "Angel", avatar: "" },
      time: "Just now",
      imageUrl: postPhotos[0],
      caption: postText.trim() || "",
      likes: 0,
      comments: [],
    };
    setPosts(prev => {
      const updated = [newPost, ...prev];
      const mockIds = new Set(mockPosts.map(p => p.id));
      const toSave = updated.filter(p => !mockIds.has(p.id) && p.type !== "help");
      save(KEYS.communityPosts, toSave);
      return updated;
    });
    setPostText("");
    setPostPhotos([]);
    setIsCreatingPost(false);
    setFeedFilter("all");
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
            {posts
              .filter(post => feedFilter === "all" ? post.type !== "help" : post.type === "help")
              .map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onDelete={() => {
                    setPosts(prev => {
                      const updated = prev.filter(p => p.id !== post.id);
                      const mockIds = new Set(mockPosts.map(p => p.id));
                      const toSavePosts = updated.filter(p => !mockIds.has(p.id) && p.type !== "help");
                      const toSaveShifts = updated.filter(p => !mockIds.has(p.id) && p.type === "help");
                      save(KEYS.communityPosts, toSavePosts);
                      save(KEYS.shiftRequests, toSaveShifts);
                      return updated;
                    });
                  }}
                  onLike={(newCount) => {
                    setPosts(prev => {
                      const updated = prev.map(p => p.id === post.id ? { ...p, likes: newCount } : p);
                      const mockIds = new Set(mockPosts.map(p => p.id));
                      const toSavePosts = updated.filter(p => !mockIds.has(p.id) && p.type !== "help");
                      const toSaveShifts = updated.filter(p => !mockIds.has(p.id) && p.type === "help");
                      save(KEYS.communityPosts, toSavePosts);
                      save(KEYS.shiftRequests, toSaveShifts);
                      return updated;
                    });
                  }}
                />
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

        {/* Create Post Overlay */}
        {isCreatingPost && (
          <div className="absolute inset-0 z-[100] flex flex-col bg-black/90 backdrop-blur-3xl animate-in slide-in-from-bottom duration-300">
            {/* Header */}
            <header className="flex items-center justify-between px-6 py-4 bg-white/5 border-b border-white/10 pt-14 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
              <button onClick={() => { setIsCreatingPost(false); setPostText(""); setPostPhotos([]); }} className="text-white/60 hover:text-white transition-colors text-sm font-medium">
                Cancel
              </button>
              <h2 className="text-white font-bold text-base tracking-wide">New Post</h2>
              <div className="w-12 text-right">
                <button
                  onClick={handlePost}
                  disabled={!postText.trim() && postPhotos.length === 0}
                  className="text-yellow-400 font-bold text-[15px] hover:text-yellow-300 transition-colors drop-shadow-[0_0_8px_rgba(250,204,21,0.3)] disabled:opacity-30"
                >
                  Post
                </button>
              </div>
            </header>

            {/* Form */}
            <div className="flex-1 p-6 space-y-6 flex flex-col">
              {/* User Info */}
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-full border border-white/20 shadow-[inset_0_2px_10px_rgba(255,255,255,0.1)] bg-gradient-to-br from-yellow-400/80 to-amber-600/80 flex items-center justify-center">
                  <span className="text-[15px] font-bold text-black/80">A</span>
                </div>
                <span className="text-white font-bold text-[15px] tracking-wide">Angel</span>
              </div>
              
              {/* Text Input */}
              <textarea
                placeholder="Share your caregiving journey, ask a question, or post an update..."
                rows={6}
                autoFocus
                value={postText}
                onChange={e => setPostText(e.target.value)}
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
                <div className="h-12 w-12 rounded-full border border-amber-500/30 bg-gradient-to-br from-yellow-400/80 to-amber-600/80 flex items-center justify-center">
                  <span className="text-[16px] font-bold text-black/80">A</span>
                </div>
                <div>
                  <p className="text-xs text-amber-200/70 uppercase tracking-widest font-bold mb-0.5">Posting as</p>
                  <p className="text-[15px] font-bold text-white">Angel</p>
                </div>
              </div>

              {/* Form Inputs */}
              <div className="space-y-4">
                <div className="space-y-4">
                  {/* Date picker bottom sheet */}
                  {comDatePicker && (() => {
                    const daysInMonth = new Date(Number(comDatePicker.year), Number(comDatePicker.month), 0).getDate();
                    const dayItems = Array.from({ length: daysInMonth }, (_, i) => String(i + 1).padStart(2, "0"));
                    return (
                      <div className="fixed inset-0 z-[200] flex items-end" onClick={() => setComDatePicker(null)}>
                        <div className="w-full bg-[#111] border-t border-white/10 rounded-t-3xl p-5 pb-10 space-y-4 animate-in slide-in-from-bottom-4 duration-200" onClick={e => e.stopPropagation()}>
                          <div className="w-10 h-1 bg-white/20 rounded-full mx-auto" />
                          <p className="text-sm font-bold text-white text-center">Select Date</p>
                          <div style={{ display: "flex", flexDirection: "row", gap: 8, alignItems: "flex-start" }}>
                            {([
                              { label: "Day",   items: dayItems,       display: undefined,  key: "day"   as const },
                              { label: "Month", items: COM_MONTH_KEYS, display: COM_MONTHS, key: "month" as const },
                              { label: "Year",  items: COM_YEARS,      display: undefined,  key: "year"  as const },
                            ] as const).map(col => (
                              <div key={col.key} style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>{col.label}</span>
                                <ScrollPickerColumn
                                  items={col.items as unknown as string[]}
                                  displayItems={col.display as unknown as string[] | undefined}
                                  value={comDatePicker[col.key]}
                                  onChange={v => setComDatePicker(p => p && ({ ...p, [col.key]: v }))}
                                />
                              </div>
                            ))}
                          </div>
                          <button onClick={confirmComDate} className="w-full py-3 rounded-xl bg-amber-400 text-black font-bold text-sm">Confirm</button>
                          <button onClick={() => setComDatePicker(null)} className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white/50 text-sm">Cancel</button>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Time picker bottom sheet */}
                  {comTimePicker && (
                    <div className="fixed inset-0 z-[200] flex items-end" onClick={() => setComTimePicker(null)}>
                      <div className="w-full bg-[#111] border-t border-white/10 rounded-t-3xl p-5 pb-10 space-y-4 animate-in slide-in-from-bottom-4 duration-200" onClick={e => e.stopPropagation()}>
                        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto" />
                        <p className="text-sm font-bold text-white text-center">Select Time</p>
                        <div style={{ display: "flex", flexDirection: "row", gap: 8, alignItems: "flex-start" }}>
                          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>Hour</span>
                            <ScrollPickerColumn items={COM_HOURS} value={comTimePicker.hour} onChange={h => setComTimePicker(p => p && ({ ...p, hour: h }))} />
                          </div>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: PICKER_H, paddingTop: 22, color: "#fff", fontSize: 24, fontWeight: 700 }}>:</div>
                          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>Min</span>
                            <ScrollPickerColumn items={COM_MINUTES} value={comTimePicker.minute} onChange={m => setComTimePicker(p => p && ({ ...p, minute: m }))} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>AM/PM</span>
                            <ScrollPickerColumn items={COM_AMPM} value={comTimePicker.ampm} onChange={a => setComTimePicker(p => p && ({ ...p, ampm: a }))} />
                          </div>
                        </div>
                        <button onClick={confirmComTime} className="w-full py-3 rounded-xl bg-amber-400 text-black font-bold text-sm">Confirm</button>
                        <button onClick={() => setComTimePicker(null)} className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white/50 text-sm">Cancel</button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-white/40 uppercase tracking-wider pl-1">Date</label>
                    <button
                      onClick={openComDatePicker}
                      className="w-full bg-[#1a1a1a] border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-left flex items-center justify-between"
                    >
                      <span className={reqDay && reqMonth && reqYear ? "text-white" : "text-white/30"}>{comDateLabel}</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    </button>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-white/40 uppercase tracking-wider pl-1">Time</label>
                    <button
                      onClick={openComTimePicker}
                      className="w-full bg-[#1a1a1a] border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-left flex items-center justify-between"
                    >
                      <span className={reqHour && reqMin ? "text-white" : "text-white/30"}>{comTimeLabel}</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-white/40 uppercase tracking-wider pl-1">Location</label>
                  <input type="text" value={reqLocation} onChange={e => setReqLocation(e.target.value)} placeholder="e.g., Bayan Lepas, Penang" className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-white/30 focus:outline-none focus:border-amber-400/50 transition-all" />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2 col-span-1">
                    <label className="text-[11px] font-bold text-white/40 uppercase tracking-wider pl-1">Age</label>
                    <input type="number" value={reqAge} onChange={e => setReqAge(e.target.value)} placeholder="72" className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-white/30 focus:outline-none focus:border-amber-400/50 transition-all" />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <label className="text-[11px] font-bold text-white/40 uppercase tracking-wider pl-1">Main Condition</label>
                    <input type="text" value={reqCondition} onChange={e => setReqCondition(e.target.value)} placeholder="e.g., Dementia Stage 2" className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-white/30 focus:outline-none focus:border-amber-400/50 transition-all" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-white/40 uppercase tracking-wider pl-1">Specific Needs / Details</label>
                  <textarea value={reqDetails} onChange={e => setReqDetails(e.target.value)} placeholder="Any specific instructions for the shift..." rows={4} className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-white/30 focus:outline-none focus:border-amber-400/50 transition-all resize-none" />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="absolute bottom-0 inset-x-0 p-6 bg-black/60 border-t border-white/10 backdrop-blur-xl z-10">
              <button
                onClick={handlePostRequest}
                disabled={!reqDay || !reqMonth || !reqYear || !reqHour || !reqMin || !reqLocation || !reqAge || !reqCondition}
                className="w-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-bold text-[15px] py-4 rounded-2xl shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
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
