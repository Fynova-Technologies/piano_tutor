import type { PracticeSession } from "@/datastore/sessionstorage";

/**
 * Pushes sessions to POST /api/practice-sessions -> practice_session_records.
 * Mirrors the retry-queue pattern in `syncToSupabase.ts`, kept as a separate queue
 * since it targets a different table with a different shape.
 */
const pendingQueue: PracticeSession[] = [];
let flushScheduled = false;

function scheduleFlush() {
  if (flushScheduled) return;
  flushScheduled = true;
  setTimeout(flushQueue, 2000);
}

async function flushQueue() {
  flushScheduled = false;
  if (pendingQueue.length === 0) return;

  const batch = pendingQueue.splice(0, pendingQueue.length);

  for (const session of batch) {
    try {
      const res = await fetch("/api/practice-sessions", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session }),
      });

      if (res.status === 401) {
        // Not signed in — drop silently, don't requeue forever for guests.
        continue;
      }

      if (!res.ok) {
        console.error("practice_session_records sync failed:", res.status);
        pendingQueue.push(session);
      }
    } catch (e) {
      console.error("practice_session_records sync error:", e);
      pendingQueue.push(session);
    }
  }

  if (pendingQueue.length > 0) scheduleFlush();
}

/** Call this from saveSession() — fire and forget */
export function queuePracticeRecordSync(session: PracticeSession) {
  pendingQueue.push(session);
  scheduleFlush();
}