// ─── Preferences Type System ────────────────────────────────────────────────

export type ColorTheme = "classic" | "dark" | "sepia" | "minimal";
export type UIScale = "compact" | "default" | "large";
export type AppearanceMode = "light" | "dark" | "system";

export type PracticeGoal = "15" | "30" | "60";
export type SkillFocus =
  | "sight_reading"
  | "rhythm"
  | "technique"
  | "improvisation";

export type Language = "en" | "ne" | "es" | "ja";
export type MusicNotation = "letter" | "solfege";

export interface AppearancePreferences {
  mode: AppearanceMode;
  sheetTheme: ColorTheme;
  uiScale: UIScale;
}

export interface LearningPreferences {
  practiceGoal: PracticeGoal;
  skillFocus: SkillFocus[];
}

export interface NotificationPreferences {
  practiceReminders: boolean;
  streakAlerts: boolean;
  assignmentDeadlines: boolean;
  reminderTime: string; // "HH:MM" 24h
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
}

export interface LocalizationPreferences {
  language: Language;
  musicNotation: MusicNotation;
}

export interface AccountExperiencePreferences {
  onboardingTips: boolean;
  practiceInsights: boolean;
  achievementAnimations: boolean;
  autoOpenLastLesson: boolean;
}

export interface AccessibilityPreferences {
  reduceAnimations: boolean;
  highContrast: boolean;
  largerText: boolean;
  simplifiedInterface: boolean;
}

export interface UserPreferences {
  appearance: AppearancePreferences;
  learning: LearningPreferences;
  notifications: NotificationPreferences;
  localization: LocalizationPreferences;
  accountExperience: AccountExperiencePreferences;
  accessibility: AccessibilityPreferences;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  appearance: {
    mode: "light",
    sheetTheme: "classic",
    uiScale: "default",
  },
  learning: {
    practiceGoal: "30",
    skillFocus: ["sight_reading", "rhythm"],
  },
  notifications: {
    practiceReminders: true,
    streakAlerts: true,
    assignmentDeadlines: false,
    reminderTime: "09:00",
    quietHoursEnabled: false,
    quietHoursStart: "22:00",
    quietHoursEnd: "08:00",
  },
  localization: {
    language: "en",
    musicNotation: "letter",
  },
  accountExperience: {
    onboardingTips: true,
    practiceInsights: true,
    achievementAnimations: true,
    autoOpenLastLesson: false,
  },
  accessibility: {
    reduceAnimations: false,
    highContrast: false,
    largerText: false,
    simplifiedInterface: false,
  },
};
