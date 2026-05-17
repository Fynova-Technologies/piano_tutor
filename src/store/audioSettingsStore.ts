"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { loadInstrumentSettings } from "@/lib/userSettings/instrumentSettings";

export const AUDIO_SETTINGS_STORAGE_KEY = "piano_audio_settings_v1";

export type AudioCategory = "instrument" | "background" | "metronome" | "countdown";

export type AudioChannelState = {
  volume: number;
  muted: boolean;
};

export type AudioSettingsState = {
  instrument: AudioChannelState;
  background: AudioChannelState;
  metronome: AudioChannelState;
  countdown: AudioChannelState;
};

const defaultChannel = (volume = 100): AudioChannelState => ({
  volume,
  muted: false,
});

const defaultState: AudioSettingsState = {
  instrument: defaultChannel(80),
  background: defaultChannel(70),
  metronome: defaultChannel(70),
  countdown: defaultChannel(80),
};

function hydrateFromInstrumentSettings(): AudioSettingsState {
  if (typeof window === "undefined") return defaultState;
  const inst = loadInstrumentSettings();
  return {
    instrument: { volume: inst.volumePlayback, muted: false },
    background: defaultChannel(70),
    metronome: { volume: inst.volumeMetronome, muted: false },
    countdown: defaultChannel(80),
  };
}

type AudioSettingsActions = {
  setVolume: (category: AudioCategory, volume: number) => void;
  setMuted: (category: AudioCategory, muted: boolean) => void;
  toggleMute: (category: AudioCategory) => void;
  setChannel: (category: AudioCategory, partial: Partial<AudioChannelState>) => void;
  getEffectiveVolume: (category: AudioCategory) => number;
  syncFromInstrumentSettings: () => void;
};

export type AudioSettingsStore = AudioSettingsState & AudioSettingsActions;

export const useAudioSettingsStore = create<AudioSettingsStore>()(
  persist(
    (set, get) => ({
      ...defaultState,

      setVolume: (category, volume) =>
        set((state) => ({
          [category]: {
            ...state[category],
            volume: Math.max(0, Math.min(100, volume)),
          },
        })),

      setMuted: (category, muted) =>
        set((state) => ({
          [category]: { ...state[category], muted },
        })),

      toggleMute: (category) =>
        set((state) => ({
          [category]: { ...state[category], muted: !state[category].muted },
        })),

      setChannel: (category, partial) =>
        set((state) => ({
          [category]: { ...state[category], ...partial },
        })),

      getEffectiveVolume: (category) => {
        const channel = get()[category];
        if (channel.muted || channel.volume <= 0) return 0;
        return channel.volume / 100;
      },

      syncFromInstrumentSettings: () => {
        const inst = loadInstrumentSettings();
        set({
          instrument: { volume: inst.volumePlayback, muted: false },
          metronome: { volume: inst.volumeMetronome, muted: get().metronome.muted },
        });
      },
    }),
    {
      name: AUDIO_SETTINGS_STORAGE_KEY,
      version: 1,
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const stored = localStorage.getItem(AUDIO_SETTINGS_STORAGE_KEY);
        if (!stored) {
          Object.assign(state, hydrateFromInstrumentSettings());
        }
      },
    },
  ),
);

export function selectAudioCategory(category: AudioCategory) {
  return (s: AudioSettingsStore) => s[category];
}
