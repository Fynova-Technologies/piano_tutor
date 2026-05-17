/**
 * POST /api/practice/generate-recovery
 *
 * --- Recovery lesson generation (AI) ---
 * Loads Supabase `practice_session_records`, merges live mistakes, calls OpenAI for MusicXML.
 *
 * --- MusicXML generation / XML validation / MXL conversion ---
 * 1) Model returns text → `normalizeAndValidateModelMusicXml` (strip fences/JSON, enforce <?xml, score-partwise).
 * 2) On failure: automatic retry with stricter system instruction (up to 3 attempts).
 * 3) Only after validation: build MXL ZIP (DEFLATE) → base64.
 * 4) Persist row in `recovery_generated_lessons` for history / replay.
 *
 * Security: OpenAI key server-only. Requires Supabase session.
 */
import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getOpenAIApiKey, getOpenAIModel } from "@/lib/env/openaiServer";
import { normalizeAndValidateModelMusicXml } from "@/lib/musicxml/musicxmlPipeline";
import { buildMxlBase64 } from "@/lib/musicxml/buildMxl";

export const runtime = "nodejs";

const MXL_PROMPT = `You are an expert piano pedagogy and MusicXML 3.1 author.

The output MUST begin exactly with:
<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1">

Never use <score>, <musicxml>, <music-score>, or any other root element.
Never omit the root element. Never output JSON, markdown, or explanation text —
raw MusicXML only, starting with the XML declaration.

CRITICAL OUTPUT RULES:
- Output ONE raw XML document ONLY. No markdown, no code fences, no JSON, no commentary before or after.
- The FIRST character of your entire reply MUST be "<" (the XML declaration).
- Output complete, valid XML only — never truncate mid-tag.

STRICT MUSICXML RULES — violations break the renderer:
1. Every <score-part> MUST have an id attribute matching its <part> id, e.g. <score-part id="P1" name="Piano"> ... and <part id="P1">.
2. <clef> MUST use child elements, never plain text:
   - Treble: <clef><sign>G</sign><line>2</line></clef>
   - Bass:   <clef><sign>F</sign><line>4</line></clef>
   - Alto:   <clef><sign>C</sign><line>3</line></clef>
3. Every <attributes> block MUST include <divisions>, <key>, <time>, and <clef> (per staff as needed for piano).
4. Never self-close <measure/>. Every measure must contain at least one <note> or <rest> subtree.

Rules:
- <part-list><score-part id="P1" name="Piano"><score-instrument id="P1-I1"/></score-part></part-list>
- <part id="P1"> with two staves: treble G clef staff 1, bass F clef staff 2, default piano
- 4 to 12 measures. Use note types whole, half, or quarter only. Valid pitch: <step>, optional <alter>, <octave>.
- Build a "recovery drill": repeat patterns that reinforce the problem MIDI pitches and intervals described in the user JSON.
- If few mistakes, write a short warm-up using suggested focus pitches.
- No <lyric>, minimize attributes. Ensure every measure has correct <backup> when voices cross staves.`;

const RETRY_ADDENDUM =
  "RETRY: Invalid or rejected. Output ONLY raw MusicXML. First line exactly: <?xml version=\"1.0\" encoding=\"UTF-8\"?> Second line exactly: <score-partwise version=\"3.1\"> No JSON, markdown, or prose.";

type ChatMessage = { role: "system" | "user"; content: string };

async function completeOpenAI(messages: ChatMessage[]) {
  const apiKey = getOpenAIApiKey();
  if (!apiKey) throw new Error("NO_API_KEY");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: getOpenAIModel(),
      temperature: 0.25,
      max_tokens: 4096,
      messages,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("OpenAI (generate-recovery)", res.status, errText);
    throw new Error("OPENAI_HTTP_ERROR");
  }

  const ojson = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return ojson.choices?.[0]?.message?.content ?? "";
}

