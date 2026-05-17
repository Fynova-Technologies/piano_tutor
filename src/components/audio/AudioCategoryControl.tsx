"use client";

import * as Slider from "@radix-ui/react-slider";
import { Volume2, VolumeX } from "lucide-react";
import {
  useAudioSettingsStore,
  type AudioCategory,
} from "@/store/audioSettingsStore";

type AudioCategoryControlProps = {
  category: AudioCategory;
  label: string;
  description?: string;
};

export function AudioCategoryControl({
  category,
  label,
  description,
}: AudioCategoryControlProps) {
  const channel = useAudioSettingsStore((s) => s[category]);
  const setVolume = useAudioSettingsStore((s) => s.setVolume);
  const toggleMute = useAudioSettingsStore((s) => s.toggleMute);

  return (
    <div className="flex flex-col gap-3 py-1">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[15px] font-medium text-[#1C1C1E]">{label}</p>
          {description ? (
            <p className="text-[13px] text-[#6E6E73] mt-0.5">{description}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => toggleMute(category)}
          className="shrink-0 rounded-lg p-2 text-[#581845] hover:bg-[#581845]/10 transition-colors"
          aria-label={channel.muted ? `Unmute ${label}` : `Mute ${label}`}
        >
          {channel.muted ? (
            <VolumeX className="h-5 w-5" aria-hidden />
          ) : (
            <Volume2 className="h-5 w-5" aria-hidden />
          )}
        </button>
      </div>
      <div className="flex items-center gap-3">
        <Slider.Root
          className="relative flex h-4 flex-1 items-center select-none touch-none"
          min={0}
          max={100}
          step={1}
          value={[channel.muted ? 0 : channel.volume]}
          onValueChange={([v]) => {
            if (channel.muted && v > 0) {
              useAudioSettingsStore.getState().setMuted(category, false);
            }
            setVolume(category, v);
          }}
          disabled={channel.muted}
        >
          <Slider.Track className="relative h-2 grow rounded-full bg-[#ECECEC]">
            <Slider.Range className="absolute h-full rounded-full bg-[#581845]" />
          </Slider.Track>
          <Slider.Thumb className="block h-5 w-5 rounded-full border-2 border-white bg-[#581845] shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]" />
        </Slider.Root>
        <span className="w-10 text-right text-[14px] font-semibold tabular-nums text-[#1C1C1E]">
          {channel.muted ? 0 : channel.volume}
        </span>
      </div>
    </div>
  );
}
