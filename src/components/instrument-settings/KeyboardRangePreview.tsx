"use client";

import { motion } from "motion/react";
import type { KeyboardRange } from "@/lib/userSettings/instrumentSettings";

const WHITE_KEYS: Record<KeyboardRange, number> = {
  61: 36,
  76: 45,
  88: 52,
};

type KeyboardRangePreviewProps = {
  keys: KeyboardRange;
  selected?: boolean;
  onSelect?: () => void;
};

export function KeyboardRangePreview({
  keys,
  selected,
  onSelect,
}: KeyboardRangePreviewProps) {
  const whiteCount = WHITE_KEYS[keys];
  const blacks = Math.floor(whiteCount * 0.6);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group relative flex flex-col items-center gap-2 rounded-xl border p-3 transition-all duration-200 ${
        selected
          ? "border-[#581845] bg-[#581845]/5 shadow-md ring-1 ring-[#581845]/20"
          : "border-[#ECECEC] bg-[#FAFAFA] hover:border-[#581845]/40 hover:shadow-sm"
      }`}
    >
      <span className="text-[15px] font-medium text-[#1C1C1E]">{keys} Keys</span>
      <div className="relative h-14 w-full max-w-[140px] overflow-hidden rounded-md bg-[#1C1C1E]/5 px-1 pt-1">
        <div className="flex h-full items-end gap-[1px]">
          {Array.from({ length: Math.min(whiteCount, 18) }).map((_, i) => (
            <motion.div
              key={`w-${i}`}
              className="flex-1 min-w-[3px] rounded-t-sm bg-white border border-[#E0E0E0] shadow-sm"
              style={{ height: i % 7 === 2 || i % 7 === 6 ? "72%" : "100%" }}
              initial={false}
              animate={{ opacity: selected ? 1 : 0.85 }}
            />
          ))}
        </div>
        <div className="absolute top-1 left-0 right-0 flex justify-around px-0.5 pointer-events-none">
          {Array.from({ length: Math.min(blacks, 10) }).map((_, i) => (
            <div
              key={`b-${i}`}
              className="h-[42%] w-[18%] max-w-[8px] rounded-b-sm bg-[#2C2C2E]"
            />
          ))}
        </div>
      </div>
      <span className="text-[12px] text-[#6E6E73]">
        {keys === 61 ? "Compact" : keys === 76 ? "Studio" : "Full grand"}
      </span>
    </button>
  );
}
