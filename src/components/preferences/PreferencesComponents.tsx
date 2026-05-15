"use client";
// components/preferences/PreferencesComponents.tsx
// All reusable building blocks for the Preferences page.

import { motion, AnimatePresence } from "framer-motion";
import { ReactNode, useState } from "react";
import {
  Sun, Moon, Monitor, Check, Clock, ChevronDown,
  Bell, BookOpen, Music, User, Accessibility,
  Palette, GraduationCap,
} from "lucide-react";

// ─── Section Icon Map ────────────────────────────────────────────────────────
export const SECTION_ICONS = {
  appearance: Palette,
  learning: GraduationCap,
  notifications: Bell,
  localization: Music,
  account: User,
  accessibility: Accessibility,
};

// ─── PreferencesCard ─────────────────────────────────────────────────────────
interface PreferencesCardProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
  delay?: number;
}

export function PreferencesCard({
  title,
  description,
  icon,
  children,
  delay = 0,
}: PreferencesCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="bg-white rounded-2xl shadow-sm border border-[#EBEBEB] overflow-hidden"
    >
      {/* Card Header */}
      <div className="px-6 py-5 border-b border-[#F0EEE9] flex items-center gap-3">
        {icon && (
          <div className="w-9 h-9 rounded-xl bg-[#F8F6F1] flex items-center justify-center text-[#D4AF37]">
            {icon}
          </div>
        )}
        <div>
          <h3 className="text-[15px] font-semibold text-[#151517]">{title}</h3>
          {description && (
            <p className="text-[12px] text-[#6E6E73] mt-0.5">{description}</p>
          )}
        </div>
      </div>
      <div className="divide-y divide-[#F0EEE9]">{children}</div>
    </motion.div>
  );
}

// ─── ToggleRow ────────────────────────────────────────────────────────────────
interface ToggleRowProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  icon?: ReactNode;
}

