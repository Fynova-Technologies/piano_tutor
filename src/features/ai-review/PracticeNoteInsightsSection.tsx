"use client";

import { useEffect, useState } from "react";
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

export function PracticeNoteInsightsSection({ refreshKey }: Props) {
  const [insights, setInsights] = useState<NoteMistakeInsights | null>(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <section className={`${premiumAnalysisCard} mb-10 p-6`}>
      <h3 className="text-lg font-bold text-black">Note habits</h3>
      <p className={`mt-1 ${analysisLabelPlum}`}>Method, songs &amp; library · not recovery drills</p>
      <p className="mt-2 text-sm text-neutral-600">
        {insights.sessionsWithMistakeTelemetry} sessions with slips · {insights.sessionsConsidered}{" "}
        runs scanned
      </p>

      {!hasTelemetry ? (
        <p className="mt-5 border-t border-black/[0.06] pt-5 text-sm text-neutral-600">
          No note-level data yet. Finish scored lessons while signed in.
        </p>
      ) : (
        <>
          <div className="mt-6 border-t border-black/[0.06] pt-5">
            <p className={analysisLabelPlum}>Wrong notes most often</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {insights.wrongNotesPlayed.slice(0, 10).map((row) => (
                <span
                  key={row.midi}
                  className="rounded-full border border-[#6e4d7d]/25 bg-[rgba(110,77,125,0.06)] px-2.5 py-0.5 text-xs text-black"
                >
                  <span className="font-semibold text-[#6e4d7d]">{row.note}</span>
                  <span className="ml-1 tabular-nums text-neutral-500">×{row.count}</span>
                </span>
              ))}
            </div>
          </div>

          <div className="mt-6 border-t border-black/[0.06] pt-5">
            <p className={analysisLabelPlum}>Expected → played</p>
            <ul className="mt-3 space-y-2 text-sm text-neutral-700">
              {insights.expectedToPlayed.slice(0, 10).map((row, i) => (
                <li
                  key={`${row.expectedLabel}-${row.playedNote}-${i}`}
                  className="flex flex-wrap items-baseline justify-between gap-2 border-b border-black/[0.05] pb-2 last:border-0"
                >
                  <span>
                    <span className="text-black">{row.expectedLabel}</span>
                    <span className="mx-2 text-neutral-400">→</span>
                    <span className="font-semibold text-[#6e4d7d]">{row.playedNote}</span>
                  </span>
                  <span className="tabular-nums text-xs text-neutral-500">×{row.count}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6 border-t border-black/[0.06] pt-5">
            <p className={analysisLabelPlum}>Lagging phrases (4-measure window)</p>
            <ul className="mt-3 space-y-2 text-sm">
              {insights.laggingPhrases.slice(0, 8).map((row, i) => (
                <li key={`${row.piece}-${row.measureStart}-${i}`} className="text-neutral-700">
                  <span className="font-medium text-black">{row.piece}</span>
                  {row.source ? <span className="text-[#6e4d7d]"> · {row.source}</span> : null}
                  <span className="text-neutral-500">
                    {" "}
                    · mm.{" "}
                    {row.measureStart}
                    {row.measureEnd !== row.measureStart ? `–${row.measureEnd}` : ""} ·{" "}
                    {row.mistakesInWindow} slips
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </section>
  );
}
