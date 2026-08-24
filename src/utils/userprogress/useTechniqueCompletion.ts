/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useCallback } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browserclient";
import { markTechniqueUnitCompleted, unlockTechniqueUnit,upsertTechniqueProgress } from "./progressService";

const supabase = getSupabaseBrowserClient();

// async function markLessonComplete(
//   userId: string,
//   fkid: string,
//   lessonId: string,
//   completed: boolean
// ) {
//   await supabase.from("technique_progress").upsert(
//     {
//       user_id: userId,
//       fkid,
//       lesson_id: lessonId,
//       completed,
//       completed_at: completed ? new Date().toISOString() : null,
//       updated_at: new Date().toISOString(),
//     },
//     { onConflict: "user_id,fkid,lesson_id" }
//   );
// }

export function useTechniqueCompletion() {
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }: any) => setUserId(data.user?.id ?? null));
  }, []);

  const completeTechnique = useCallback(async (lessonId: string, fkid?: string) => {
    if (!userId || !fkid) return;
    await upsertTechniqueProgress(userId, fkid, lessonId, true);

    // fetch current progress + unitLessonsData2 fresh here, since this
    // hook has no shared state with Techniques.tsx anymore
    const [{ data: progressRows }, techniquesRes] = await Promise.all([
      supabase.from("technique_progress").select("lesson_id, completed").eq("user_id", userId).eq("fkid", fkid),
      fetch("/techniques.json").then((r) => r.json()),
    ]);

    const unit = techniquesRes.Techniques.find((u: any) => u.fkid === fkid);
    const completedIds = new Set(
      (progressRows ?? []).filter((r: { completed: any; }) => r.completed).map((r: { lesson_id: any; }) => r.lesson_id)
    );
    completedIds.add(lessonId);
    const allDone = unit?.unitlessons.every((l: any) => completedIds.has(l.id)) ?? false;

    if (allDone) {
      await markTechniqueUnitCompleted(userId, fkid);
      const idx = techniquesRes.Techniques.findIndex((u: any) => u.fkid === fkid);
      const nextUnit = techniquesRes.Techniques[idx + 1];
      if (nextUnit) await unlockTechniqueUnit(userId, nextUnit.fkid);
    }
  }, [userId]);

  return { completeTechnique };
}