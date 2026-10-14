'use client';
import { useEffect } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/browserclient';
import { cleanOldNotifications, addNotification, setNotificationUser } from '@/utils/notification';
import { buildNotification, type NotifContext } from '@/utils/tailorednotification';

const DAY = 86400000;

async function fetchNotifContext(userId: string): Promise<NotifContext> {
  const supabase = getSupabaseBrowserClient();

  const { data: sessions } = await supabase
    .from('practice_sessions')
    .select('created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(60);

  const rows = (sessions ?? []) as { created_at: string }[];
  const days = Array.from(new Set(rows.map(s => new Date(s.created_at).setHours(0, 0, 0, 0))));
  const lastPracticedAt = rows[0] ? new Date(rows[0].created_at).getTime() : null;

  let streak = 0;
  for (let i = 0; i < days.length; i++) {
    if (i === 0 || Math.round((days[i - 1] - days[i]) / DAY) === 1) streak++;
    else break;
  }

  // TODO: nextLesson, weakHand, pendingAssignments
  return { streak, lastPracticedAt, nextLesson: null, weakHand: null, pendingAssignments: [] };
}

export function useNotificationEngine() {
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const { data } = await getSupabaseBrowserClient().auth.getUser();
        const user = data.user;
        setNotificationUser(user?.id);
        cleanOldNotifications();
        if (!user) return;

        const ctx = await fetchNotifContext(user.id);
        if (cancelled) return;

        const n = buildNotification({
          ...ctx,
          firstName: user.user_metadata?.full_name?.split(' ')[0],
        });
        if (n && addNotification(n)) {
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Learnkeys', { body: n.message });
          }
        }
      } catch (e) {
        console.log('Notification engine error:', e);
      }
    };

    run();
    const id = setInterval(run, 60 * 60 * 1000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);
}