"use client";
// app/preferences/page.tsx

import { motion } from "framer-motion";
import {
  Sun, Moon, Monitor, BookOpen, Music2, Bell,
  Globe, User, Accessibility, Eye, Zap,
  BookMarked, Mic2, Target, AlarmClock,
} from "lucide-react";

import { usePreferences } from "@/hooks/preferences/usePreferences";
import {
  PreferencesCard,
  ToggleRow,
  SegmentedSelector,
  ThemeSelector,
  MultiSelectCards,
  SettingsDropdown,
  NotificationTimePicker,
  SettingsHeader,
} from "@/components/preferences/PreferencesComponents";

import type {
  AppearanceMode,
  UIScale,
  ColorTheme,
  PracticeGoal,
  SkillFocus,
  Language,
  MusicNotation,
} from "@/types/preferences";

// ─── Data ─────────────────────────────────────────────────────────────────────

const APPEARANCE_MODES: { value: AppearanceMode; label: string; icon: React.ReactNode }[] = [
  { value: "light", label: "Light", icon: <Sun size={13} /> },
  { value: "dark", label: "Dark", icon: <Moon size={13} /> },
  { value: "system", label: "System", icon: <Monitor size={13} /> },
];

const UI_SCALES: { value: UIScale; label: string }[] = [
  { value: "compact", label: "Compact" },
  { value: "default", label: "Default" },
  { value: "large", label: "Large" },
];

const PRACTICE_GOALS: { value: PracticeGoal; label: string; description: string }[] = [
  { value: "15", label: "15 min / day", description: "Quick daily practice" },
  { value: "30", label: "30 min / day", description: "Steady progress" },
  { value: "60", label: "60 min / day", description: "Serious commitment" },
];

const SKILL_FOCUSES: { value: SkillFocus; label: string; icon: React.ReactNode }[] = [
  { value: "sight_reading", label: "Sight Reading", icon: <BookOpen size={13} /> },
  { value: "rhythm", label: "Rhythm", icon: <Music2 size={13} /> },
  { value: "technique", label: "Technique", icon: <Zap size={13} /> },
  { value: "improvisation", label: "Improvisation", icon: <Mic2 size={13} /> },
];

const LANGUAGES: { value: Language; label: string; flag: string }[] = [
  { value: "en", label: "English", flag: "🇺🇸" },
  { value: "ne", label: "Nepali", flag: "🇳🇵" },
  { value: "es", label: "Spanish", flag: "🇪🇸" },
  { value: "ja", label: "Japanese", flag: "🇯🇵" },
];

