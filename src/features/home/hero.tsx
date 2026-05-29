"use client";

export default function Hero() {
  return (
    <section className="bg-[#F5F2ED] flex flex-col items-center text-center pt-16 pb-10 px-6">
      {/* Ornamental divider */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-14 h-px bg-[#C9A84C]" />
        <div className="w-1.5 h-1.5 bg-[#C9A84C] rotate-45" />
        <div className="w-14 h-px bg-[#C9A84C]" />
      </div>

      {/* Subtitle */}
      <p className="text-[#C9A84C] text-[10px] tracking-[0.35em] uppercase mb-10 font-medium">
        Est. 2026 · Classical &amp; Contemporary
      </p>

      {/* Main headline */}
      <h1 className="leading-none mb-8">
        <span className="block text-[#1A1A1A] font-black text-7xl md:text-8xl tracking-tight font-serif">
          MASTER
        </span>
        <span className="block text-[#1A1A1A] font-black italic text-7xl md:text-8xl tracking-tight font-serif">
          PIANO.
        </span>
        <span className="block text-[#C9A84C] font-black text-7xl md:text-8xl tracking-tight font-serif">
          ANYTIME.
        </span>
      </h1>

      {/* Body copy */}
      <p className="text-[#5A5047] text-sm md:text-base max-w-md leading-relaxed mb-10">
        From your very first note to concert-level repertoire — Learnkeys
        adapts to your pace, your taste, and your schedule. No metronome
        anxiety required.
      </p>

      {/* CTA buttons */}
      <div className="flex items-center gap-4">
        <button className="bg-[#C9A84C] text-white text-xs tracking-[0.2em] uppercase font-semibold rounded-full px-8 py-3.5 hover:bg-[#B8963E] transition-colors duration-200 shadow-sm">
          Start Free — 14 Days
        </button>
        <button className="border border-[#1A1A1A] text-[#1A1A1A] text-xs tracking-[0.2em] uppercase font-medium rounded-full px-8 py-3.5 hover:bg-[#1A1A1A] hover:text-white transition-colors duration-200 flex items-center gap-2">
          <span className="text-[10px]">▶</span>
          Watch Demo
        </button>
      </div>
    </section>
  );
}
