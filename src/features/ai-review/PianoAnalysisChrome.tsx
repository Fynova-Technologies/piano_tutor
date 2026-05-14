"use client";

/**
 * Shared chrome + themes.
 *
 * `/ai-analysis` uses a reports-inspired palette (ideas-only): warm beige shell,
 * charcoal nav, amber→orange gradients for primary emphasis, plum for charts / slip data.
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

/** Soft keyboard stripe — ivory / graphite */
export function PianoKeysStripeLight({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none h-2 w-full overflow-hidden rounded-sm ${className}`}
      style={{
        backgroundImage:
          "repeating-linear-gradient(90deg, #e8e4dc 0px, #e8e4dc 10px, #fdfcfa 10px, #fdfcfa 23px)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.65)",
      }}
    />
  );
}

/** Dashboard-style tiles (legacy) */
export const dashboardAnalysisCard =
  "rounded-2xl border border-black/10 bg-[#FEFEFE] shadow-[0_5px_10px_0px_rgba(80,80,80,0.12)]";

/** Analysis cards — white float on beige shell */
export const premiumAnalysisCard =
  "rounded-2xl border border-black/[0.06] bg-white shadow-[0_10px_36px_rgba(45,35,55,0.06)]";

/** AI analysis page shell */
export const analysisShellBg = "bg-[#F5F4EF]";
export const analysisNavBg = "bg-[#2d2d2d]";
/** Primary CTA / active nav pill */
export const analysisAccentGradient =
  "bg-gradient-to-r from-[#f5d94a] via-[#f0b429] to-[#ea8f26] font-semibold text-neutral-900 shadow-sm";

export const analysisNavIdle =
  "rounded-full px-4 py-1.5 text-xs font-medium text-white/78 transition hover:bg-white/10 hover:text-white";

export const analysisNavActive = `rounded-full px-4 py-1.5 text-xs ${analysisAccentGradient}`;

/** Uppercase labels for data / slips */
export const analysisLabelPlum =
  "text-xs font-semibold uppercase tracking-wide text-[#6e4d7d]";

/** Inline code / tinted panels */
export const analysisMutedSurface = "bg-[#ede9e4]";
export const analysisCodeBg = "bg-[#F5F4EF]";

/** SVG / chart accents */
export const ANALYSIS_PLUM = "#6e4d7d";
export const ANALYSIS_PLUM_DEEP = "#54355f";
export const ANALYSIS_PLUM_SOFT = "#8b6f9e";

export const pianoIvoryCard =
  "rounded-2xl border border-[#e8e4dc] bg-gradient-to-b from-[#fffefb] to-[#faf8f4] shadow-[0_4px_18px_rgba(42,35,28,0.06)]";

export const pianoEbonyCard =
  "rounded-2xl border border-[#2a2624] bg-gradient-to-br from-[#141210] via-[#1c1816] to-[#12100e] text-[#f5edd8] shadow-[0_12px_40px_rgba(0,0,0,0.35)]";
