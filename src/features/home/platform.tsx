"use client";

const features = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18V5l12-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="16" r="3" />
      </svg>
    ),
    title: "Music Library",
    description:
      "Access thousands of sheet music pieces across all levels and genres. Search, filter, and organize your favorite scores.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <path d="M14 17h7M17.5 14v7" />
      </svg>
    ),
    title: "Method Lessons",
    description:
      "Structured, step-by-step lessons designed from trusted piano method books to build strong fundamentals and technique progressively.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 12h2m16 0h2M12 2v2m0 16v2" />
        <circle cx="12" cy="12" r="4" />
        <path d="M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M19.07 4.93l-1.41 1.41M5.34 18.66l-1.41 1.41" />
      </svg>
    ),
    title: "Sight Reading",
    description:
      "Improve your sight-reading skills with real-time feedback, progressive exercises, and performance tracking tailored to your level.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
        <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
        <line x1="6" y1="1" x2="6" y2="4" />
        <line x1="10" y1="1" x2="10" y2="4" />
        <line x1="14" y1="1" x2="14" y2="4" />
      </svg>
    ),
    title: "Technique Lessons",
    description:
      "Master scales, arpeggios, chords, finger control, and hand coordination through focused exercises designed to improve precision and speed.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
    title: "AI Performance Analysis",
    description:
      "Get AI-powered insights on your practice sessions. Detect mistakes, identify weak areas, track improvement, and receive personalized plans.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
        <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3v5z" />
        <path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3v5z" />
      </svg>
    ),
    title: "340+ Curated Pieces",
    description:
      "From Bach inventions to Debussy impressions to contemporary pop — interactive sheet music in every lesson.",
  },
];

export default function PlatformSection() {
  return (
    <section className="bg-[#F5F2ED] px-8 py-20 md:py-28">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="text-center mb-14">
          <div className="flex items-center justify-center gap-3 mb-5">
            <div className="w-8 h-px bg-[#C9A84C]" />
            <span className="text-[#C9A84C] text-[10px] tracking-[0.3em] uppercase font-medium">
              Platform
            </span>
            <div className="w-8 h-px bg-[#C9A84C]" />
          </div>
          <h2 className="font-serif text-5xl md:text-6xl font-black text-[#1A1A1A] leading-tight mb-4">
            Everything a{" "}
            <br className="hidden md:block" />
            <em className="text-[#C9A84C]">Modern Pianist</em>{" "}
            Needs
          </h2>
          <p className="text-[#8A8078] text-sm max-w-md mx-auto leading-relaxed">
            Built for the way people actually learn — in bursts, on phones, between
            meetings, and with real musical taste.
          </p>
        </div>

        {/* Feature grid */}
        <div className="bg-[#1C1C1C] rounded-2xl overflow-hidden grid grid-cols-1 md:grid-cols-3 divide-y divide-[#2A2A2A] md:divide-y-0">
          {/* Top row */}
          {features.slice(0, 3).map((f, i) => (
            <div
              key={f.title}
              className={`p-7 flex flex-col gap-4 ${
                i < 2 ? "md:border-r border-[#2A2A2A]" : ""
              }`}
            >
              <div className="w-9 h-9 rounded-lg bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center justify-center text-[#C9A84C]">
                {f.icon}
              </div>
              <div>
                <h3 className="text-white font-bold text-sm font-serif mb-2">
                  {f.title}
                </h3>
                <p className="text-[#666] text-xs leading-relaxed">{f.description}</p>
              </div>
            </div>
          ))}

          {/* Divider row */}
          <div className="md:col-span-3 h-px bg-[#2A2A2A]" />

          {/* Bottom row */}
          {features.slice(3).map((f, i) => (
            <div
              key={f.title}
              className={`p-7 flex flex-col gap-4 ${
                i < 2 ? "md:border-r border-[#2A2A2A]" : ""
              }`}
            >
              <div className="w-9 h-9 rounded-lg bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center justify-center text-[#C9A84C]">
                {f.icon}
              </div>
              <div>
                <h3 className="text-white font-bold text-sm font-serif mb-2">
                  {f.title}
                </h3>
                <p className="text-[#666] text-xs leading-relaxed">{f.description}</p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}