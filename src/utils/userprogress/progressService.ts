/* eslint-disable @typescript-eslint/no-explicit-any */
import { getSupabaseBrowserClient } from "@/lib/supabase/browserclient";
// const CDN_BASE = "https://cdn-dataforpiano.netlify.app";


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

export async function upsertTechniqueProgress(
  userId: string,
  fkid: string,
  lessonId: string,
  completed: boolean
) {
  await getSupabaseBrowserClient().from("technique_progress").upsert(
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

export async function getUserTechniqueUnitProgress(userId: string) {
  const { data, error } = await getSupabaseBrowserClient()
    .from("technique_unit_progress")
    .select("*")
    .eq("user_id", userId);
  if (error) return [];
  return data;
}

export async function unlockTechniqueUnit(userId: string, fkid: string) {
  await getSupabaseBrowserClient().from("technique_unit_progress").upsert(
    { user_id: userId, fkid, unlocked: true, last_accessed: new Date().toISOString() },
    { onConflict: "user_id,fkid" }
  );
}

export async function markTechniqueUnitCompleted(userId: string, fkid: string) {
  await getSupabaseBrowserClient().from("technique_unit_progress").upsert(
    { user_id: userId, fkid, completed: true, unlocked: true },
    { onConflict: "user_id,fkid" }
  );
}

// // progressService.ts
// export async function completeTechniqueLessonById(
//   userId: string,
//   fkid: string,
//   lessonId: string
// ) {
//   await getSupabaseBrowserClient().from("technique_progress").upsert(
//     { user_id: userId, fkid, lesson_id: lessonId, completed: true, completed_at: new Date().toISOString() },
//     { onConflict: "user_id,fkid,lesson_id" }
//   );

//   const res = await fetch(`${CDN_BASE}/techniques.json`);
//   const { Techniques } = await res.json();
//   const unit = Techniques.find((u: any) => u.fkid === fkid);
//   const progress = await getUserProgress(userId); // or a techniques-specific fetch
//   const allDone = unit?.unitlessons.every((l: any) =>
//     progress.find((p: any) => p.fkid === fkid && p.lesson_id === l.id)?.completed
//   );

//   if (allDone) {
//     await markTechniqueUnitCompleted(userId, fkid);
//     const idx = Techniques.findIndex((u: any) => u.fkid === fkid);
//     if (Techniques[idx + 1]) await unlockTechniqueUnit(userId, Techniques[idx + 1].fkid);
//   }
// }