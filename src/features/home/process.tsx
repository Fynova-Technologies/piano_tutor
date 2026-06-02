"use client";

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

const lessons = [
  { title: "Introduction & Score Reading", duration: "18m", done: true },
  { title: "Left Hand Accompaniment", duration: "25m", done: true },
  { title: "Melody Phrasing & Dynamics", duration: "32m", active: true },
  { title: "Pedal Technique", duration: "28m", done: false },
];

// Mini piano key pattern for the dashboard card
const WHITE_KEYS = 14;
const pattern = [true, true, false, true, true, true, false]; // which whites have black keys after

export default function ProcessSection() {
  return (
    <section className="bg-[#F5F2ED] px-8 py-20 md:py-28">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-16 items-start">
        
        {/* LEFT — text content */}
        <div className="flex-1 min-w-0">
          {/* Process label */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-px bg-[#C49A3C]" />
            <span className="text-[#C49A3C] text-[14px] tracking-[3.26px] uppercase font-medium font-inter">
              Process
            </span>
          </div>

          {/* Headline */}
          <div className="flex items-start">
          <span className="font-inter font-bold text-[56px] text-black leading-[60px] tracking-[-0.58px] mb-6">
            From Zero<br/>to{" "}
            <em className="text-[#D4AF37] font-black not-italic text-[56px] leading-[60px] tracking-[-0.58px] font-inter" style={{ fontStyle: "italic" }}>
              Sonata
            </em>
          </span>
          </div>

          {/* Subtext */}
          <div className="flex items-start">
          <span className="text-[#5D5D5D] font-light text-start text-[14px] leading-relaxed mb-12 max-w-md">
            A structured path that meets you wherever you are — beginner, lapsed
            player, or serious student.
          </span>
          </div>

          {/* Steps */}
          <div className="flex flex-col gap-8">
            {steps.map((step) => (
              <div key={step.number} className="flex gap-6">
                <span className="text-[#C9A84C] text-xs font-bold tracking-widest mt-0.5 w-6 shrink-0">
                  {step.number}
                </span>
                <div>
                  <h3 className="text-[#1A1A1A] font-bold text-sm mb-1 font-serif">
                    {step.title}
                  </h3>
                  <p className="text-[#8A8078] text-xs leading-relaxed max-w-xs">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — dashboard card */}
        <div className="flex-1 min-w-0 flex items-center justify-center">
          <div className="bg-[#1A1A1A] rounded-2xl overflow-hidden w-full max-w-sm shadow-2xl">
            {/* Card header */}
            <div className="px-5 pt-5 pb-3">
              <p className="text-[#5A5A5A] text-[10px] tracking-[0.2em] uppercase mb-4">
                learnkeys.app — dashboard
              </p>

              <p className="text-[#C9A84C] text-[9px] tracking-[0.25em] uppercase font-medium mb-1">
                Current Course
              </p>
              <p className="text-white text-sm font-semibold font-serif">
                Nocturne in E♭ — Chopin
              </p>
              <p className="text-[#5A5A5A] text-[10px] mt-0.5">
                Week 3 of 8 · Intermediate
              </p>
            </div>

            {/* Progress bars */}
            <div className="px-5 py-3 border-t border-[#2A2A2A]">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[#5A5A5A] text-[9px] tracking-[0.2em] uppercase">
                  Overall Progress
                </span>
                <span className="text-white text-[10px] font-medium">64%</span>
              </div>
              <div className="h-1 bg-[#2A2A2A] rounded-full mb-3">
                <div className="h-1 bg-[#C9A84C] rounded-full" style={{ width: "64%" }} />
              </div>

              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[#5A5A5A] text-[9px] tracking-[0.2em] uppercase">
                  Accuracy
                </span>
                <span className="text-white text-[10px] font-medium">88%</span>
              </div>
              <div className="h-1 bg-[#2A2A2A] rounded-full">
                <div className="h-1 bg-white/40 rounded-full" style={{ width: "88%" }} />
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
                {/* Black keys */}
                <div className="absolute inset-0 flex pointer-events-none">
                  {Array.from({ length: WHITE_KEYS }).map((_, i) => {
                    const posInOctave = i % 7;
                    const showBlack = pattern[posInOctave];
                    return showBlack ? (
                      <div key={`b-${i}`} className="relative" style={{ flex: 1 }}>
                        <div
                          className="absolute bg-[#111] rounded-b-sm z-10"
                          style={{
                            width: "62%",
                            height: "58%",
                            right: "-31%",
                            top: 0,
                          }}
                        />
                      </div>
                    ) : (
                      <div key={`bg-${i}`} style={{ flex: 1 }} />
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Lesson list */}
            <div className="px-5 pb-5 pt-1 border-t border-[#2A2A2A] flex flex-col gap-0">
              {lessons.map((lesson, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between py-2.5 ${
                    lesson.active
                      ? "border-l-2 border-[#C9A84C] -ml-5 pl-[18px] bg-[#C9A84C]/5"
                      : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {lesson.done ? (
                      <div className="w-4 h-4 rounded-full bg-[#C9A84C] flex items-center justify-center shrink-0">
                        <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                          <path
                            d="M1 3L3 5L7 1"
                            stroke="#1A1A1A"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    ) : lesson.active ? (
                      <div className="w-4 h-4 rounded-full border-2 border-[#C9A84C] shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-[#3A3A3A] shrink-0" />
                    )}
                    <span
                      className={`text-xs ${
                        lesson.active
                          ? "text-white font-semibold"
                          : lesson.done
                          ? "text-[#5A5A5A]"
                          : "text-[#4A4A4A]"
                      }`}
                    >
                      {lesson.title}
                    </span>
                  </div>
                  <span className="text-[#4A4A4A] text-[10px] shrink-0 ml-2">
                    {lesson.duration}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}