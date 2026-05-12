import { Suspense } from "react";
import RecoveryLessonStudio from "@/features/recovery/RecoveryLessonStudio";

export default function MistakeRecoveryPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[40vh] bg-[#F8F6F1] p-10 pt-16 text-center text-sm text-[#535356]">
          Loading recovery studio…
        </div>
      }
    >
      <RecoveryLessonStudio />
    </Suspense>
  );
}
