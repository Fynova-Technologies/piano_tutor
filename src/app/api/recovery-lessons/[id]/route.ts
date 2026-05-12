/**
 * GET /api/recovery-lessons/[id] — fetch one generated drill (MusicXML) for replay.
 */
import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ ok: false, message: "id required" }, { status: 400 });
    }

    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ ok: false, code: "UNAUTHORIZED" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("recovery_generated_lessons")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("recovery-lesson get", error);
      return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ ok: false, code: "NOT_FOUND" }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      lesson: {
        id: data.id,
        title: data.title,
        sourceLessonUid: data.source_lesson_uid,
        musicXml: data.music_xml,
        createdAt: data.created_at,
        meta: data.meta,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { ok: false, message: e instanceof Error ? e.message : "error" },
      { status: 500 }
    );
  }
}
