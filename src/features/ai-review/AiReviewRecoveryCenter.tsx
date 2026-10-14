/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { motion } from "motion/react";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { RefreshCw, FileText, Target, Clock, AlertTriangle, BookOpen, Zap, ChevronRight, Calendar, TrendingUp, Eye, ArrowRight } from "lucide-react";
import { useAiReview } from "./useAiReview";
import { AiReviewCharts } from "./AiReviewCharts";
import { HandBalanceCard } from "./handbalancecard";
import { formatDelta } from "./formatDelta";

import {
  // analysisAccentGradient,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  analysisLabelPlum,
  analysisShellBg,
} from "@/features/ai-review/PianoAnalysisChrome";
import { PracticeNoteInsightsSection } from "@/features/ai-review/PracticeNoteInsightsSection";
import Image from "next/image";
import { History } from "lucide-react";




function RecoveryDrillsBanner({
  count,
  onStart,
}: {
  count: number;
  onStart?: () => void;
}) {
  return (
    <div className="flex w-full flex-col gap-4 rounded-2xl border border-[#EDDEC6] bg-[#FFFFFF] px-6 py-5 shadow-[0_4px_24px_rgba(0,0,0,0.04)] sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        {/* Icon badge */}
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-[#FAF1E3]">
          <History className="h-5 w-5 text-[#E7B762]" strokeWidth={2} />
        </div>

        <div className="min-w-0">
          <h3 className="font-playfair text-[1.15rem] font-bold leading-tight text-[#1A1813]">
            {count} recovery {count === 1 ? "drill is" : "drills are"} ready
          </h3>
          <p className="mt-1 max-w-[260px] text-[13px] leading-snug text-[#5D5D5D]">
            Short practice made from the notes you missed.
          </p>
        </div>
      </div>

      {/* CTA */}
      <button
        type="button"
        onClick={onStart}
        className="inline-flex font-medium text-[15px] flex-shrink-0 items-center justify-center gap-2 rounded-full bg-gradient-to-b from-[#E2B258] to-[#C28C33] px-6 py-2.5 text-[#1A1813] shadow-[0_6px_16px_rgba(197,147,88,0.35)] transition-all hover:brightness-105 hover:shadow-[0_8px_20px_rgba(197,147,88,0.45)] active:scale-[0.98]"
      >
        Start practicing
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}


/* ─────────────────────────────────────────────
   Stat Cell
───────────────────────────────────────────── */
function StatCell({
  icon: Icon,
  value,
  unit,
  label,
  delta,
}: {
  icon: string | React.ComponentType<any> | any;
  value?: React.ReactNode;
  unit?: string;
  label?: React.ReactNode;
  delta?: string;
}) {
  return (

    
    <div className="flex flex-col  justify-center py-5 px-4 ">
      <div className="pb-4">
            <Image className={`rounded-full border border-[#3E3427] bg-[#FAF6EE] p-2`} src={Icon} alt="" width={30} height={30} />
          </div>
      <div className="text-[34px] font-bold text-[#000000]">
        {value}{unit && <span className="text-base font-medium text-neutral-500 ml-0.5">{unit}</span>}
      </div>
      <div className="text-[14px] text-black mt-0.5 font-semibold">{label}</div>
      {delta && (
  <div
    className={`flex items-center gap-1 text-[11px] font-semibold mt-1`}
  >
    <span className="text-[12px] text-[#5D5D5D] mt-0.5 font-normal">{delta}</span>
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
   Main Component
───────────────────────────────────────────── */
export default function AiReviewRecoveryCenter() {
  const { snapshot, report, loading, pendingRefresh, refetch } =
    useAiReview();

  if (!snapshot) {
    return (
      <section className={`border-y border-black/[0.04] ${analysisShellBg} py-14`}>
        <div className="mx-auto max-w-10xl px-4">
          <SkeletonBlock />
        </div>
      </section>
    );
  }

  const accuracyDelta = formatDelta(snapshot.recentAvgScore, snapshot.previousPeriodAvgScore);
const practiceDelta = formatDelta(
  snapshot.recentAvgPracticeMinutes,
  snapshot.previousAvgPracticeMinutes
);

  return (
    <section className="relative pb-16 pt-10 md:pt-12 bg-[#F8F6F1] min-h-screen">
      <div className="relative mx-auto max-w-[min(1200px,100%)] px-4 md:px-6">

        {/* ── Header ── */}
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <div className={`inline-flex items-center rounded-full py-1.5 text-[11px] uppercase tracking-[1.5px] text-[#C59358] font-bold`}>AI Performance
            </div>
            <h2 className="mt-3 text-[1.9rem] font-bold font-playfair  tracking-tight text-[#0F172A] leading-tight">
              Your practice snapshot
            </h2>
            <p className="mt-1.5 text-sm text-[#585858]">
              Smart tips to help you practice better, not just more.
            </p>
          </div>
          <div className="flex gap-2.5 items-center flex-shrink-0">
            <button
              type="button"
              onClick={() => void refetch()}
              disabled={pendingRefresh}
              className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold border border-[#2B2F3B] text-[#E5E7EB] bg-[#171920] shadow-sm hover:shadow-md transition-all disabled:opacity-50"
            >
              {/* <RefreshCw className={`h-3.5 w-3.5 text-neutral-600 ${pendingRefresh ? "animate-spin" : ""}`} /> */}
              Refresh
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold border border-[#2B2F3B] text-[#E5E7EB] bg-[#171920] shadow-sm hover:shadow-md transition-all disabled:opacity-50"
            >
              {/* <FileText className="h-3.5 w-3.5 text-neutral-600" /> */}
              Export PDF
            </button>
          </div>
        </motion.header>

        {/* ── Stats Strip ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.06 }}
          className="bg-white rounded-2xl border border-[#E6E6E6]  mb-5 overflow-hidden"
        >
            <div className="grid grid-cols-4">
            {/* Overall ring */}
            <div className="flex flex-col items-center justify-center py-5 px-4">
              <StatCell icon="/aistaryellow.svg" label="Overall Score" value={snapshot.recentAvgScore ?? 82} delta="Good Job! Keep going" />
            </div>

            <StatCell
              icon="/ainoteyellow.svg"
              value={snapshot.sessionCount}
              label="Sessions Analyzed"
              delta={`${snapshot.sessionsLast7Days} in the last 7 days`}
            />
            <StatCell
              icon="/airightyellow.svg"
              value={`${report?.accuracyScore ?? snapshot.recentAvgScore}%`}
              label="Accuracy"
              delta={accuracyDelta.text}
            />
            <StatCell
              icon="/aiclockyello.svg"
              value={snapshot.recentAvgPracticeMinutes}
              unit="min"
              label="Avg. Practice Time"
              delta={practiceDelta.text}
            />
          </div>
        </motion.div>
        <div className="grid grid-cols-2 mb-5 gap-[20px]">
          <div className="grid gap-[20px]">          
            <HandBalanceCard insights={snapshot.handInsights} />
            <div>
              <RecoveryDrillsBanner count={3} onStart={() => {}} />
            </div>
          </div>
          <AiReviewCharts snapshot={snapshot} />
</div>

        {/* ── Middle Row: Note Habits + Quick Actions ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.12 }}
          className="grid gap-4 mb-5"
        >
          {/* Note Habits */}
          <PracticeNoteInsightsSection
            refreshKey={`${snapshot.sessionCount}|${snapshot.lastSessionAt ?? ""}|${snapshot.totalPracticeMinutes}`}
          />

          
        </motion.div>

        

        {/* ── Loading skeleton ── */}
        {loading && !report ? (
          <div className="mb-6">
            <SkeletonBlock />
          </div>
        ) : null}

      </div>
    </section>
  );
}