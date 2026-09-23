'use client';
import { useEffect, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/browserclient';
import { onSessionQueued } from '@/lib/practiceSessions/syncToSupabase'; // adjust path to your file

/**
 * Per-user, per-lesson play count, sourced from practice_sessions (one row per playthrough).
 * lessonUid must be the same value you write into practice_sessions.lesson_uid
 * (e.g. "Method-1A-1"), NOT the bare lesson_id — lesson_id repeats across lessons,
 * lesson_uid doesn't.
 */
export function useLessonPlayCount(lessonUid: string | null | undefined) {
  const [playCount, setPlayCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!lessonUid) {
      setPlayCount(0);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      const supabase = getSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || cancelled) {
        if (!cancelled) setLoading(false);
        return;
      }

      const { count, error } = await supabase
        .from('practice_sessions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('lesson_uid', lessonUid);

      if (cancelled) return;

      if (error) {
        console.error('useLessonPlayCount: failed to fetch count', error);
      } else if (count !== null) {
        setPlayCount(count);
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [lessonUid]);

  // Optimistic bump: fires the moment a session for THIS lesson is queued for
  // sync (not when the batched upsert actually lands — queuePracticeSessionSync
  // is fire-and-forget and never reports success back to its caller). The DB
  // count() on mount is still the source of truth and self-corrects on reload,
  // so a permanently-failed sync just means a stale count until next visit —
  // acceptable for a "Play Count" display, and upsert(onConflict:"id") means
  // a session can never be double-counted once it does land.
  useEffect(() => {
    if (!lessonUid) return;
    const unsubscribe = onSessionQueued((session) => {
      if (session.lesson.uid === lessonUid) {
        setPlayCount((c) => c + 1);
      }
    });
    return unsubscribe;
  }, [lessonUid]);

  return { playCount, loading };
}