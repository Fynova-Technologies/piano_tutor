"use client";

import { useEffect } from "react";
import { syncPlaybackFromLocal, usePlaybackStore } from "@/store/playbackStore";
import { loadInstrumentSettings } from "@/lib/userSettings/instrumentSettings";

type UsePlaybackAudioSyncOptions = {
  isPlaying: boolean;
  isCountingIn?: boolean;
  isPaused?: boolean;
  tempo?: number;
  /** Pattern-practice sheet manages its own metronome scheduler. */
  externalMetronome?: boolean;
  enabled?: boolean;
};

/**
 * Bridges page-local cursor/playback state to the global playback store.
 * Cursor UI remains the source of truth; this hook propagates changes to the audio engine.
 */
export function usePlaybackAudioSync({
  isPlaying,
  isCountingIn = false,
  isPaused = false,
  tempo,
  externalMetronome = false,
  enabled = true,
}: UsePlaybackAudioSyncOptions): void {
  const setCountInEnabled = usePlaybackStore((s) => s.setCountInEnabled);
  const setMetronomeMode = usePlaybackStore((s) => s.setMetronomeMode);

  useEffect(() => {
    if (!enabled) return;
    syncPlaybackFromLocal({ isPlaying, isCountingIn, isPaused, tempo });
  }, [isPlaying, isCountingIn, isPaused, tempo, enabled]);

  useEffect(() => {
    if (!enabled) return;
    const inst = loadInstrumentSettings();
    setCountInEnabled(inst.metronomeCountIn);
    setMetronomeMode(externalMetronome ? "external" : "internal");
    return () => setMetronomeMode("internal");
  }, [externalMetronome, enabled, setCountInEnabled, setMetronomeMode]);
}
