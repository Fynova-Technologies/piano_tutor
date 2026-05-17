/**
 * GET /api/recovery-lessons/[id] — fetch one generated drill (MusicXML) for replay.
 * DELETE /api/recovery-lessons/[id] — remove a saved recovery drill.
 */
import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { buildMxlBase64 } from "@/lib/musicxml/buildMxl";

export const runtime = "nodejs";

type RecoveryRow = {
  id: string;
  title: string;
  source_lesson_uid: string;
  music_xml: string;
  created_at: string;
  meta: unknown;
};

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

    const row = data as RecoveryRow;
    const meta = (row.meta ?? {}) as Record<string, unknown>;
    const downloadFileName =
      typeof meta.downloadFileName === "string"
        ? meta.downloadFileName
        : `recovery-${row.id.slice(0, 8)}.mxl`;
    const mxlEntryName =
      typeof meta.mxlEntryName === "string" ? meta.mxlEntryName : "score.musicxml";

    let mxlBase64: string | undefined;
    try {
      const built = await buildMxlBase64(row.music_xml, mxlEntryName);
      mxlBase64 = built.base64;
    } catch (e) {
      console.error("recovery-lesson mxl build", e);
    }

    return NextResponse.json({
      ok: true,
      lesson: {
        id: row.id,
        title: row.title,
        sourceLessonUid: row.source_lesson_uid,
        musicXml: row.music_xml,
        createdAt: row.created_at,
        meta: row.meta,
        downloadFileName,
        mxlBase64,
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

export async function DELETE(
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
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)
      .select("id")
      .maybeSingle();

    if (error) {
      console.error("recovery-lesson delete", error);
      return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ ok: false, code: "NOT_FOUND" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, deletedId: data.id });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { ok: false, message: e instanceof Error ? e.message : "error" },
      { status: 500 }
    );
  }
}
