"use client";

import { useEffect, useMemo, useState } from "react";
import { getMergedPracticeSessions } from "@/lib/practiceSessions/merge";
import {
  aggregateNoteMistakeInsights,
  type NoteMistakeInsights,
} from "@/lib/practiceSessions/noteInsights";
import {
  analysisLabelPlum,
  premiumAnalysisCard,
} from "@/features/ai-review/PianoAnalysisChrome";

type Props = {
  refreshKey: string;
};

/* ---------- helpers ---------- */

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const BLACK_PITCH_CLASSES = new Set([1, 3, 6, 8, 10]);

const midiToName = (midi: number) => `${NOTE_NAMES[midi % 12]}${Math.floor(midi / 12) - 1}`;

// heat scale: pale cream -> deep orange-red
const HEAT_LOW = [251, 236, 214];
const HEAT_HIGH = [220, 90, 53];

function heatColor(count: number, max: number) {
  if (!count || !max) return `rgb(${HEAT_LOW.join(",")})`;
  const t = Math.min(1, count / max);
  const rgb = HEAT_LOW.map((l, i) => Math.round(l + (HEAT_HIGH[i] - l) * t));
  return `rgb(${rgb.join(",")})`;
}

const times = (n: number) => `${n} ${n === 1 ? "time" : "times"}`;

/* ---------- small UI pieces ---------- */

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-3 rounded-[6px] border border-[#DBDBDB] bg-[#FAF6EE] px-4 py-3 text-[12px] leading-relaxed text-[#6B6259]">
      {children}
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h4 className="text-[16px] font-semibold text-[#505050]">{children}</h4>;
}

/* ---------- piano heatmap ---------- */

