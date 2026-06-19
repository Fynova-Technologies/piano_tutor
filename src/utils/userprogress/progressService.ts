import { getSupabaseBrowserClient } from "@/lib/supabase/browserclient";

export async function getUserProgress(userId: string | undefined) {
  const { data, error } = await getSupabaseBrowserClient()
    .from("user_progress")
    .select("*")
    .eq("user_id", userId);
  if (error) throw error;
  return data;
}

export async function upsertProgress(
  userId: string,
  fkid: string,
  lessonId: string,
  completed: boolean
) {
  const { error } = await getSupabaseBrowserClient()
    .from("user_progress")
    .upsert(
      {
        user_id: userId,
        fkid,
        lesson_id: lessonId,
        completed,
        completed_at: completed ? new Date().toISOString() : null,
      },
      { onConflict: "user_id,fkid,lesson_id" }
    );
  if (error) throw error;
}

export async function getUserUnitProgress(userId: string | undefined) {
  const { data, error } = await getSupabaseBrowserClient()
    .from("user_unit_progress")
    .select("*")
    .eq("user_id", userId);
  if (error) throw error;
  return data;
}

// fkid is the single unit key — no more unit_id
export async function unlockUnit(userId: string, fkid: string) {
  const { error } = await getSupabaseBrowserClient()
    .from("user_unit_progress")
    .upsert(
      {
        user_id: userId,
        fkid,
        unlocked: true,
        last_accessed: new Date().toISOString(),
      },
      { onConflict: "user_id,fkid" }
    );
  if (error) throw error;
}

export async function markUnitCompleted(userId: string, fkid: string) {
  const { error } = await getSupabaseBrowserClient()
    .from("user_unit_progress")
    .upsert(
      {
        user_id: userId,
        fkid,
        unlocked: true,
        completed: true,
        last_accessed: new Date().toISOString(),
      },
      { onConflict: "user_id,fkid" }
    );
  if (error) throw error;
}

