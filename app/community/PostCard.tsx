"use client";

import React, { useState } from "react";

export interface Comment {
  id: string;
  user: string;
  text: string;
}

export interface PostProps {
  id: string;
  user: {
    name: string;
    avatar: string;
  };
  time: string;
  imageUrl: string;
  caption: string;
  likes: number;
  comments: Comment[];
}

export default function PostCard({ post }: { post: PostProps }) {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [showComments, setShowComments] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikeCount(prev => (isLiked ? prev - 1 : prev + 1));
  };

  return (
    <div className="mb-6 rounded-[32px] border border-white/30 bg-white/10 p-4 backdrop-blur-[40px] backdrop-saturate-150 shadow-[0_16px_40px_rgba(0,0,0,0.4),inset_0_1px_2px_rgba(255,255,255,0.4)] transition-all">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 overflow-hidden rounded-full border border-white/40 shadow-[0_0_10px_rgba(255,255,255,0.2)]">
            <img src={post.user.avatar} alt={post.user.name} className="h-full w-full object-cover" />
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-white drop-shadow-md">{post.user.name}</h3>
            <p className="text-xs text-white/50">{post.time}</p>
          </div>
        </div>
        <button className="text-white/50 hover:text-white transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="1" />
            <circle cx="19" cy="12" r="1" />
            <circle cx="5" cy="12" r="1" />
          </svg>
        </button>
      </div>

      {/* Image Container */}
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl border border-white/20 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] bg-black/20">
        <img 
          src={post.imageUrl} 
          alt="Post content" 
          className="h-full w-full object-cover"
          onDoubleClick={handleLike}
        />
        {/* Heart Animation overlay on double click could go here */}
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between mt-4 px-2">
        <div className="flex items-center gap-4">
          <button onClick={handleLike} className="group transition-transform active:scale-90">
            <svg 
              width="26" height="26" viewBox="0 0 24 24" 
              fill={isLiked ? "#ef4444" : "none"} 
              stroke={isLiked ? "#ef4444" : "currentColor"} 
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className={`transition-colors duration-300 ${isLiked ? 'drop-shadow-[0_0_12px_rgba(239,68,68,0.8)]' : 'text-white/80 group-hover:text-white'}`}
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
          <button onClick={() => setShowComments(!showComments)} className="group transition-transform active:scale-90 text-white/80 hover:text-white">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
          </button>
          <button className="group transition-transform active:scale-90 text-white/80 hover:text-white">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2 11 13" />
              <path d="m22 2-7 20-4-9-9-4 20-7z" />
            </svg>
          </button>
        </div>
        <button onClick={() => setIsSaved(!isSaved)} className="group transition-transform active:scale-90">
          <svg 
            width="24" height="24" viewBox="0 0 24 24" 
            fill={isSaved ? "white" : "none"} 
            stroke="currentColor" 
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className={`transition-colors duration-300 ${isSaved ? 'text-white' : 'text-white/80 group-hover:text-white'}`}
          >
            <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
          </svg>
        </button>
      </div>

      {/* Likes */}
      <div className="px-2 mt-3 text-sm font-bold text-white drop-shadow-md">
        {likeCount.toLocaleString()} likes
      </div>

      {/* Caption */}
      <div className="px-2 mt-1 text-[14px] text-white/90">
        <span className="font-bold text-white mr-2">{post.user.name}</span>
        {post.caption}
      </div>

      {/* Comments Section */}
      <div className="px-2 mt-2">
        {post.comments.length > 0 && !showComments && (
          <button onClick={() => setShowComments(true)} className="text-sm text-white/50 hover:text-white/80 transition-colors">
            View all {post.comments.length} comments
          </button>
        )}
        
        {showComments && (
          <div className="mt-3 space-y-2 animate-in slide-in-from-top-2 fade-in duration-300">
            {post.comments.map(comment => (
              <div key={comment.id} className="text-[13px] leading-tight text-white/80">
                <span className="font-bold text-white mr-2">{comment.user}</span>
                {comment.text}
              </div>
            ))}
            
            <div className="mt-4 flex items-center gap-3">
              <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-yellow-400 to-orange-500 overflow-hidden border border-white/20">
                <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" alt="You" className="h-full w-full object-cover" />
              </div>
              <input 
                type="text" 
                placeholder="Add a comment..." 
                className="flex-1 bg-transparent text-sm text-white placeholder-white/40 outline-none"
              />
              <button className="text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors">Post</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
