import { Suspense } from "react";
import RecoveryLessonStudio from "@/features/recovery/RecoveryLessonStudio";

export default function MistakeRecoveryPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-black/60">Loading studio…</div>}>
      <RecoveryLessonStudio />
    </Suspense>
  );
}
