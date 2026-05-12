import type { PracticeSession } from "@/datastore/sessionstorage";

/** DB row shape for public.practice_session_records */
export type PracticeSessionRecordRow = {
  id: string;
  user_id: string;
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
  ai_feedback_snapshot: unknown;
  progress_metrics: unknown;
  mistake_events: unknown;
  created_at: string;
};

/** Map Supabase row → local PracticeSession (for analytics merge). */
export function practiceRecordToSession(row: PracticeSessionRecordRow): PracticeSession {
  const accuracy = row.accuracy_pct ?? undefined;
  return {
    id: row.client_session_id,
    startedAt: new Date(row.started_at).getTime(),
    endedAt: new Date(row.ended_at).getTime(),
    durationSec: row.duration_sec,
    lesson: {
      uid: row.lesson_uid,
      id: row.lesson_id,
      title: row.lesson_title,
      source: row.lesson_source,
    },
    ...(row.lesson_file ? { lessonFile: row.lesson_file } : {}),
    performance: {
      attempts: row.attempts,
      score: row.score,
      ...(accuracy != null ? { accuracy } : {}),
      ...(row.correct_notes != null ? { correctNotes: row.correct_notes } : {}),
      ...(row.incorrect_notes != null ? { incorrectNotes: row.incorrect_notes } : {}),
      ...(row.total_scoreable != null ? { totalScoreable: row.total_scoreable } : {}),
    },
    sessionCategory: row.session_category as PracticeSession["sessionCategory"],
    tempoBpm: row.tempo_bpm ?? undefined,
    completionStatus: row.completion_status,
    mistakes: Array.isArray(row.mistakes) ? row.mistakes : undefined,
    weakAreas: Array.isArray(row.weak_areas)
      ? (row.weak_areas as string[])
      : undefined,
    rhythmInaccuracy: row.rhythm_inaccuracy,
    aiFeedbackSnapshot: row.ai_feedback_snapshot ?? undefined,
    progressMetrics:
      row.progress_metrics && typeof row.progress_metrics === "object"
        ? (row.progress_metrics as Record<string, unknown>)
        : undefined,
    mistakeEvents: Array.isArray(row.mistake_events)
      ? (row.mistake_events as PracticeSession["mistakeEvents"])
      : undefined,
  };
}
