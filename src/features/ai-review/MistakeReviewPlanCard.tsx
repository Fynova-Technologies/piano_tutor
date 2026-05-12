"use client";

import { motion } from "motion/react";
import type { AiReviewReport } from "./types";
import { dashboardAnalysisCard, PianoKeysStripeLight } from "./PianoAnalysisChrome";

type Props = { report: AiReviewReport };

export function MistakeReviewPlanCard({ report }: Props) {
  const plan = report.mistakeReviewPlan;

  const lists: { title: string; items: string[]; icon: string }[] = [
    { title: "AI-generated exercises", items: plan.aiGeneratedExercises, icon: "✦" },
    { title: "Weak-area drills", items: plan.weakAreaDrills, icon: "◎" },
    { title: "Tempo correction", items: plan.tempoCorrectionTasks, icon: "𝕥" },
    { title: "Finger training", items: plan.fingerTrainingExercises, icon: "☝" },
    { title: "Rhythm recovery", items: plan.rhythmRecoverySessions, icon: "♪" },
    { title: "Repeat loops", items: plan.repeatPracticeLoops, icon: "↻" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className={`relative overflow-hidden ${dashboardAnalysisCard} p-6 transition duration-300 hover:shadow-[0_8px_24px_rgba(80,80,80,0.14)]`}
    >
      <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/35 to-transparent" />
      <PianoKeysStripeLight className="absolute left-0 right-0 top-0 rounded-t-2xl opacity-75" />

      <div className="relative flex flex-wrap items-center justify-between gap-3 pt-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8a7a68]">
            Lesson plan
          </p>
          <h3 className="mt-2 text-2xl font-bold primary-color-text">Recovery practice list</h3>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="rounded-xl border border-[#D4AF37]/50 bg-[#0A0A0B] px-4 py-2 text-center shadow-[0_5px_10px_0px_rgba(80,80,80,0.12)]">
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#D4AF37]">Daily target</p>
            <p className="text-xl font-bold tabular-nums text-[#f5edd8]">
              {plan.recommendedDailyPracticeMinutes}
              <span className="text-sm font-medium text-[#d8cfc0]/75"> min</span>
            </p>
          </div>
          <div className="rounded-xl border border-black/10 bg-[#fafaf9] px-4 py-2 shadow-inner">
            <p className="text-[10px] uppercase tracking-wide text-[#8a7a68]">Mastery horizon</p>
            <p className="text-sm font-medium text-[#151517]">{plan.estimatedMasteryTimeline}</p>
          </div>
        </div>
      </div>

      <p className="relative mt-4 rounded-lg border border-black/10 bg-[#fafaf9] px-4 py-3 text-sm leading-relaxed text-[#535356] shadow-inner">
        <span className="font-semibold text-[#151517]">Adaptive path: </span>
        {plan.adaptiveDifficultyNotes}
      </p>

      <div className="relative mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {lists.map((block) => (
          <div
            key={block.title}
            className="rounded-xl border border-black/10 bg-[#fafaf9]/95 p-3 shadow-sm"
          >
            <p className="text-xs font-semibold text-[#151517]">
              <span className="mr-1 text-[#b8922a]">{block.icon}</span>
              {block.title}
            </p>
            <ul className="mt-2 space-y-1.5 text-xs text-[#535356]">
              {block.items.slice(0, 5).map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#D4AF37]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="relative mt-4 rounded-xl border border-[#c9a227]/25 bg-gradient-to-r from-[#fffdf8] to-[#faf8f4] px-4 py-3 shadow-inner">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6b5612]">
          Smart sequencing + metronome
        </p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <ul className="space-y-1 text-xs text-[#535356]">
            {plan.smartPracticeSequencing.map((s) => (
              <li key={s}>→ {s}</li>
            ))}
          </ul>
          <p className="text-xs leading-relaxed text-[#535356]">{plan.metronomeRhythmGuide}</p>
        </div>
      </div>

      <PianoKeysStripeLight className="relative mt-6 rounded-md opacity-[0.65]" />
    </motion.div>
  );
}
