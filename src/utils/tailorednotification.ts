import type { NewNotification } from './notification';

export type NotifContext = {
  firstName?: string;
  streak: number;                       // consecutive days practiced
  lastPracticedAt: number | null;       // ms timestamp
  nextLesson?: { title: string; href: string } | null;
  weakHand?: 'left' | 'right' | null;
  pendingAssignments?: { title: string; dueAt: number }[];
};

const DAY = 24 * 60 * 60 * 1000;
const startOfDay = (t: number) => new Date(t).setHours(0, 0, 0, 0);

export function buildNotification(ctx: NotifContext, now = Date.now()): NewNotification | null {
  const name = ctx.firstName ? `${ctx.firstName}, ` : '';
  const daysSince = ctx.lastPracticedAt
    ? Math.floor((startOfDay(now) - startOfDay(ctx.lastPracticedAt)) / DAY)
    : null;

  // 1. Assignment due within 48h (highest priority)
  const due = (ctx.pendingAssignments ?? [])
    .filter(a => a.dueAt > now && a.dueAt - now < 2 * DAY)
    .sort((a, b) => a.dueAt - b.dueAt)[0];
  if (due) {
    const hrs = Math.max(1, Math.round((due.dueAt - now) / 3600000));
    return {
      kind: 'assignment',
      message: `📚 "${due.title}" is due in ${hrs}h. Submit it before the deadline.`,
      href: '/classroom',
      dedupeKey: `assignment:${due.title}`,
    };
  }

  // 2. Streak at risk: practiced yesterday but not yet today
  if (ctx.streak > 0 && daysSince === 1) {
    return {
      kind: 'streak',
      message: `🔥 ${name}your ${ctx.streak}-day streak ends tonight. Even 5 minutes keeps it alive.`,
      href: ctx.nextLesson?.href ?? '/dashboard',
      dedupeKey: `streak:${startOfDay(now)}`,
    };
  }

  // 3. Inactive 3+ days
  if (daysSince !== null && daysSince >= 3) {
    return {
      kind: 'inactive',
      message: `🎹 ${name}it's been ${daysSince} days. A short warm-up is a good way back in.`,
      href: '/dashboard',
      dedupeKey: `inactive:${startOfDay(now)}`,
    };
  }

  // 4. Weak-hand nudge (from your AI analysis data)
  if (ctx.weakHand && daysSince === 0) {
    return {
      kind: 'weak-area',
      message: `🎯 Your ${ctx.weakHand} hand has been the tricky one lately. Try a recovery drill.`,
      href: '/ai-analysis',
      dedupeKey: `weak:${ctx.weakHand}:${startOfDay(now)}`,
    };
  }

  // 5. Continue where they left off
  if (ctx.nextLesson) {
    return {
      kind: 'lesson',
      message: `▶️ Up next: ${ctx.nextLesson.title}`,
      href: ctx.nextLesson.href,
      dedupeKey: `lesson:${ctx.nextLesson.title}:${startOfDay(now)}`,
    };
  }

  return null;
}