"use client";

import React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AiReviewReport, AnalyticsSnapshot } from "./types";
import { dashboardAnalysisCard } from "./PianoAnalysisChrome";

type Props = {
  snapshot: AnalyticsSnapshot;
  report: AiReviewReport;
};

function shortLabel(s: string, max = 18) {
  if (s.length <= max) return s;
  return `${s.slice(0, max)}…`;
}

/** Single shell: mistake pressure + score trend — no extra stat tiles or heatmap. */
export function AiReviewCharts({ snapshot, report }: Props) {
  const lessonBars = Object.entries(snapshot.scoresByLesson)
    .slice(0, 8)
    .map(([name, v]) => ({
      name: shortLabel(name.replace(/ · /g, " — "), 22),
      mistakePressure: Math.max(0, 100 - v.avgScore),
      avg: v.avgScore,
      sessions: v.sessions,
    }));

  const chronological = [...snapshot.recentScores].reverse();
  const trendData = chronological.map((r, idx) => ({
    pass: idx + 1,
    score: r.score,
    piece: shortLabel(r.title, 14),
  }));

  const lineMerge = trendData.map((d) => ({
    pass: d.pass,
    score: d.score,
  }));

  return (
    <div className={`${dashboardAnalysisCard} p-5`}>
      <p className="mb-4 text-xs font-medium uppercase tracking-wide text-[#8a7a68]">
        Charts
      </p>
      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <h3 className="mb-1 text-sm font-semibold text-[#151517]">Mistake pressure by piece</h3>
          <p className="mb-3 text-xs text-[#6b6054]">Taller bars = more room to improve.</p>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={lessonBars} margin={{ left: 4, right: 8, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3d342918" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: "#5c5348" }}
                  interval={0}
                  angle={-16}
                  textAnchor="end"
                  height={68}
                />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#5c5348" }} />
                <RTooltip
                  formatter={(value: number, _name: string, item) => {
                    const p = item.payload as { avg?: number; sessions?: number };
                    return [
                      `${value} (avg ${p.avg ?? "—"}%, ${p.sessions ?? "—"} runs)`,
                      "Pressure",
                    ];
                  }}
                />
                <Bar dataKey="mistakePressure" name="Pressure" radius={[6, 6, 0, 0]}>
                  {lessonBars.map((_, i) => (
                    <Cell key={i} fill={i % 2 === 0 ? "#c9a227" : "#2a2318"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div>
          <h3 className="mb-1 text-sm font-semibold text-[#151517]">Recent session scores</h3>
          <p className="mb-3 text-xs text-[#6b6054]">Latest on the right.</p>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineMerge} margin={{ left: 4, right: 8, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3d342918" />
                <XAxis dataKey="pass" tick={{ fontSize: 11, fill: "#5c5348" }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#5c5348" }} />
                <RTooltip />
                <Line
                  type="monotone"
                  dataKey="score"
                  name="Score"
                  stroke="#5c4528"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#D4AF37", stroke: "#2a2318" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
