export const PREFERENCES_KEY = "piano_preferences_v1";

export type AppearanceMode = "system" | "light" | "dark";
export type SheetTheme = "cream" | "white" | "dark";
export type UiScale = "comfortable" | "compact" | "large";
export type PracticeGoalMinutes = 15 | 30 | 60;
export type SkillFocus = "sight_reading" | "rhythm" | "technique" | "improvisation";

export type AppPreferences = {
  appearance: AppearanceMode;
  sheetTheme: SheetTheme;
  uiScale: UiScale;
  practiceGoalMinutes: PracticeGoalMinutes;
  skillFocus: SkillFocus[];
  notifyReminderEnabled: boolean;
  notifyReminderTime: string;
  notifyStreakAlerts: boolean;
  notifyAssignmentDeadlines: boolean;
  language: string;
  musicNotationLocale: "english" | "german" | "italian";
};

export const defaultPreferences: AppPreferences = {
  appearance: "light",
  sheetTheme: "cream",
  uiScale: "comfortable",
  practiceGoalMinutes: 30,
  skillFocus: ["sight_reading", "rhythm"],
  notifyReminderEnabled: true,
  notifyReminderTime: "18:00",
  notifyStreakAlerts: true,
  notifyAssignmentDeadlines: true,
  language: "en",
  musicNotationLocale: "english",
};

export function loadPreferences(): AppPreferences {
  if (typeof window === "undefined") return defaultPreferences;
  try {
    const raw = localStorage.getItem(PREFERENCES_KEY);
    if (!raw) return defaultPreferences;
    const parsed = JSON.parse(raw) as Partial<AppPreferences>;
    return { ...defaultPreferences, ...parsed };
  } catch {
    return defaultPreferences;
  }
}

export function savePreferences(p: AppPreferences): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PREFERENCES_KEY, JSON.stringify(p));
}
