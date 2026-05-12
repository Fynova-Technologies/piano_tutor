import type { PracticeSession } from "@/datastore/sessionstorage";
import type { AnalyticsSnapshot } from "./types";

function startOfDay(ts: number) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Days with at least one session ending that UTC day, counting consecutive days backward from the most recent activity day. */
function computeStreakFromSessions(endedAts: number[]): number {
  if (endedAts.length === 0) return 0;
  const daySet = new Set(endedAts.map((t) => startOfDay(t)));
  const sortedDays = [...daySet].sort((a, b) => b - a);
  if (sortedDays.length === 0) return 0;
  let cursor = sortedDays[0];
  let streak = 0;
  while (daySet.has(cursor)) {
    streak++;
    cursor -= 86400000;
  }
  return streak;
}

/** Deterministic snapshot from persisted practice sessions (no new writes). */
export function buildAnalyticsSnapshot(sessions: PracticeSession[]): AnalyticsSnapshot {
  const sorted = [...sessions].sort((a, b) => b.endedAt - a.endedAt);
  const sessionCount = sorted.length;

  const streakDays = computeStreakFromSessions(sorted.map((s) => s.endedAt));

  const recentScores = sorted.slice(0, 12).map((s) => ({
    at: new Date(s.endedAt).toISOString(),
    score: s.performance.score,
    title: s.lesson.title,
    attempts: s.performance.attempts,
  }));

  const byLesson: Record<string, { sum: number; n: number }> = {};
  for (const s of sorted) {
    const key = `${s.lesson.source} · ${s.lesson.title}`;
    if (!byLesson[key]) byLesson[key] = { sum: 0, n: 0 };
    byLesson[key].sum += s.performance.score;
    byLesson[key].n += 1;
  }

  const scoresByLesson: Record<string, { avgScore: number; sessions: number }> = {};
  for (const [k, v] of Object.entries(byLesson)) {
    scoresByLesson[k] = { avgScore: Math.round(v.sum / v.n), sessions: v.n };
  }

  const overallAvgScore =
    sessionCount > 0
      ? Math.round(
          sorted.reduce((acc, s) => acc + s.performance.score, 0) / sessionCount
        )
      : 0;

  const totalPracticeMinutes =
    Math.round(sorted.reduce((acc, s) => acc + s.durationSec, 0) / 60) || 0;

  const lastSessionAt =
    sorted[0] != null ? new Date(sorted[0].endedAt).toISOString() : null;

  const last7 = sorted.slice(0, 7);
  const prior = sorted.slice(7);
  const prevAvg =
    prior.length > 0
      ? Math.round(
          prior.reduce((a, s) => a + s.performance.score, 0) / prior.length
        )
      : null;

  const recentAvgScore =
    last7.length > 0
      ? Math.round(
          last7.reduce((a, s) => a + s.performance.score, 0) / last7.length
        )
      : overallAvgScore;

  return {
    generatedAt: new Date().toISOString(),
    sessionCount,
    streakDays,
    recentScores,
    scoresByLesson,
    overallAvgScore,
    recentAvgScore,
    totalPracticeMinutes,
    lastSessionAt,
    previousPeriodAvgScore: prevAvg,
  };
}
