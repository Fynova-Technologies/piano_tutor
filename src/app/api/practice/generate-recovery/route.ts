/**
 * POST /api/practice/generate-recovery
 *
 * Called by `features/recovery/RecoveryLessonStudio.tsx`. Given a source lesson,
 * pulls that lesson's recent mistake_events AND progress_metrics.handStats from
 * `practice_session_records`, ranks the weakest notes PER HAND, decides which hand(s)
 * to drill, and produces a grand-staff MusicXML drill (treble = right hand, bass = left).
 *
 * Body: { lessonUid, lessonTitle?, lessonSource?, tempoBpm?,
 *         handFocus?: "auto" | "left" | "right" | "both",   // default "auto"
 *         currentSessionMistakes? }
 *
 * Generation order:
 *   1. OpenAI (if OPENAI_API_KEY is set and there are weak notes for the drilled hand).
 *      Its output must pass isValidDrillXml, which checks the staves line up and that
 *      pitched notes sit only on the hand(s) being drilled.
 *   2. Otherwise / on any failure: the deterministic generator in lib/recovery/handDrill.ts.
 *
 * DB requirement unchanged: `recovery_generated_lessons` (see app/api/recovery-lessons).
 */
import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getOpenAIApiKey, getOpenAIModel } from "@/lib/env/openaiServer";
import { prepareMusicXmlForOsmd } from "@/lib/musicxml/musicxmlPipeline";
import { buildMxlBase64 } from "@/lib/musicxml/buildMxl";
import {
  buildDrillUserPayload,
  buildDrillXml,
  buildGrandStaffSystemPrompt,
  extractHandStats,
  isValidDrillXml,
  parseEvents,
  rankWeakNotesByHand,
  resolveHandFocus,
  type DrillMistakeEvent,
  type FocusDecision,
  type HandFocusMode,
  type HandStatsLike,
  type HandWeakNotes,
} from "@/lib/recovery/recoveryDrill";

export const runtime = "nodejs";

const MAX_SESSIONS_SCANNED = 15;
const HAND_MODES: HandFocusMode[] = ["auto", "left", "right", "both"];

function stripCodeFence(text: string) {
  let t = text.trim();
  if (t.startsWith("```")) {
    t = t.replace(/^```(?:xml|musicxml)?\s*/i, "").replace(/\s*```$/i, "");
  }
  // Some models preface with prose before the XML declaration; trim to the tag.
  const idx = t.indexOf("<?xml");
  const idx2 = idx === -1 ? t.indexOf("<score-partwise") : idx;
  if (idx2 > 0) t = t.slice(idx2);
  return t.trim();
}

/** Legacy single-staff prompt, used only when the drill is treble-only (no hand data). */
const TREBLE_ONLY_PROMPT = `You are a piano pedagogy assistant that outputs ONLY valid MusicXML 3.1 (partwise), no prose, no markdown fences.
Generate a short recovery drill (8-16 measures, 4/4 time, single treble-clef part "P1") that repeatedly and deliberately visits the given list of "weak" MIDI note numbers, using mostly quarter notes (occasional half notes for variety), moderate stepwise motion connecting the weak notes rather than random leaps, at a difficulty appropriate for a student re-drilling these specific pitches.
Rules:
- Root tag must be <score-partwise version="3.1"> with a valid <part-list> and one <part id="P1">.
- First measure must include <attributes> with <divisions>, <key>, <time>, and <clef>.
- Use only <note> elements with <pitch><step>/<alter?>/<octave></pitch> and <duration>/<type>. No chords, no rests needed but allowed sparingly.
- Prioritize the weakest (highest count) notes appearing most often.
- Output nothing except the XML document.`;

function safePrepare(xml: string): string | null {
  try {
    return prepareMusicXmlForOsmd(xml);
  } catch (e) {
    console.error("MusicXML repair failed:", e);
    return null;
  }
}

async function askOpenAi(
  apiKey: string,
  weak: HandWeakNotes,
  decision: FocusDecision,
  tempoBpm: number,
  lessonTitle: string
): Promise<string | null> {
  const grand = decision.layout === "grand";
  const system = grand ? buildGrandStaffSystemPrompt(decision) : TREBLE_ONLY_PROMPT;
  const user = grand
    ? buildDrillUserPayload(weak, decision, tempoBpm, lessonTitle)
    : {
        weakNotes: weak.right.map((w) => ({
          midi: w.midi,
          note: w.note,
          timesMissed: Math.max(1, Math.round(w.count)),
        })),
        tempoBpm,
        lessonTitle,
      };

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: getOpenAIModel(),
      temperature: 0.4,
      messages: [
        { role: "system", content: system },
        { role: "user", content: JSON.stringify(user) },
      ],
    }),
  });
  if (!res.ok) {
    console.error("OpenAI drill generation error:", res.status, await res.text());
    return null;
  }
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return stripCodeFence(data.choices?.[0]?.message?.content ?? "");
}

