"use client";

import { Suspense } from "react";
import Link from "next/link";
import AiReviewRecoveryCenter from "@/features/ai-review/AiReviewRecoveryCenter";

function BackLink() {
  return (
    <div className="border-b border-black/10 bg-[#F8F6F1]">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4 md:px-8">
        <Link
          href="/"
          className="text-sm font-medium text-[#0A0A0B] underline-offset-4 hover:underline"
        >
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
}

export default function AiAnalysisPage() {
  return (
    <div className="min-h-screen bg-[#F8F6F1]">
      <BackLink />
      <Suspense fallback={<div className="p-8 text-center text-black/60">Loading analysis…</div>}>
        <AiReviewRecoveryCenter />
      </Suspense>
    </div>
  );
}
