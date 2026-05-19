import { createClient } from "@supabase/supabase-js";
import type { PracticeSession } from "@/datastore/sessionstorage";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Retry queue — survives brief network hiccups
const pendingQueue: PracticeSession[] = [];
let flushScheduled = false;

function scheduleFlush() {
  if (flushScheduled) return;
  flushScheduled = true;
  setTimeout(flushQueue, 2000); // small delay so rapid saves batch nicely
}

async function flushQueue() {
  flushScheduled = false;
  if (pendingQueue.length === 0) return;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    // Not signed in — leave items in queue, retry later
    scheduleFlush();
    return;
  }

  const batch = pendingQueue.splice(0, pendingQueue.length);

  const rows = batch.map((s) => ({
    id: s.id,
    user_id: user.id,
    started_at: new Date(s.startedAt).toISOString(),
    ended_at: new Date(s.endedAt).toISOString(),
    duration_sec: s.durationSec,

    lesson_uid: s.lesson.uid,
    lesson_id: s.lesson.id,
    lesson_title: s.lesson.title,
    lesson_source: s.lesson.source,

    attempts: s.performance.attempts,
    score: s.performance.score,
    accuracy: s.performance.accuracy ?? null,
    correct_notes: s.performance.correctNotes ?? null,
    incorrect_notes: s.performance.incorrectNotes ?? null,
    total_scoreable: s.performance.totalScoreable ?? null,

    session_category: s.sessionCategory ?? null,
    lesson_file: s.lessonFile ?? null,
    tempo_bpm: s.tempoBpm ?? null,
    completion_status: s.completionStatus ?? null,
    weak_areas: s.weakAreas ?? null,
    mistake_events: s.mistakeEvents ?? null,
    ai_feedback_snapshot: s.aiFeedbackSnapshot ?? null,
    progress_metrics: s.progressMetrics ?? null,
  }));

  const { error } = await supabase
    .from("practice_sessions")
    .upsert(rows, { onConflict: "id" }); // upsert = safe to retry

  if (error) {
    console.error("Supabase sync failed:", error.message);
    // Re-queue failed batch so it retries
    pendingQueue.unshift(...batch);
    scheduleFlush();
  }
}

/** Call this from saveSession() — fire and forget */
export function queuePracticeSessionSync(session: PracticeSession) {
  pendingQueue.push(session);
  scheduleFlush();
}

/** Optional: fetch a user's full session history from Supabase */
export async function fetchSessionsFromSupabase(): Promise<PracticeSession[]> {
  const { data, error } = await supabase
    .from("practice_sessions")
    .select("*")
    .order("started_at", { ascending: false });

  if (error || !data) return [];

  return data.map((r) => ({
    id: r.id,
    startedAt: new Date(r.started_at).getTime(),
    endedAt: new Date(r.ended_at).getTime(),
    durationSec: r.duration_sec,
    lesson: {
      uid: r.lesson_uid,
      id: r.lesson_id,
      title: r.lesson_title,
      source: r.lesson_source,
    },
    performance: {
      attempts: r.attempts,
      score: r.score,
      accuracy: r.accuracy,
      correctNotes: r.correct_notes,
      incorrectNotes: r.incorrect_notes,
      totalScoreable: r.total_scoreable,
    },
    sessionCategory: r.session_category,
    lessonFile: r.lesson_file,
    tempoBpm: r.tempo_bpm,
    completionStatus: r.completion_status,
    weakAreas: r.weak_areas,
    mistakeEvents: r.mistake_events,
    aiFeedbackSnapshot: r.ai_feedback_snapshot,
    progressMetrics: r.progress_metrics,
  }));
}