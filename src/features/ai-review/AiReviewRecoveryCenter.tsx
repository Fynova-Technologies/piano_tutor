"use client";

import React from "react";
import { motion } from "motion/react";
import { Sparkles, RefreshCw, ChevronDown } from "lucide-react";
import { useAiReview } from "./useAiReview";
import { AiReviewCharts } from "./AiReviewCharts";
import { MistakeReviewPlanCard } from "./MistakeReviewPlanCard";
import { MiniSheetMusicPreview } from "./MiniSheetMusicPreview";
import { MistakeRecoverySection } from "@/features/recovery/MistakeRecoverySection";
import {
  dashboardAnalysisCard,
  PianoKeysStripeLight,
} from "@/features/ai-review/PianoAnalysisChrome";

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
      className={`group ${dashboardAnalysisCard} transition-[box-shadow] open:shadow-[0_8px_24px_rgba(80,80,80,0.14)]`}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 marker:content-none [&::-webkit-details-marker]:hidden">
        <span className="text-sm font-semibold tracking-wide text-[#151517]">{title}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-[#535356] transition-transform group-open:rotate-180" />
      </summary>
      <div className="border-t border-black/10 px-4 py-3 text-sm leading-relaxed text-[#535356]">
        {children}
      </div>
    </details>
  );
}

function SkeletonBlock() {
  return (
    <div className="animate-pulse space-y-3 rounded-2xl border border-black/10 bg-[#FEFEFE] p-6 shadow-[0_5px_10px_0px_rgba(80,80,80,0.08)]">
      <div className="h-4 w-1/3 rounded bg-[#d4cbc0]/80" />
      <div className="h-3 w-full rounded bg-[#ddd4c8]/70" />
      <div className="h-3 w-5/6 rounded bg-[#ddd4c8]/70" />
      <div className="h-32 w-full rounded-xl bg-[#e5dcd1]/80" />
    </div>
  );
}

