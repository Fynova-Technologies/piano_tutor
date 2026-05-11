// utils/userprogress/userrecentpost.ts
"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";

export type RecentLesson = {
  id: string;
  lesson_id: string;
  lesson_title: string;
  file: string | null;
  unit_id: string;
  fkid: string;
  source: string;
  course_title: string;
  image_url: string | null;
  progress: number;
  played_at: string;
};

export function useRecentLessons() {
  // ── Stable client — created once per hook mount, never recreated ─────────
  const supabaseRef = useRef(
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  );
  const supabase = supabaseRef.current;

  const [recentLessons, setRecentLessons] = useState<RecentLesson[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchRecentLessons = useCallback(async () => {
    setLoading(true);
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        console.error("[useRecentLessons] auth error:", authError.message);
        setLoading(false);
        return;
      }
      if (!user) {
        console.warn("[useRecentLessons] no authenticated user");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("recent_lessons")
        .select("*")
        .eq("user_id", user.id)
        .order("played_at", { ascending: false })
        .limit(10);

      if (error) {
        console.error("[useRecentLessons] fetch error:", error.message);
      } else {
        setRecentLessons(data as RecentLesson[]);
      }
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // ── Save — upsert on (user_id, lesson_id) ───────────────────────────────
  const saveRecentLesson = useCallback(
    async (params: {
      lesson_id: string;
      lesson_title: string;
      file?: string;
      unit_id: string;
      fkid: string;
      source?: string;
      course_title: string;
      image_url?: string;
      progress?: number;
    }) => {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          console.error("[useRecentLessons] not authenticated — cannot save");
          return;
        }

        const row = {
          user_id: user.id,
          lesson_id: params.lesson_id,
          lesson_title: params.lesson_title,
          file: params.file ?? null,
          unit_id: params.unit_id,
          fkid: params.fkid,
          source: params.source ?? "",
          course_title: params.course_title,
          image_url: params.image_url ?? null,
          progress: params.progress ?? 0,
          played_at: new Date().toISOString(),
        };

        const { error } = await supabase
          .from("recent_lessons")
          .upsert(row, { onConflict: "user_id,lesson_id" });

        if (error) {
          console.error("[useRecentLessons] upsert error:", error.message);
        } else {
          // Optimistically update local state so dashboard reflects immediately
          setRecentLessons((prev) => [
            row as unknown as RecentLesson,
            ...prev.filter((r) => r.lesson_id !== params.lesson_id),
          ]);
        }
      } catch (err) {
        console.error("[useRecentLessons] unexpected error:", err);
      }
    },
    [supabase]
  );

  useEffect(() => {
    fetchRecentLessons();
  }, [fetchRecentLessons]);

  return {
    recentLessons,
    loading,
    saveRecentLesson,
    refetch: fetchRecentLessons,
  };
}