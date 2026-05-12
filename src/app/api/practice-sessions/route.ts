import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import type { PracticeSessionRecordRow } from "@/lib/practiceSessions/types";

export const runtime = "nodejs";

/**
 * GET — load practice history for the signed-in user (AI Review + analytics).
 * Anonymous users: 401 (client falls back to localStorage).
 */
export async function GET() {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ ok: false, code: "UNAUTHORIZED" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("practice_session_records")
      .select("*")
      .eq("user_id", user.id)
      .order("ended_at", { ascending: false })
      .limit(800);

    if (error) {
      console.error("practice_session_records select", error);
      return NextResponse.json(
        { ok: false, message: error.message },
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

/**
 * POST — insert or upsert one session (called from client after saveSession).
 * Payload fields mirror `sessionToRecordPayload` in mapSession.ts.
 */
export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ ok: false, code: "UNAUTHORIZED" }, { status: 401 });
    }

    const body = await req.json();
    const row = {
      user_id: user.id,
      client_session_id: String(body.client_session_id ?? ""),
      session_category: String(body.session_category ?? "unspecified"),
      lesson_uid: String(body.lesson_uid ?? ""),
      lesson_id: String(body.lesson_id ?? ""),
      lesson_title: String(body.lesson_title ?? ""),
      lesson_source: String(body.lesson_source ?? ""),
      lesson_file: body.lesson_file != null ? String(body.lesson_file) : null,
      started_at: body.started_at,
      ended_at: body.ended_at,
      duration_sec: Number(body.duration_sec ?? 0),
      attempts: Number(body.attempts ?? 1),
      score: Number(body.score ?? 0),
      accuracy_pct: body.accuracy_pct != null ? Number(body.accuracy_pct) : null,
      correct_notes: body.correct_notes != null ? Number(body.correct_notes) : null,
      incorrect_notes: body.incorrect_notes != null ? Number(body.incorrect_notes) : null,
      total_scoreable: body.total_scoreable != null ? Number(body.total_scoreable) : null,
      tempo_bpm: body.tempo_bpm != null ? Number(body.tempo_bpm) : null,
      rhythm_inaccuracy: body.rhythm_inaccuracy ?? [],
      mistakes: body.mistakes ?? [],
      weak_areas: body.weak_areas ?? [],
      completion_status: String(body.completion_status ?? "completed"),
      ai_feedback_snapshot: body.ai_feedback_snapshot ?? null,
      progress_metrics: body.progress_metrics ?? {},
      mistake_events: body.mistake_events ?? [],
    };

    if (!row.client_session_id) {
      return NextResponse.json({ ok: false, message: "client_session_id required" }, { status: 400 });
    }

    const { error } = await supabase.from("practice_session_records").upsert(row, {
      onConflict: "user_id,client_session_id",
    });

    if (error) {
      console.error("practice_session_records upsert", error);
      return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { ok: false, message: e instanceof Error ? e.message : "error" },
      { status: 500 }
    );
  }
}
