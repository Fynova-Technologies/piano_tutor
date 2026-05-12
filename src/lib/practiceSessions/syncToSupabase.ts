import type { PracticeSession } from "@/datastore/sessionstorage";
import { sessionToRecordPayload } from "./mapSession";

let inFlight = false;
const pending: PracticeSession[] = [];

/**
 * Non-blocking: sync one session to Supabase (requires logged-in user + table migration).
 * Queues if a request is already in flight to avoid dropping rows.
 */
export function queuePracticeSessionSync(session: PracticeSession) {
  pending.push(session);
  void drainQueue();
}

async function drainQueue() {
  if (inFlight || pending.length === 0) return;
  inFlight = true;
  try {
    while (pending.length > 0) {
      const session = pending.shift()!;
      try {
        const res = await fetch("/api/practice-sessions", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sessionToRecordPayload(session)),
        });
        if (res.status === 401 || res.status === 403) {
          /* User logged out or RLS — local store remains source of truth */
          continue;
        }
        if (!res.ok) {
          console.warn("[practice sync] API error", res.status);
        }
      } catch (e) {
        console.warn("[practice sync] network", e);
      }
    }
  } finally {
    inFlight = false;
  }
}
