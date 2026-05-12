"use client";

import type { AiReviewReport } from "./types";

type Props = {
  report: AiReviewReport;
};

/** Visual stand-in until MusicXML/OSMD pipeline is wired to `/api/ai-review/sheet`. */
export function MiniSheetMusicPreview({ report }: Props) {
  const highlights = report.sheetMusicGuidance.sectionsToHighlight.slice(0, 4);
  const w = 440;
  const h = 120;
  const linesTreble = [28, 40, 52, 64, 76];

  return (
    <div className="rounded-2xl border border-[#D4AF37]/35 bg-gradient-to-b from-[#0A0A0B] via-[#15151a] to-[#0A0A0B] p-5 text-white shadow-lg">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D4AF37]">
            Dynamic AI sheet (preview)
          </p>
          <p className="mt-1 max-w-md text-sm text-white/80">
            {report.mistakeReviewPlan.dynamicSheetMusicSummary}
          </p>
        </div>
        <div className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10px] text-white/70">
          Adaptive layout · Annotations below
        </div>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-white/10 bg-black/40 p-4">
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden className="mx-auto">
          <rect x={0} y={0} width={w} height={h} fill="url(#staffGrad)" rx={8} />
          <defs>
            <linearGradient id="staffGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#1a1a22" />
              <stop offset="100%" stopColor="#0f0f12" />
            </linearGradient>
          </defs>
          {linesTreble.map((y) => (
            <line
              key={y}
              x1={24}
              y1={y}
              x2={w - 24}
              y2={y}
              stroke="#f5f0e6"
              strokeOpacity={0.35}
              strokeWidth={1}
            />
          ))}
          <text
            x={28}
            y={22}
            fill="#D4AF37"
            fontSize={11}
            fontFamily="var(--font-inter), system-ui, sans-serif"
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
                  fill={weak ? "rgba(212, 175, 55, 0.18)" : "rgba(255,255,255,0.04)"}
                  stroke={weak ? "rgba(212, 175, 55, 0.65)" : "rgba(255,255,255,0.12)"}
                  rx={4}
                />
                <ellipse
                  cx={cx + (i === 1 ? 8 : 0)}
                  cy={52}
                  rx={9}
                  ry={7}
                  fill={weak ? "#D4AF37" : "#e8e2d6"}
                  opacity={0.92}
                />
                <line
                  x1={cx + 9}
                  y1={52}
                  x2={cx + 9}
                  y2={22}
                  stroke="#e8e2d6"
                  strokeWidth={2}
                  opacity={0.85}
                />
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {highlights.map((hItem) => (
          <div
            key={hItem.label}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs leading-relaxed"
          >
            <p className="font-semibold text-[#D4AF37]">{hItem.label}</p>
            <p className="mt-0.5 text-white/75">{hItem.reason}</p>
          </div>
        ))}
      </div>

      <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-white/70">
        {report.sheetMusicGuidance.annotations.slice(0, 6).map((a) => (
          <li key={a}>{a}</li>
        ))}
      </ul>
      <p className="mt-3 text-[11px] text-white/50">
        Difficulty: {report.sheetMusicGuidance.difficultyAdjustment}
      </p>
    </div>
  );
}
