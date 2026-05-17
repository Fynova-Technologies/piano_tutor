"use client";

import { AudioCategoryControl } from "./AudioCategoryControl";

type AudioSettingsPanelProps = {
  compact?: boolean;
};

export function AudioSettingsPanel({ compact = false }: AudioSettingsPanelProps) {
  return (
    <div className={compact ? "flex flex-col gap-4" : "flex flex-col gap-5"}>
      <AudioCategoryControl
        category="instrument"
        label="Instrument sound"
        description="Piano and lesson playback"
      />
      <AudioCategoryControl
        category="background"
        label="Background music"
        description="Accompaniment track during practice"
      />
      <AudioCategoryControl
        category="metronome"
        label="Metronome"
        description="Click track while the cursor moves"
      />
      <AudioCategoryControl
        category="countdown"
        label="Countdown"
        description="Count-in before playback starts"
      />
    </div>
  );
}
