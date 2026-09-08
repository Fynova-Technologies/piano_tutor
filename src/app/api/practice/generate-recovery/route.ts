/**
 * POST /api/practice/generate-recovery
 *
 * Called by `features/recovery/RecoveryLessonStudio.tsx`. Given a source lesson,
 * pulls that lesson's recent mistake_events from `practice_session_records`
 * (+ any in-flight `currentSessionMistakes` passed from the client), ranks the
 * weakest notes, asks OpenAI for a short MusicXML drill isolating them, repairs it
 * with the same pipeline used for CDN lessons, packages it as .mxl, saves it to
 * `recovery_generated_lessons`, and returns it for immediate OSMD playback.
 *
 * Falls back to a small deterministic MusicXML drill (no OpenAI call) if
 * OPENAI_API_KEY is unset or the model call/parse fails — the feature stays usable
 * offline, same philosophy as `heuristicReport.ts` on the analysis side.
 *
 * DB requirement — `recovery_generated_lessons` (inferred from
 * `app/api/recovery-lessons/[id]/route.ts` + list route):
 *   id uuid pk default gen_random_uuid(),
 *   user_id uuid not null references auth.users(id),
 *   source_lesson_uid text, source_lesson_title text, source_lesson_source text,
 *   title text not null,
 *   music_xml text not null,
 *   meta jsonb not null default '{}',
 *   created_at timestamptz not null default now()
 * with RLS scoping all access to auth.uid() = user_id.
 */
import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getOpenAIApiKey, getOpenAIModel } from "@/lib/env/openaiServer";
import { prepareMusicXmlForOsmd } from "@/lib/musicxml/musicxmlPipeline";
import { buildMxlBase64 } from "@/lib/musicxml/buildMxl";
import { midiToNoteName } from "@/lib/practiceSessions/noteInsights";

export const runtime = "nodejs";

type IncomingMistakeEvent = {
  expectedMidi?: number[];
  playedMidi?: number;
  measureIndex?: number;
};

type WeakNote = { midi: number; note: string; count: number };

const MAX_SESSIONS_SCANNED = 15;
const MAX_WEAK_NOTES = 8;
const MIN_WEAK_NOTES_FALLBACK = [60, 62, 64, 65, 67]; // C4 D4 E4 F4 G4 — used if no mistake data at all

