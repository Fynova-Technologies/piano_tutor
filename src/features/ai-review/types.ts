/** Shared contract between client, API route, and future OpenAI JSON output. */

export type AnalyticsSnapshot = {
  generatedAt: string;
  sessionCount: number;
  streakDays: number;
  recentScores: { at: string; score: number; title: string; attempts: number }[];
  scoresByLesson: Record<string, { avgScore: number; sessions: number }>;
  /** Average across all saved sessions. */
  overallAvgScore: number;
  /** Rolling average of up to the 7 most recent sessions (or fewer). */
  recentAvgScore: number;
  totalPracticeMinutes: number;
  lastSessionAt: string | null;
  previousPeriodAvgScore: number | null;
};

export type MistakeReviewPlan = {
  aiGeneratedExercises: string[];
  weakAreaDrills: string[];
  tempoCorrectionTasks: string[];
  fingerTrainingExercises: string[];
  rhythmRecoverySessions: string[];
  repeatPracticeLoops: string[];
  adaptiveDifficultyNotes: string;
  estimatedMasteryTimeline: string;
  recommendedDailyPracticeMinutes: number;
  dynamicSheetMusicSummary: string;
  smartPracticeSequencing: string[];
  metronomeRhythmGuide: string;
};

export type SheetMusicGuidance = {
  sectionsToHighlight: { label: string; reason: string }[];
  annotations: string[];
  difficultyAdjustment: string;
};

export type AiReviewReport = {
  mistakeAnalysisSummary: string;
  mostRepeatedMistakes: string[];
  weakestSkills: string[];
  accuracyScore: number;
  rhythmTimingAnalysis: string;
  pitchNoteAnalysis: string;
  speedConsistencyReview: string;
  improvementTrends: string;
  practiceQualityScore: number;
  focusRecommendationOfTheDay: string;
  recoveryRoadmap: string[];
  nextPracticeTarget: string;
  smartImprovementSuggestions: string[];
  confidenceEstimation: number;
  performanceVsPreviousSessions: string;
  aiFeedbackComments: string[];
  mistakeReviewPlan: MistakeReviewPlan;
  sheetMusicGuidance: SheetMusicGuidance;
  /** Present when response used rules-based fallback (no model output). */
  isHeuristicFallback?: boolean;
};

export type AiReviewApiResponse =
  | { ok: true; report: AiReviewReport; cached?: boolean }
  | { ok: false; code: string; message: string; report?: AiReviewReport };
