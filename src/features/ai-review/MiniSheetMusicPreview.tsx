"use client";

import { useId } from "react";
import type { AiReviewReport } from "./types";
import { dashboardAnalysisCard, PianoKeysStripeLight } from "./PianoAnalysisChrome";

type Props = {
  report: AiReviewReport;
};

/** Visual stand-in until MusicXML/OSMD pipeline is wired to `/api/ai-review/sheet`. */
export function MiniSheetMusicPreview({ report }: Props) {
  const gradId = useId().replace(/:/g, "");
  const highlights = report.sheetMusicGuidance.sectionsToHighlight.slice(0, 4);
  const w = 440;
  const h = 120;
  const linesTreble = [28, 40, 52, 64, 76];

  return (
    <div className={`relative overflow-hidden ${dashboardAnalysisCard} p-6`}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_85%_0%,rgba(212,175,55,0.06),transparent)]" />
      <PianoKeysStripeLight className="relative z-[1] mb-4 rounded-md opacity-70" />

      <div className="relative z-[1] flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6b5612]">
            Score sketch · highlights
          </p>
          <p className="mt-1 max-w-md text-sm text-[#535356]">
            {report.mistakeReviewPlan.dynamicSheetMusicSummary}
          </p>
        </div>
        <div className="rounded-full border border-black/10 bg-[#fafaf9] px-3 py-1 text-[10px] text-[#535356]">
          Staff preview
        </div>
      </div>

      <div className="relative z-[1] mt-4 overflow-x-auto rounded-xl border border-black/10 bg-[#faf9f6] p-4 shadow-inner">
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden className="mx-auto">
          <rect x={0} y={0} width={w} height={h} fill={`url(#staffGrad-${gradId})`} rx={8} />
          <defs>
            <linearGradient id={`staffGrad-${gradId}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fdfcfa" />
              <stop offset="100%" stopColor="#f3f1eb" />
            </linearGradient>
          </defs>
          {linesTreble.map((y) => (
            <line
              key={y}
              x1={24}
              y1={y}
              x2={w - 24}
              y2={y}
              stroke="#c9bfb0"
              strokeOpacity={0.85}
              strokeWidth={1}
            />
          ))}
          <text
            x={28}
            y={22}
            fill="#aa8c2c"
            fontSize={11}
            fontFamily="system-ui, sans-serif"
          >
            Personalized recovery sketch
          </text>
          {[0, 1, 2, 3].map((i) => {
            const cx = 72 + i * 92;
            const weak = highlights[i];
            return (
              <g key={i}>
                <rect
                  x={cx - 18}
                  y={18}
                  width={56}
                  height={88}
                  fill={weak ? "rgba(212, 175, 55, 0.14)" : "rgba(255,255,255,0.5)"}
                  stroke={weak ? "rgba(212, 175, 55, 0.55)" : "rgba(0,0,0,0.08)"}
                  rx={4}
                />
                <ellipse
                  cx={cx + (i === 1 ? 8 : 0)}
                  cy={52}
                  rx={9}
                  ry={7}
                  fill={weak ? "#D4AF37" : "#4a453d"}
                  opacity={weak ? 0.92 : 0.55}
                />
                <line
                  x1={cx + 9}
                  y1={52}
                  x2={cx + 9}
                  y2={22}
                  stroke="#4a453d"
                  strokeWidth={2}
                  opacity={0.65}
                />
              </g>
            );
          })}
        </svg>
      </div>

      <div className="relative z-[1] mt-4 grid gap-3 sm:grid-cols-2">
        {highlights.map((hItem) => (
          <div
            key={hItem.label}
            className="rounded-lg border border-black/10 bg-[#fafaf9] px-3 py-2 text-xs leading-relaxed text-[#535356]"
          >
            <p className="font-semibold text-[#6b5612]">{hItem.label}</p>
            <p className="mt-0.5">{hItem.reason}</p>
          </div>
        ))}
      </div>

      <ul className="relative z-[1] mt-3 list-disc space-y-1 pl-5 text-xs text-[#535356]">
        {report.sheetMusicGuidance.annotations.slice(0, 6).map((a) => (
          <li key={a}>{a}</li>
        ))}
      </ul>
      <p className="relative z-[1] mt-3 text-[11px] text-[#8a7a68]">
        Difficulty: {report.sheetMusicGuidance.difficultyAdjustment}
      </p>
    </div>
  );
}