export default function AiReviewRecoveryCenter() {
  const { snapshot, report, loading, pendingRefresh, aiOk, statusMsg, apiErrorCode, refetch } =
    useAiReview();

  if (!snapshot) {
    return (
      <section className="border-y border-black/[0.06] bg-[#F8F6F1] py-14">
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
    <section className="relative py-14">
      <div className="relative mx-auto max-w-[min(1440px,100%-32px)] px-4 md:px-8">
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between"
        >
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/50 bg-[#0A0A0B] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[#D4AF37] shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-[#D4AF37]" />
              AI Performance
            </div>
            <h2 className="mt-4 text-3xl font-bold tracking-tight primary-color-text md:text-[2.35rem] md:leading-tight">
              Coach view · mistakes & recovery
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#535356]">
              Trends from your signed-in practice history, optional OpenAI commentary, and recovery drills —
              same look as your dashboard tiles.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="overflow-hidden rounded-2xl border border-black/10 bg-[#FEFEFE] px-5 py-3 shadow-[0_5px_10px_0px_rgba(80,80,80,0.12)]">
              <p className="text-[10px] uppercase tracking-[0.18em] text-[#8a7a68]">
                Level {level}
              </p>
              <div className="mt-2 h-2 w-44 overflow-hidden rounded-full bg-[#ece8df] shadow-inner">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-[#a8892e] to-[#D4AF37]"
                  initial={{ width: 0 }}
                  whileInView={{ width: `${tierProgress}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
              <p className="mt-1 text-[11px] text-[#535356] tabular-nums">{xp} XP · streak</p>
              <PianoKeysStripeLight className="mt-3 rounded-sm opacity-80" />
            </div>
            <button
              type="button"
              onClick={() => void refetch()}
              disabled={pendingRefresh}
              className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-[#FEFEFE] px-4 py-3 text-sm font-medium text-[#151517] shadow-[0_5px_10px_0px_rgba(80,80,80,0.12)] transition hover:border-[#D4AF37]/35 hover:bg-[#f2e6c1]/80 hover:shadow-md disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${pendingRefresh ? "animate-spin" : ""}`} />
              Refresh scoreboard
            </button>
          </div>
        </motion.header>

        <MistakeRecoverySection />

        {statusMsg ? (
          <p
            className={`mb-6 rounded-xl border px-4 py-3 text-sm shadow-sm ${
              apiErrorCode === "NO_API_KEY"
                ? "border-[#c9a227]/40 bg-[#fff9e8] text-[#6b5612]"
                : "border-red-300/80 bg-red-50 text-red-950"
            }`}
            role="status"
          >
            {apiErrorCode === "NO_API_KEY" ? (
              <>
                Coach is using offline rules. If you added                 <code className="rounded border border-[#e5dcd1] bg-[#faf7f2] px-1 text-[#151517]">OPENAI_API_KEY</code> to{" "}
                <code className="rounded border border-[#e5dcd1] bg-[#faf7f2] px-1 text-[#151517]">.env.local</code>, restart{" "}
                <code className="rounded border border-[#e5dcd1] bg-[#faf7f2] px-1 text-[#151517]">npm run dev</code> so the server picks it up.
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
              <div className={`${dashboardAnalysisCard} p-5`}>
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#8a7a68]">
                  Mistake analysis
                </p>
                <p className="mt-2 text-sm leading-relaxed text-[#535356]">
                  {report.mistakeAnalysisSummary}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {report.mostRepeatedMistakes.slice(0, 4).map((m) => (
                    <span
                      key={m}
                      className="rounded-full border border-[#D4AF37]/35 bg-[#D4AF37]/12 px-2.5 py-0.5 text-xs font-medium text-[#6b5612]"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>
              <div className={`${dashboardAnalysisCard} p-5`}>
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#8a7a68]">
                  Focus today
                </p>
                <p className="mt-2 text-lg font-semibold text-[#151517]">
                  {report.focusRecommendationOfTheDay}
                </p>
                <p className="mt-2 text-sm text-[#535356]">{report.nextPracticeTarget}</p>
                <div className="mt-3 grid grid-cols-2 gap-2 text-center">
                  <div className="rounded-lg border border-[#e5dcd1] bg-[#faf7f2] py-2 shadow-inner">
                    <p className="text-[10px] uppercase tracking-wide text-[#8a7a68]">Practice quality</p>
                    <p className="text-xl font-bold tabular-nums text-[#151517]">{report.practiceQualityScore}%</p>
                  </div>
                  <div className="rounded-lg border border-[#e5dcd1] bg-[#faf7f2] py-2 shadow-inner">
                    <p className="text-[10px] uppercase tracking-wide text-[#8a7a68]">Model confidence</p>
                    <p className="text-xl font-bold tabular-nums text-[#151517]">{report.confidenceEstimation}%</p>
                  </div>
                </div>
              </div>
              <div className={`${dashboardAnalysisCard} p-5`}>
                <p className="text-xs uppercase tracking-[0.18em] text-[#6b5612]">
                  Session comparison
                </p>
                <p className="mt-3 text-sm leading-relaxed text-[#535356]">
                  {report.performanceVsPreviousSessions}
                </p>
                <ul className="mt-3 space-y-2 border-t border-black/10 pt-3 text-xs text-[#535356]">
                  {report.aiFeedbackComments.map((c) => (
                    <li key={c}>“{c}”</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mb-8 flex flex-wrap items-center gap-2 text-xs">
              <span
                className={`rounded-full px-2.5 py-1 font-semibold ${
                  aiOk
                    ? "border border-emerald-700/25 bg-emerald-950/90 text-emerald-100"
                    : "border border-[#c9bfb0] bg-[#faf7f2] text-[#5c5348]"
                }`}
              >
                {aiOk ? "OpenAI powered" : "Acoustic heuristic mode"}
              </span>
              {report.isHeuristicFallback ? (
                <span className="rounded-full border border-[#d4cbc0] bg-[#f3ebe0]/90 px-2.5 py-1 font-medium text-[#6b6054]">
                  Add OPENAI_KEY for fuller narratives
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
                <p className="mt-3 text-xs font-medium text-[#8a7a68]">Micro-suggestions</p>
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

            <p className="mt-6 text-center text-[11px] tracking-wide text-[#8a7a68]">
              API: <code className="rounded border border-[#d4cbc0]/80 bg-[#faf7f2] px-1.5 py-0.5 text-[#151517]">POST /api/ai-review</code> · optional{" "}
              <code className="rounded border border-[#d4cbc0]/80 bg-[#faf7f2] px-1.5 py-0.5 text-[#151517]">OPENAI_MODEL</code> · keys stay server-side only.
            </p>
          </>
        ) : null}
      </div>
    </section>
  );
}
