"use client";
// hooks/preferences/usePreferences.ts

import { useState, useEffect, useCallback, useRef } from "react";
import {
  UserPreferences,
  DEFAULT_PREFERENCES,
} from "@/types/preferences";
import {
  loadPreferences,
  savePreferences,
} from "@/lib/preferences/supabase";

type SaveStatus = "idle" | "saving" | "saved" | "error";

interface UsePreferencesReturn {
  preferences: UserPreferences;
  updatePreferences: <K extends keyof UserPreferences>(
    section: K,
    value: Partial<UserPreferences[K]>
  ) => void;
  saveStatus: SaveStatus;
  loading: boolean;
}

const DEBOUNCE_MS = 800;

export function usePreferences(): UsePreferencesReturn {
  const [preferences, setPreferences] =
    useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

  const pendingRef = useRef<UserPreferences | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initial load
  useEffect(() => {
    loadPreferences()
      .then((prefs) => setPreferences(prefs))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Debounced save
  const scheduleSave = useCallback((next: UserPreferences) => {
    pendingRef.current = next;
    setSaveStatus("saving");

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      if (!pendingRef.current) return;
      const toSave = pendingRef.current;
      pendingRef.current = null;
      try {
        await savePreferences(toSave);
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 1500);
      } catch {
        setSaveStatus("error");
      }
    }, DEBOUNCE_MS);
  }, []);

  // Optimistic update + schedule persist
  const updatePreferences = useCallback(
    <K extends keyof UserPreferences>(
      section: K,
      value: Partial<UserPreferences[K]>
    ) => {
      setPreferences((prev) => {
        const next: UserPreferences = {
          ...prev,
          [section]: {
            ...(prev[section] as object),
            ...value,
          },
        };
        scheduleSave(next);
        return next;
      });
    },
    [scheduleSave]
  );

  return { preferences, updatePreferences, saveStatus, loading };
}
