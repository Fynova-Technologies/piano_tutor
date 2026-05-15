"use client";

import * as Slider from "@radix-ui/react-slider";

type SliderSettingProps = {
  label: string;
  description?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
  disabled?: boolean;
};

export function SliderSetting({
  label,
  description,
  value,
  min,
  max,
  step = 1,
  unit = "%",
  onChange,
  disabled,
}: SliderSettingProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[15px] font-medium text-[#1C1C1E]">{label}</p>
          {description && (
            <p className="text-[13px] text-[#6E6E73] mt-0.5">{description}</p>
          )}
        </div>
        <span className="text-[14px] font-medium text-[#581845] tabular-nums shrink-0">
          {value}
          {unit}
        </span>
      </div>
      <Slider.Root
        className="relative flex items-center select-none touch-none w-full h-5"
        min={min}
        max={max}
        step={step}
        value={[value]}
        disabled={disabled}
        onValueChange={([v]) => onChange(v)}
        aria-label={label}
      >
        <Slider.Track className="bg-[#ECECEC] relative grow rounded-full h-2">
          <Slider.Range className="absolute bg-[#581845] h-full rounded-full" />
        </Slider.Track>
        <Slider.Thumb className="block w-5 h-5 bg-[#581845] border-2 border-white rounded-full shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D4AF37]" />
      </Slider.Root>
    </div>
  );
}
