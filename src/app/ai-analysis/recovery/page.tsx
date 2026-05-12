import { Suspense } from "react";
import RecoveryLessonStudio from "@/features/recovery/RecoveryLessonStudio";
import { analysisShellBg } from "@/features/ai-review/PianoAnalysisChrome";

export default function MistakeRecoveryPage() {
  return (
    <Suspense
      fallback={
        <div className={`min-h-[40vh] ${analysisShellBg} p-10 pt-16 text-center text-sm text-neutral-600`}>
          Loading recovery studio…
        </div>
      }
    >
      <RecoveryLessonStudio />
    </Suspense>
  );
}
