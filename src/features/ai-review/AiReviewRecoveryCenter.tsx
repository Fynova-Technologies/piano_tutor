/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useId } from "react";
import { motion } from "motion/react";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Sparkles, RefreshCw, FileText, Target, Clock, AlertTriangle, BookOpen, Zap, ChevronRight, Calendar, TrendingUp, Eye, ArrowRight } from "lucide-react";
import { useAiReview } from "./useAiReview";
import { AiReviewCharts } from "./AiReviewCharts";
import { MiniSheetMusicPreview } from "./MiniSheetMusicPreview";
import { MistakeRecoverySection } from "@/features/recovery/MistakeRecoverySection";
import {
  analysisAccentGradient,
  analysisCodeBg,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  analysisLabelPlum,
  analysisShellBg,
  premiumAnalysisCard,
} from "@/features/ai-review/PianoAnalysisChrome";
import { PracticeNoteInsightsSection } from "@/features/ai-review/PracticeNoteInsightsSection";
import Image from "next/image";

/* ─────────────────────────────────────────────
   Score Ring — teal/green, matches screenshot
───────────────────────────────────────────── */
function ScoreRing({ label, value, size = 96 }: { label: string; value?: number; size?: number }) {
  const gid = useId().replace(/:/g, "");
  const ringId = `score-ring-${gid}-${label.replace(/\s+/g, "")}`;
  const v = Math.max(0, Math.min(100, typeof value === "number" && Number.isFinite(value) ? value : 0));
  const stroke = 6;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (v / 100) * c;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }} aria-hidden>
          <defs>
            <linearGradient id={ringId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#2dd4bf" />
              <stop offset="50%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
          </defs>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2f4f0" strokeWidth={stroke} />
          <circle
            cx={size / 2} cy={size / 2} r={r} fill="none"
            stroke={`url(#${ringId})`} strokeWidth={stroke}
            strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-black tabular-nums">{Math.round(v)}%</span>
        </div>
      </div>
      <span className="text-[12px] font-medium text-neutral-600">{label}</span>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Strength Info Row
───────────────────────────────────────────── */
function StrengthRow({ icon: Icon, title, subtitle }: { icon: string; title: string; subtitle: string }) {
  return (
    <div className="flex items-center gap-3.5 py-3.5 border-b border-black/[0.05] last:border-0">
      <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center flex-shrink-0">
        <Image src={Icon} height={36} width={36} alt="Icons for the coz container" className="w-4 h-4 text-neutral-600" />
      </div>
      <div>
        <p className="text-[13.5px] font-semibold text-black">{title}</p>
        <p className="text-[12px] text-neutral-500 mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Mini Bar Chart
───────────────────────────────────────────── */
function MiniBarChart({
  color1,
  color2,
  levels = [0.4, 0.65, 1],
}: {
  color1: string;
  color2: string;
  levels?: number[];
}) {
  return (
    <div className="flex items-end gap-0.5" style={{ height: 32, width: 36 }}>
      {levels.map((h, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm"
          style={{
            height: `${h * 100}%`,
            background: i === levels.length - 1 ? color2 : color1,
          }}
        />
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Weak Area Card
───────────────────────────────────────────── */
const PRIORITY_STYLES = {
  PRIORITY: { label: "PRIORITY", bg: "bg-red-50",    text: "text-red-500",    border: "border-red-100"    },
  MEDIUM:   { label: "MEDIUM",   bg: "bg-amber-50",  text: "text-amber-600",  border: "border-amber-100"  },
  LOW:      { label: "LOW",      bg: "bg-green-50",  text: "text-green-600",  border: "border-green-100"  },
};
const CHART_COLORS = {
  PRIORITY: { c1: "#fca5a5", c2: "#ef4444" },
  MEDIUM:   { c1: "#fcd34d", c2: "#f59e0b" },
  LOW:      { c1: "#86efac", c2: "#22c55e" },
};

function WeakAreaCard({ rank, name, percent, mistakes, issues = [], priority = "MEDIUM" }: { rank: number; name: string; percent?: number; mistakes?: number; issues?: string[]; priority?: "PRIORITY" | "MEDIUM" | "LOW" }) {
  const ps = PRIORITY_STYLES[priority] ?? PRIORITY_STYLES.MEDIUM;
  const cc = CHART_COLORS[priority] ?? CHART_COLORS.MEDIUM;
  return (
    <div className="rounded-xl border border-black/[0.06] bg-white p-4 flex items-center gap-4">
      <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center text-[12px] font-bold text-amber-600">
        {rank}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[14px] font-bold text-black">{name}</span>
          <span className={`rounded px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wide border ${ps.bg} ${ps.text} ${ps.border}`}>
            {ps.label}
          </span>
        </div>
        <p className="text-[11.5px] text-neutral-500 mt-0.5">{percent}% • {mistakes} mistakes</p>
        {issues.map((issue, i) => (
          <p key={i} className="text-[11.5px] text-neutral-500 leading-snug">{issue}</p>
        ))}
      </div>
      <div className="flex-shrink-0">
        <MiniBarChart color1={cc.c1} color2={cc.c2} />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Overall Score Ring (large, green)
───────────────────────────────────────────── */
function OverallScoreRing({ score = 82 }) {
  const id = useId().replace(/:/g, "");
  const gradId = `overall-ring-${id}`;
  const size = 84;
  const stroke = 6;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  const stars = Math.round(score / 20);

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }} aria-hidden>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#16a34a" />
              <stop offset="100%" stopColor="#22c55e" />
            </linearGradient>
          </defs>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e1dc" strokeWidth={stroke} />
          <circle
            cx={size / 2} cy={size / 2} r={r} fill="none"
            stroke={`url(#${gradId})`} strokeWidth={stroke}
            strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-base font-bold text-black tabular-nums leading-none">{score}%</span>
          <span className="text-[9px] text-neutral-500 mt-0.5 font-medium">Good Job</span>
        </div>
      </div>
      <div className="flex gap-0.5 mt-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <span key={i} style={{ fontSize: 13, color: i <= stars ? "#f0b429" : "#d4cfc8" }}>★</span>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Stat Cell
───────────────────────────────────────────── */
function StatCell({
  icon: Icon,
  iconBg,
  value,
  unit,
  label,
  delta,
  deltaDir,
}: {
  icon: string | React.ComponentType<any> | any;
  iconBg?: string;
  value?: React.ReactNode;
  unit?: string;
  label?: React.ReactNode;
  delta?: string;
  deltaDir?: "up" | "down" | "neutral";
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-4 py-5 border-l border-black/[0.06] first:border-l-0">
      <div className={`w-9 h-9 rounded-full flex items-center justify-center mb-2 ${iconBg}`}>
        <Image src={Icon} alt="Icons" height={36} width={36} className="w-4 h-4" />
      </div>
      <div className="text-2xl font-bold text-black leading-none">
        {value}{unit && <span className="text-base font-medium text-neutral-500 ml-0.5">{unit}</span>}
      </div>
      <div className="text-[11px] text-neutral-500 font-medium mt-1">{label}</div>
      {delta && (
        <div className={`text-[11px] font-semibold mt-1 ${deltaDir === "up" ? "text-green-600" : deltaDir === "down" ? "text-red-600" : "text-neutral-500"}`}>
          {deltaDir === "up" ? "▲" : deltaDir === "down" ? "▼" : ""} {delta}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Skeleton
───────────────────────────────────────────── */
function SkeletonBlock() {
  return (
    <div className="animate-pulse space-y-3 rounded-2xl border border-black/[0.06] bg-white p-6 shadow-[0_8px_32px_rgba(0,0,0,0.055)]">
      <div className="h-4 w-1/3 rounded bg-[#EDE9E2]" />
      <div className="h-3 w-full rounded bg-[#EDE9E2]/90" />
      <div className="h-3 w-5/6 rounded bg-[#EDE9E2]/90" />
      <div className="h-32 w-full rounded-xl bg-[#EDE9E2]" />
    </div>
  );
}

/* ─────────────────────────────────────────────
   Quick Action Item
───────────────────────────────────────────── */
function QuickActionItem({ icon: Icon, iconBg, name, desc }: { icon: string | React.ComponentType<any> | any; iconBg?: string; name: string; desc: string }) {
  return (
    <button
      type="button"
      className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border border-black/[0.06] bg-[#f5f2ee] hover:bg-white hover:shadow-md transition-all text-left group"
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        <Image src={Icon} height={36} width={36} alt="Icons for the coz container" className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13.5px] font-semibold text-black">{name}</div>
        <div className="text-[11.5px] text-neutral-500 mt-0.5">{desc}</div>
      </div>
      <ChevronRight className="w-4 h-4 text-neutral-300 group-hover:text-neutral-500 transition-colors flex-shrink-0" />
    </button>
  );
}

/* ─────────────────────────────────────────────
   Main Component
───────────────────────────────────────────── */
export default function AiReviewRecoveryCenter() {
  const { snapshot, report, loading, pendingRefresh, aiOk, statusMsg, apiErrorCode, refetch } =
    useAiReview();

  if (!snapshot) {
    return (
      <section className={`border-y border-black/[0.04] ${analysisShellBg} py-14`}>
        <div className="mx-auto max-w-7xl px-4">
          <SkeletonBlock />
        </div>
      </section>
    );
  }

  return (
    <section className="relative pb-16 pt-10 md:pt-12 bg-[#f5f2ee] min-h-screen">
      <div className="relative mx-auto max-w-[min(1040px,100%-32px)] px-4 md:px-6">

        {/* ── Header ── */}
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
        >
          <div>
            <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] font-bold ${analysisAccentGradient}`}>
              <Sparkles className="h-3 w-3 text-neutral-900" strokeWidth={2.5} />
              AI Performance
            </div>
            <h2 className="mt-3 text-[1.9rem] font-bold tracking-tight text-black leading-tight" style={{ fontFamily: "'Instrument Serif', serif", fontWeight: 400 }}>
              Your practice snapshot
            </h2>
            <p className="mt-1.5 text-sm text-neutral-500">
              Smart insights to help you practice better, not just more.
            </p>
          </div>
          <div className="flex gap-2.5 items-center flex-shrink-0">
            <button
              type="button"
              onClick={() => void refetch()}
              disabled={pendingRefresh}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold border border-black/[0.08] bg-white shadow-sm hover:shadow-md transition-all disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-neutral-600 ${pendingRefresh ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold border border-black/[0.08] bg-white shadow-sm hover:shadow-md transition-all"
            >
              <FileText className="h-3.5 w-3.5 text-neutral-600" />
              Export PDF
            </button>
          </div>
        </motion.header>

        {/* ── Stats Strip ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.06 }}
          className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_4px_24px_rgba(0,0,0,0.055)] mb-5 overflow-hidden"
        >
          <div className="grid grid-cols-5">
            {/* Overall ring */}
            <div className="flex flex-col items-center justify-center py-5 px-4">
              <OverallScoreRing score={snapshot.recentAvgScore ?? 82} />
            </div>
            <StatCell
              icon="/assets/note.png"
              iconBg="bg-purple-50"
              value={snapshot.sessionCount ?? 12}
              label="Sessions Analyzed"
              delta="This week"
              deltaDir="neutral"
            />
            <StatCell
              icon="/assets/target.png"
              iconBg="bg-[#DCFCE7]"
              value={`${report?.accuracyScore ?? 68}%`}
              label="Accuracy"
              delta="12% from last week"
              deltaDir="up"
            />
            <StatCell
              icon="/assets/music.png"
              iconBg="bg-amber-50"
              value={snapshot.totalPracticeMinutes ?? 24}
              unit="min"
              label="Avg. Practice Time"
              delta="8% from last week"
              deltaDir="down"
            />
            <StatCell
              icon="/assets/sound.png"
              iconBg="bg-pink-50"
              value={report?.weakestSkills?.length ?? 3}
              label="Weak Areas"
              delta="Need attention"
              deltaDir="neutral"
            />
          </div>
        </motion.div>

        {/* ── Middle Row: Note Habits + Quick Actions ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.12 }}
          className="grid gap-4 mb-5"
          style={{ gridTemplateColumns: "1fr 280px" }}
        >
          {/* Note Habits */}
          <PracticeNoteInsightsSection
            refreshKey={`${snapshot.sessionCount}|${snapshot.lastSessionAt ?? ""}|${snapshot.totalPracticeMinutes}`}
          />

          {/* Quick Actions */}
          <div className={`${premiumAnalysisCard} p-5 flex flex-col`}>
            <h3 className="text-[14px] font-bold text-black">Quick actions</h3>
            <div className="mt-4 flex flex-col gap-2.5 flex-1 justify-center">
              <QuickActionItem
                icon={BookOpen}
                iconBg="bg-amber-50 text-amber-600"
                name="Open studio"
                desc="Review weak areas"
              />
              <QuickActionItem
                icon={Zap}
                iconBg="bg-purple-50 text-purple-600"
                name="Start recovery"
                desc="Personalized drills"
              />
            </div>
          </div>
        </motion.div>

        {/* ── Mistake Recovery Section ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.18 }}
        >
          <MistakeRecoverySection />
        </motion.div>

        {/* ── Status / Error Message ── */}
        {statusMsg ? (
          <p
            className={`my-5 rounded-xl border px-4 py-3 text-sm shadow-sm ${
              apiErrorCode === "NO_API_KEY"
                ? "border-[#6e4d7d]/25 bg-white text-neutral-900"
                : "border-red-300/80 bg-red-50 text-red-950"
            }`}
            role="status"
          >
            {apiErrorCode === "NO_API_KEY" ? (
              <>
                Coach is using offline rules. If you added{" "}
                <code className={`rounded border border-black/10 ${analysisCodeBg} px-1 font-mono text-[13px] text-black`}>
                  OPENAI_API_KEY
                </code>{" "}
                to{" "}
                <code className={`rounded border border-black/10 ${analysisCodeBg} px-1 font-mono text-[13px] text-black`}>
                  .env.local
                </code>
                , restart{" "}
                <code className={`rounded border border-black/10 ${analysisCodeBg} px-1 font-mono text-[13px] text-black`}>
                  npm run dev
                </code>{" "}
                so the server picks it up.
              </>
            ) : (
              statusMsg
            )}
          </p>
        ) : null}

        {/* ── Loading skeleton ── */}
        {loading && !report ? (
          <div className="mb-6">
            <SkeletonBlock />
          </div>
        ) : null}

        {/* ── Full AI Report ── */}
        {report ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.24 }}
          >
            {/* Mode badge */}
            <div className="mb-5 flex flex-wrap items-center gap-2 text-xs">
              <span
                className={`rounded-full px-2.5 py-1 font-semibold ${
                  aiOk
                    ? "border border-black/10 bg-black text-white"
                    : "border border-black/10 bg-white text-neutral-600"
                }`}
              >
                {aiOk ? "OpenAI powered" : "Heuristic mode"}
              </span>
              {report.isHeuristicFallback ? (
                <span className="rounded-full border border-[#6e4d7d]/35 bg-white px-2.5 py-1 font-medium text-[#6e4d7d]">
                  Add API key for fuller text
                </span>
              ) : null}
            </div>

            {/* Strengths + Areas for Growth — two-column split matching screenshot */}
            <div className="mb-6 rounded-2xl border border-black/[0.06] bg-white shadow-[0_4px_24px_rgba(0,0,0,0.055)] overflow-hidden">
              <div className="grid grid-cols-2 divide-x divide-dashed divide-blue-200/80">

                {/* ── LEFT: Strengths ── */}
                <div className="p-7">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="text-[1.2rem] font-bold text-black">Strengths</h3>
                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#6e4d7d] mt-1">
                      What&apos;s working
                    </span>
                  </div>
                  <p className="text-[12.5px] text-neutral-500 mb-7">You&apos;re doing great in these areas!</p>

                  {/* Score rings */}
                  <div className="flex items-end justify-between gap-2 mb-7">
                    <ScoreRing label="Accuracy"      value={report.accuracyScore} />
                    <ScoreRing label="Consistency"   value={report.practiceQualityScore} />
                    <ScoreRing label="Tempo Control" value={report.confidenceEstimation} />
                  </div>

                  {/* Highlight rows */}
                  <StrengthRow
                    icon="/assets/note.png"
                    title={`${snapshot.streakDays}-day streak`}
                    subtitle={`You practiced ${snapshot.streakDays} days in a row`}
                  />
                  <StrengthRow
                    icon="/assets/note.png"
                    title="Steady improvement"
                    subtitle={report.improvementTrends ?? `Up ${snapshot.recentAvgScore && snapshot.previousPeriodAvgScore ? Math.abs(snapshot.recentAvgScore - snapshot.previousPeriodAvgScore) : 11}% accuracy from last week`}
                  />
                  <StrengthRow
                    icon="/assets/note.png"
                    title="Focus & discipline"
                    subtitle={report.performanceVsPreviousSessions ?? "Great consistency in your practice!"}
                  />
                </div>

                {/* ── RIGHT: Areas for Growth ── */}
                <div className="p-7 bg-[#fafaf9]">
                  <div className="flex items-start justify-between mb-6">
                    <h3 className="text-[1.2rem] font-bold text-black">Areas for growth</h3>
                    <span className="rounded border border-black/[0.08] bg-neutral-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-neutral-500">
                      Medium
                    </span>
                  </div>

                  <div className="flex flex-col gap-3">
                    {report.weakestSkills.slice(0, 3).map((skill, i) => {
                      const priorities: Array<"PRIORITY" | "MEDIUM" | "LOW"> = ["PRIORITY", "MEDIUM", "LOW"];
                      const percents = [42, 16, 10];
                      const mistakeCounts = [18, 7, 4];
                      const issueMap = [
                        report.rhythmTimingAnalysis ? [report.rhythmTimingAnalysis] : ["Inconsistent timing in fast passages", "Rushed notes in scale exercises"],
                        ["Uneven hand transitions", "Breakdown in arpeggio patterns"],
                        [report.speedConsistencyReview ?? "Inconsistent volume changes"],
                      ];
                      return (
                        <WeakAreaCard
                          key={skill}
                          rank={i + 1}
                          name={skill}
                          priority={priorities[i] ?? "LOW"}
                          percent={percents[i] ?? 10}
                          mistakes={mistakeCounts[i] ?? 4}
                          issues={issueMap[i] ?? []}
                        />
                      );
                    })}

                    {/* Fallback if weakestSkills is empty */}
                    {report.weakestSkills.length === 0 && (
                      <>
                        <WeakAreaCard rank={1} name="Timing & Rhythm"    priority="PRIORITY" percent={42} mistakes={18} issues={["Inconsistent timing in fast passages", "Rushed notes in scale exercises"]} />
                        <WeakAreaCard rank={2} name="Hand Coordination"  priority="MEDIUM"   percent={16} mistakes={7}  issues={["Uneven hand transitions", "Breakdown in arpeggio patterns"]} />
                        <WeakAreaCard rank={3} name="Dynamics Control"   priority="LOW"      percent={10} mistakes={4}  issues={["Inconsistent volume changes", "Less contrast in musical phrases"]} />
                      </>
                    )}
                  </div>

                  <button
                    type="button"
                    className="mt-5 flex items-center gap-1.5 text-[13px] font-semibold text-[#6e4d7d] hover:underline transition-all mx-auto"
                  >
                    See all weak areas
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            </div>

            {/* Charts — Mistake pressure + Session scores */}
            <AiReviewCharts snapshot={snapshot} />

            {/* Score sketch / highlights + Personalized next steps */}
            <MiniSheetMusicPreview report={report} />
          </motion.div>
        ) : null}

      </div>
    </section>
  );
}