"use client";

import React, { useId } from "react";
import { motion } from "motion/react";
import { Sparkles, RefreshCw } from "lucide-react";
import { useAiReview } from "./useAiReview";
import { AiReviewCharts } from "./AiReviewCharts";
import { MiniSheetMusicPreview } from "./MiniSheetMusicPreview";
import { MistakeRecoverySection } from "@/features/recovery/MistakeRecoverySection";
import {
  analysisAccentGradient,
  analysisCodeBg,
  analysisLabelPlum,
  analysisShellBg,
  premiumAnalysisCard,
} from "@/features/ai-review/PianoAnalysisChrome";
import { PracticeNoteInsightsSection } from "@/features/ai-review/PracticeNoteInsightsSection";

function ScoreRing({ label, value }: { label: string; value: number }) {
  const gid = useId().replace(/:/g, "");
  const ringId = `score-ring-${gid}-${label.replace(/\s+/g, "")}`;
  const v = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
  const size = 76;
  const stroke = 5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (v / 100) * c;

  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90" aria-hidden>
          <defs>
            <linearGradient id={ringId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#f5d94a" />
              <stop offset="55%" stopColor="#f0b429" />
              <stop offset="100%" stopColor="#ea8f26" />
            </linearGradient>
          </defs>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="#e5e1dc"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={`url(#${ringId})`}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-black tabular-nums">
          {Math.round(v)}
        </span>
      </div>
      <span className="mt-1.5 max-w-[5.75rem] text-[10px] font-semibold uppercase tracking-wide text-neutral-600">
        {label}
      </span>
    </div>
  );
}

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
    <section className="relative pb-16 pt-10 md:pt-12">
      <div className="relative mx-auto max-w-[min(960px,100%-32px)] px-4 md:px-8">
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
        >
          <div>
            <div
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs uppercase tracking-[0.18em] ${analysisAccentGradient}`}
            >
              <Sparkles className="h-3.5 w-3.5 text-neutral-900" strokeWidth={2} />
              AI Performance
            </div>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-black md:text-[2.1rem] md:leading-tight">
              Your practice snapshot
            </h2>
            <p className="mt-2 max-w-xl text-sm text-neutral-600">
              Strengths and growth areas — minimal summary.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void refetch()}
            disabled={pendingRefresh}
            className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-5 py-3 text-sm shadow-md transition hover:brightness-[1.03] hover:shadow-lg disabled:opacity-50 ${analysisAccentGradient}`}
          >
            <RefreshCw className={`h-4 w-4 text-neutral-900 ${pendingRefresh ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </motion.header>

        <PracticeNoteInsightsSection
          refreshKey={`${snapshot.sessionCount}|${snapshot.lastSessionAt ?? ""}|${snapshot.totalPracticeMinutes}`}
        />

        <MistakeRecoverySection />

        {statusMsg ? (
          <p
            className={`mb-6 rounded-xl border px-4 py-3 text-sm shadow-sm ${
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

        {loading && !report ? (
          <div className="mb-8">
            <SkeletonBlock />
          </div>
        ) : null}

        {report ? (
          <>
            <div className="mb-6 flex flex-wrap items-center gap-2 text-xs">
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

            <div className="mb-8 grid gap-6 lg:grid-cols-2 lg:items-start">
              <div className={`${premiumAnalysisCard} p-6`}>
                <h3 className="text-lg font-bold text-black">Strengths</h3>
                <p className={`mt-1 ${analysisLabelPlum}`}>What&apos;s working</p>

                <div className="mt-6 flex flex-wrap justify-center gap-8 sm:justify-between sm:gap-4">
                  <ScoreRing label="Accuracy" value={report.accuracyScore} />
                  <ScoreRing label="Practice quality" value={report.practiceQualityScore} />
                  <ScoreRing label="Confidence" value={report.confidenceEstimation} />
                </div>

                <p className="mt-6 text-sm leading-relaxed text-neutral-600">
                  <span className="font-semibold text-black">{snapshot.streakDays}-day streak</span>
                  {" · "}
                  {snapshot.sessionCount} session{snapshot.sessionCount === 1 ? "" : "s"}
                  {" · "}
                  {snapshot.totalPracticeMinutes} min · recent avg{" "}
                  <span className="font-semibold text-black">{snapshot.recentAvgScore}%</span>
                  {snapshot.previousPeriodAvgScore != null
                    ? ` (was ${snapshot.previousPeriodAvgScore}%)`
                    : ""}
                </p>
                {report.improvementTrends ? (
                  <p className="mt-4 text-sm leading-relaxed text-neutral-600">{report.improvementTrends}</p>
                ) : null}
                {report.performanceVsPreviousSessions ? (
                  <p className="mt-4 text-sm leading-relaxed text-neutral-600">
                    {report.performanceVsPreviousSessions}
                  </p>
                ) : null}
                {report.aiFeedbackComments.length > 0 ? (
                  <ul className="mt-4 list-disc space-y-1.5 pl-5 text-sm text-neutral-600">
                    {report.aiFeedbackComments.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                ) : null}
              </div>

              <div className={`${premiumAnalysisCard} p-6`}>
                <h3 className="text-lg font-bold text-black">Areas for growth</h3>
                <p className={`mt-1 ${analysisLabelPlum}`}>Focus next</p>

                <p className="mt-5 text-sm font-semibold leading-snug text-black">
                  {report.focusRecommendationOfTheDay}
                </p>
                {report.nextPracticeTarget ? (
                  <p className="mt-2 text-sm text-neutral-600">{report.nextPracticeTarget}</p>
                ) : null}
                {report.mistakeAnalysisSummary ? (
                  <p className="mt-4 text-sm leading-relaxed text-neutral-600">
                    {report.mistakeAnalysisSummary}
                  </p>
                ) : null}
                {report.mostRepeatedMistakes.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {report.mostRepeatedMistakes.slice(0, 8).map((m) => (
                      <span
                        key={m}
                        className="rounded-full border border-[#6e4d7d]/25 bg-[rgba(110,77,125,0.08)] px-2.5 py-0.5 text-xs font-medium text-neutral-800"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                ) : null}
                {report.weakestSkills.length > 0 ? (
                  <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-neutral-600">
                    {report.weakestSkills.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                ) : null}

                <div className="mt-5 space-y-3 border-t border-black/[0.06] pt-5 text-sm leading-relaxed text-neutral-600">
                  <p>
                    <span className="font-semibold text-black">Rhythm. </span>
                    {report.rhythmTimingAnalysis}
                  </p>
                  <p>
                    <span className="font-semibold text-black">Pitch. </span>
                    {report.pitchNoteAnalysis}
                  </p>
                  <p>
                    <span className="font-semibold text-black">Tempo &amp; evenness. </span>
                    {report.speedConsistencyReview}
                  </p>
                </div>

                {report.recoveryRoadmap.length > 0 ? (
                  <div className="mt-5 border-t border-black/[0.06] pt-5">
                    <p className={analysisLabelPlum}>Next steps</p>
                    <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm text-neutral-600">
                      {report.recoveryRoadmap.slice(0, 8).map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ol>
                  </div>
                ) : null}

                {report.smartImprovementSuggestions.length > 0 ? (
                  <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-neutral-600">
                    {report.smartImprovementSuggestions.slice(0, 8).map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                ) : null}

                <p className="mt-4 text-sm text-neutral-600">
                  Aim for ~{report.mistakeReviewPlan.recommendedDailyPracticeMinutes} min/day when you can.
                  {report.mistakeReviewPlan.adaptiveDifficultyNotes
                    ? ` ${report.mistakeReviewPlan.adaptiveDifficultyNotes}`
                    : ""}
                </p>
                {report.mistakeReviewPlan.metronomeRhythmGuide ? (
                  <p className="mt-3 text-xs leading-relaxed text-[#6e4d7d]/90">
                    {report.mistakeReviewPlan.metronomeRhythmGuide}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="mb-8">
              <AiReviewCharts snapshot={snapshot} />
            </div>

            <MiniSheetMusicPreview report={report} />

            <p className="mt-8 text-center text-[11px] tracking-wide text-[#6e4d7d]/75">
              API:{" "}
              <code className="rounded border border-black/[0.08] bg-white px-1.5 py-0.5 font-mono text-[11px] text-neutral-700 shadow-sm">
                POST /api/ai-review
              </code>
            </p>
          </>
        ) : null}
      </div>
    </section>
  );
}
