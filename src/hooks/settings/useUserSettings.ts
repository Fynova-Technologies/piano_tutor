"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/utils/Authsegment";
import { debounce } from "@/lib/settings/debounce";
import {
  fetchInstrumentSettings,
  fetchUserPreferences,
  upsertInstrumentSettings,
  upsertUserPreferences,
} from "@/lib/settings/supabaseSync";
import {
  loadInstrumentSettings,
  saveInstrumentSettings,
  type InstrumentSettings,
} from "@/lib/userSettings/instrumentSettings";
import {
  loadPreferences,
  savePreferences,
  type AppPreferences,
} from "@/lib/userSettings/preferencesSettings";

export type SyncStatus = "idle" | "loading" | "saving" | "saved" | "error";

type UsePersistedSettingsOptions<T> = {
  loadLocal: () => T;
  saveLocal: (value: T) => void;
  fetchRemote: (userId: string) => Promise<{ data: T }>;
  upsertRemote: (userId: string, value: T) => Promise<unknown>;
  debounceMs?: number;
};

function usePersistedSettings<T>({
  loadLocal,
  saveLocal,
  fetchRemote,
  upsertRemote,
  debounceMs = 600,
}: UsePersistedSettingsOptions<T>) {
  const auth = useAuth();
  const userId = auth?.user?.id ?? null;

  const [value, setValue] = useState<T>(loadLocal);
  const [ready, setReady] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const valueRef = useRef(value);
  valueRef.current = value;

  const persistRef = useRef(
    debounce(async (uid: string, next: T) => {
      setSyncStatus("saving");
      setError(null);
      try {
        await upsertRemote(uid, next);
        setSyncStatus("saved");
        window.setTimeout(() => {
          setSyncStatus((s) => (s === "saved" ? "idle" : s));
        }, 2000);
      } catch (e) {
        setSyncStatus("error");
        setError(e instanceof Error ? e.message : "Failed to save settings");
      }
    }, debounceMs),
  );

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      setSyncStatus("loading");
      setError(null);

      const local = loadLocal();
      setValue(local);

      if (!userId) {
        if (!cancelled) {
          setReady(true);
          setSyncStatus("idle");
        }
        return;
      }

      try {
        const remote = await fetchRemote(userId);
        if (!cancelled) {
          setValue(remote.data);
          saveLocal(remote.data);
          setSyncStatus("idle");
        }
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof Error ? e.message : "Failed to load settings",
          );
          setSyncStatus("error");
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    }

    setReady(false);
    void hydrate();

    return () => {
      cancelled = true;
    };
  }, [userId, loadLocal, saveLocal, fetchRemote]);

  const update = useCallback(
    (patch: Partial<T> | ((prev: T) => T)) => {
      setValue((prev) => {
        const next =
          typeof patch === "function"
            ? (patch as (p: T) => T)(prev)
            : ({ ...prev, ...patch } as T);
        saveLocal(next);
        if (userId) persistRef.current(userId, next);
        return next;
      });
    },
    [userId, saveLocal],
  );

  const flush = useCallback(async () => {
    if (!userId) return;
    setSyncStatus("saving");
    try {
      await upsertRemote(userId, valueRef.current);
      setSyncStatus("saved");
    } catch (e) {
      setSyncStatus("error");
      setError(e instanceof Error ? e.message : "Failed to save settings");
    }
  }, [userId, upsertRemote]);

  return {
    value,
    update,
    ready,
    syncStatus,
    error,
    userId,
    flush,
  };
}

export function useInstrumentSettingsPersisted() {
  return usePersistedSettings<InstrumentSettings>({
    loadLocal: loadInstrumentSettings,
    saveLocal: saveInstrumentSettings,
    fetchRemote: fetchInstrumentSettings,
    upsertRemote: upsertInstrumentSettings,
  });
}

export function useUserPreferencesPersisted() {
  return usePersistedSettings<AppPreferences>({
    loadLocal: loadPreferences,
    saveLocal: savePreferences,
    fetchRemote: fetchUserPreferences,
    upsertRemote: upsertUserPreferences,
  });
}

/** Combined access for pages that need both instrument + app preferences. */
export function useUserSettings() {
  const instrument = useInstrumentSettingsPersisted();
  const preferences = useUserPreferencesPersisted();

  const ready = instrument.ready && preferences.ready;
  const syncStatus: SyncStatus =
    instrument.syncStatus === "saving" ||
    preferences.syncStatus === "saving"
      ? "saving"
      : instrument.syncStatus === "loading" ||
          preferences.syncStatus === "loading"
        ? "loading"
        : instrument.syncStatus === "error" ||
            preferences.syncStatus === "error"
          ? "error"
          : instrument.syncStatus === "saved" ||
              preferences.syncStatus === "saved"
            ? "saved"
            : "idle";

  return {
    instrument,
    preferences,
    ready,
    syncStatus,
  };
}
