"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/browserclient";
import { extractMusicXmlFromMxlBuffer } from "@/lib/musicxml/buildMxl";
import { LessonPracticeWorkspace } from "@/features/lessons/LessonPracticeWorkspace";

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; xml: string; title: string; fileName: string };

export default function MySheetPlayPage() {
  const { id } = useParams<{ id: string }>();
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data: sheet, error } = await supabase
          .from("user_music_sheets")
          .select("id, title, file_name, file_path")
          .eq("id", id)
          .single();
        if (error || !sheet) throw new Error("Sheet not found.");

        const { data: blob, error: dlErr } = await supabase.storage
          .from("user-music-sheets")
          .download(sheet.file_path);
        if (dlErr || !blob) throw new Error("Couldn't download this sheet.");

        const buf = await blob.arrayBuffer();
        const xml = sheet.file_path.endsWith(".mxl")
          ? await extractMusicXmlFromMxlBuffer(buf)
          : new TextDecoder().decode(buf);

        if (active) setState({ status: "ready", xml, title: sheet.title, fileName: sheet.file_name });
      } catch (e: any) {
        if (active) setState({ status: "error", message: e?.message || "Something went wrong." });
      }
    })();
    return () => { active = false; };
  }, [id]);

  if (state.status === "loading") return <div className="p-8 text-center text-black/60">Loading sheet…</div>;
  if (state.status === "error") return <div className="p-8 text-center text-red-500">{state.message}</div>;

  return (
    <LessonPracticeWorkspace
      cdnFileName={null}
      externalXml={state.xml}
      xmlRenderKey={0}
      courseTitle={state.title}
      lessonSource="UserSheet"
      lessonId={id}
      displayFileName={state.fileName}
      lessonUid={`user-sheet-${id}`}
      sessionCategory="user_sheet"
      fkid="0"
    />
  );
}