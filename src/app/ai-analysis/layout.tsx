"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  analysisAccentGradient,
  analysisNavBg,
  analysisNavIdle,
  analysisShellBg,
} from "@/features/ai-review/PianoAnalysisChrome";

export default function AiAnalysisLayout({ children }: { children: ReactNode }) {
  const path = usePathname() ?? "";
  const isRecovery = path.includes("/recovery");

  return (
    <div className={`min-h-screen ${analysisShellBg} antialiased`}>
      <header className={analysisNavBg}>
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5 md:px-8">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-white/90 transition hover:text-amber-200"
          >
            ← Dashboard
          </Link>
          <nav className="flex flex-1 items-center justify-center gap-2 sm:gap-3" aria-label="AI analysis">
            <Link
              href="/ai-analysis"
              className={isRecovery ? analysisNavIdle : `${analysisAccentGradient} rounded-full px-4 py-1.5 text-xs`}
            >
              Performance
            </Link>
            <Link
              href="/ai-analysis/recovery"
              className={
                isRecovery ? `${analysisAccentGradient} rounded-full px-4 py-1.5 text-xs` : analysisNavIdle
              }
            >
              Recovery
            </Link>
          </nav>
          <div className="w-[4.5rem] shrink-0 sm:w-24" aria-hidden />
        </div>
        <div
          className="h-0.5 w-full bg-gradient-to-r from-[#f5d94a] via-[#f0b429] to-[#ea8f26]"
          aria-hidden
        />
      </header>
      {children}
    </div>
  );
}
