import type { PracticeSession } from "@/datastore/sessionstorage";
import type { Hand, HandCounts, HandStats } from "./handstats";

/** Need at least this many expected notes per hand before naming a weaker hand. */
export const MIN_NOTES_PER_HAND = 20;
/** Need at least this many two-staff sessions before naming a weaker hand. */
export const MIN_SESSIONS = 3;
/** Accuracy gap (percentage points) that counts as a real difference. */
export const MIN_GAP_PCT = 8;
/** Only the most recent sessions count, so the result tracks current ability. */
const MAX_SESSIONS = 10;

export type HandSummary = HandCounts & {
  /** hit / expected, 0-100. null when the hand had no expected notes. */
  accuracyPct: number | null;
};

export type HandInsights = {
  sessionsWithHandData: number;
  left: HandSummary;
  right: HandSummary;
  /**
   * no_data: no two-staff sessions with hand stats yet
   * insufficient: data exists but too little to compare
   * balanced: hands are within MIN_GAP_PCT of each other
   * weaker_hand: one hand is clearly behind
   */
  status: "no_data" | "insufficient" | "balanced" | "weaker_hand";
  weakerHand: Hand | null;
  /** Accuracy difference in points (stronger minus weaker). 0 unless both hands have data. */
  gapPct: number;
  /** When status is insufficient: roughly how many more notes the thinner hand needs. */
  notesNeeded: number;
};

const zero = (): HandCounts => ({ expected: 0, hit: 0, missed: 0, wrong: 0, extra: 0 });

function isHandStats(v: unknown): v is HandStats {
  if (!v || typeof v !== "object") return false;
  const o = v as Partial<HandStats>;
  return o.version === 1 && typeof o.twoStaff === "boolean" && !!o.left && !!o.right;
}

function add(into: HandCounts, from: HandCounts) {
  into.expected += from.expected ?? 0;
  into.hit += from.hit ?? 0;
  into.missed += from.missed ?? 0;
  into.wrong += from.wrong ?? 0;
  into.extra += from.extra ?? 0;
}

function summarize(c: HandCounts): HandSummary {
  return {
    ...c,
    accuracyPct: c.expected > 0 ? Math.round((c.hit / c.expected) * 100) : null,
  };
}

export function aggregateHandInsights(sessions: PracticeSession[]): HandInsights {
  const left = zero();
  const right = zero();
  let used = 0;

  const recent = [...sessions].sort((a, b) => b.endedAt - a.endedAt);

  for (const s of recent) {
    if (used >= MAX_SESSIONS) break;
    if (s.sessionCategory === "recovery_drill") continue;

    const raw = (s.progressMetrics as Record<string, unknown> | undefined)?.handStats;
    if (!isHandStats(raw) || !raw.twoStaff) continue;
    if (raw.left.expected + raw.right.expected === 0) continue;

    add(left, raw.left);
    add(right, raw.right);
    used++;
  }

  const l = summarize(left);
  const r = summarize(right);

  const base = { sessionsWithHandData: used, left: l, right: r };

  if (used === 0) {
    return { ...base, status: "no_data", weakerHand: null, gapPct: 0, notesNeeded: MIN_NOTES_PER_HAND };
  }

  const thinner = Math.min(left.expected, right.expected);
  if (used < MIN_SESSIONS || thinner < MIN_NOTES_PER_HAND) {
    return {
      ...base,
      status: "insufficient",
      weakerHand: null,
      gapPct: 0,
      notesNeeded: Math.max(0, MIN_NOTES_PER_HAND - thinner),
    };
  }

  const la = l.accuracyPct ?? 0;
  const ra = r.accuracyPct ?? 0;
  const gap = Math.abs(la - ra);

  if (gap < MIN_GAP_PCT) {
    return { ...base, status: "balanced", weakerHand: null, gapPct: gap, notesNeeded: 0 };
  }

  return {
    ...base,
    status: "weaker_hand",
    weakerHand: la < ra ? "left" : "right",
    gapPct: gap,
    notesNeeded: 0,
  };
}