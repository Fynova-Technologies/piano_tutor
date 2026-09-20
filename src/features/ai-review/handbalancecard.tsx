"use client";

import { premiumAnalysisCard, analysisLabelPlum } from "@/features/ai-review/PianoAnalysisChrome";
import {
  MIN_NOTES_PER_HAND,
  MIN_SESSIONS,
  type HandInsights,
  type HandSummary,
} from "@/lib/practiceSessions/handinsights";

function HandBar({
  name,
  data,
  weaker,
}: {
  name: string;
  data: HandSummary;
  weaker: boolean;
}) {
  const pct = data.accuracyPct;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[13.5px] font-semibold text-black">{name}</span>
        <span className="text-[13.5px] font-bold tabular-nums text-black">
          {pct == null ? "No notes yet" : `${pct}%`}
        </span>
      </div>
      <div
        className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-neutral-100"
        role="img"
        aria-label={pct == null ? `${name}: no data` : `${name}: ${pct}% of notes hit`}
      >
        <div
          className={`h-full rounded-full ${weaker ? "bg-amber-400" : "bg-emerald-500"}`}
          style={{ width: `${pct ?? 0}%` }}
        />
      </div>
      {data.expected > 0 ? (
        <p className="mt-1.5 text-[11.5px] text-neutral-500">
          {data.hit} of {data.expected} notes hit · {data.wrong} wrong · {data.missed} missed
        </p>
      ) : null}
    </div>
  );
}

function headline(h: HandInsights): string {
  switch (h.status) {
    case "weaker_hand": {
      const hand = h.weakerHand === "left" ? "left" : "right";
      return `Your ${hand} hand is ${h.gapPct} points behind`;
    }
    case "balanced":
      return "Both hands are playing at about the same level";
    case "insufficient":
      return "Not enough two-handed practice to compare yet";
    default:
      return "Play a two-handed lesson to compare your hands";
  }
}

function detail(h: HandInsights): string {
  switch (h.status) {
    case "weaker_hand": {
      const weak = h.weakerHand === "left" ? h.left : h.right;
      const hand = h.weakerHand === "left" ? "left" : "right";
      const missedBias = weak.missed >= weak.wrong;
      return missedBias
        ? `Most ${hand}-hand slips are notes that never got played. Try hands-separate ${hand}-hand passes before putting them together.`
        : `Most ${hand}-hand slips are wrong keys. Slow the tempo and check the note names in your ${hand} hand first.`;
    }
    case "balanced":
      return "No gap worth training for. Keep alternating hands-separate and hands-together passes.";
    case "insufficient":
      const needNotes = h.sessionsWithHandData >= MIN_SESSIONS && h.notesNeeded > 0;
return `We compare hands after ${MIN_SESSIONS} two-handed sessions with at least ${MIN_NOTES_PER_HAND} notes per hand.${
  needNotes ? ` About ${h.notesNeeded} more notes needed.` : ""
}`;
    default:
      return "Lessons that use both the treble and bass staff count toward this.";
  }
}

export function HandBalanceCard({ insights }: { insights?: HandInsights }) {
  if (!insights) return null;

  const showBars = insights.status !== "no_data";

  return (
    <section className={`${premiumAnalysisCard} p-6`}>
      <p className={analysisLabelPlum}>Left vs right hand</p>
      <h3 className="mt-2 text-[1.05rem] font-bold text-black">{headline(insights)}</h3>
      <p className="mt-1 max-w-xl text-[12.5px] leading-relaxed text-neutral-500">{detail(insights)}</p>

      {showBars ? (
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <HandBar name="Left hand" data={insights.left} weaker={insights.weakerHand === "left"} />
          <HandBar name="Right hand" data={insights.right} weaker={insights.weakerHand === "right"} />
        </div>
      ) : null}

      {showBars ? (
        <p className="mt-4 text-[11px] text-neutral-400">
          Based on your last {insights.sessionsWithHandData} two-handed session
          {insights.sessionsWithHandData === 1 ? "" : "s"}.
        </p>
      ) : null}
    </section>
  );
}