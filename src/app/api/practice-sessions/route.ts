/**
 * GET  /api/practice-sessions
 * POST /api/practice-sessions
 *
 * Reads/writes `public.practice_session_records` — the richer per-session table
 * (mistake_events, weak_areas, rhythm_inaccuracy, etc.) that:
 *   - `lib/practiceSessions/merge.ts` (`getMergedPracticeSessions`) reads from (GET)
 *   - `app/api/recovery-lessons/route.ts` reads mistake summaries from
 *   - `app/api/practice/generate-recovery/route.ts` reads per-lesson mistakes from
 *
 * NOTE: this is separate from `practice_sessions` (written client-side by
 * `syncToSupabase.ts`). That table only carries score/accuracy — no mistake_events
 * shape rich enough for recovery generation. Do not merge the two without checking
 * every consumer above.
 *
 * DB requirement: a unique constraint on (user_id, client_session_id) is needed for
 * the upsert below to be idempotent on replays:
 *
 *   alter table public.practice_session_records
 *     add constraint practice_session_records_user_client_uidx
 *     unique (user_id, client_session_id);
 *
 * RLS: this route uses the server (cookie-aware) Supabase client and always scopes
 * reads/writes to auth.uid(), so standard "user can only touch their own rows" RLS
 * policies on practice_session_records are assumed.
 */
import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { sessionToRecordPayload } from "@/lib/practiceSessions/mapSession";
import type { PracticeSession } from "@/datastore/sessionstorage";
import type { PracticeSessionRecordRow } from "@/lib/practiceSessions/types";

export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      // Not signed in: merge.ts falls back to local-only sessions on a non-200.
      return NextResponse.json(
        { ok: false, code: "UNAUTHORIZED", message: "Sign in required" },
        { status: 401 }
      );
    }

    const { data, error } = await supabase
      .from("practice_session_records")
      .select("*")
      .eq("user_id", user.id)
      .order("ended_at", { ascending: false })
      .limit(200);

    if (error) {
      console.error("practice-sessions GET", error);
      return NextResponse.json(
        { ok: false, code: "DB_ERROR", message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      sessions: (data ?? []) as PracticeSessionRecordRow[],
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { ok: false, message: e instanceof Error ? e.message : "error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      // Fire-and-forget caller (saveSession) should just drop this silently.
      return NextResponse.json(
        { ok: false, code: "UNAUTHORIZED", message: "Sign in required" },
        { status: 401 }
      );
    }

    const body = (await req.json()) as { session?: PracticeSession };
    const session = body.session;
    if (!session || !session.id || !session.lesson) {
      return NextResponse.json(
        { ok: false, code: "BAD_REQUEST", message: "Invalid session payload" },
        { status: 400 }
      );
    }

    const payload = sessionToRecordPayload(session);

    const { data, error } = await supabase
      .from("practice_session_records")
      .upsert(
        { ...payload, user_id: user.id },
        { onConflict: "user_id,client_session_id" }
      )
      .select("id")
      .maybeSingle();

    if (error) {
      console.error("practice-sessions POST", error);
      return NextResponse.json(
        { ok: false, code: "DB_ERROR", message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, id: data?.id ?? null });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { ok: false, message: e instanceof Error ? e.message : "error" },
      { status: 500 }
    );
  }
}