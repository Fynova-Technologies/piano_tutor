"use client";

import React from "react";
import { motion } from "motion/react";
import { Sparkles, RefreshCw, ChevronDown } from "lucide-react";
import { useAiReview } from "./useAiReview";
import { AiReviewCharts } from "./AiReviewCharts";
import { MistakeReviewPlanCard } from "./MistakeReviewPlanCard";
import { MiniSheetMusicPreview } from "./MiniSheetMusicPreview";
import { MistakeRecoverySection } from "@/features/recovery/MistakeRecoverySection";

function InsightPanel({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details
      open={defaultOpen}
      className="group rounded-xl border border-black/8 bg-white/95 shadow-sm transition-[box-shadow] open:shadow-md"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 marker:content-none [&::-webkit-details-marker]:hidden">
        <span className="text-sm font-semibold text-[#0A0A0B]">{title}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-black/40 transition-transform group-open:rotate-180" />
      </summary>
      <div className="border-t border-black/5 px-4 py-3 text-sm leading-relaxed text-black/75">
        {children}
      </div>
    </details>
  );
}

function SkeletonBlock() {
  return (
    <div className="animate-pulse space-y-3 rounded-2xl border border-black/5 bg-white/70 p-6">
      <div className="h-4 w-1/3 rounded bg-black/10" />
      <div className="h-3 w-full rounded bg-black/10" />
      <div className="h-3 w-5/6 rounded bg-black/10" />
      <div className="h-32 w-full rounded-xl bg-black/5" />
    </div>
  );
}

