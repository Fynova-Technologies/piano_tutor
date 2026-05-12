"use client";

/**
 * Piano-inspired accents aligned with the dashboard (`#F8F6F1`, `#FEFEFE`, gold hover).
 * Prefer `PianoKeysStripeLight` + `dashboardAnalysisCard` for subtle keys cues on cream tiles.
 */

/** High-contrast stripe for dark chrome only */
export function PianoKeysStripe({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none h-4 w-full overflow-hidden rounded-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.35)] ${className}`}
      style={{
        backgroundImage:
          "repeating-linear-gradient(90deg, #0e0e12 0px, #0e0e12 12px, #f6f3eb 12px, #f6f3eb 26px)",
      }}
    />
  );
}

/** Soft keyboard stripe for dashboard-style light backgrounds */
export function PianoKeysStripeLight({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none h-2 w-full overflow-hidden rounded-sm ${className}`}
      style={{
        backgroundImage:
          "repeating-linear-gradient(90deg, #dad6cf 0px, #dad6cf 10px, #fdfcfa 10px, #fdfcfa 23px)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.65)",
      }}
    />
  );
}

/** Matches dashboard hero tiles (`MusicCategories`, AI dashboard card) */
export const dashboardAnalysisCard =
  "rounded-2xl border border-black/10 bg-[#FEFEFE] shadow-[0_5px_10px_0px_rgba(80,80,80,0.12)]";

/** Warm ivory panel — use sparingly when a softer inset than `#FEFEFE` helps */
export const pianoIvoryCard =
  "rounded-2xl border border-[#e8e4dc] bg-gradient-to-b from-[#fffefb] to-[#faf8f4] shadow-[0_4px_18px_rgba(42,35,28,0.06)]";

/** Dark lacquer accent — align with dashboard “Premium coach” chip (`#0A0A0B` / gold) */
export const pianoEbonyCard =
  "rounded-2xl border border-[#2a2624] bg-gradient-to-br from-[#141210] via-[#1c1816] to-[#12100e] text-[#f5edd8] shadow-[0_12px_40px_rgba(0,0,0,0.35)]";