function rankWeakNotes(events: IncomingMistakeEvent[], limit = MAX_WEAK_NOTES): WeakNote[] {
  const counts = new Map<number, number>();
  for (const ev of events) {
    if (typeof ev.playedMidi === "number") {
      counts.set(ev.playedMidi, (counts.get(ev.playedMidi) ?? 0) + 1);
    }
    // Also credit the *expected* note as "worth drilling" even when the wrong
    // note played doesn't repeat — the target note is still the weak spot.
    for (const exp of ev.expectedMidi ?? []) {
      if (typeof exp === "number") counts.set(exp, (counts.get(exp) ?? 0) + 0.5);
    }
  }
  return [...counts.entries()]
    .map(([midi, count]) => ({ midi, note: midiToNoteName(midi), count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

function stripCodeFence(text: string) {
  let t = text.trim();
  if (t.startsWith("```")) {
    t = t.replace(/^```(?:xml|musicxml)?\s*/i, "").replace(/\s*```$/i, "");
  }
  // Some models preface with prose before the XML declaration — trim to the tag.
  const idx = t.indexOf("<?xml");
  const idx2 = idx === -1 ? t.indexOf("<score-partwise") : idx;
  if (idx2 > 0) t = t.slice(idx2);
  return t.trim();
}

function buildHeuristicDrillXml(weakNotes: WeakNote[], tempoBpm: number): string {
  const pool = weakNotes.length > 0 ? weakNotes.map((w) => w.midi) : MIN_WEAK_NOTES_FALLBACK;
  const measures: string[] = [];
  const measuresCount = 8;

  for (let m = 0; m < measuresCount; m++) {
    const notes: string[] = [];
    for (let beat = 0; beat < 4; beat++) {
      const midi = pool[(m * 4 + beat) % pool.length];
      const pc = ((midi % 12) + 12) % 12;
      const octave = Math.floor(midi / 12) - 1;
      const stepAlter: Record<number, [string, number]> = {
        0: ["C", 0], 1: ["C", 1], 2: ["D", 0], 3: ["D", 1], 4: ["E", 0],
        5: ["F", 0], 6: ["F", 1], 7: ["G", 0], 8: ["G", 1], 9: ["A", 0],
        10: ["A", 1], 11: ["B", 0],
      };
      const [step, alter] = stepAlter[pc];
      notes.push(
        `<note><pitch><step>${step}</step>${alter ? `<alter>${alter}</alter>` : ""}<octave>${octave}</octave></pitch><duration>1</duration><type>quarter</type></note>`
      );
    }
    // <direction> (metronome mark) must live INSIDE a <measure>, never as a
    // direct child of <part> — that was the structural bug. It only needs to
    // appear once, so we attach it to measure 1 alongside <attributes>.
    const attrs =
      m === 0
        ? `<attributes><divisions>1</divisions><key><fifths>0</fifths></key><time><beats>4</beats><beat-type>4</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes><direction placement="above"><direction-type><metronome><beat-unit>quarter</beat-unit><per-minute>${tempoBpm}</per-minute></metronome></direction-type></direction>`
        : "";
    measures.push(`<measure number="${m + 1}">${attrs}${notes.join("")}</measure>`);
  }

  // No DOCTYPE — an external DTD reference is unnecessary for OSMD and some
  // strict parsers stumble on it. Keep the document minimal.
  return `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1">
  <work><work-title>Recovery Drill</work-title></work>
  <identification><encoding><software>Learnkeys heuristic generator</software></encoding></identification>
  <part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list>
  <part id="P1">
    ${measures.join("\n    ")}
  </part>
</score-partwise>`;
}

/** Cheap structural sanity check — not full schema validation, just enough to
 * reject obviously-truncated or malformed model output before we trust it. */
function isLikelyValidPartwiseXml(xml: string): boolean {
  if (!xml.includes("<score-partwise")) return false;
  if (!xml.trim().endsWith("</score-partwise>")) return false;
  const openMeasures = (xml.match(/<measure[\s>]/g) ?? []).length;
  const closeMeasures = (xml.match(/<\/measure>/g) ?? []).length;
  if (openMeasures === 0 || openMeasures !== closeMeasures) return false;
  const openNotes = (xml.match(/<note[\s>]/g) ?? []).length;
  const closeNotes = (xml.match(/<\/note>/g) ?? []).length;
  if (openNotes !== closeNotes) return false;
  return true;
}

const SYSTEM_PROMPT = `You are a piano pedagogy assistant that outputs ONLY valid MusicXML 3.1 (partwise), no prose, no markdown fences.
Generate a short recovery drill (8-16 measures, 4/4 time, single treble-clef part "P1") that repeatedly and deliberately visits the given list of "weak" MIDI note numbers, using mostly quarter notes (occasional half notes for variety), moderate stepwise motion connecting the weak notes rather than random leaps, at a difficulty appropriate for a student re-drilling these specific pitches.
Rules:
- Root tag must be <score-partwise version="3.1"> with a valid <part-list> and one <part id="P1">.
- First measure must include <attributes> with <divisions>, <key>, <time>, and <clef>.
- Use only <note> elements with <pitch><step>/<alter?>/<octave></pitch> and <duration>/<type>. No chords, no rests needed but allowed sparingly.
- Prioritize the weakest (highest count) notes appearing most often.
- Output nothing except the XML document.`;

export async function POST(req: Request) {
  let body: {
    lessonUid?: string;
    lessonTitle?: string;
    lessonSource?: string;
    tempoBpm?: number;
    currentSessionMistakes?: IncomingMistakeEvent[];
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

  // Pull recent sessions for this lesson to gather mistake_events.
  const { data: rows, error: qErr } = await supabase
    .from("practice_session_records")
    .select("mistake_events")
    .eq("user_id", user.id)
    .eq("lesson_uid", lessonUid)
    .order("ended_at", { ascending: false })
    .limit(MAX_SESSIONS_SCANNED);

  if (qErr) {
    console.error("generate-recovery mistake query", qErr);
  }

  const dbEvents: IncomingMistakeEvent[] = (rows ?? []).flatMap((r) =>
    Array.isArray(r.mistake_events) ? (r.mistake_events as IncomingMistakeEvent[]) : []
  );
  const liveEvents = Array.isArray(body.currentSessionMistakes) ? body.currentSessionMistakes : [];
  const allEvents = [...dbEvents, ...liveEvents];

  const weakNotes = rankWeakNotes(allEvents);

  let musicXml: string | undefined;
  let usedOpenAi = false;

  const apiKey = getOpenAIApiKey();
  if (apiKey && weakNotes.length > 0) {
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: getOpenAIModel(),
          temperature: 0.5,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            {
              role: "user",
              content: JSON.stringify({
                weakNotes: weakNotes.map((w) => ({
                  midi: w.midi,
                  note: w.note,
                  timesMissed: Math.round(w.count),
                })),
                tempoBpm,
                lessonTitle: body.lessonTitle ?? "",
              }),
            },
          ],
        }),
      });

      if (!res.ok) {
        console.error("OpenAI drill generation error:", res.status, await res.text());
      } else {
        const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
        const raw = data.choices?.[0]?.message?.content ?? "";
        const cleaned = stripCodeFence(raw);
        if (isLikelyValidPartwiseXml(cleaned)) {
          musicXml = cleaned;
          usedOpenAi = true;
        } else {
          console.error("OpenAI drill failed structural check, using fallback:", cleaned.slice(0, 300));
        }
      }
    } catch (e) {
      console.error("OpenAI drill generation failed:", e);
    }
  }

  if (!musicXml) {
    musicXml = buildHeuristicDrillXml(weakNotes, tempoBpm);
    usedOpenAi = false;
  }

  let prepared: string;
  try {
    prepared = prepareMusicXmlForOsmd(musicXml);
  } catch (e) {
    console.error("MusicXML repair failed, using heuristic fallback:", e);
    prepared = prepareMusicXmlForOsmd(buildHeuristicDrillXml(weakNotes, tempoBpm));
    usedOpenAi = false;
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

  const title = `Recovery · ${body.lessonTitle || lessonUid}`;

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
        weakNotes,
        generatedWithOpenAi: usedOpenAi,
      },
    })
    .select("id")
    .maybeSingle();

  if (insErr) {
    console.error("recovery_generated_lessons insert failed:", insErr);
    // Still return the playable drill even if the save failed — better than losing it.
    return NextResponse.json({
      ok: true,
      musicXml: prepared,
      mxlBase64,
      fileName,
      recoveryLessonId: null,
      warning: "Drill generated but could not be saved to history.",
    });
  }

  return NextResponse.json({
    ok: true,
    musicXml: prepared,
    mxlBase64,
    fileName,
    recoveryLessonId: inserted?.id ?? null,
  });
}