"use client";

import { useEffect, type RefObject } from "react";
import * as Tone from "tone";
import { useAudioSettingsStore } from "@/store/audioSettingsStore";

/**
 * Applies global instrument volume to a Tone.js Sampler without recreating it.
 */
export function useInstrumentSamplerVolume(
  samplerRef: RefObject<Tone.Sampler | null>,
): void {
  const instrument = useAudioSettingsStore((s) => s.instrument);

  useEffect(() => {
    const sampler = samplerRef.current;
    if (!sampler) return;
    const gain = useAudioSettingsStore.getState().getEffectiveVolume("instrument");
    sampler.volume.value = Tone.gainToDb(gain);
  }, [samplerRef, instrument.volume, instrument.muted]);
}
