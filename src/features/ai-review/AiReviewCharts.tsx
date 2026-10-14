"use client";

import React, { useId } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AnalyticsSnapshot } from "./types";
import {
  premiumAnalysisCard,
  analysisLabelPlum,
} from "./PianoAnalysisChrome";

type Props = {
  snapshot: AnalyticsSnapshot;
};

// function shortLabel(s: string, max = 18) {
//   if (s.length <= max) return s;
//   return `${s.slice(0, max)}…`;
// }

/** Mistake pressure + score trend — plum series, minimal chrome */
export function AiReviewCharts({ snapshot }: Props) {
  const chartId = useId().replace(/:/g, "");
  const areaGradId = `score-area-${chartId}`;

  // const lessonBars = Object.entries(snapshot.scoresByLesson)
  //   .slice(0, 8)
  //   .map(([name, v]) => ({
  //     name: shortLabel(name.replace(/ · /g, " — "), 22),
  //     mistakePressure: Math.max(0, 100 - v.avgScore),
  //     avg: v.avgScore,
  //     sessions: v.sessions,
  //   }));

  const chronological = [...snapshot.recentScores].reverse();
  const lineMerge = chronological.map((r, idx) => ({
    pass: idx + 1,
    score: r.score,
  }));

  const axisMuted = "#7a756f";

  return (
    <div className={`${premiumAnalysisCard} p-5 md:p-6 space-y-[20px]`}>
      <p className={`mb-1 ${analysisLabelPlum}`}>SESSION SCORES</p>
      <p className="mt-2 text-[28px] font-semibold font-playfair  text-[#1F1A17]" >Your score in each practice session</p>
      <div className="grid gap-8 lg:grid-cols-1 mt-5">
        {/* <div> */}
          {/* <h3 className="mb-1 text-sm font-bold text-black">Mistake pressure</h3> */}
          {/* <p className="mb-3 text-xs text-neutral-500">Taller bars = more room to improve.</p> */}
          {/* <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={lessonBars} margin={{ left: 4, right: 8, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#0000000d" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: axisMuted }}
                  interval={0}
                  angle={-16}
                  textAnchor="end"
                  height={68}
                />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: axisMuted }} />
                <RTooltip
                  formatter={(value: number, _name: string, item) => {
                    const p = item.payload as { avg?: number; sessions?: number };
                    return [
                      `${value} (avg ${p.avg ?? "—"}%, ${p.sessions ?? "—"} runs)`,
                      "Pressure",
                    ];
                  }}
                />
                <Bar dataKey="mistakePressure" name="Pressure" radius={[8, 8, 0, 0]}>
                  {lessonBars.map((_, i) => (
                    <Cell key={i} fill={i % 2 === 0 ? ANALYSIS_PLUM : ANALYSIS_PLUM_DEEP} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div> */}
        {/* </div> */}

        <div className="w-[100%]">
          {/* <h3 className="mb-1 text-sm font-bold text-black">Session scores</h3>
          <p className="mb-3 text-xs text-neutral-500">Latest on the right.</p> */}
                <div
      role="note"
      className="w-full mb-10 rounded-lg border border-[#EDE3D2] border-l-4 border-l-[#D9B668] bg-[#FAF6EE] px-4 py-3 text-[13px] leading-[1.5] text-[#5D5D5D]"
    >
      <span className="font-semibold font-plus-jakarta-sans text-[14px] text-[#2F291E]">How to read this: </span> 
      <span className=" font-plus-jakarta-sans text-[14px] text-[#2F291E]">each dot is one session, from 1 on the left to your latest on the right. 
      Higher is better. Your best sessions reached 100.</span>
    </div>
          <div className="h-84 w-[100%]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={lineMerge} margin={{ left: 4, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id={areaGradId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#CA9C46" stopOpacity={0.4} />
                    <stop offset="50%"  stopColor="#E5C789" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#FBF7EE" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="#EAE6DD"   horizontalValues={[25, 50, 75]} vertical={false} />
                <XAxis dataKey="pass" tick={{ fontSize: 19, fill: axisMuted, fontFamily: "var(--font-plus-jakarta-sans)" }} axisLine={false}
  tickLine={false} padding={{ left: 20, right: 20 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 19, fill: axisMuted }} axisLine={false}
  tickLine={false} padding={{ top: 20, bottom: 20 }}/>
                <RTooltip />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="none"
                  fill={`url(#${areaGradId})`}
                  fillOpacity={1}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  name="Score"
                  stroke="#A77C2B"
                  strokeWidth={2.8}
                  dot={{ r: 4.5, fill: "#fff", stroke: "#A77C2B", strokeWidth: 2.8 }}
                  activeDot={{ r: 5 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
