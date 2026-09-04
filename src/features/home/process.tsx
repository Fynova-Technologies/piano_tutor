"use client";

import { useLessons } from "@/utils/userprogress/lessonprogress";
import { useRecentLessons } from "@/utils/userprogress/userrecentpost";

const steps = [
  {
    number: "01",
    title: "Assess Your Level",
    description:
      "A 3-minute interactive assessment places you exactly where you belong — no guesswork, no wasted lessons.",
  },
  {
    number: "02",
    title: "Follow Your Curriculum",
    description:
      "An AI-curated roadmap adapts weekly based on your performance, preferences, and goals.",
  },
  {
    number: "03",
    title: "Practice with Feedback",
    description:
      "Record your playing, get instant analysis on timing, dynamics, and note accuracy. Like having a teacher in the room.",
  },
  {
    number: "04",
    title: "Perform & Progress",
    description:
      "Share recordings, earn certificates, and unlock advanced repertoire as milestones are reached.",
  },
];

const WHITE_KEYS = 14;
const pattern = [true, true, false, true, true, true, false];

export default function ProcessSection() {
  const lessonsCtx = useLessons();
  const getOverallProgress = lessonsCtx?.getOverallProgress ?? (() => 0);
  const overallProgress = getOverallProgress();

  const { recentLessons, loading } = useRecentLessons();

  // Show at most a handful in this compact card
  const visibleRecent = recentLessons.slice(0, 4);

  // Accuracy stays hardcoded for now
  const accuracy = 88;

  return (
    <section className="bg-[#F5F2ED] px-4 sm:px-8 py-16 md:py-28">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-12 md:gap-16 items-center justify-center">

        {/* LEFT — text content */}
        <div className="flex-1 min-w-0 w-full">
          {/* Process label */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-px bg-[#C49A3C]" />
            <span className="text-[#C49A3C] text-[14px] tracking-[3.26px] uppercase font-medium font-inter">
              Process
            </span>
          </div>

          {/* Headline */}
          <div className="flex items-start">
            <span className="font-inter font-bold text-[clamp(36px,8vw,56px)] text-black leading-[1.08] tracking-[-0.58px] mb-6">
              From Zero<br />to{" "}
              <em className="text-[#D4AF37] font-black not-italic font-inter" style={{ fontStyle: "italic" }}>
                Sonata
              </em>
            </span>
          </div>

          {/* Subtext */}
          <div className="flex items-start ">
            <span className="text-[#5D5D5D] font-light text-start text-[14px] leading-relaxed mb-10 md:mb-12 max-w-md">
              A structured path that meets you wherever you are — beginner, lapsed
              player, or serious student.
            </span>
          </div>

          {/* Steps */}
          <div className="flex flex-col gap-7 md:gap-8">
            {steps.map((step, index) => (
              <div
                key={step.number}
                className={`flex gap-5 md:gap-6 pb-7 md:pb-8 ${
                  index !== steps.length - 1 ? "border-b border-[#00000014]" : ""
                }`}
              >
                <span className="text-[#C9A84C] font-dm-mono text-[14px] tracking-widest mt-0.5 w-8 h-8 p-6 shrink-0 border border-[#C49A3C33] rounded-full flex items-center justify-center">
                  {step.number}
                </span>
                <div>
                  <h3 className="text-[#1A1A1A] text-start font-bold text-sm mb-1 font-serif">
                    {step.title}
                  </h3>
                  <p className="text-[#8A8078] text-xs text-start leading-relaxed max-w-xs">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — dashboard card */}
        <div className="flex-1 min-w-0 w-full h-full flex items-center justify-center">
          <div className="bg-[#1A1A1A] rounded-2xl overflow-hidden w-full shadow-2xl">
            {/* Card header */}
            <div className="px-5 pt-5 pb-3">
              <p className="text-[#8A7A65] text-[10px] text-start tracking-[0.2em] uppercase mb-4">
                Dashboard
              </p>
              <p className="text-[#C9A84C] text-[9px] text-start tracking-[0.25em] uppercase font-medium mb-1">
                Current Course
              </p>
              <p className="text-white text-sm text-start font-semibold font-serif">
                {visibleRecent[0]?.course_title ?? "Nocturne in E♭ — Chopin"}
              </p>
              <p className="text-[#5A5A5A] text-start text-[10px] mt-0.5">
                Week 3 of 8 · Intermediate
              </p>
            </div>

            {/* Progress bars */}
            <div className="px-5 py-3 border-t border-[#2A2A2A]">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[#5A5A5A] text-[9px] tracking-[0.2em] uppercase">
                  Overall Progress
                </span>
                <span className="text-white text-[10px] font-medium">{overallProgress}%</span>
              </div>
              <div className="h-1 bg-[#2A2A2A] rounded-full mb-3">
                <div
                  className="h-1 bg-[#C9A84C] rounded-full transition-all duration-300"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[#5A5A5A] text-[9px] tracking-[0.2em] uppercase">
                  Accuracy
                </span>
                <span className="text-white text-[10px] font-medium">{accuracy}%</span>
              </div>
              <div className="h-1 bg-[#2A2A2A] rounded-full">
                <div className="h-1 bg-white/40 rounded-full" style={{ width: `${accuracy}%` }} />
              </div>
            </div>

            {/* Mini Piano */}
            <div className="px-5 py-3 border-t border-[#2A2A2A]">
              <div
                className="relative flex rounded-sm overflow-hidden border border-[#333]"
                style={{ height: "52px" }}
              >
                {Array.from({ length: WHITE_KEYS }).map((_, i) => (
                  <div
                    key={`w-${i}`}
                    className={`flex-1 border-r border-[#333] last:border-r-0 ${
                      i === 5 || i === 6 || i === 7
                        ? "bg-[#C9A84C]"
                        : "bg-[#E8E4DF]"
                    }`}
                  />
                ))}
                <div className="absolute inset-0 flex pointer-events-none">
                  {Array.from({ length: WHITE_KEYS }).map((_, i) => {
                    const posInOctave = i % 7;
                    const showBlack = pattern[posInOctave];
                    return showBlack ? (
                      <div key={`b-${i}`} className="relative" style={{ flex: 1 }}>
                        <div
                          className="absolute bg-[#111] rounded-b-sm z-10"
                          style={{ width: "62%", height: "58%", right: "-31%", top: 0 }}
                        />
                      </div>
                    ) : (
                      <div key={`bg-${i}`} style={{ flex: 1 }} />
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Recently Played (dynamic) */}
<div className="px-5 pb-5 pt-1 border-t border-[#2A2A2A] flex flex-col gap-0">
  {loading ? (
    Array.from({ length: 3 }).map((_, i) => (
      <div key={i} className="flex items-center gap-3 py-2.5">
        <div className="w-4 h-4 rounded-full bg-[#2A2A2A] animate-pulse shrink-0" />
        <div className="h-3 flex-1 rounded bg-[#2A2A2A] animate-pulse" />
      </div>
    ))
  ) : visibleRecent.length === 0 ? (
    <p className="text-[#4A4A4A] text-xs py-3">No recent lessons yet.</p>
  ) : (
    visibleRecent.map((lesson, i) => {
      const isActive = i === 0; // most recently played
      const isCompleted = lesson.iscompleted;

      return (
        <div
          key={lesson.id}
          className={`flex items-center justify-between py-2.5 ${
            isActive
              ? "border-l-2 border-[#C9A84C] -ml-5 pl-[18px] bg-[#C9A84C]/5"
              : ""
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            {/* Indicator — fixed-size slot so a thumbnail image can drop in later without layout shift */}
            <div
              className={`relative w-4 h-4 rounded-full shrink-0 overflow-hidden flex items-center justify-center ${
                isCompleted
                  ? "bg-[#C9A84C]"
                  : isActive
                  ? "border-2 border-[#C9A84C]"
                  : "border border-[#3A3A3A]"
              }`}
            >
              {/* TODO: swap this for <Image src={lesson.image_url} fill className="object-cover" /> once thumbnails are ready */}
              {isCompleted && (
                <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                  <path
                    d="M1 3L3 5L7 1"
                    stroke="#1A1A1A"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
            <span
              className={`text-xs truncate ${
                isActive ? "text-white font-semibold" : "text-[#5A5A5A]"
              }`}
            >
              {lesson.lesson_title}
            </span>
          </div>
          <span className="text-[#4A4A4A] text-[10px] shrink-0 ml-2 truncate max-w-[90px]">
            {lesson.course_title}
          </span>
        </div>
      );
    })
  )}
</div>
          </div>
        </div>
      </div>
    </section>
  );
}