"use client";

import { useCallback, useEffect, useState } from "react";
import {
  defaultPreferences,
  loadPreferences,
  savePreferences,
  type AppPreferences,
} from "@/lib/userSettings/preferencesSettings";

export function useAppPreferences() {
  const [preferences, setPreferences] = useState<AppPreferences>(defaultPreferences);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setPreferences(loadPreferences());
    setReady(true);
  }, []);

  const update = useCallback((patch: Partial<AppPreferences>) => {
    setPreferences((prev) => {
      const next = { ...prev, ...patch };
      savePreferences(next);
      return next;
    });
  }, []);

  return { preferences, update, ready };
}