const NOTATION_OPTIONS: { value: MusicNotation; label: string; description: string }[] = [
  { value: "letter", label: "Letter Notes", description: "C D E F G A B" },
  { value: "solfege", label: "Solfège", description: "Do Re Mi Fa Sol La Si" },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PreferencesPage() {
  const { preferences, updatePreferences, saveStatus, loading } = usePreferences();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F6F1] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full"
          />
          <p className="text-[13px] text-[#6E6E73]">Loading preferences…</p>
        </div>
      </div>
    );
  }

  const { appearance, learning, notifications, localization, accountExperience, accessibility } = preferences;

  return (
    <div className="min-h-screen bg-[#F8F6F1]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 pb-20">

        {/* ── Header ── */}
        <SettingsHeader saveStatus={saveStatus} />

        <div className="space-y-6">

          {/* ── SECTION 1: Appearance ── */}
          <PreferencesCard
            title="Appearance"
            description="Customize how the app looks and feels"
            icon={<Eye size={16} />}
            delay={0.05}
          >
            {/* Dark / Light / System */}
            <SegmentedSelector
              label="Theme Mode"
              description="Choose your preferred color scheme"
              options={APPEARANCE_MODES}
              value={appearance.mode}
              onChange={(mode) =>
                updatePreferences("appearance", { mode: mode as AppearanceMode })
              }
            />

            {/* Sheet music theme */}
            <div className="border-t border-[#F0EEE9]">
              <ThemeSelector
                value={appearance.sheetTheme}
                onChange={(sheetTheme) =>
                  updatePreferences("appearance", { sheetTheme: sheetTheme as ColorTheme })
                }
              />
            </div>

            {/* UI Scale */}
            <div className="border-t border-[#F0EEE9]">
              <SegmentedSelector
                label="UI Scale"
                description="Adjust the overall interface density"
                options={UI_SCALES}
                value={appearance.uiScale}
                onChange={(uiScale) =>
                  updatePreferences("appearance", { uiScale: uiScale as UIScale })
                }
              />
            </div>
          </PreferencesCard>

          {/* ── SECTION 2: Learning ── */}
          <PreferencesCard
            title="Learning Preferences"
            description="Shape your practice routine and focus areas"
            icon={<Target size={16} />}
            delay={0.1}
          >
            {/* Practice goal */}
            <div className="px-6 py-4">
              <p className="text-[14px] font-medium text-[#151517] mb-3">Daily Practice Goal</p>
              <div className="grid grid-cols-3 gap-3">
                {PRACTICE_GOALS.map((goal) => {
                  const selected = learning.practiceGoal === goal.value;
                  return (
                    <motion.button
                      key={goal.value}
                      type="button"
                      whileTap={{ scale: 0.97 }}
                      onClick={() =>
                        updatePreferences("learning", { practiceGoal: goal.value })
                      }
                      className="flex flex-col items-center justify-center py-4 px-2 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:ring-offset-1 text-center"
                      style={{
                        borderColor: selected ? "#D4AF37" : "#E8E4DC",
                        backgroundColor: selected ? "#FDF8EC" : "#F8F6F1",
                      }}
                    >
                      <AlarmClock
                        size={20}
                        className={selected ? "text-[#D4AF37]" : "text-[#A8A8AE]"}
                      />
                      <span
                        className={`mt-2 text-[13px] font-semibold ${selected ? "text-[#A8861A]" : "text-[#151517]"}`}
                      >
                        {goal.label}
                      </span>
                      <span className="mt-0.5 text-[11px] text-[#6E6E73]">{goal.description}</span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Skill focus */}
            <div className="border-t border-[#F0EEE9]">
              <MultiSelectCards
                label="Skill Focus"
                description="Select the areas you want to improve"
                options={SKILL_FOCUSES}
                value={learning.skillFocus}
                onChange={(skillFocus) =>
                  updatePreferences("learning", { skillFocus })
                }
              />
            </div>
          </PreferencesCard>

          {/* ── SECTION 3: Notifications ── */}
          <PreferencesCard
            title="Notifications"
            description="Stay on track with helpful reminders"
            icon={<Bell size={16} />}
            delay={0.15}
          >
            <ToggleRow
              label="Practice Reminders"
              description="Daily nudges to keep your streak alive"
              checked={notifications.practiceReminders}
              onChange={(v) => updatePreferences("notifications", { practiceReminders: v })}
            />
            <ToggleRow
              label="Streak Alerts"
              description="Get notified before your streak breaks"
              checked={notifications.streakAlerts}
              onChange={(v) => updatePreferences("notifications", { streakAlerts: v })}
            />
            <ToggleRow
              label="Assignment Deadlines"
              description="Reminders for upcoming lesson deadlines"
              checked={notifications.assignmentDeadlines}
              onChange={(v) => updatePreferences("notifications", { assignmentDeadlines: v })}
            />

            <NotificationTimePicker
              label="Reminder Time"
              description="When to send your daily practice reminder"
              value={notifications.reminderTime}
              onChange={(reminderTime) =>
                updatePreferences("notifications", { reminderTime })
              }
              disabled={!notifications.practiceReminders}
            />

            {/* Quiet Hours */}
            <div className="border-t border-[#F0EEE9]">
              <ToggleRow
                label="Quiet Hours"
                description="Pause all notifications during these hours"
                checked={notifications.quietHoursEnabled}
                onChange={(v) => updatePreferences("notifications", { quietHoursEnabled: v })}
              />
              {notifications.quietHoursEnabled && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="border-t border-[#F0EEE9] grid grid-cols-2 divide-x divide-[#F0EEE9]"
                >
                  <NotificationTimePicker
                    label="From"
                    value={notifications.quietHoursStart}
                    onChange={(v) =>
                      updatePreferences("notifications", { quietHoursStart: v })
                    }
                  />
                  <NotificationTimePicker
                    label="Until"
                    value={notifications.quietHoursEnd}
                    onChange={(v) =>
                      updatePreferences("notifications", { quietHoursEnd: v })
                    }
                  />
                </motion.div>
              )}
            </div>
          </PreferencesCard>

          {/* ── SECTION 4: Language & Notation ── */}
          <PreferencesCard
            title="Language & Music Notation"
            description="Set your language and how notes are displayed"
            icon={<Globe size={16} />}
            delay={0.2}
          >
            <SettingsDropdown
              label="App Language"
              description="Interface language for all text"
              options={LANGUAGES}
              value={localization.language}
              onChange={(language) =>
                updatePreferences("localization", { language: language as Language })
              }
            />

            <div className="border-t border-[#F0EEE9]">
              <div className="px-6 py-4">
                <p className="text-[14px] font-medium text-[#151517] mb-1">Music Notation</p>
                <p className="text-[12px] text-[#6E6E73] mb-3">How notes are labeled in lessons</p>
                <div className="grid grid-cols-2 gap-3">
                  {NOTATION_OPTIONS.map((opt) => {
                    const selected = localization.musicNotation === opt.value;
                    return (
                      <motion.button
                        key={opt.value}
                        type="button"
                        whileTap={{ scale: 0.97 }}
                        onClick={() =>
                          updatePreferences("localization", {
                            musicNotation: opt.value as MusicNotation,
                          })
                        }
                        className="flex flex-col items-start py-3 px-4 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                        style={{
                          borderColor: selected ? "#D4AF37" : "#E8E4DC",
                          backgroundColor: selected ? "#FDF8EC" : "#F8F6F1",
                        }}
                      >
                        <span
                          className={`text-[13px] font-semibold ${selected ? "text-[#A8861A]" : "text-[#151517]"}`}
                        >
                          {opt.label}
                        </span>
                        <span className="text-[11px] text-[#6E6E73] mt-0.5">
                          {opt.description}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </div>
          </PreferencesCard>

          {/* ── SECTION 5: Account Experience ── */}
          <PreferencesCard
            title="Account Experience"
            description="Control how the app behaves for you"
            icon={<User size={16} />}
            delay={0.25}
          >
            <ToggleRow
              label="Onboarding Tips"
              description="Show helpful hints as you explore the app"
              checked={accountExperience.onboardingTips}
              onChange={(v) => updatePreferences("accountExperience", { onboardingTips: v })}
              icon={<BookMarked size={15} />}
            />
            <ToggleRow
              label="Practice Insights"
              description="Weekly summaries of your progress"
              checked={accountExperience.practiceInsights}
              onChange={(v) => updatePreferences("accountExperience", { practiceInsights: v })}
              icon={<Eye size={15} />}
            />
            <ToggleRow
              label="Achievement Animations"
              description="Celebrate milestones with animated effects"
              checked={accountExperience.achievementAnimations}
              onChange={(v) =>
                updatePreferences("accountExperience", { achievementAnimations: v })
              }
              icon={<Zap size={15} />}
            />
            <ToggleRow
              label="Auto-open Last Lesson"
              description="Resume where you left off automatically"
              checked={accountExperience.autoOpenLastLesson}
              onChange={(v) =>
                updatePreferences("accountExperience", { autoOpenLastLesson: v })
              }
              icon={<BookOpen size={15} />}
            />
          </PreferencesCard>

          {/* ── SECTION 6: Accessibility ── */}
          <PreferencesCard
            title="Accessibility"
            description="Make the app work better for your needs"
            icon={<Accessibility size={16} />}
            delay={0.3}
          >
            <ToggleRow
              label="Reduce Animations"
              description="Minimize motion for a calmer experience"
              checked={accessibility.reduceAnimations}
              onChange={(v) => updatePreferences("accessibility", { reduceAnimations: v })}
            />
            <ToggleRow
              label="High Contrast"
              description="Increase color contrast for better readability"
              checked={accessibility.highContrast}
              onChange={(v) => updatePreferences("accessibility", { highContrast: v })}
            />
            <ToggleRow
              label="Larger Text"
              description="Increase text size across the app"
              checked={accessibility.largerText}
              onChange={(v) => updatePreferences("accessibility", { largerText: v })}
            />
            <ToggleRow
              label="Simplified Interface"
              description="Reduce visual complexity in lessons and menus"
              checked={accessibility.simplifiedInterface}
              onChange={(v) => updatePreferences("accessibility", { simplifiedInterface: v })}
            />
          </PreferencesCard>

        </div>
      </div>
    </div>
  );
}