export async function POST(req: Request) {
  let body: {
    lessonUid?: string;
    lessonTitle?: string;
    lessonSource?: string;
    tempoBpm?: number;
    handFocus?: string;
    currentSessionMistakes?: DrillMistakeEvent[];
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, code: "BAD_REQUEST", message: "Expected JSON body" },
      { status: 400 }
    );
  }

  const lessonUid = body.lessonUid;
  if (!lessonUid) {
    return NextResponse.json(
      { ok: false, code: "BAD_REQUEST", message: "lessonUid required" },
      { status: 400 }
    );
  }
  const tempoBpm = Number(body.tempoBpm) || 72;
  const mode: HandFocusMode = HAND_MODES.includes(body.handFocus as HandFocusMode)
    ? (body.handFocus as HandFocusMode)
    : "auto";

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

  const { data: rows, error: qErr } = await supabase
    .from("practice_session_records")
    .select("mistake_events, progress_metrics")
    .eq("user_id", user.id)
    .eq("lesson_uid", lessonUid)
    .order("ended_at", { ascending: false })
    .limit(MAX_SESSIONS_SCANNED);

  if (qErr) console.error("generate-recovery mistake query", qErr);

  // parseEvents / extractHandStats accept both jsonb objects and JSON strings.
  const dbEvents: DrillMistakeEvent[] = (rows ?? []).flatMap((r) => parseEvents(r.mistake_events));
  const liveEvents = Array.isArray(body.currentSessionMistakes) ? body.currentSessionMistakes : [];
  const statsList: HandStatsLike[] = (rows ?? [])
    .map((r) => extractHandStats(r.progress_metrics))
    .filter((s): s is HandStatsLike => s != null);

  const weak = rankWeakNotesByHand([...dbEvents, ...liveEvents], statsList);
  const decision = resolveHandFocus(mode, statsList, weak);

  // The model only gets a shot when there is real evidence for the hand being drilled.
  const evidenceForFocus =
    decision.focus === "left"
      ? weak.left.length > 0
      : decision.focus === "right"
        ? weak.right.length > 0
        : weak.left.length > 0 || weak.right.length > 0;

  const deterministic = () => buildDrillXml(weak, decision, tempoBpm);

  let musicXml: string | undefined;
  let usedOpenAi = false;

  const apiKey = getOpenAIApiKey();
  if (apiKey && evidenceForFocus) {
    try {
      const raw = await askOpenAi(apiKey, weak, decision, tempoBpm, body.lessonTitle ?? "");
      if (raw && isValidDrillXml(raw, decision)) {
        musicXml = raw;
        usedOpenAi = true;
      } else if (raw) {
        console.error("OpenAI drill failed validation, using fallback:", raw.slice(0, 300));
      }
    } catch (e) {
      console.error("OpenAI drill generation failed:", e);
    }
  }
  if (!musicXml) musicXml = deterministic();

  // Repair for OSMD, then re-check that the repair step did not drop a staff or a hand.
  let prepared = safePrepare(musicXml);
  if (!prepared || !isValidDrillXml(prepared, decision)) {
    if (usedOpenAi) console.error("Prepared model drill failed validation, using fallback");
    usedOpenAi = false;
    const fallback = deterministic();
    const preparedFallback = safePrepare(fallback);
    prepared =
      preparedFallback && isValidDrillXml(preparedFallback, decision) ? preparedFallback : fallback;
  }

  const mxlEntryName = "score.musicxml";
  const fileName = `recovery-${lessonUid.replace(/[^a-z0-9-]/gi, "_")}-${Date.now()}.mxl`;
  let mxlBase64: string | undefined;
  try {
    const built = await buildMxlBase64(prepared, mxlEntryName);
    mxlBase64 = built.base64;
  } catch (e) {
    console.error("MXL packaging failed:", e);
  }

  const handLabel =
    decision.layout === "treble_only"
      ? ""
      : decision.focus === "left"
        ? "Left hand · "
        : decision.focus === "right"
          ? "Right hand · "
          : "Both hands · ";
  const title = `Recovery · ${handLabel}${body.lessonTitle || lessonUid}`;

  const { data: inserted, error: insErr } = await supabase
    .from("recovery_generated_lessons")
    .insert({
      user_id: user.id,
      source_lesson_uid: lessonUid,
      source_lesson_title: body.lessonTitle ?? "",
      source_lesson_source: body.lessonSource ?? "",
      title,
      music_xml: prepared,
      meta: {
        downloadFileName: fileName,
        mxlEntryName,
        tempoBpm,
        // flat list kept for anything that already reads meta.weakNotes
        weakNotes: [...weak.left, ...weak.right],
        weakNotesByHand: weak,
        handFocus: decision.focus,
        handFocusRequested: mode,
        handReason: decision.reason,
        layout: decision.layout,
        generatedWithOpenAi: usedOpenAi,
      },
    })
    .select("id")
    .maybeSingle();

  const common = {
    ok: true,
    musicXml: prepared,
    mxlBase64,
    fileName,
    title,
    handFocus: decision.focus,
    handReason: decision.reason,
    layout: decision.layout,
  };

  if (insErr) {
    console.error("recovery_generated_lessons insert failed:", insErr);
    // Still return the playable drill even if the save failed.
    return NextResponse.json({
      ...common,
      recoveryLessonId: null,
      warning: "Drill generated but could not be saved to history.",
    });
  }

  return NextResponse.json({ ...common, recoveryLessonId: inserted?.id ?? null });
}