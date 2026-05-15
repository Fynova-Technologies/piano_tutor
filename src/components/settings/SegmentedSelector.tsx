"use client";

import { motion } from "motion/react";

export type SegmentOption<T extends string> = {
  value: T;
  label: string;
  description?: string;
};

type SegmentedSelectorProps<T extends string> = {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
  layoutId?: string;
  size?: "sm" | "md";
};

export function SegmentedSelector<T extends string>({
  options,
  value,
  onChange,
  disabled,
  layoutId = "segment-highlight",
  size = "md",
}: SegmentedSelectorProps<T>) {
  const pad = size === "sm" ? "px-3 py-2 text-[13px]" : "px-4 py-2.5 text-[14px]";

  return (
    <motion.div
      role="radiogroup"
      className={`inline-flex flex-wrap gap-1 rounded-xl bg-[#F2F2F7] p-1 border border-[#ECECEC]/60 ${
        disabled ? "opacity-50 pointer-events-none" : ""
      }`}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            className={`relative rounded-lg font-medium transition-colors ${pad} ${
              active ? "text-white" : "text-[#1C1C1E] hover:text-[#581845]"
            }`}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-lg bg-[#581845] shadow-sm"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">{opt.label}</span>
          </button>
        );
      })}
    </motion.div>
  );
}
