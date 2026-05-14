"use client";

import React, { useId } from "react";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AnalyticsSnapshot } from "./types";
import {
  ANALYSIS_PLUM,
  ANALYSIS_PLUM_DEEP,
  premiumAnalysisCard,
  analysisLabelPlum,
} from "./PianoAnalysisChrome";

type Props = {
  snapshot: AnalyticsSnapshot;
};

function shortLabel(s: string, max = 18) {
  if (s.length <= max) return s;
  return `${s.slice(0, max)}…`;
}

/** Mistake pressure + score trend — plum series, minimal chrome */
export function AiReviewCharts({ snapshot }: Props) {
  const chartId = useId().replace(/:/g, "");
  const areaGradId = `score-area-${chartId}`;

  const lessonBars = Object.entries(snapshot.scoresByLesson)
    .slice(0, 8)
    .map(([name, v]) => ({
      name: shortLabel(name.replace(/ · /g, " — "), 22),
      mistakePressure: Math.max(0, 100 - v.avgScore),
      avg: v.avgScore,
      sessions: v.sessions,
    }));

  const chronological = [...snapshot.recentScores].reverse();
  const lineMerge = chronological.map((r, idx) => ({
    pass: idx + 1,
    score: r.score,
  }));

  const axisMuted = "#7a756f";

  return (
    <div className={`${premiumAnalysisCard} p-5 md:p-6`}>
      <p className={`mb-1 ${analysisLabelPlum}`}>Charts</p>
      <p className="mb-6 text-sm text-neutral-600">Pressure by piece · recent scores</p>
      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <h3 className="mb-1 text-sm font-bold text-black">Mistake pressure</h3>
          <p className="mb-3 text-xs text-neutral-500">Taller bars = more room to improve.</p>
          <div className="h-56 w-full">
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
          </div>
        </div>

        <div>
          <h3 className="mb-1 text-sm font-bold text-black">Session scores</h3>
          <p className="mb-3 text-xs text-neutral-500">Latest on the right.</p>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={lineMerge} margin={{ left: 4, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id={areaGradId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={ANALYSIS_PLUM} stopOpacity={0.28} />
                    <stop offset="100%" stopColor={ANALYSIS_PLUM} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#0000000d" />
                <XAxis dataKey="pass" tick={{ fontSize: 11, fill: axisMuted }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: axisMuted }} />
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
                  stroke={ANALYSIS_PLUM}
                  strokeWidth={2}
                  dot={{ r: 3.5, fill: "#f0b429", stroke: ANALYSIS_PLUM_DEEP, strokeWidth: 1 }}
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
