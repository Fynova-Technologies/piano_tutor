"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/browserclient";
import { extractMusicXmlFromMxlBuffer } from "@/lib/musicxml/buildMxl";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ["mxl", "musicxml", "xml"];
const BUCKET = "user-music-sheets";


function readMeta(xml: string, fallbackTitle: string) {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  if (doc.querySelector("parsererror")) {
    throw new Error("That file isn't valid MusicXML.");
  }
  const root = doc.documentElement.nodeName;
  if (root !== "score-partwise" && root !== "score-timewise") {
    throw new Error("That file isn't a MusicXML score.");
  }
  if (!doc.querySelector("note")) {
    throw new Error("No notes were found in that score.");
  }
  // Your beat cursor and feedback dots are built around piano. Start strict, relax later.
  if (doc.querySelectorAll("score-partwise > part").length > 1) {
    throw new Error("Only single-part (piano) scores are supported for now.");
  }
    const title =
    doc.querySelector("work > work-title")?.textContent?.trim() ||
    doc.querySelector("movement-title")?.textContent?.trim() ||
    fallbackTitle;
  const composer =
    doc.querySelector('identification > creator[type="composer"]')?.textContent?.trim() || null;

  const measures = doc.querySelector("part")?.querySelectorAll("measure").length ?? null;
  const beats = doc.querySelector("time > beats")?.textContent?.trim();
  const beatType = doc.querySelector("time > beat-type")?.textContent?.trim();
  const timeSignature = beats && beatType ? `${beats}/${beatType}` : null;
  const tempoAttr = doc.querySelector("sound[tempo]")?.getAttribute("tempo");
  const tempoBpm = tempoAttr ? Math.round(Number(tempoAttr)) || null : null;

  return { title, composer, measures, timeSignature, tempoBpm };
}

export default function UploadSheetButton() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!ALLOWED.includes(ext)) return setError("Please choose a .mxl, .musicxml or .xml file.");
    if (file.size > MAX_BYTES) return setError("That file is larger than 5 MB.");

    setBusy(true);
    try {
      const buf = await file.arrayBuffer();
      const xml = ext === "mxl"
        ? await extractMusicXmlFromMxlBuffer(buf)
        : new TextDecoder().decode(buf);

      const { title, composer, measures, timeSignature, tempoBpm } =
  readMeta(xml, file.name.replace(/\.[^.]+$/, ""));

      const supabase = getSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please sign in again.");

      const id = crypto.randomUUID();
      const path = `${user.id}/${id}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { upsert: false });
      if (upErr) throw upErr;

      const { error: dbErr } = await supabase.from("user_music_sheets").insert({
  id,
  user_id: user.id,
  title,
  composer,
  file_name: file.name,
  file_path: path,
  file_size: file.size,
  measures,
  time_signature: timeSignature,
  tempo_bpm: tempoBpm,
});
      if (dbErr) {
        await supabase.storage.from(BUCKET).remove([path]); // don't leave orphans
        throw dbErr;
      }

      router.refresh();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      setError(e?.message || "Upload failed. Please try again.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        type="file"
        accept=".mxl,.musicxml,.xml"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        className="bg-[#D4AF37] text-[#151517] px-5 py-3 rounded-xl font-medium hover:opacity-90 transition disabled:opacity-60"
      >
        {busy ? "Uploading…" : "Upload sheet (.mxl)"}
      </button>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}