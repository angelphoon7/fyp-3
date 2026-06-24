"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import IPhone13Frame from "@/components/iPhone13Frame";
import TextType from "./TextType";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const bgPlaylist = ["/caregiver.mp4", "/feed.mp4", "/shirt.mp4"] as const;
  const [bgIndex, setBgIndex] = useState<number>(0);

  const handleVideoEnded = useCallback(() => {
    setBgIndex((i) => (i + 1) % bgPlaylist.length);
  }, [bgPlaylist.length]);

  useEffect(() => {
    const el = videoRefs.current[bgIndex];
    if (el) {
      el.play().catch(() => {});
    }
  }, [bgIndex]);

  const InputIcon = ({ children }: { children: React.ReactNode }) => (
    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/70">
      {children}
    </span>
  );

  return (
    <IPhone13Frame>
    <div className="relative h-dvh w-full flex-1 overflow-hidden bg-black">
      {bgPlaylist.map((src, index) => (
        <video
          key={src}
          ref={(el) => {
            videoRefs.current[index] = el;
          }}
          className={`absolute inset-x-0 top-0 h-[70dvh] w-full object-cover [object-position:center_bottom] transition-opacity duration-1000 [mask-image:linear-gradient(to_bottom,black_60%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,black_60%,transparent_100%)] ${
            index === bgIndex ? "opacity-100" : "opacity-0"
          }`}
          src={src}
          muted
          playsInline
          preload="auto"
          onEnded={index === bgIndex ? handleVideoEnded : undefined}
        />
      ))}

      <div className="pointer-events-none absolute bottom-0 right-0 z-10 h-14 w-24 bg-black/0 sm:h-16 sm:w-28" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-[62dvh] bg-gradient-to-b from-transparent via-black/40 to-black/80" />

      <div className="absolute inset-x-0 bottom-0 z-30 flex flex-col justify-end bg-gradient-to-b from-transparent to-black/40 px-5 pb-8 pt-10 text-white">
        <div className="mx-auto w-full max-w-sm">
          <h1 className="mb-4 flex flex-col justify-end min-h-[80px] text-2xl font-serif font-extrabold text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.65)]">
            <TextType 
              text={["Welcome!"]}
              typingSpeed={50}
              pauseDuration={1500}
              showCursor
              cursorCharacter="|"
              deletingSpeed={30}
              variableSpeed={{ min: 30, max: 80 }}
              cursorBlinkDuration={0.5}
            />
          </h1>

          <form className="space-y-2.5">
            <div className="relative">
              <InputIcon>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <path d="M20 21a8 8 0 1 0-16 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z" stroke="currentColor" strokeWidth="2" />
                </svg>
              </InputIcon>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                placeholder="Username"
                className="h-11 w-full rounded-xl border border-white/18 bg-white/10 pl-11 pr-4 text-[15px] text-white shadow-sm outline-none placeholder:text-white/80 focus:border-white/35 focus:bg-white/20"
              />
            </div>

            <div className="relative">
              <InputIcon>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <path d="M7 11V8a5 5 0 0 1 10 0v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M6 11h12a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="2" />
                </svg>
              </InputIcon>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="Password"
                className="h-11 w-full rounded-xl border border-white/18 bg-white/10 pl-11 pr-11 text-[15px] text-white shadow-sm outline-none placeholder:text-white/80 focus:border-white/35 focus:bg-white/20"
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-white/70 hover:bg-white/10 hover:text-white"
                aria-label="Toggle password visibility"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <path d="M2 12s3.636-7 10-7 10 7 10 7-3.636 7-10 7-10-7-10-7Z" stroke="currentColor" strokeWidth="2" />
                  <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="currentColor" strokeWidth="2" />
                </svg>
              </button>
            </div>

            <div className="flex items-center justify-between pt-1 text-sm drop-shadow-[0_1px_6px_rgba(0,0,0,0.55)]">
              <label className="flex items-center gap-2 text-white/80">
                <input type="checkbox" className="h-4 w-4 rounded border-white/30 bg-white/10 text-white accent-zinc-500" />
                Remember me
              </label>
              <button type="button" className="font-medium text-gray-300 hover:text-white">
                Forgot Password?
              </button>
            </div>

            <button
              type="button"
              onClick={() => router.push("/home")}
              className="mt-2 h-11 w-full rounded-xl bg-yellow-400 text-sm font-extrabold tracking-[0.24em] text-gray-900 shadow-[0_10px_28px_rgba(250,204,21,0.25)] transition-colors hover:bg-yellow-500 active:bg-yellow-600"
            >
              LOGIN
            </button>

            <div className="pt-1 text-center text-sm text-white/70 drop-shadow-[0_1px_6px_rgba(0,0,0,0.55)]">
              Don&apos;t have an account?{" "}
              <button type="button" onClick={() => router.push("/onboarding")} className="font-semibold text-gray-300 hover:text-white">
                Sign up
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
    </IPhone13Frame>
  );
}
