// lib/preferences/supabase.ts
// Helpers for loading and saving user_preferences in Supabase.
// Uses the same createBrowserClient pattern as the rest of the project.

import { createBrowserClient } from "@supabase/ssr";
import {
  UserPreferences,
  DEFAULT_PREFERENCES,
} from "@/types/preferences";

function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

function deepMerge<T extends object>(defaults: T, overrides: Partial<T>): T {
  const result = { ...defaults };
  for (const key in overrides) {
    const k = key as keyof T;
    if (
      overrides[k] !== null &&
      typeof overrides[k] === "object" &&
      !Array.isArray(overrides[k]) &&
      typeof defaults[k] === "object" &&
      !Array.isArray(defaults[k])
    ) {
      result[k] = deepMerge(
        defaults[k] as object,
        overrides[k] as object
      ) as T[keyof T];
    } else if (overrides[k] !== undefined) {
      result[k] = overrides[k] as T[keyof T];
    }
  }
  return result;
}

/** Load from Supabase, falling back to defaults if no row exists. */
export async function loadPreferences(): Promise<UserPreferences> {
  const supabase = getSupabase();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return DEFAULT_PREFERENCES;

  const { data, error } = await supabase
    .from("user_preferences")
    .select("preferences")
    .eq("user_id", user.id)
    .single();

  if (error || !data) return DEFAULT_PREFERENCES;

  return deepMerge(
    DEFAULT_PREFERENCES,
    data.preferences as Partial<UserPreferences>
  );
}

/** Upsert the full preferences object for the authenticated user. */
export async function savePreferences(
  preferences: UserPreferences
): Promise<void> {
  const supabase = getSupabase();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return;

  await supabase.from("user_preferences").upsert(
    {
      user_id: user.id,
      preferences,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
}