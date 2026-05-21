"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

type RangeType = "week" | "month" | "3month" | "custom";

interface ActivityChartProps {
  /** Pass the same rangedSessions length from the parent to decide empty vs data state */
  sessionCount: number;
  loading?: boolean;
}

// Ghost bar heights (%) — mimic a real bar chart silhouette
const GHOST_BARS = [
  { height: 72, pink: true },
  { height: 38, pink: false },
  { height: 55, pink: false },
  { height: 90, pink: true },
  { height: 45, pink: false },
  { height: 30, pink: false },
  { height: 62, pink: true },
];

export default function ActivityChart({ sessionCount, loading = false }: ActivityChartProps) {
  const router = useRouter();
  const [range, setRange] = useState<RangeType>("week");

  const isEmpty = !loading && sessionCount === 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#EBEBEB] p-5 w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[#0A0A0B] text-base font-semibold">Activity Chart</h2>

        {/* Week dropdown */}
        <div className="relative">
          <select
            value={range}
            onChange={(e) => setRange(e.target.value as RangeType)}
            className="appearance-none rounded-lg border border-[#D8D8D8] bg-[#F5F5F5] pl-3 pr-7 py-1.5 text-[13px] font-medium text-[#151517] focus:outline-none cursor-pointer"
          >
            <option value="week">Week</option>
            <option value="month">Month</option>
            <option value="3month">3 Months</option>
            <option value="custom">Custom</option>
          </select>
          {/* Chevron */}
          <svg
            className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2"
            width="12" height="12" viewBox="0 0 12 12" fill="none"
          >
            <path d="M2.5 4.5L6 8L9.5 4.5" stroke="#555" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* Body */}
      {loading ? (
        <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
          Loading…
        </div>
      ) : isEmpty ? (
        /* ── Empty state ───────────────────────────────────────────── */
        <div className="relative flex flex-col items-center justify-center py-6 overflow-hidden" style={{ minHeight: 220 }}>

          {/* Ghost bar chart in background */}
          <div
            className="absolute inset-0 flex items-end justify-around px-6 pb-4 pointer-events-none"
            aria-hidden="true"
          >
            {GHOST_BARS.map((bar, i) => (
              <div
                key={i}
                className="rounded-t-md flex-1 mx-1"
                style={{
                  height: `${bar.height}%`,
                  background: bar.pink
                    ? "rgba(255, 180, 180, 0.35)"
                    : "transparent",
                  border: bar.pink ? "none" : "1.5px dashed #D0CCC4",
                }}
              />
            ))}
          </div>

          {/* Overlay content */}
          <div className="relative z-10 flex flex-col items-center gap-3 text-center">
            {/* Calendar icon pill */}
            <div
              className="flex items-center justify-center rounded-2xl"
              style={{
                width: 52,
                height: 52,
                background: "#F0EFED",
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="5" width="18" height="16" rx="3" stroke="#8E8E93" strokeWidth="1.6" />
                <path d="M3 10H21" stroke="#8E8E93" strokeWidth="1.6" strokeLinecap="round" />
                <path d="M8 3V7" stroke="#8E8E93" strokeWidth="1.6" strokeLinecap="round" />
                <path d="M16 3V7" stroke="#8E8E93" strokeWidth="1.6" strokeLinecap="round" />
                <rect x="7" y="13" width="3" height="3" rx="0.5" fill="#8E8E93" opacity="0.5" />
              </svg>
            </div>

            {/* Text */}
            <div>
              <p className="text-[#0A0A0B] font-bold text-sm sm:text-base leading-snug">
                No activity recorded yet
              </p>
              <p className="text-[#8E8E93] text-xs sm:text-sm mt-1 max-w-[200px] leading-relaxed">
                Start practicing to generate your weekly activity insights.
              </p>
            </div>

            {/* CTA */}
            <button
              onClick={() => router.push("/lessons")}
              className="mt-1 flex items-center gap-2 bg-[#F5C518] hover:bg-[#e8b800] active:bg-[#d4a800] transition-colors duration-200 text-[#1A1A1A] text-sm font-bold px-6 py-2.5 rounded-full shadow-sm"
            >
              Start Practice
              <span className="text-sm">›</span>
            </button>
          </div>
        </div>
      ) : (
        /* ── Real chart goes here when data exists ──────────────────── */
        <div className="flex items-end justify-around gap-1 h-48 px-2">
          {/* Replace with your real BarChart / Recharts component */}
          <p className="text-gray-400 text-sm self-center">Chart renders here</p>
        </div>
      )}
    </div>
  );
}