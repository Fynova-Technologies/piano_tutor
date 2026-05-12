import type { PracticeSession } from "@/datastore/sessionstorage";

/** Build weak-area tags from session metrics (lightweight until per-note DB). */
export function inferWeakAreas(session: PracticeSession): string[] {
  const p = session.performance;
  const weak: string[] = [];
  const incorrect = "correctNotes" in p && "incorrectNotes" in p ? p.incorrectNotes : undefined;
  const correct = "correctNotes" in p ? p.correctNotes : undefined;
  const scoreable = "totalScoreable" in p ? p.totalScoreable : undefined;
  if (typeof incorrect === "number" && incorrect > 0) {
    weak.push("note_accuracy");
    if (typeof correct === "number" && incorrect > correct) weak.push("precision");
  }
  if (typeof p.score === "number" && p.score < 70) weak.push("overall_consistency");
  if (
    typeof scoreable === "number" &&
    scoreable > 0 &&
    "accuracy" in p &&
    typeof p.accuracy === "number" &&
    p.accuracy < 75
  ) {
    weak.push("rhythm_reading");
  }
  return [...new Set(weak)];
}

export function inferMistakesSummary(session: PracticeSession): Record<string, unknown>[] {
  const p = session.performance;
  const summary: Record<string, unknown>[] = [];
  if ("incorrectNotes" in p && typeof p.incorrectNotes === "number" && p.incorrectNotes > 0) {
    summary.push({
      kind: "incorrect_note_events",
      count: p.incorrectNotes,
      sessionCategory: session.sessionCategory ?? "unknown",
    });
  }
  return summary;
}

export function sessionToRecordPayload(session: PracticeSession): {
  client_session_id: string;
  session_category: string;
  lesson_uid: string;
  lesson_id: string;
  lesson_title: string;
  lesson_source: string;
  lesson_file: string | null;
  started_at: string;
  ended_at: string;
  duration_sec: number;
  attempts: number;
  score: number;
  accuracy_pct: number | null;
  correct_notes: number | null;
  incorrect_notes: number | null;
  total_scoreable: number | null;
  tempo_bpm: number | null;
  rhythm_inaccuracy: unknown;
  mistakes: unknown;
  weak_areas: unknown;
  completion_status: string;
  ai_feedback_snapshot: unknown | null;
  progress_metrics: unknown;
  mistake_events: unknown;
} {
  const p = session.performance;
  const accuracy = "accuracy" in p && typeof p.accuracy === "number" ? p.accuracy : null;
  const correct = "correctNotes" in p && typeof p.correctNotes === "number" ? p.correctNotes : null;
  const incorrect =
    "incorrectNotes" in p && typeof p.incorrectNotes === "number" ? p.incorrectNotes : null;
  const totalScoreable =
    "totalScoreable" in p && typeof p.totalScoreable === "number" ? p.totalScoreable : null;

  const weak = session.weakAreas?.length ? session.weakAreas : inferWeakAreas(session);
  const mistakes = session.mistakes ?? inferMistakesSummary(session);
  const rhythm = session.rhythmInaccuracy ?? [];

  return {
    client_session_id: session.id,
    session_category: session.sessionCategory ?? "unspecified",
    lesson_uid: session.lesson.uid,
    lesson_id: session.lesson.id,
    lesson_title: session.lesson.title,
    lesson_source: session.lesson.source,
    lesson_file: session.lessonFile ?? null,
    started_at: new Date(session.startedAt).toISOString(),
    ended_at: new Date(session.endedAt).toISOString(),
    duration_sec: session.durationSec,
    attempts: p.attempts,
    score: p.score,
    accuracy_pct: accuracy,
    correct_notes: correct,
    incorrect_notes: incorrect,
    total_scoreable: totalScoreable,
    tempo_bpm: session.tempoBpm ?? null,
    rhythm_inaccuracy: rhythm,
    mistakes,
    weak_areas: weak,
    completion_status: session.completionStatus ?? "completed",
    ai_feedback_snapshot:
      session.aiFeedbackSnapshot != null ? session.aiFeedbackSnapshot : null,
    progress_metrics: session.progressMetrics ?? {},
    mistake_events: session.mistakeEvents ?? [],
  };
}
