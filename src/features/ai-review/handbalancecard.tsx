"use client";

import { analysisLabelPlum } from "@/features/ai-review/PianoAnalysisChrome";
import {
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
    <div className="grid grid-cols-1 gap-[20px]">
      <div className="w-full">
        <div className="flex items-baseline justify-between gap-3">
        <span className="text-[19px] font-newsreader font-semibold text-[#1F1A17]">{name}</span>
        <span className={`text-[17px] font-plus-jakarta-sans font-bold tabular-nums ${weaker ? "text-[#D95343]" : "text-[#2F855A]"}`}>
          {pct == null ? "No notes yet" : `${pct}%`}
        </span>
      </div>
      <div
        className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-neutral-100"
        role="img"
        aria-label={pct == null ? `${name}: no data` : `${name}: ${pct}% of notes hit`}
      >
        <div
          className={`h-full rounded-full ${weaker ? "bg-[#D95343]" : "bg-[#2F855A]"}`}
          style={{ width: `${pct ?? 0}%` }}
        />
      </div>
      {data.expected > 0 ? (
        <p className="mt-1.5 text-[11.5px] text-neutral-500">
          {data.hit} of {data.expected} notes correct · {data.wrong} wrong · {data.missed} missed
        </p>
      ) : null}
      </div>
      
      
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



export function HandBalanceCard({ insights }: { insights?: HandInsights }) {
  if (!insights) return null;

  const showBars = insights.status !== "no_data";

  return (
    <section className={`rounded-2xl border border-black/[0.06] bg-white shadow-[0_10px_36px_rgba(45,35,55,0.06)]" p-6 space-y-[20px] `}>
         <div>
        <p className={analysisLabelPlum}>Left vs right hand</p>
      </div>

      

      <div>
      <h3 className="mt-2 text-[28px] font-semibold font-playfair  text-[#1F1A17]">{headline(insights)}</h3>
      </div>

      <div
      role="note"
      className="w-full rounded-lg border border-[#EDE3D2] border-l-4 border-l-[#C59358] bg-[#FAF6EE] px-4 py-3 text-[13px] leading-[1.5] text-[#5D5D5D]"
    >
      <span className="font-bold text-black">What this means:</span> most left-hand slips are notes that never got played. Try each hand alone
  before putting them together.
    </div>
      

      {showBars ? (
        <div className="flex flex-col mt-5 gap-5">
          <HandBar name="Left hand" data={insights.left} weaker={insights.weakerHand === "left"} />
          <HandBar name="Right hand" data={insights.right} weaker={insights.weakerHand === "right"} />
        </div>
      ) : null}

      {showBars ? (
        <div>
        <p className="mt-4 text-[11px] text-neutral-400">
          Based on your last {insights.sessionsWithHandData} two-handed session
          {insights.sessionsWithHandData === 1 ? "" : "s"}.
        </p>
        </div>
      ) : null}

      
     
    </section>
  );
}