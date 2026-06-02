"use client";

import Image from "next/image";

const features = [
  {
    icon: "/assets/icons/majesticonsmusic.png",
    title: "Music Library",
    description:
      "Access thousands of sheet music pieces across all levels and genres. Search, filter, and organize your favorite scores.",
  },
  {
    icon:"/assets/icons/tablerbook.png",
    title: "Method Lessons",
    description:
      "Structured, step-by-step lessons designed from trusted piano method books to build strong fundamentals and technique progressively.",
  },
  {
    icon: "/assets/icons/streamline-freehandmusic-clef.png",
    title: "Sight Reading",
    description:
      "Improve your sight-reading skills with real-time feedback, progressive exercises, and performance tracking tailored to your level.",
  },
  {
    icon: "/assets/icons/boxiconshand.png",
    title: "Technique Lessons",
    description:
      "Master scales, arpeggios, chords, finger control, and hand coordination through focused exercises designed to improve precision and speed.",
  },
  {
    icon: "/assets/icons/magechart.png",
    title: "AI Performance Analysis",
    description:
      "Get AI-powered insights on your practice sessions. Detect mistakes, identify weak areas, track improvement, and receive personalized plans.",
  },
  {
    icon:"/assets/icons/magesound-waves.png",
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
        <div className="bg-[#0F0D0B] rounded-2xl overflow-hidden grid grid-cols-1 md:grid-cols-3 divide-y divide-[#2A2A2A] md:divide-y-0">
          {/* Top row */}
          {features.slice(0, 3).map((f, i) => (
            <div
              key={f.title}
              className={`p-7 flex flex-col gap-4 ${
                i < 2 ? "md:border-r border-[#2A2A2A]" : ""
              }`}
            >
              <div className="p-4 rounded-lg bg-[#0F0D0B] border border-[#EFC264] flex items-center justify-center w-9  h-9 text-[#C9A84C]">
                <Image  src ={f.icon} height={18} width={18} alt="icons" />
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
              <div className="p-4 rounded-lg bg-[#0F0D0B] border border-[#EFC264] flex items-center justify-center w-9  h-9 text-[#C9A84C]">
                <Image  src ={f.icon} height={18} width={18} alt="icons" />
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