export function ToggleRow({ label, description, checked, onChange, icon }: ToggleRowProps) {
  return (
    <div className="px-6 py-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {icon && <span className="text-[#6E6E73] shrink-0">{icon}</span>}
        <div className="min-w-0">
          <p className="text-[14px] font-medium text-[#151517]">{label}</p>
          {description && (
            <p className="text-[12px] text-[#6E6E73] mt-0.5 truncate">{description}</p>
          )}
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative shrink-0 w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:ring-offset-2 ${
          checked ? "bg-[#D4AF37]" : "bg-[#E0DDD6]"
        }`}
      >
        <motion.span
          layout
          transition={{ type: "spring", stiffness: 700, damping: 38 }}
          className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm ${
            checked ? "left-[22px]" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}

// ─── SegmentedSelector ────────────────────────────────────────────────────────
interface SegmentOption<T extends string> {
  value: T;
  label: string;
  icon?: ReactNode;
}

interface SegmentedSelectorProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label?: string;
  description?: string;
}

export function SegmentedSelector<T extends string>({
  options,
  value,
  onChange,
  label,
  description,
}: SegmentedSelectorProps<T>) {
  return (
    <div className="px-6 py-4">
      {(label || description) && (
        <div className="mb-3">
          {label && <p className="text-[14px] font-medium text-[#151517]">{label}</p>}
          {description && <p className="text-[12px] text-[#6E6E73] mt-0.5">{description}</p>}
        </div>
      )}
      <div className="flex bg-[#F8F6F1] rounded-xl p-1 gap-1">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className="relative flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-[13px] font-medium transition-colors duration-150 focus:outline-none"
          >
            {value === opt.value && (
              <motion.div
                layoutId="segment-bg"
                className="absolute inset-0 bg-white rounded-lg shadow-sm"
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
            )}
            <span className={`relative z-10 flex items-center gap-1.5 ${value === opt.value ? "text-[#151517]" : "text-[#6E6E73]"}`}>
              {opt.icon}
              {opt.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── ThemeSelector ────────────────────────────────────────────────────────────
interface ThemeOption {
  value: string;
  label: string;
  bg: string;
  lines: string;
  text: string;
}

const SHEET_THEMES: ThemeOption[] = [
  { value: "classic", label: "Classic", bg: "#FFFFFF", lines: "#E8E4DC", text: "#1A1A1A" },
  { value: "dark", label: "Dark", bg: "#1C1C1E", lines: "#3A3A3C", text: "#F5F5F7" },
  { value: "sepia", label: "Sepia", bg: "#F4ECD8", lines: "#C8B89A", text: "#3D2B1F" },
  { value: "minimal", label: "Minimal", bg: "#FAFAFA", lines: "#F0F0F0", text: "#333333" },
];

interface ThemeSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function ThemeSelector({ value, onChange }: ThemeSelectorProps) {
  return (
    <div className="px-6 py-4">
      <p className="text-[14px] font-medium text-[#151517] mb-3">Sheet Music Theme</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {SHEET_THEMES.map((theme) => (
          <button
            key={theme.value}
            type="button"
            onClick={() => onChange(theme.value)}
            className="group relative rounded-xl overflow-hidden border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:ring-offset-2"
            style={{
              borderColor: value === theme.value ? "#D4AF37" : "#E8E4DC",
            }}
          >
            {/* Mini sheet preview */}
            <div
              className="h-16 flex flex-col justify-center px-3 gap-1"
              style={{ backgroundColor: theme.bg }}
            >
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-px w-full"
                  style={{ backgroundColor: theme.lines }}
                />
              ))}
            </div>
            <div
              className="py-2 px-2 flex items-center justify-between"
              style={{ backgroundColor: theme.bg }}
            >
              <span
                className="text-[11px] font-medium"
                style={{ color: theme.text }}
              >
                {theme.label}
              </span>
              {value === theme.value && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-4 h-4 rounded-full bg-[#D4AF37] flex items-center justify-center"
                >
                  <Check size={9} strokeWidth={3} color="white" />
                </motion.div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── MultiSelectCards ─────────────────────────────────────────────────────────
interface MultiSelectOption<T extends string> {
  value: T;
  label: string;
  description?: string;
  icon?: ReactNode;
}

interface MultiSelectCardsProps<T extends string> {
  options: MultiSelectOption<T>[];
  value: T[];
  onChange: (value: T[]) => void;
  label?: string;
  description?: string;
}

export function MultiSelectCards<T extends string>({
  options,
  value,
  onChange,
  label,
  description,
}: MultiSelectCardsProps<T>) {
  const toggle = (v: T) => {
    if (value.includes(v)) {
      onChange(value.filter((x) => x !== v));
    } else {
      onChange([...value, v]);
    }
  };

  return (
    <div className="px-6 py-4">
      {(label || description) && (
        <div className="mb-3">
          {label && <p className="text-[14px] font-medium text-[#151517]">{label}</p>}
          {description && <p className="text-[12px] text-[#6E6E73] mt-0.5">{description}</p>}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const selected = value.includes(opt.value);
          return (
            <motion.button
              key={opt.value}
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={() => toggle(opt.value)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 text-[13px] font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:ring-offset-1"
              style={{
                borderColor: selected ? "#D4AF37" : "#E8E4DC",
                backgroundColor: selected ? "#FDF8EC" : "#F8F6F1",
                color: selected ? "#A8861A" : "#6E6E73",
              }}
            >
              {opt.icon}
              {opt.label}
              <AnimatePresence>
                {selected && (
                  <motion.span
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Check size={12} strokeWidth={3} />
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// ─── SettingsDropdown ─────────────────────────────────────────────────────────
interface DropdownOption<T extends string> {
  value: T;
  label: string;
  flag?: string;
}

interface SettingsDropdownProps<T extends string> {
  options: DropdownOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label?: string;
  description?: string;
}

export function SettingsDropdown<T extends string>({
  options,
  value,
  onChange,
  label,
  description,
}: SettingsDropdownProps<T>) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <div className="px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          {label && <p className="text-[14px] font-medium text-[#151517]">{label}</p>}
          {description && <p className="text-[12px] text-[#6E6E73] mt-0.5">{description}</p>}
        </div>
        <div className="relative shrink-0 ml-4">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-2 px-4 py-2 bg-[#F8F6F1] border border-[#E8E4DC] rounded-xl text-[13px] font-medium text-[#151517] hover:border-[#D4AF37] transition-colors focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:ring-offset-1 min-w-[120px] justify-between"
          >
            <span className="flex items-center gap-2">
              {selected?.flag && <span>{selected.flag}</span>}
              {selected?.label}
            </span>
            <motion.span
              animate={{ rotate: open ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown size={14} className="text-[#6E6E73]" />
            </motion.span>
          </button>

          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-[calc(100%+6px)] z-50 bg-white border border-[#EBEBEB] rounded-xl shadow-lg overflow-hidden min-w-[140px]"
              >
                {options.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                    className="w-full flex items-center justify-between gap-3 px-4 py-2.5 text-[13px] hover:bg-[#F8F6F1] transition-colors text-left"
                  >
                    <span className="flex items-center gap-2 text-[#151517] font-medium">
                      {opt.flag && <span>{opt.flag}</span>}
                      {opt.label}
                    </span>
                    {value === opt.value && (
                      <Check size={13} strokeWidth={2.5} className="text-[#D4AF37]" />
                    )}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ─── NotificationTimePicker ───────────────────────────────────────────────────
interface NotificationTimePickerProps {
  value: string; // "HH:MM"
  onChange: (value: string) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
}

export function NotificationTimePicker({
  value,
  onChange,
  label,
  description,
  disabled,
}: NotificationTimePickerProps) {
  return (
    <div className="px-6 py-4 flex items-center justify-between">
      <div className="min-w-0">
        {label && (
          <p className={`text-[14px] font-medium ${disabled ? "text-[#A8A8AE]" : "text-[#151517]"}`}>
            {label}
          </p>
        )}
        {description && <p className="text-[12px] text-[#6E6E73] mt-0.5">{description}</p>}
      </div>
      <div className="flex items-center gap-2 shrink-0 ml-4">
        <Clock size={14} className={disabled ? "text-[#C8C8CE]" : "text-[#D4AF37]"} />
        <input
          type="time"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="px-3 py-1.5 bg-[#F8F6F1] border border-[#E8E4DC] rounded-lg text-[13px] font-medium text-[#151517] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        />
      </div>
    </div>
  );
}

// ─── SettingsHeader ───────────────────────────────────────────────────────────
interface SettingsHeaderProps {
  saveStatus: "idle" | "saving" | "saved" | "error";
}

export function SettingsHeader({ saveStatus }: SettingsHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 mb-8">
      <div>
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-[28px] sm:text-[32px] font-bold text-[#151517] leading-tight"
        >
          Preferences
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.07 }}
          className="text-[14px] text-[#6E6E73] mt-1.5"
        >
          Personalize your learning experience and app behavior
        </motion.p>
      </div>

      {/* Save status indicator */}
      <AnimatePresence mode="wait">
        {saveStatus !== "idle" && (
          <motion.div
            key={saveStatus}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2 }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium shrink-0 ${
              saveStatus === "saving"
                ? "bg-[#F8F6F1] text-[#6E6E73]"
                : saveStatus === "saved"
                ? "bg-[#F0FDF4] text-[#16A34A]"
                : "bg-[#FEF2F2] text-[#DC2626]"
            }`}
          >
            {saveStatus === "saving" && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                className="w-3 h-3 border-2 border-current border-t-transparent rounded-full"
              />
            )}
            {saveStatus === "saved" && <Check size={12} strokeWidth={3} />}
            {saveStatus === "saving" ? "Saving…" : saveStatus === "saved" ? "Saved" : "Error saving"}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── AppearanceMode icons ─────────────────────────────────────────────────────
export const APPEARANCE_ICONS = {
  light: <Sun size={14} />,
  dark: <Moon size={14} />,
  system: <Monitor size={14} />,
};

// ─── BookOpen re-export for inline use ───────────────────────────────────────
export { BookOpen };
