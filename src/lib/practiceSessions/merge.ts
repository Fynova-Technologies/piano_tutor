import { getSessions } from "@/datastore/sessionstorage";
import type { PracticeSession } from "@/datastore/sessionstorage";
import {
  practiceRecordToSession,
  type PracticeSessionRecordRow,
} from "./types";

/** Merge cloud history (Supabase) with localStorage; remote wins on same client_session_id. */
export async function getMergedPracticeSessions(): Promise<PracticeSession[]> {
  const local = getSessions();
  if (typeof window === "undefined") return local;

  try {
    const res = await fetch("/api/practice-sessions", { credentials: "include" });
    if (!res.ok) return local;

    const data = (await res.json()) as { sessions?: PracticeSessionRecordRow[] };
    const rows = data.sessions ?? [];
    const remote = rows.map(practiceRecordToSession);
    const byId = new Map<string, PracticeSession>();
    for (const s of local) byId.set(s.id, s);
    for (const s of remote) byId.set(s.id, s);
    return Array.from(byId.values()).sort((a, b) => b.endedAt - a.endedAt);
  } catch {
    return local;
  }
}