export async function POST(req: Request) {
  const apiKey = getOpenAIApiKey();
  if (!apiKey) {
    return NextResponse.json(
      { ok: false, code: "NO_API_KEY", message: "Server missing OPENAI_API_KEY" },
      { status: 503 }
    );
  }

  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          ok: false,
          code: "UNAUTHORIZED",
          message: "Sign in to generate recovery drills from cloud history.",
        },
        { status: 401 }
      );
    }

    const body = await req.json();
    const lessonUid = String(body.lessonUid ?? "");
    if (!lessonUid) {
      return NextResponse.json({ ok: false, code: "BAD_REQUEST", message: "lessonUid required" }, { status: 400 });
    }

    const { data: rows, error } = await supabase
      .from("practice_session_records")
      .select(
        "mistake_events, mistakes, weak_areas, tempo_bpm, ended_at, score, incorrect_notes, lesson_title, lesson_source, lesson_file"
      )
      .eq("user_id", user.id)
      .eq("lesson_uid", lessonUid)
      .order("ended_at", { ascending: false })
      .limit(30);

    if (error) {
      console.error("generate-recovery select", error);
      return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
    }

    const history = (rows ?? []).map((r) => ({
      ended_at: r.ended_at,
      score: r.score,
      incorrect_notes: r.incorrect_notes,
      tempo_bpm: r.tempo_bpm,
      weak_areas: r.weak_areas,
      mistakes: r.mistakes,
      mistake_events: r.mistake_events,
    }));

    const payload = {
      lessonUid,
      lessonTitle: String(body.lessonTitle ?? ""),
      lessonSource: String(body.lessonSource ?? ""),
      baseFileName: body.baseFileName != null ? String(body.baseFileName) : null,
      targetTempoBpm: body.tempoBpm != null ? Number(body.tempoBpm) : null,
      currentSessionMistakes: Array.isArray(body.currentSessionMistakes)
        ? body.currentSessionMistakes
        : [],
      supabaseRecentSessions: history,
    };

    const userJson = JSON.stringify(payload);

    let musicXml: string | null = null;
    let lastValError = "";

    for (let attempt = 0; attempt < 3; attempt++) {
      const messages: ChatMessage[] =
        attempt === 0
          ? [
              { role: "system", content: MXL_PROMPT },
              { role: "user", content: userJson },
            ]
          : [
              { role: "system", content: `${MXL_PROMPT}\n\n${RETRY_ADDENDUM}` },
              {
                role: "user",
                content: `${userJson}\n\n(validator: ${lastValError})`,
              },
            ];

      let text: string;
      try {
        text = await completeOpenAI(messages);
      } catch (e) {
        if (e instanceof Error && e.message === "OPENAI_HTTP_ERROR") {
          return NextResponse.json(
            { ok: false, code: "OPENAI_ERROR", message: "AI generation failed" },
            { status: 502 }
          );
        }
        throw e;
      }

      const validation = normalizeAndValidateModelMusicXml(text);
      if (validation.ok) {
        musicXml = validation.doc;
        break;
      }
      lastValError = validation.error;
      console.warn(`generate-recovery: attempt ${attempt + 1} invalid:`, validation.error);
    }

    if (!musicXml) {
      return NextResponse.json(
        {
          ok: false,
          code: "INVALID_XML",
          message: lastValError || "Model did not return valid MusicXML after retries",
        },
        { status: 422 }
      );
    }

    const mxlEntryName = "score.musicxml";
    const { base64: mxlBase64 } = await buildMxlBase64(musicXml, mxlEntryName);
    const safeSlug = lessonUid.replace(/[^a-zA-Z0-9-_]/g, "_");
    const downloadName = `recovery-${safeSlug}.mxl`;

    const mistakeSnapshot = {
      lessonUid,
      historySessionCount: history.length,
      liveMistakes: payload.currentSessionMistakes.length,
    };

    let recoveryLessonId: string | null = null;
    const insertPayload = {
      user_id: user.id,
      source_lesson_uid: lessonUid,
      source_lesson_title: String(body.lessonTitle ?? ""),
      source_lesson_source: String(body.lessonSource ?? ""),
      title: `Recovery · ${String(body.lessonTitle || lessonUid).slice(0, 80)}`,
      music_xml: musicXml,
      mistake_snapshot: mistakeSnapshot,
      meta: {
        downloadFileName: downloadName,
        mxlEntryName: "score.musicxml",
        model: getOpenAIModel(),
      },
    };

    const { data: inserted, error: insErr } = await supabase
      .from("recovery_generated_lessons")
      .insert(insertPayload)
      .select("id")
      .single();

    if (insErr) {
      console.error("recovery_generated_lessons insert", insErr);
    } else if (inserted?.id) {
      recoveryLessonId = inserted.id;
    }

    return NextResponse.json({
      ok: true,
      musicXml: musicXml,
      mxlBase64,
      fileName: downloadName,
      recoveryLessonId,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { ok: false, message: e instanceof Error ? e.message : "error" },
      { status: 500 }
    );
  }
}
