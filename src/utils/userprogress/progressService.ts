// services/progressService.js
import { supabase } from "@/lib/supabaseClient"; // matches your existing import

export async function getUserProgress(userId: string | undefined) {
  const { data, error } = await supabase
    .from("user_progress")
    .select("*")
    .eq("user_id", userId);

  if (error) throw error;
  return data;
}

export async function upsertProgress(userId: string, fkid: string, lessonId: string, completed: boolean) {
  const { error } = await supabase
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
  const { data, error } = await supabase
    .from("user_unit_progress")
    .select("*")
    .eq("user_id", userId);

  if (error) throw error;
  return data;
}

export async function unlockUnit(userId: string | undefined, unitId: string | undefined, fkid: string | undefined) {
  const { error } = await supabase
    .from("user_unit_progress")
    .upsert(
      {
        user_id: userId,
        unit_id: unitId,
        fkid,
        unlocked: true,
        last_accessed: new Date().toISOString(),
      },
      { onConflict: "user_id,unit_id" }
    );
  if (error) throw error;
}

export async function markUnitCompleted(userId: string | undefined, unitId: string | undefined, fkid: string | undefined) {
  const { error } = await supabase
    .from("user_unit_progress")
    .upsert(
      {
        user_id: userId,
        unit_id: unitId,
        fkid,
        unlocked: true,
        completed: true,
        last_accessed: new Date().toISOString(),
      },
      { onConflict: "user_id,unit_id" }
    );
  if (error) throw error;
}