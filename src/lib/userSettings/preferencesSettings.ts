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

const SKILL_SET = new Set<SkillFocus>([
  "sight_reading",
  "rhythm",
  "technique",
  "improvisation",
]);

export function mergeAppPreferencesPartial(
  partial: Partial<AppPreferences> | null | undefined,
): AppPreferences {
  if (!partial || typeof partial !== "object") return { ...defaultPreferences };
  const merged: AppPreferences = { ...defaultPreferences, ...partial };
  if (Array.isArray(partial.skillFocus)) {
    merged.skillFocus = [
      ...new Set(
        partial.skillFocus.filter((s): s is SkillFocus =>
          SKILL_SET.has(s as SkillFocus),
        ),
      ),
    ];
    if (merged.skillFocus.length === 0)
      merged.skillFocus = [...defaultPreferences.skillFocus];
  }
  return merged;
}

export function coerceAppPreferences(raw: unknown): AppPreferences {
  if (!raw || typeof raw !== "object") return defaultPreferences;
  return mergeAppPreferencesPartial(raw as Partial<AppPreferences>);
}