export default function AiReviewRecoveryCenter() {
  const { snapshot, report, loading, pendingRefresh, aiOk, statusMsg, apiErrorCode, refetch } =
    useAiReview();

  if (!snapshot) {
    return (
      <section className="border-y border-black/5 bg-[#eceae4] py-14">
        <div className="mx-auto max-w-7xl px-4">
          <SkeletonBlock />
        </div>
      </section>
    );
  }

  const xp =
    snapshot.totalPracticeMinutes * 3 +
    snapshot.streakDays * 25 +
    snapshot.sessionCount * 12;
  const level = Math.floor(xp / 220) + 1;
  const tierProgress = ((xp % 220) / 220) * 100;

  return (
    <section className="border-y border-[#D4AF37]/25 bg-gradient-to-b from-[#ebe8e0] via-[#f3efe8] to-[#e8e6df] py-14">
      <div className="mx-auto max-w-[min(1440px,100%-32px)] px-4 md:px-8">
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between"
        >
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/40 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[#6b5612]">
              <Sparkles className="h-3.5 w-3.5 text-[#D4AF37]" />
              AI Review &amp; Recovery Center
            </div>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#0A0A0B] md:text-4xl">
              Your personal AI music coach
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-black/65">
              Blends saved practice sessions with on-demand OpenAI coaching
              (optional). Heuristics keep the dashboard useful without a key.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl border border-black/10 bg-[#0A0A0B] px-5 py-3 text-white shadow-lg">
              <p className="text-[10px] uppercase tracking-widest text-[#D4AF37]">
                Coach level {level}
              </p>
              <div className="mt-2 h-2 w-44 overflow-hidden rounded-full bg-white/15">
                <motion.div
                  className="h-full rounded-full bg-[#D4AF37]"
                  initial={{ width: 0 }}
                  whileInView={{ width: `${tierProgress}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
              <p className="mt-1 text-[11px] text-white/60 tabular-nums">{xp} XP · streak-powered</p>
            </div>
            <button
              type="button"
              onClick={() => void refetch()}
              disabled={pendingRefresh}
              className="inline-flex items-center gap-2 rounded-xl border border-black/15 bg-white px-4 py-3 text-sm font-medium text-[#0A0A0B] shadow-sm transition hover:bg-[#fafafa] disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${pendingRefresh ? "animate-spin" : ""}`} />
              Refresh insights
            </button>
          </div>
        </motion.header>

        <MistakeRecoverySection />

        {statusMsg ? (
          <p
            className={`mb-6 rounded-xl border px-4 py-2 text-sm ${
              apiErrorCode === "NO_API_KEY"
                ? "border-amber-200 bg-amber-50 text-amber-950"
                : "border-red-200 bg-red-50 text-red-900"
            }`}
            role="status"
          >
            {apiErrorCode === "NO_API_KEY" ? (
              <>
                Coach is using offline rules. If you added <code className="rounded bg-black/5 px-1">OPENAI_API_KEY</code> to{" "}
                <code className="rounded bg-black/5 px-1">.env.local</code>, restart{" "}
                <code className="rounded bg-black/5 px-1">npm run dev</code> so the server picks it up.
              </>
            ) : (
              statusMsg
            )}
          </p>
        ) : null}

        {loading && !report ? (
          <div className="mb-8">
            <SkeletonBlock />
          </div>
        ) : null}

        {report ? (
          <>
            <div className="mb-6 grid gap-4 lg:grid-cols-3">
              <div className="rounded-2xl border border-black/8 bg-white p-5 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-black/45">
                  Mistake analysis
                </p>
                <p className="mt-2 text-sm leading-relaxed text-black/80">
                  {report.mistakeAnalysisSummary}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {report.mostRepeatedMistakes.slice(0, 4).map((m) => (
                    <span
                      key={m}
                      className="rounded-full bg-[#D4AF37]/15 px-2.5 py-0.5 text-xs font-medium text-[#5c4a12]"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-black/8 bg-white p-5 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-black/45">
                  Focus today
                </p>
                <p className="mt-2 text-lg font-semibold text-[#0A0A0B]">
                  {report.focusRecommendationOfTheDay}
                </p>
                <p className="mt-2 text-sm text-black/70">{report.nextPracticeTarget}</p>
                <div className="mt-3 grid grid-cols-2 gap-2 text-center">
                  <div className="rounded-lg bg-[#F8F6F1] py-2">
                    <p className="text-[10px] text-black/50">Practice quality</p>
                    <p className="text-xl font-bold text-[#0A0A0B]">{report.practiceQualityScore}%</p>
                  </div>
                  <div className="rounded-lg bg-[#F8F6F1] py-2">
                    <p className="text-[10px] text-black/50">Model confidence</p>
                    <p className="text-xl font-bold text-[#0A0A0B]">{report.confidenceEstimation}%</p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-black/8 bg-gradient-to-br from-[#0A0A0B] to-[#1c1c24] p-5 text-white shadow-lg">
                <p className="text-xs uppercase tracking-[0.15em] text-[#D4AF37]">
                  Session comparison
                </p>
                <p className="mt-3 text-sm leading-relaxed text-white/85">
                  {report.performanceVsPreviousSessions}
                </p>
                <ul className="mt-3 space-y-2 border-t border-white/10 pt-3 text-xs text-white/75">
                  {report.aiFeedbackComments.map((c) => (
                    <li key={c}>“{c}”</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mb-8 flex flex-wrap items-center gap-2 text-xs">
              <span
                className={`rounded-full px-2.5 py-1 font-semibold ${
                  aiOk ? "bg-emerald-100 text-emerald-900" : "bg-white text-black/70 border border-black/10"
                }`}
              >
                {aiOk ? "OpenAI powered" : "Heuristic / fallback mode"}
              </span>
              {report.isHeuristicFallback ? (
                <span className="rounded-full bg-black/5 px-2.5 py-1 font-medium text-black/60">
                  Add OPENAI_API_KEY for full narratives
                </span>
              ) : null}
            </div>

            <div className="mb-10">
              <AiReviewCharts snapshot={snapshot} report={report} />
            </div>

            <div className="mb-10 space-y-3">
              <InsightPanel title="Rhythm & timing analysis" defaultOpen>
                <p>{report.rhythmTimingAnalysis}</p>
              </InsightPanel>
              <InsightPanel title="Pitch & note accuracy">
                <p>{report.pitchNoteAnalysis}</p>
              </InsightPanel>
              <InsightPanel title="Speed consistency">
                <p>{report.speedConsistencyReview}</p>
              </InsightPanel>
              <InsightPanel title="Improvement trends & forecasting context">
                <p>{report.improvementTrends}</p>
              </InsightPanel>
              <InsightPanel title="Weakest skills (AI / heuristic)">
                <ul className="list-disc space-y-1 pl-5">
                  {report.weakestSkills.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </InsightPanel>
              <InsightPanel title="Smart suggestions & recovery roadmap">
                <ol className="list-decimal space-y-2 pl-5">
                  {report.recoveryRoadmap.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
                <p className="mt-3 text-xs font-medium text-black/55">Micro-suggestions</p>
                <ul className="mt-1 list-disc space-y-1 pl-5">
                  {report.smartImprovementSuggestions.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </InsightPanel>
            </div>

            <div className="mb-10">
              <MistakeReviewPlanCard report={report} />
            </div>

            <MiniSheetMusicPreview report={report} />

            <p className="mt-6 text-center text-[11px] text-black/45">
              API: <code className="rounded bg-black/5 px-1">POST /api/ai-review</code> · optional{" "}
              <code className="rounded bg-black/5 px-1">OPENAI_MODEL</code> · never expose keys client-side.
            </p>
          </>
        ) : null}
      </div>
    </section>
  );
}
