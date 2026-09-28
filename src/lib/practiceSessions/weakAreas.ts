import type { PracticeSession } from "@/datastore/sessionstorage";
import { isHandStats, type HandInsights } from "./handinsights";

export type Priority = "PRIORITY" | "MEDIUM" | "LOW";

export type WeakArea = {
  id: string;
  category: "lesson" | "hand";
  name: string;
  /** 0-100, higher = worse. Used only for ranking and priority; not shown directly. */
  severity: number;
  priority: Priority;
  /** Miss rate shown on the card, 0-100. */
  percent: number;
  /** Count of tracked mistakes shown on the card. */
  mistakes: number;
  /** Up to 2 short, real-data-derived lines. */
  issues: string[];
  /** Miss rate (0-100) per session, oldest to newest, up to 5 points. Drives the card sparkline. */
  trend: number[];
  /** 1-based measure numbers where slips repeat (lessons only). Empty when nothing repeats. */
  hotMeasures: number[];
  /** Tempo of the most recent run, when known (lessons only). */
  tempoBpm?: number;
};

/** How many of a lesson's most recent sessions count toward its numbers. */
const MAX_SESSIONS_PER_LESSON = 10;
/** A lesson only becomes a weak area once its average score is below this. */
const WEAK_SCORE_THRESHOLD = 85;
/** A lesson needs at least this many sessions before it's ranked (one bad run isn't a pattern). */
const MIN_SESSIONS_FOR_LESSON = 2;
/** Sparkline length. */
const TREND_POINTS = 5;
/** A measure counts as "hot" only if slips there repeat at least this many times. */
const HOT_MEASURE_MIN_HITS = 2;

/** Severity (miss rate) cut points. Tune these against real usage once you have more data. */
const PRIORITY_CUTOFF = 35;
const MEDIUM_CUTOFF = 18;

function priorityFor(severity: number): Priority {
  if (severity >= PRIORITY_CUTOFF) return "PRIORITY";
  if (severity >= MEDIUM_CUTOFF) return "MEDIUM";
  return "LOW";
}

function hotMeasuresFor(sessions: PracticeSession[]): number[] {
  const counts = new Map<number, number>();
  for (const s of sessions) {
    for (const ev of s.mistakeEvents ?? []) {
      if (typeof ev.measureIndex === "number" && ev.measureIndex >= 0) {
        counts.set(ev.measureIndex, (counts.get(ev.measureIndex) ?? 0) + 1);
      }
    }
  }
  return [...counts.entries()]
    .filter(([, c]) => c >= HOT_MEASURE_MIN_HITS)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([m]) => m + 1)
    .sort((a, b) => a - b);
}

function buildLessonAreas(sessions: PracticeSession[]): WeakArea[] {
  const byLesson = new Map<string, { title: string; sessions: PracticeSession[] }>();

  const sorted = [...sessions].sort((a, b) => b.endedAt - a.endedAt);
  for (const s of sorted) {
    if (s.sessionCategory === "recovery_drill") continue;
    const key = s.lesson.uid || `${s.lesson.source}|||${s.lesson.title}`;
    let g = byLesson.get(key);
    if (!g) {
      g = { title: s.lesson.title || "Untitled lesson", sessions: [] };
      byLesson.set(key, g);
    }
    if (g.sessions.length < MAX_SESSIONS_PER_LESSON) g.sessions.push(s);
  }

  const areas: WeakArea[] = [];

  for (const [key, g] of byLesson) {
    if (g.sessions.length < MIN_SESSIONS_FOR_LESSON) continue;

    const avgScore = Math.round(
      g.sessions.reduce((a, s) => a + s.performance.score, 0) / g.sessions.length
    );
    if (avgScore >= WEAK_SCORE_THRESHOLD) continue;

    const totalMistakes = g.sessions.reduce((a, s) => a + (s.performance.incorrectNotes ?? 0), 0);
    const mostRecent = g.sessions[0];
    const severity = 100 - avgScore;

    const issues: string[] = [
      `Averaging ${avgScore}% over ${g.sessions.length} session${g.sessions.length === 1 ? "" : "s"}`,
    ];
    if (mostRecent.performance.incorrectNotes != null && mostRecent.performance.totalScoreable) {
      issues.push(
        `Most recent run: ${mostRecent.performance.incorrectNotes} wrong of ${mostRecent.performance.totalScoreable} notes`
      );
    } else if (mostRecent.performance.attempts > 1) {
      issues.push(`${mostRecent.performance.attempts} attempts on the last run`);
    }

    const trend = g.sessions
      .slice(0, TREND_POINTS)
      .reverse()
      .map((s) => Math.max(0, Math.min(100, 100 - s.performance.score)));

    areas.push({
      id: `lesson:${key}`,
      category: "lesson",
      name: g.title,
      severity,
      priority: priorityFor(severity),
      percent: severity,
      mistakes: totalMistakes,
      issues,
      trend,
      hotMeasures: hotMeasuresFor(g.sessions),
      tempoBpm: mostRecent.tempoBpm ?? undefined,
    });
  }

  return areas;
}

function buildHandArea(insights: HandInsights, sessions: PracticeSession[]): WeakArea | null {
  if (insights.status !== "weaker_hand" || !insights.weakerHand) return null;

  const hand = insights.weakerHand;
  const weak = hand === "left" ? insights.left : insights.right;
  const handLabel = hand === "left" ? "Left hand" : "Right hand";
  const missRate = 100 - (weak.accuracyPct ?? 0);

  const issues: string[] =
    weak.missed >= weak.wrong
      ? [
          `${weak.missed} of ${weak.expected} notes never played in that hand`,
          "Try a hands-separate pass before playing both together",
        ]
      : [
          `${weak.wrong} wrong keys in that hand`,
          "Slow the tempo and check note names before speeding up",
        ];

  const trend = [...sessions]
    .sort((a, b) => b.endedAt - a.endedAt)
    .filter((s) => s.sessionCategory !== "recovery_drill")
    .flatMap((s) => {
      const hs = (s.progressMetrics as Record<string, unknown> | undefined)?.handStats;
      if (!isHandStats(hs) || !hs.twoStaff) return [];
      const c = hs[hand];
      return c.expected > 0 ? [100 - Math.round((c.hit / c.expected) * 100)] : [];
    })
    .slice(0, TREND_POINTS)
    .reverse();

  return {
    id: "hand:weaker",
    category: "hand",
    name: handLabel,
    severity: missRate,
    priority: priorityFor(missRate),
    percent: missRate,
    mistakes: weak.wrong + weak.missed,
    issues,
    trend,
    hotMeasures: [],
  };
}

export type WeakAreasResult = {
  areas: WeakArea[];
  /** True when nothing met the bar for a weak area, a genuinely good state rather than missing data. */
  isEmpty: boolean;
};

/**
 * Build one ranked list of real weak areas from lesson performance and hand balance.
 * Ranking is by severity (miss rate), so the worst thing shown is always first;
 * no fixed slot is reserved for any one category.
 */
export function buildWeakAreas(
  sessions: PracticeSession[],
  handInsights: HandInsights,
  maxItems = 3
): WeakAreasResult {
  const hand = buildHandArea(handInsights, sessions);
  const areas = [...buildLessonAreas(sessions), ...(hand ? [hand] : [])];
  areas.sort((a, b) => b.severity - a.severity);
  const top = areas.slice(0, maxItems);
  return { areas: top, isEmpty: top.length === 0 };
}