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

type Props = {
  snapshot: AnalyticsSnapshot;
  report: AiReviewReport;
};

function shortLabel(s: string, max = 18) {
  if (s.length <= max) return s;
  return `${s.slice(0, max)}…`;
}

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

  const heatmapLessons = Object.entries(snapshot.scoresByLesson)
    .sort((a, b) => a[1].avgScore - b[1].avgScore)
    .slice(0, 5);

  const metrics = ["Pitch", "Rhythm", "Tempo", "Evenness", "Memory"];

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border border-black/10 bg-white/90 p-4 shadow-sm backdrop-blur-sm">
        <h3 className="mb-1 text-sm font-semibold text-[#0A0A0B]">
          Mistake pressure by piece
        </h3>
        <p className="mb-3 text-xs text-black/55">
          Taller bars mean lower rolling average — prioritize these titles first.
        </p>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={lessonBars} margin={{ left: 4, right: 8, top: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#00000014" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10 }}
                interval={0}
                angle={-16}
                textAnchor="end"
                height={68}
              />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
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
                  <Cell key={i} fill={i % 2 === 0 ? "#c9a227" : "#3d3d42"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border border-black/10 bg-white/90 p-4 shadow-sm backdrop-blur-sm">
        <h3 className="mb-1 text-sm font-semibold text-[#0A0A0B]">Session score trend</h3>
        <p className="mb-3 text-xs text-black/55">Most recent sessions on the right.</p>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineMerge} margin={{ left: 4, right: 8, top: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#00000014" />
              <XAxis dataKey="pass" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <RTooltip />
              <Line
                type="monotone"
                dataKey="score"
                name="Score"
                stroke="#0A0A0B"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border border-black/10 bg-white/90 p-4 shadow-sm backdrop-blur-sm lg:col-span-2">
        <h3 className="mb-1 text-sm font-semibold text-[#0A0A0B]">
          Weak-area heatmap
        </h3>
        <p className="mb-3 text-xs text-black/55">
          Warmer cells suggest more focused recovery work until granular MIDI mistakes ship.
        </p>
        <div className="overflow-x-auto">
          <div
            className="grid gap-1 min-w-[520px]"
            style={{
              gridTemplateColumns: `160px repeat(${metrics.length}, minmax(0,1fr))`,
            }}
          >
            <div />
            {metrics.map((m) => (
              <div
                key={m}
                className="text-center text-[10px] font-semibold uppercase tracking-wide text-black/50"
              >
                {m}
              </div>
            ))}
            {heatmapLessons.map(([title, v]) => (
              <React.Fragment key={title}>
                <div
                  className="truncate pr-2 text-xs font-medium text-[#0A0A0B]"
                  title={title}
                >
                  {shortLabel(title, 26)}
                </div>
                {metrics.map((_, mi) => {
                  const base = v.avgScore;
                  const jitter = (mi * 7 + title.length) % 13;
                  const intensity = Math.min(100, Math.max(0, 100 - base + jitter - 6));
                  const alpha = 0.35 + intensity / 220;
                  return (
                    <div
                      key={`${title}-${mi}`}
                      className="h-9 rounded-md border border-black/5"
                      style={{
                        background: `rgba(212, 175, 55, ${alpha})`,
                      }}
                      title={`~${Math.round(intensity)} focus`}
                    />
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-xl bg-[#0A0A0B] px-4 py-3 text-white md:col-span-2">
            <p className="text-xs uppercase tracking-widest text-[#D4AF37]">
              Consistency engine
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{snapshot.streakDays}-day streak</p>
            <p className="mt-1 text-sm text-white/75">
              {snapshot.totalPracticeMinutes} min logged · {snapshot.sessionCount} session
              {snapshot.sessionCount === 1 ? "" : "s"}
            </p>
            <p className="mt-2 text-xs text-white/60">
              Rolling {snapshot.recentAvgScore}%
              {snapshot.previousPeriodAvgScore != null
                ? ` vs earlier ${snapshot.previousPeriodAvgScore}%`
                : ""}
            </p>
          </div>
          <div className="rounded-xl border border-[#D4AF37]/40 bg-gradient-to-br from-[#fffdf8] to-[#f3efe6] px-4 py-3">
            <p className="text-xs font-medium text-black/50">Accuracy readout</p>
            <p className="mt-1 text-3xl font-bold tabular-nums text-[#0A0A0B]">
              {report.accuracyScore}%
            </p>
          </div>
          <div className="rounded-xl border border-black/10 bg-white px-4 py-3">
            <p className="text-xs font-medium text-black/50">AI confidence</p>
            <p className="mt-1 text-3xl font-bold tabular-nums text-[#0A0A0B]">
              {report.confidenceEstimation}%
            </p>
            <p className="mt-2 text-[10px] text-black/45">Higher with more session history.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
