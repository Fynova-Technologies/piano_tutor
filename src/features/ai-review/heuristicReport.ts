import type { AnalyticsSnapshot, AiReviewReport } from "./types";

/** Rules-based coach copy when OpenAI is unavailable — keeps the module fully usable offline. */
export function buildHeuristicReport(snapshot: AnalyticsSnapshot): AiReviewReport {
  const lowLessons = Object.entries(snapshot.scoresByLesson)
    .filter(([, v]) => v.avgScore < 75 && v.sessions >= 1)
    .sort((a, b) => a[1].avgScore - b[1].avgScore)
    .slice(0, 5)
    .map(([k]) => k);

  const trend =
    snapshot.previousPeriodAvgScore != null &&
    snapshot.sessionCount >= 3
      ? snapshot.recentAvgScore >= snapshot.previousPeriodAvgScore
        ? `Your last sessions average (${snapshot.recentAvgScore}%) is at or above your earlier baseline (${snapshot.previousPeriodAvgScore}%). Keep linking short sessions with focused reps.`
        : `Recent sessions average ${snapshot.recentAvgScore}% vs an earlier ${snapshot.previousPeriodAvgScore}%. Prioritize slower-tempo accuracy before speed.`
      : snapshot.sessionCount === 0
        ? "No saved practice sessions yet. Complete a lesson to unlock trend analysis."
        : "Complete a few more sessions to compare this week against earlier performance.";

  const focus =
    lowLessons[0] ??
    (snapshot.sessionCount
      ? "Maintain hand independence and steady quarter-note pulse in your current repertoire."
      : "Start with Middle C navigation and whole-note reading — establish a daily 10-minute routine.");

  return {
    mistakeAnalysisSummary:
    snapshot.sessionCount === 0
      ? "Once you practice with scoring enabled, your mistake patterns (by piece and attempt count) will appear here."
      : `From ${snapshot.sessionCount} saved session(s), weaker averages cluster around: ${lowLessons.slice(0, 3).join("; ") || "— balanced so far"}. Higher attempts on the same lesson often signal sections worth isolating.`,
    mostRepeatedMistakes: lowLessons.length
      ? [
          `Pieces scoring under ~75%: ${lowLessons.slice(0, 3).join(", ")}`,
          snapshot.recentScores.some((s) => s.attempts > 2)
            ? "Multiple attempts on recent runs — loop the first 2 measures before full play-throughs."
            : "Attempt counts look stable — add deliberate mistake replays on hard transitions only.",
        ]
      : ["Not enough data — play and save a few scored sessions."],
    weakestSkills: lowLessons.length
      ? ["Reading + recall on lower-scoring titles", "Consistency under tempo", "End-of-phrase relaxation"]
      : ["Baseline not established"],
    accuracyScore: snapshot.recentAvgScore,
    rhythmTimingAnalysis:
      snapshot.sessionCount === 0
        ? "Rhythm variance will be inferred from session scores once you log practice."
        : "Use a metronome at 70–80% of performance tempo for one clean pass, then notch up 4 BPM. This stabilizes timing without dulling musical line.",
    pitchNoteAnalysis:
      snapshot.sessionCount === 0
        ? "Pitch accuracy tracking activates after scored lessons."
        : "Isolate suspect measures hands-separately; hum the line before playing to anchor pitch memory.",
    speedConsistencyReview:
      snapshot.sessionCount < 2
        ? "Speed consistency needs at least two timed sessions to compare."
        : "Prioritize evenness: if scores jump between sessions, cap tempo until variance drops.",
    improvementTrends: trend,
    practiceQualityScore: Math.min(100, 40 + snapshot.streakDays * 8 + Math.min(40, snapshot.sessionCount * 2)),
    focusRecommendationOfTheDay: focus,
    recoveryRoadmap: [
      "Single-measure loops ×5 correct in a row",
      "Hands separate → hands together at reduced tempo",
      "One full pass with metronome, then one without",
    ],
    nextPracticeTarget:
      lowLessons[0] != null
        ? `Spend 70% of today's time on: ${lowLessons[0]}`
        : "Complete one full lesson with recording enabled, then rerun only measures 1–4.",
    smartImprovementSuggestions: [
      "Gamify reps: +1 XP per perfect slow loop (track mentally or on paper).",
      "Alternate 3 min technique + 7 min repertoire to protect focus quality.",
    ],
    confidenceEstimation: snapshot.sessionCount >= 8 ? 72 : snapshot.sessionCount >= 3 ? 55 : 35,
    performanceVsPreviousSessions: trend,
    aiFeedbackComments: [
      snapshot.streakDays > 0
        ? `Nice consistency — ${snapshot.streakDays}-day practice streak supports skill consolidation.`
        : "Short daily blocks beat rare marathons for motor memory.",
    ],
    mistakeReviewPlan: {
      aiGeneratedExercises: [
        "Five-finger pattern in RH, quarter notes, mf",
        "Broken chord outline of the lowest-scoring phrase (if applicable)",
      ],
      weakAreaDrills: lowLessons.length
        ? [`Micro-loop final beat of each bar in ${lowLessons[0]}`, "Tap rhythm on desk before keyboard"]
        : ["Tap-and-clap the main time signature before playing"],
      tempoCorrectionTasks: [
        "Set metronome −20 BPM from last run; successful pass → +4 BPM ladder",
      ],
      fingerTrainingExercises: ["Contrary motion scales — two octaves, legato", "Wrist lift between phrase boundaries"],
      rhythmRecoverySessions: ["Subdivide aloud: \"1 e & a\" on problem measures", "Accent beat 1 only for one page"],
      repeatPracticeLoops: ["2-measure A loop until 3 clean passes", "Bridge-into-coda loop ×10"],
      adaptiveDifficultyNotes:
        "When accuracy exceeds ~90% at current tempo, increase difficulty by tempo or by adding left-hand alone first.",
      estimatedMasteryTimeline: snapshot.sessionCount
        ? "Estimate 2–4 weeks of focused 20-min days for measurable shift on weakest titles (heuristic)."
        : "Start logging sessions to personalize timeline.",
      recommendedDailyPracticeMinutes: Math.min(45, 15 + snapshot.streakDays * 2),
      dynamicSheetMusicSummary:
        "Personalized MusicXML/MXL export can be wired to this card via `POST /api/ai-review/sheet` (see route comments).",
      smartPracticeSequencing: ["Warm-up → isolate → slow full piece → review weakest 8 bars"],
      metronomeRhythmGuide:
        "Beat 2 and 4 softly on snare-voice mental model; align releases with click, not only attacks.",
    },
    sheetMusicGuidance: {
      sectionsToHighlight:
        lowLessons.length > 0
          ? [{ label: lowLessons[0], reason: "Lowest rolling average in your history" }]
          : [{ label: "Opening phrase", reason: "Default focus until sessions accrue" }],
      annotations: ["Circle accidentals", "Mark finger numbers only where shifts occur"],
      difficultyAdjustment: "Reduce polyphony or tempo before adding pedal.",
    },
    isHeuristicFallback: true,
  };
}
