"use client";

import { Suspense } from "react";
import Link from "next/link";
import AiReviewRecoveryCenter from "@/features/ai-review/AiReviewRecoveryCenter";
import { PianoKeysStripeLight } from "@/features/ai-review/PianoAnalysisChrome";

function BackLink() {
  return (
    <div className="border-b border-black/10 bg-[#FEFEFE] shadow-[0_2px_8px_rgba(80,80,80,0.06)]">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4 md:px-8">
        <Link
          href="/"
          className="text-sm font-medium text-[#151517] underline-offset-4 transition hover:text-[#aa8c2c]"
        >
          ← Back to Dashboard
        </Link>
      </div>
      <PianoKeysStripeLight className="opacity-[0.72]" />
    </div>
  );
}

export default function AiAnalysisPage() {
  return (
    <div className="min-h-screen bg-[#F8F6F1]">
      <BackLink />
      <Suspense
        fallback={<div className="p-10 text-center text-sm text-[#535356]">Loading insights…</div>}
      >
        <AiReviewRecoveryCenter />
      </Suspense>
    </div>
  );
}
