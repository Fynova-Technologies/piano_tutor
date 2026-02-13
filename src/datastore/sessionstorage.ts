/* eslint-disable @typescript-eslint/no-explicit-any */
const STORAGE_KEY = "practice_sessions";


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
  };
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
  return {
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

    performance: {
      attempts: session.performance.attempts,
      score: session.performance.score,
    },
  };
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
}




/* Clear (for testing) */
export function clearSessions() {
  localStorage.removeItem(STORAGE_KEY);
}
