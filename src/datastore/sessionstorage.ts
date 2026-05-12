/* eslint-disable @typescript-eslint/no-explicit-any */
const STORAGE_KEY = "practice_sessions";


export type PracticeSessionCategory =
  | "method_lesson"
  | "music_library"
  | "library_song"
  | "sasr"
  | "recovery_drill"
  | "unspecified";

/** Per-event mistakes for Supabase + AI recovery drills (lesson flow). */
export type PracticeMistakeEvent = {
  at: number;
  cursorStep: number;
  expectedMidi: number[];
  playedMidi: number;
  kind: "wrong_pitch" | "timing_or_extra_note";
  measureIndex?: number;
};

export interface PracticeSession {
  id: string;

  startedAt: number;
  endedAt: number;

  durationSec: number;

  lesson: {
    uid: string;   // "Method-1A-3"
    id: string;    // "3"
    title: string;
    source: string; // "Method-1A"
  };

  performance: {
    attempts: number;
    score: number;
    accuracy?: number;
    correctNotes?: number;
    incorrectNotes?: number;
    totalScoreable?: number;
  };

  /** High-level source for Supabase analytics & AI Review. */
  sessionCategory?: PracticeSessionCategory;
  lessonFile?: string;
  tempoBpm?: number | null;
  completionStatus?: string;
  mistakes?: unknown;
  weakAreas?: string[];
  rhythmInaccuracy?: unknown;
  aiFeedbackSnapshot?: unknown;
  progressMetrics?: Record<string, unknown>;
  mistakeEvents?: PracticeMistakeEvent[];
}


/* Get all sessions */
export function getSessions(): PracticeSession[] {
  if (typeof window === "undefined") return [];

  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) return [];

  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/* Clean before save */
function sanitizeSession(
  session: PracticeSession
): PracticeSession {
  const perf: PracticeSession["performance"] = {
    attempts: session.performance.attempts,
    score: session.performance.score,
  };
  if (session.performance.accuracy != null) perf.accuracy = session.performance.accuracy;
  if (session.performance.correctNotes != null)
    perf.correctNotes = session.performance.correctNotes;
  if (session.performance.incorrectNotes != null)
    perf.incorrectNotes = session.performance.incorrectNotes;
  if (session.performance.totalScoreable != null)
    perf.totalScoreable = session.performance.totalScoreable;

  const out: PracticeSession = {
    id: session.id,
    startedAt: session.startedAt,
    endedAt: session.endedAt,
    durationSec: session.durationSec,
    lesson: {
      uid: session.lesson.uid,
      id: session.lesson.id,
      title: session.lesson.title,
      source: session.lesson.source,
    },
    performance: perf,
  };

  if (session.sessionCategory) out.sessionCategory = session.sessionCategory;
  if (session.lessonFile) out.lessonFile = session.lessonFile;
  if (session.tempoBpm != null) out.tempoBpm = session.tempoBpm;
  if (session.completionStatus) out.completionStatus = session.completionStatus;
  if (session.mistakes != null) out.mistakes = session.mistakes;
  if (session.weakAreas?.length) out.weakAreas = session.weakAreas;
  if (session.rhythmInaccuracy != null) out.rhythmInaccuracy = session.rhythmInaccuracy;
  if (session.aiFeedbackSnapshot != null) out.aiFeedbackSnapshot = session.aiFeedbackSnapshot;
  if (session.progressMetrics) out.progressMetrics = session.progressMetrics;
  if (session.mistakeEvents?.length) out.mistakeEvents = session.mistakeEvents;

  return out;
}

/* Save */
export function saveSession(
  session: PracticeSession
) {
  const sessions = getSessions();

  const clean = sanitizeSession(session);

  sessions.push(clean);

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(sessions)
  );

  if (typeof window !== "undefined") {
    void import("@/lib/practiceSessions/syncToSupabase").then(({ queuePracticeSessionSync }) => {
      queuePracticeSessionSync(clean);
    });
  }
}




/* Clear (for testing) */
export function clearSessions() {
  localStorage.removeItem(STORAGE_KEY);
}