function PianoHeatmap({ counts }: { counts: Map<number, number> }) {
  const { whites, blacks, max } = useMemo(() => {
    const keys = [...counts.keys()];
    // default to one octave (C4–B4), expand to cover any wrong notes outside it
    const lo = Math.min(60, ...keys);
    const hi = Math.max(71, ...keys);
    const start = Math.floor(lo / 12) * 12;
    const end = Math.floor(hi / 12) * 12 + 11;

    const whites: number[] = [];
    const blacks: { midi: number; whitesBefore: number }[] = [];
    for (let m = start; m <= end; m++) {
      if (BLACK_PITCH_CLASSES.has(m % 12)) blacks.push({ midi: m, whitesBefore: whites.length });
      else whites.push(m);
    }
    return { whites, blacks, max: Math.max(1, ...counts.values()) };
  }, [counts]);

  const keyW = 100 / whites.length;
  const blackW = keyW * 0.62;

  return (
    <div className="mt-5 max-w-[50%] ">
      {/* counts above white keys */}
      <div className="flex">
        {whites.map((midi) => {
          const c = counts.get(midi) ?? 0;
          return (
            <div
              key={midi}
              className="h-5 flex-1 text-center text-[11px] font-semibold tabular-nums text-[#D9772B]"
            >
              {c > 0 ? `${c}×` : ""}
            </div>
          );
        })}
      </div>

      <div className="relative h-[148px] w-full">
        {/* white keys */}
        <div className="absolute inset-0 flex">
          {whites.map((midi) => {
            const c = counts.get(midi) ?? 0;
            return (
              <div
                key={midi}
                title={`${midiToName(midi)}${c ? ` · pressed by mistake ${times(c)}` : ""}`}
                className="flex flex-1 items-end justify-center rounded-b-[6px] border-r border-white/70 pb-3 shadow-[0_2px_5px_rgba(0,0,0,0.12)] first:rounded-bl-[8px] last:rounded-br-[8px] last:border-r-0"
                style={{ backgroundColor: heatColor(c, max) }}
              >
                <span className="text-[11px] font-bold text-[#1F1A17]">{midiToName(midi)}</span>
              </div>
            );
          })}
        </div>

        {/* black keys */}
        {blacks.map(({ midi, whitesBefore }) => {
          const c = counts.get(midi) ?? 0;
          return (
            <div
              key={midi}
              title={`${midiToName(midi)}${c ? ` · pressed by mistake ${times(c)}` : ""}`}
              className="absolute top-0 flex h-[62%] items-end justify-center rounded-b-[5px] bg-[#1A1A20] pb-2 shadow-[0_3px_5px_rgba(0,0,0,0.3)]"
              style={{
                width: `${blackW}%`,
                left: `${whitesBefore * keyW - blackW / 2}%`,
              }}
            >
              {c > 0 && (
                <span className="text-[10px] font-semibold tabular-nums text-[#F5A99B]">{c}×</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- main section ---------- */

export function PracticeNoteInsightsSection({ refreshKey }: Props) {
  const [insights, setInsights] = useState<NoteMistakeInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void getMergedPracticeSessions()
      .then((sessions) => {
        if (cancelled) return;
        setInsights(aggregateNoteMistakeInsights(sessions));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const counts = useMemo(() => {
    const m = new Map<number, number>();
    insights?.wrongNotesPlayed.forEach((r) => m.set(r.midi, (m.get(r.midi) ?? 0) + r.count));
    return m;
  }, [insights]);

  if (loading) {
    return (
      <div className={`${premiumAnalysisCard} mb-10 animate-pulse p-6`}>
        <div className="h-5 w-40 rounded bg-neutral-100" />
        <div className="mt-4 h-3 w-full rounded bg-neutral-100" />
        <div className="mt-6 space-y-3 border-t border-black/[0.06] pt-6">
          <div className="h-3 w-[75%] rounded bg-neutral-100" />
          <div className="h-3 w-1/2 rounded bg-neutral-100" />
        </div>
      </div>
    );
  }

  if (!insights) return null;

  const hasTelemetry = insights.totalMistakeEvents > 0;
  const mixUps = insights.expectedToPlayed;
  const visibleMixUps = showAll ? mixUps : mixUps.slice(0, 5);

  return (
    <section className={`${premiumAnalysisCard} mb-10 p-5 md:p-6`}>
      <p className={analysisLabelPlum}>NOTE HABITS</p>
      <h3 className="mt-2 font-playfair text-[30px] font-medium leading-tight text-[#1F1A17]">
        Piano keys you press by mistake
      </h3>
      <p className="mt-2 text-[12px] text-[#5D5D5D]">
        From Method, songs and library, not recovery drills • {insights.sessionsWithMistakeTelemetry}{" "}
        sessions with slips • {insights.sessionsConsidered} runs checked
      </p>

      {!hasTelemetry ? (
        <p className="mt-5 border-t border-black/[0.06] pt-5 text-sm text-neutral-600">
          No note-level data yet. Finish scored lessons while signed in.
        </p>
      ) : (
        <>
          {/* ---- most common wrong keys ---- */}
          <div className="mt-8">
            <SectionHeading>Your most common wrong keys</SectionHeading>

            <div className="mt-3 flex flex-wrap gap-2">
              {insights.wrongNotesPlayed.slice(0, 6).map((row, i) => (
                <span
                  key={row.midi}
                  className={`rounded-[4px] border px-2.5 py-1 text-[11px] font-semibold tabular-nums text-[#1F1A17] ${
                    i === 0
                      ? "border-[#F7A294] bg-[#F7A294]"
                      : "border-[#DBDBDB] bg-[#FAF6EE]"
                  }`}
                >
                  {row.note} <span className="mx-0.5">•</span> {row.count}
                </span>
              ))}
            </div>

            <InfoBox>
              The darker the pink, the more often you pressed the wrong key. This number is how
              many times.
            </InfoBox>

            <PianoHeatmap counts={counts} />
          </div>

          {/* ---- expected -> played ---- */}
          <div className="mt-10">
            <SectionHeading>What you should play → what you played</SectionHeading>

            <InfoBox>
              Read each row like this: the first note is what the music asked for, the pink one is
              what you pressed.
            </InfoBox>

            <ul className="mt-3 p-0">
              {visibleMixUps.map((row, i) => (
                <li
                  key={`${row.expectedLabel}-${row.playedNote}-${i}`}
                  className="flex items-center justify-between gap-3 border-b rounded-2xl p-2 border-black/[0.12] py-3"
                >
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="rounded-[4px] border border-[#DBDBDB] bg-[#FAF6EE] px-2 py-0.5 text-[10px] font-medium text-[#3D3631]">
                      {row.expectedLabel && row.expectedLabel !== "—" ? row.expectedLabel : "No note"}
                    </span>
                    <span className="text-[11px] text-neutral-500">→</span>
                    <span className="rounded-[4px] bg-[#F7A294] px-2 py-0.5 text-[10px] font-semibold text-[#1F1A17]">
                      {row.playedNote}
                    </span>
                      </span>
                  <span className="shrink-0 text-[12px] tabular-nums text-[#3D3631]">
                    {times(row.count)}
                  </span>
                </li>
              ))}
            </ul>

            {mixUps.length > 5 && (
              <button
                type="button"
                onClick={() => setShowAll((v) => !v)}
                className="mt-5 rounded-full border border-[#3F3F46CC] y-1.5 text-[12px] px-4 py-2 font-bold text-black transition-colors hover:bg-[#1F1A17] hover:text-white"
              >
                {showAll ? "Show fewer" : `Show all ${mixUps.length} mix-ups`}
              </button>
            )}
          </div>

          
        </>
      )}
    </section>
  );
}