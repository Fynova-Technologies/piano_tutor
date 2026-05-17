"use client";

import { create } from "zustand";

export type PlaybackStatus = "stopped" | "counting_in" | "playing" | "paused";

export type MetronomeMode = "internal" | "external";

export type PlaybackStore = {
  status: PlaybackStatus;
  tempo: number;
  countInEnabled: boolean;
  metronomeMode: MetronomeMode;
  setStatus: (status: PlaybackStatus) => void;
  setTempo: (tempo: number) => void;
  setCountInEnabled: (enabled: boolean) => void;
  setMetronomeMode: (mode: MetronomeMode) => void;
  stop: () => void;
  isActive: () => boolean;
};

export const usePlaybackStore = create<PlaybackStore>((set, get) => ({
  status: "stopped",
  tempo: 100,
  countInEnabled: true,
  metronomeMode: "internal",

  setStatus: (status) => set({ status }),

  setTempo: (tempo) => set({ tempo: Math.max(40, Math.min(208, tempo)) }),

  setCountInEnabled: (countInEnabled) => set({ countInEnabled }),

  setMetronomeMode: (metronomeMode) => set({ metronomeMode }),

  stop: () => set({ status: "stopped" }),

  isActive: () => {
    const { status } = get();
    return status === "playing" || status === "counting_in";
  },
}));

/** Map page-local playing flags to global playback status (cursor = source of truth). */
export function syncPlaybackFromLocal(opts: {
  isPlaying: boolean;
  isCountingIn?: boolean;
  isPaused?: boolean;
  tempo?: number;
}): void {
  const store = usePlaybackStore.getState();
  if (opts.tempo !== undefined) {
    store.setTempo(opts.tempo);
  }
  if (opts.isPaused) {
    store.setStatus("paused");
    return;
  }
  if (opts.isCountingIn) {
    store.setStatus("counting_in");
    return;
  }
  if (opts.isPlaying) {
    store.setStatus("playing");
    return;
  }
  store.setStatus("stopped");
}
