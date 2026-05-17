"use client";

import { useEffect } from "react";
import { initAudioEngine } from "@/lib/audio/audioEngine";
import { useAudioSettingsStore } from "@/store/audioSettingsStore";

export function AudioProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const dispose = initAudioEngine();
    useAudioSettingsStore.persist.rehydrate();
    return dispose;
  }, []);

  return <>{children}</>;
}
