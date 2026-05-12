/**
 * POST /api/ai-review
 *
 * Architecture (OpenAI integration — wire when `OPENAI_API_KEY` is set in `.env.local`):
 * - `mistakeAnalysis`, `reviewGeneration`: single chat completion with structured JSON (see SYSTEM_PROMPT).
 * - `dynamicSheetMusic`: extend with `POST /api/ai-review/sheet` returning MusicXML fragments + metadata;
 *   client can pipe into OSMD or store as downloadable `.musicxml`.
 * - `recommendationEngine`: same payload drives roadmap + "focus of the day"; cache by snapshot hash.
 * - `analyticsInterpretation`: snapshot is built client-side from `practice_sessions` localStorage; server trusts
 *   aggregate stats only — enrich with user id + DB when you migrate off local storage.
 * - `personalizedRecovery`: fields map 1:1 to `AiReviewReport.mistakeReviewPlan` in types.ts.
 *
 * Env: `OPENAI_API_KEY` — never commit keys; never pass from browser.
 *
 * Future: add Redis/Upstash cache keyed by `hashSnapshot(snapshot)` with TTL 6h.
 */

import { NextResponse } from "next/server";
import type { AnalyticsSnapshot, AiReviewReport } from "@/features/ai-review/types";
import { buildHeuristicReport } from "@/features/ai-review/heuristicReport";
import { getOpenAIApiKey, getOpenAIModel } from "@/lib/env/openaiServer";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `You are an expert piano pedagogy coach. Given JSON analytics from a student's saved practice sessions (scores, lesson titles, attempts, streaks), return a single JSON object matching this TypeScript shape (no markdown, no prose outside JSON):
{
  "mistakeAnalysisSummary": string,
  "mostRepeatedMistakes": string[],
  "weakestSkills": string[],
  "accuracyScore": number (0-100, estimated from data),
  "rhythmTimingAnalysis": string,
  "pitchNoteAnalysis": string,
  "speedConsistencyReview": string,
  "improvementTrends": string,
  "practiceQualityScore": number (0-100),
  "focusRecommendationOfTheDay": string,
  "recoveryRoadmap": string[],
  "nextPracticeTarget": string,
  "smartImprovementSuggestions": string[],
  "confidenceEstimation": number (0-100, how confident you are in this advice given data sparsity),
  "performanceVsPreviousSessions": string,
  "aiFeedbackComments": string[],
  "mistakeReviewPlan": {
    "aiGeneratedExercises": string[],
    "weakAreaDrills": string[],
    "tempoCorrectionTasks": string[],
    "fingerTrainingExercises": string[],
    "rhythmRecoverySessions": string[],
    "repeatPracticeLoops": string[],
    "adaptiveDifficultyNotes": string,
    "estimatedMasteryTimeline": string,
    "recommendedDailyPracticeMinutes": number,
    "dynamicSheetMusicSummary": string (describe what personalized sheet exercise would look like; MusicXML can be added later),
    "smartPracticeSequencing": string[],
    "metronomeRhythmGuide": string
  },
  "sheetMusicGuidance": {
    "sectionsToHighlight": { "label": string, "reason": string }[],
    "annotations": string[],
    "difficultyAdjustment": string
  }
}
Be encouraging, specific, and reference lesson titles or patterns from the input when possible. If sessionCount is 0, still return helpful defaults and lower confidenceEstimation.`;

function stripJsonFence(text: string) {
  let t = text.trim();
  if (t.startsWith("```")) {
    t = t.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  }
  return t.trim();
}

