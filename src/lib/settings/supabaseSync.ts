import { supabase } from "@/lib/supabaseClient";
import {
  coerceInstrumentSettings,
  defaultInstrumentSettings,
  type InstrumentSettings,
} from "@/lib/userSettings/instrumentSettings";
import {
  coerceAppPreferences,
  defaultPreferences,
  type AppPreferences,
} from "@/lib/userSettings/preferencesSettings";
import {
  getInstrumentCache,
  getPreferencesCache,
  setInstrumentCache,
  setPreferencesCache,
} from "@/lib/settings/settingsCache";

export type SettingsFetchResult<T> = {
  data: T;
  updatedAt: string | null;
  source: "remote" | "local" | "default";
};

export async function fetchInstrumentSettings(
  userId: string,
): Promise<SettingsFetchResult<InstrumentSettings>> {
  const cached = getInstrumentCache(userId);
  if (cached) {
    return {
      data: cached.data,
      updatedAt: cached.updatedAt,
      source: "remote",
    };
  }

  const { data: row, error } = await supabase
    .from("instrument_settings")
    .select("settings, updated_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;

  if (row?.settings) {
    const merged = coerceInstrumentSettings(row.settings);
    setInstrumentCache(userId, merged, row.updated_at ?? null);
    return {
      data: merged,
      updatedAt: row.updated_at ?? null,
      source: "remote",
    };
  }

  return {
    data: defaultInstrumentSettings,
    updatedAt: null,
    source: "default",
  };
}

export async function upsertInstrumentSettings(
  userId: string,
  settings: InstrumentSettings,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("instrument_settings")
    .upsert(
      { user_id: userId, settings },
      { onConflict: "user_id" },
    )
    .select("updated_at")
    .single();

  if (error) throw error;
  const updatedAt = data?.updated_at ?? null;
  setInstrumentCache(userId, settings, updatedAt);
  return updatedAt;
}

export async function fetchUserPreferences(
  userId: string,
): Promise<SettingsFetchResult<AppPreferences>> {
  const cached = getPreferencesCache(userId);
  if (cached) {
    return {
      data: cached.data,
      updatedAt: cached.updatedAt,
      source: "remote",
    };
  }

  const { data: row, error } = await supabase
    .from("user_preferences")
    .select("preferences, updated_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;

  if (row?.preferences) {
    const merged = coerceAppPreferences(row.preferences);
    setPreferencesCache(userId, merged, row.updated_at ?? null);
    return {
      data: merged,
      updatedAt: row.updated_at ?? null,
      source: "remote",
    };
  }

  return {
    data: defaultPreferences,
    updatedAt: null,
    source: "default",
  };
}

export async function upsertUserPreferences(
  userId: string,
  preferences: AppPreferences,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("user_preferences")
    .upsert(
      { user_id: userId, preferences },
      { onConflict: "user_id" },
    )
    .select("updated_at")
    .single();

  if (error) throw error;
  const updatedAt = data?.updated_at ?? null;
  setPreferencesCache(userId, preferences, updatedAt);
  return updatedAt;
}
