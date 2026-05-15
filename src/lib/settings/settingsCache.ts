import type { InstrumentSettings } from "@/lib/userSettings/instrumentSettings";
import type { AppPreferences } from "@/lib/userSettings/preferencesSettings";

type CacheEntry<T> = {
  data: T;
  updatedAt: string | null;
};

const instrumentCache = new Map<string, CacheEntry<InstrumentSettings>>();
const preferencesCache = new Map<string, CacheEntry<AppPreferences>>();

export function getInstrumentCache(userId: string) {
  return instrumentCache.get(userId);
}

export function setInstrumentCache(
  userId: string,
  data: InstrumentSettings,
  updatedAt: string | null,
) {
  instrumentCache.set(userId, { data, updatedAt });
}

export function getPreferencesCache(userId: string) {
  return preferencesCache.get(userId);
}

export function setPreferencesCache(
  userId: string,
  data: AppPreferences,
  updatedAt: string | null,
) {
  preferencesCache.set(userId, { data, updatedAt });
}

export function clearSettingsCache(userId?: string) {
  if (userId) {
    instrumentCache.delete(userId);
    preferencesCache.delete(userId);
    return;
  }
  instrumentCache.clear();
  preferencesCache.clear();
}