function coerceReport(raw: unknown, snapshot: AnalyticsSnapshot): AiReviewReport | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const plan = o.mistakeReviewPlan as Record<string, unknown> | undefined;
  const sheet = o.sheetMusicGuidance as Record<string, unknown> | undefined;
  if (
    typeof o.mistakeAnalysisSummary !== "string" ||
    !Array.isArray(o.mostRepeatedMistakes) ||
    !plan ||
    !sheet
  ) {
    return null;
  }

  return {
    mistakeAnalysisSummary: o.mistakeAnalysisSummary,
    mostRepeatedMistakes: o.mostRepeatedMistakes as string[],
    weakestSkills: (o.weakestSkills as string[]) ?? [],
    accuracyScore: Number(o.accuracyScore) || snapshot.recentAvgScore,
    rhythmTimingAnalysis: String(o.rhythmTimingAnalysis ?? ""),
    pitchNoteAnalysis: String(o.pitchNoteAnalysis ?? ""),
    speedConsistencyReview: String(o.speedConsistencyReview ?? ""),
    improvementTrends: String(o.improvementTrends ?? ""),
    practiceQualityScore: Math.min(
      100,
      Math.max(0, Number(o.practiceQualityScore) || 0)
    ),
    focusRecommendationOfTheDay: String(o.focusRecommendationOfTheDay ?? ""),
    recoveryRoadmap: (o.recoveryRoadmap as string[]) ?? [],
    nextPracticeTarget: String(o.nextPracticeTarget ?? ""),
    smartImprovementSuggestions: (o.smartImprovementSuggestions as string[]) ?? [],
    confidenceEstimation: Math.min(
      100,
      Math.max(0, Number(o.confidenceEstimation) || 50)
    ),
    performanceVsPreviousSessions: String(o.performanceVsPreviousSessions ?? ""),
    aiFeedbackComments: (o.aiFeedbackComments as string[]) ?? [],
    mistakeReviewPlan: {
      aiGeneratedExercises:
        (plan.aiGeneratedExercises as string[]) ?? [],
      weakAreaDrills: (plan.weakAreaDrills as string[]) ?? [],
      tempoCorrectionTasks: (plan.tempoCorrectionTasks as string[]) ?? [],
      fingerTrainingExercises:
        (plan.fingerTrainingExercises as string[]) ?? [],
      rhythmRecoverySessions:
        (plan.rhythmRecoverySessions as string[]) ?? [],
      repeatPracticeLoops: (plan.repeatPracticeLoops as string[]) ?? [],
      adaptiveDifficultyNotes: String(plan.adaptiveDifficultyNotes ?? ""),
      estimatedMasteryTimeline: String(plan.estimatedMasteryTimeline ?? ""),
      recommendedDailyPracticeMinutes:
        Number(plan.recommendedDailyPracticeMinutes) || 20,
      dynamicSheetMusicSummary: String(plan.dynamicSheetMusicSummary ?? ""),
      smartPracticeSequencing:
        (plan.smartPracticeSequencing as string[]) ?? [],
      metronomeRhythmGuide: String(plan.metronomeRhythmGuide ?? ""),
    },
    sheetMusicGuidance: {
      sectionsToHighlight:
        (sheet.sectionsToHighlight as { label: string; reason: string }[]) ??
        [],
      annotations: (sheet.annotations as string[]) ?? [],
      difficultyAdjustment: String(sheet.difficultyAdjustment ?? ""),
    },
    isHeuristicFallback: false,
  };
}

export async function POST(req: Request) {
  let snapshot: AnalyticsSnapshot;
  try {
    const body = await req.json();
    snapshot = body.snapshot as AnalyticsSnapshot;
    if (!snapshot || typeof snapshot.sessionCount !== "number") {
      return NextResponse.json(
        { ok: false, code: "BAD_REQUEST", message: "Invalid snapshot" },
        { status: 400 }
      );
    }
  } catch {
    return NextResponse.json(
      { ok: false, code: "BAD_REQUEST", message: "Expected JSON body" },
      { status: 400 }
    );
  }

  const apiKey = getOpenAIApiKey();
  if (!apiKey) {
    const report = buildHeuristicReport(snapshot);
    return NextResponse.json({
      ok: false,
      code: "NO_API_KEY",
      message:
        "Set OPENAI_API_KEY in .env.local for full AI coaching. Showing heuristic report.",
      report,
    });
  }

  try {
    const userPayload = {
      analytics: snapshot,
      note: "Interpret holistically; session data is aggregate-only.",
    };

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: getOpenAIModel(),
        temperature: 0.55,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: JSON.stringify(userPayload),
          },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("OpenAI error:", res.status, errText);
      return NextResponse.json(
        {
          ok: false,
          code: "OPENAI_ERROR",
          message: "AI service unavailable. Showing heuristic report.",
          report: buildHeuristicReport(snapshot),
        },
        { status: 502 }
      );
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = data.choices?.[0]?.message?.content ?? "";
    const parsed = JSON.parse(stripJsonFence(text));
    const report = coerceReport(parsed, snapshot);
    if (!report) {
      return NextResponse.json({
        ok: false,
        code: "PARSE_ERROR",
        message: "Could not parse AI response. Showing heuristic report.",
        report: buildHeuristicReport(snapshot),
      });
    }

    return NextResponse.json({ ok: true, report });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      {
        ok: false,
        code: "SERVER_ERROR",
        message: e instanceof Error ? e.message : "Unknown error",
        report: buildHeuristicReport(snapshot),
      },
      { status: 500 }
    );
  }
}
