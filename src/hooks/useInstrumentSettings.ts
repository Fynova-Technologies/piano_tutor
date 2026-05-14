"use client";

import { useCallback, useEffect, useState } from "react";
import {
  defaultInstrumentSettings,
  loadInstrumentSettings,
  saveInstrumentSettings,
  type InstrumentSettings,
} from "@/lib/userSettings/instrumentSettings";

export function useInstrumentSettings() {
  const [settings, setSettings] = useState<InstrumentSettings>(defaultInstrumentSettings);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSettings(loadInstrumentSettings());
    setReady(true);
  }, []);

  const update = useCallback((patch: Partial<InstrumentSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveInstrumentSettings(next);
      return next;
    });
  }, []);

  return { settings, update, ready };
}
