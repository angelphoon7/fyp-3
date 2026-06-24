"use client";

import { useEffect, useRef } from "react";

const ITEM_H  = 44;
const VISIBLE = 5;
export const PICKER_H = ITEM_H * VISIBLE;

export function ScrollPickerColumn({ items, displayItems, value, onChange }: {
  items: string[];
  displayItems?: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const idx = items.indexOf(value);
    if (ref.current && idx >= 0) ref.current.scrollTop = idx * ITEM_H;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleScroll = () => {
    if (!ref.current) return;
    const idx = Math.round(ref.current.scrollTop / ITEM_H);
    const v = items[Math.max(0, Math.min(items.length - 1, idx))];
    if (v && v !== value) onChange(v);
  };

  return (
    <div style={{ position: "relative", width: "100%", height: PICKER_H, flexShrink: 0, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 4, right: 4, top: ITEM_H * 2, height: ITEM_H, background: "rgba(255,255,255,0.12)", borderRadius: 10, pointerEvents: "none", zIndex: 1 }} />
      <div
        ref={ref}
        onScroll={handleScroll}
        style={{
          width: "100%", height: "100%",
          overflowY: "scroll",
          scrollSnapType: "y mandatory",
          WebkitOverflowScrolling: "touch",
          paddingTop: ITEM_H * 2, paddingBottom: ITEM_H * 2,
          boxSizing: "border-box",
          scrollbarWidth: "none",
        } as React.CSSProperties}
      >
        {items.map((item, i) => (
          <div key={item} style={{ height: ITEM_H, scrollSnapAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 17, fontWeight: 600, userSelect: "none" }}>
            {displayItems ? displayItems[i] : item}
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: ITEM_H * 2, background: "linear-gradient(to bottom,#111 10%,transparent 100%)", pointerEvents: "none", zIndex: 2 }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: ITEM_H * 2, background: "linear-gradient(to top,#111 10%,transparent 100%)", pointerEvents: "none", zIndex: 2 }} />
    </div>
  );
}
