"use client";
import { useEffect, useMemo, useState } from "react";
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  CartesianGrid,
} from "recharts";
import { getSessions, PracticeSession } from "@/datastore/sessionstorage";
import { useRouter } from "next/navigation";

// ── Ghost data to render faded chart behind empty state ──────────────────
const GHOST_DATA = [
  { date: "05/22/2025", score: 35 },
  { date: "05/23/2025", score: 78 },
  { date: "05/24/2025", score: 57 },
  { date: "05/25/2025", score: 55 },
  { date: "06/26/2025", score: 60 },
  { date: "05/27/2025", score: 65 },
  { date: "05/28/2025", score: 80 },
  { date: "05/29/2025", score: 90 },
];

export default function SASRReport() {
  const router = useRouter();
  const [sessions, setSessions] = useState<PracticeSession[]>([]);

  useEffect(() => {
    const data = getSessions();
    setSessions(data);
  }, []);

  function formatDate(timestamp: number) {
    const d = new Date(timestamp);
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const year = d.getFullYear();
    return `${month}/${day}/${year}`;
  }

  const chartData = useMemo(() => {
    const dailyMap: Record<string, { total: number; count: number }> = {};
    const sasrSessions = sessions.filter(
      (s) => s.lesson?.source?.toUpperCase() === "SASR"
    );
    sasrSessions.forEach((session) => {
      const dateKey = formatDate(session.endedAt);
      const score = session.performance.score;
      if (!dailyMap[dateKey]) dailyMap[dateKey] = { total: 0, count: 0 };
      dailyMap[dateKey].total += score;
      dailyMap[dateKey].count += 1;
    });
    const result = Object.entries(dailyMap).map(([date, info]) => ({
      date,
      score: Math.round(info.total / info.count),
    }));
    result.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    return result;
  }, [sessions]);

  // ── Empty State ────────────────────────────────────────────────────────
  if (chartData.length === 0) {
    return (
      <div className="relative w-full h-full min-h-[250px]">
        {/* Ghost chart — faded in background */}
        <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.18 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={GHOST_DATA}>
              <defs>
                <linearGradient id="ghostGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="2%" stopColor="#000000B2" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#000000B2" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis 
  dataKey="date" 
  tick={(props) => {
    const { x, y, payload } = props;
    return (
      <text x={x} y={y} dy={16} textAnchor="middle" fill="#1A1A1A" fontSize={12}>
        {payload.value}
      </text>
    );
  }}
/>

<YAxis 
  domain={[0, 100]}
  tick={(props) => {
    const { x, y, payload } = props;
    return (
      <text x={x} y={y} dy={4} textAnchor="end" fill="#1A1A1A" fontSize={12}>
        {payload.value}
      </text>
    );
  }}
/>
              <CartesianGrid strokeDasharray="6 6" opacity={0.4} />
              <Area
                dataKey="score"
                type="monotone"
                stroke="#581845"
                fill="url(#ghostGrad)"
                strokeWidth={2}
                strokeDasharray="6 4"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Overlay content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-4">
          {/* Floating decorations */}
          <div className="relative w-full flex items-center justify-center">
            {/* Sparkle top-left */}
            <svg
              className="absolute"
              style={{ left: "20%", top: "-48px" }}
              width="18" height="18" viewBox="0 0 18 18" fill="none"
            >
              <path d="M9 0 L10.2 6.8 L17 9 L10.2 11.2 L9 18 L7.8 11.2 L1 9 L7.8 6.8 Z" fill="#7C3F6B" opacity="0.5" />
            </svg>
            {/* Musical note left */}
            <svg
              className="absolute"
              style={{ left: "26%", top: "-28px" }}
              width="20" height="22" viewBox="0 0 20 22" fill="none"
            >
              <path d="M7 17V5l10-2v12" stroke="#7C3F6B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.55" />
              <circle cx="5" cy="17" r="2.5" fill="#7C3F6B" opacity="0.55" />
              <circle cx="15" cy="15" r="2.5" fill="#7C3F6B" opacity="0.55" />
            </svg>
            {/* Sparkle top-right */}
            <svg
              className="absolute"
              style={{ right: "22%", top: "-56px" }}
              width="14" height="14" viewBox="0 0 14 14" fill="none"
            >
              <path d="M7 0 L8 5 L13 7 L8 9 L7 14 L6 9 L1 7 L6 5 Z" fill="#7C3F6B" opacity="0.45" />
            </svg>
            {/* Musical note right */}
            <svg
              className="absolute"
              style={{ right: "24%", top: "-30px" }}
              width="18" height="20" viewBox="0 0 18 20" fill="none"
            >
              <path d="M6 15V5l9-2v10" stroke="#7C3F6B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
              <circle cx="4" cy="15" r="2.2" fill="#7C3F6B" opacity="0.5" />
              <circle cx="13" cy="13" r="2.2" fill="#7C3F6B" opacity="0.5" />
            </svg>

            {/* Center circle with music note */}
            <div
              className="flex items-center justify-center rounded-full"
              style={{
                width: 96,
                height: 96,
                background: "rgba(124, 63, 107, 0.12)",
              }}
            >
              <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
                <path
                  d="M18 34V14l18-4v20"
                  stroke="#581845"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="13" cy="34" r="5" fill="#581845" />
                <circle cx="31" cy="30" r="5" fill="#581845" />
              </svg>
            </div>
          </div>

          {/* Text */}
          <div className="text-center mt-2">
            <p className="text-[#0A0A0B] font-bold text-base sm:text-lg leading-snug">
              No SASR score yet
            </p>
            <p className="text-[#7A7A7A] text-sm mt-1 leading-relaxed max-w-[220px] mx-auto">
              Take your first sight-reading assessment to track your progress over time.
            </p>
          </div>

          {/* CTA button */}
          <button
            onClick={() => router.push("/sasr")}
            className="mt-1 flex items-center gap-2 bg-gradient-to-l from-[#FFD700] via-[#FFA500] to-[#FFEC8B] hover:bg-[#e8b800] active:bg-[#d4a800] transition-colors duration-200 text-[#151517] text-sm px-5 py-2.5 rounded-full shadow-sm"
          >
            Start your first test
            <span className="text-[12px] leading-none">▶</span>
          </button>
        </div>
      </div>
    );
  }

  // ── Normal chart ───────────────────────────────────────────────────────
  return (
    <ResponsiveContainer width="100%" height={250}>
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
            <stop offset="2%" stopColor="#581845" stopOpacity={1} />
            <stop offset="100%" stopColor="#581845" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis 
  dataKey="date" 
  tick={(props) => {
    const { x, y, payload } = props;
    return (
      <text x={x} y={y} dy={16} textAnchor="middle" fill="#1A1A1A" fontSize={12}>
        {payload.value}
      </text>
    );
  }}
/>

<YAxis 
  domain={[0, 100]}
  tick={(props) => {
    const { x, y, payload } = props;
    return (
      <text x={x} y={y} dy={4} textAnchor="end" fill="#1A1A1A" fontSize={12}>
        {payload.value}
      </text>
    );
  }}
/>
        <CartesianGrid strokeDasharray="6 6" opacity={0.4} />
        <Tooltip />
        <Area
          dataKey="score"
          type="monotone"
          stroke="#581845"
          fill="url(#colorScore)"
          strokeWidth={2}
          dot={{ r: 4, fill: "#fff", stroke: "#581845", strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}