"use client";
import Image from "next/image";
import Link from 'next/link'

export default function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center text-center overflow-hidden px-4">
      {/* ── Piano keyboard background ── */}
      <PianoBackground />

      {/* Gold glow */}
      <div
        className="absolute inset-0 z-[3] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(196,154,60,0.08) 0%, transparent 70%)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-4xl">
        {/* Ornamental divider */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 sm:w-14 h-px bg-[#C49A3C]" />
          <div className="w-1.5 h-1.5 bg-[#C49A3C] rotate-45" />
          <div className="w-10 sm:w-14 h-px bg-[#C49A3C]" />
        </div>

        {/* Subtitle */}
        <p className="text-[#C49A3C] text-[10px] sm:text-[11px] tracking-[0.25em] sm:tracking-[0.35em] uppercase mb-6 sm:mb-8 font-playfair font-[900]">
          Est. 2026 · Classical &amp; Contemporary
        </p>

        {/* Main headline */}
        <h1 className="leading-none mb-6 sm:mb-7">
          <span className="block text-white font-black font-playfair text-[clamp(3rem,12vw,7rem)] md:text-8xl tracking-tight">
            MASTER
          </span>
          <span className="block text-[#E8E8E8] font-black italic font-playfair text-[clamp(3rem,12vw,7rem)] md:text-8xl tracking-tight">
            PIANO.
          </span>
          <span className="block text-[#C49A3C] font-black font-playfair text-[clamp(3rem,12vw,7rem)] md:text-8xl tracking-tight">
            ANYTIME.
          </span>
        </h1>

        {/* Body copy */}
        <p className="text-white text-[15px] sm:text-[17px] md:text-[19.2px] tracking-[0.38px] font-normal max-w-xl md:max-w-2xl leading-relaxed mb-7 sm:mb-9 font-inter">
          From your very first note to concert-level repertoire — Learnkeys
          adapts to your pace, your taste, and your schedule. No metronome
          anxiety required.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full sm:w-auto">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto bg-[#C49A3C] text-white text-[13px] sm:text-[14px] tracking-[2.89px] uppercase font-medium rounded-full px-8 sm:px-[38.4px] py-[14.4px] hover:bg-[#B8963E] transition-all duration-200 shadow-[0_4px_24px_rgba(196,154,60,0.35)] hover:shadow-[0_6px_32px_rgba(196,154,60,0.5)] hover:-translate-y-px"
          >
            Get Started
          </Link>
          <Link
            href="/demo"
            className="w-full sm:w-auto border border-white/45 text-white text-[13px] sm:text-[14px] tracking-[2.89px] uppercase font-medium rounded-full px-8 py-3.5 hover:bg-white/8 hover:border-white/70 transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <span className="text-[9px]">▶</span>
            Watch Demo
          </Link>
        </div>
      </div>
    </section>
  );
}

// Generates realistic piano keys in CSS
function PianoBackground() {
  return (
    <div className="absolute inset-0 z-0 bg-[#0a0a0a] overflow-hidden">
      {/* The actual image */}
      <Image
        src="/assets/image3.png"
        alt="Piano background"
        fill
        className="object-cover object-center"
      />
      {/* Blur layer — strong at top, fades to nothing at bottom */}
      <div
        className="absolute inset-0"
        style={{
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          maskImage: "radial-gradient(to bottom, black 80%, black 80%, transparent 45%)",
          WebkitMaskImage: "radial-gradient(to bottom, black 90%, black 80%, transparent 45%)",
        }}
      />
      {/* Dark overlay — heavier at top for text legibility, clears at bottom */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            linear-gradient(to bottom,
              rgba(0,0,0,0.75) 100%,
              rgba(0,0,0,0.55) 40%,
              rgba(0,0,0,0.15) 75%,
              rgba(0,0,0,0.0) 100%)
          `,
        }}
      />
    </div>
  );
}