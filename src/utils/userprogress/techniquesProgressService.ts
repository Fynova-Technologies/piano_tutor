import { getSupabaseBrowserClient } from "@/lib/supabase/browserclient"; 

const supabase = getSupabaseBrowserClient();

export async function getUserTechniqueProgress(userId: string) {
  const { data, error } = await supabase
    .from("technique_progress")
    .select("fkid, lesson_id, completed")
    .eq("user_id", userId);
  return error || !data ? [] : data;
}

export async function upsertTechniqueProgress(
  userId: string,
  fkid: string,
  lessonId: string,
  completed: boolean
) {
  await supabase.from("technique_progress").upsert(
    {
      user_id: userId,
      fkid,
      lesson_id: lessonId,
      completed,
      completed_at: completed ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,fkid,lesson_id" }
  );
}

// technique_unit_progress (per-method: 1A, 1B, etc.)
export async function getUserTechniqueUnitProgress(userId: string) {
  const { data, error } = await supabase
    .from("technique_unit_progress")
    .select("*")
    .eq("user_id", userId);
  return error || !data ? [] : data;
}

export async function unlockTechniqueUnit(userId: string, fkid: string) {
  await supabase.from("technique_unit_progress").upsert(
    { user_id: userId, fkid, unlocked: true, last_accessed: new Date().toISOString() },
    { onConflict: "user_id,fkid" }
  );
}

export async function markTechniqueUnitCompleted(userId: string, fkid: string) {
  await supabase.from("technique_unit_progress").upsert(
    { user_id: userId, fkid, completed: true, unlocked: true },
    { onConflict: "user_id,fkid" }
  );
}