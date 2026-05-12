/**
 * GET /api/recovery-lessons
 * History of AI-generated recovery drills + recent source-lesson options from practice_session_records.
 */
import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, code: "UNAUTHORIZED", message: "Sign in required" },
        { status: 401 }
      );
    }

    const { data: recoveryRows, error: rErr } = await supabase
      .from("recovery_generated_lessons")
      .select(
        "id, source_lesson_uid, source_lesson_title, source_lesson_source, title, created_at, meta"
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(40);

    if (rErr) {
      console.error("recovery-lessons select", rErr);
      return NextResponse.json(
        { ok: false, message: rErr.message, code: "DB_ERROR" },
        { status: 500 }
      );
    }

    const { data: sessionRows, error: sErr } = await supabase
      .from("practice_session_records")
      .select("lesson_uid, lesson_title, lesson_source, ended_at, score, mistake_events")
      .eq("user_id", user.id)
      .order("ended_at", { ascending: false })
      .limit(80);

    if (sErr) {
      console.error("recovery-lessons sessions", sErr);
    }

    const seen = new Set<string>();
    const sourceOptions: {
      lessonUid: string;
      lessonTitle: string;
      lessonSource: string;
      lastSessionAt: string;
      recentScore: number | null;
    }[] = [];

    for (const row of sessionRows ?? []) {
      const uid = row.lesson_uid;
      if (!uid || seen.has(uid)) continue;
      seen.add(uid);
      sourceOptions.push({
        lessonUid: uid,
        lessonTitle: row.lesson_title ?? "",
        lessonSource: row.lesson_source ?? "",
        lastSessionAt: row.ended_at,
        recentScore: row.score ?? null,
      });
      if (sourceOptions.length >= 24) break;
    }

    const mistakeSummary = (sessionRows ?? []).slice(0, 12).map((row) => {
      const ev = row.mistake_events;
      const n = Array.isArray(ev) ? ev.length : 0;
      return {
        lessonUid: row.lesson_uid,
        endedAt: row.ended_at,
        mistakeEventCount: n,
        score: row.score,
      };
    });

    return NextResponse.json({
      ok: true,
      recoveryLessons: recoveryRows ?? [],
      sourceOptions,
      recentMistakeSummary: mistakeSummary,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { ok: false, message: e instanceof Error ? e.message : "error" },
      { status: 500 }
    );
  }
}
