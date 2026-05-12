"use client";

import { motion } from "motion/react";
import type { AiReviewReport } from "./types";

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
      className="relative overflow-hidden rounded-2xl border-2 border-[#D4AF37]/50 bg-white p-6 shadow-[0_20px_50px_rgba(10,10,11,0.08)]"
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-[#D4AF37]/15 blur-2xl" />
      <div className="relative flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#8a6d1d]">
            Premium · Mistake Review Plan
          </p>
          <h3 className="mt-1 text-2xl font-semibold text-[#0A0A0B]">Your recovery lab</h3>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="rounded-xl bg-[#0A0A0B] px-4 py-2 text-center text-white">
            <p className="text-[10px] uppercase tracking-wide text-[#D4AF37]">Daily target</p>
            <p className="text-xl font-bold tabular-nums">
              {plan.recommendedDailyPracticeMinutes}
              <span className="text-sm font-medium text-white/70"> min</span>
            </p>
          </div>
          <div className="rounded-xl border border-black/10 bg-[#F8F6F1] px-4 py-2">
            <p className="text-[10px] uppercase tracking-wide text-black/50">Mastery horizon</p>
            <p className="text-sm font-medium text-[#0A0A0B]">{plan.estimatedMasteryTimeline}</p>
          </div>
        </div>
      </div>

      <p className="relative mt-4 rounded-lg border border-black/5 bg-[#F8F6F1] px-4 py-3 text-sm leading-relaxed text-black/80">
        <span className="font-semibold text-[#0A0A0B]">Adaptive path: </span>
        {plan.adaptiveDifficultyNotes}
      </p>

      <div className="relative mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {lists.map((block) => (
          <div
            key={block.title}
            className="rounded-xl border border-black/8 bg-white/80 p-3 shadow-sm backdrop-blur-sm"
          >
            <p className="text-xs font-semibold text-[#0A0A0B]">
              <span className="mr-1 text-[#D4AF37]">{block.icon}</span>
              {block.title}
            </p>
            <ul className="mt-2 space-y-1.5 text-xs text-black/70">
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

      <div className="relative mt-4 rounded-xl border border-[#D4AF37]/30 bg-gradient-to-r from-[#fffdf6] to-[#f5f0e6] px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#6b5612]">
          Smart sequencing + metronome
        </p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <ul className="space-y-1 text-xs text-black/75">
            {plan.smartPracticeSequencing.map((s) => (
              <li key={s}>→ {s}</li>
            ))}
          </ul>
          <p className="text-xs leading-relaxed text-black/80">{plan.metronomeRhythmGuide}</p>
        </div>
      </div>
    </motion.div>
  );
}
