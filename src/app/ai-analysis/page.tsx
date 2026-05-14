"use client";

import { Suspense } from "react";
import AiReviewRecoveryCenter from "@/features/ai-review/AiReviewRecoveryCenter";

export default function AiAnalysisPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-sm text-neutral-600">Loading insights…</div>
      }
    >
      <AiReviewRecoveryCenter />
    </Suspense>
  );
}
