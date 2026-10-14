export type NotificationKind =
  | 'assignment' | 'streak' | 'inactive' | 'lesson' | 'weak-area' | 'system';

export type NotificationType = {
  id: number;
  kind: NotificationKind;
  message: string;
  href?: string;          // where clicking should take the user
  dedupeKey?: string;     // prevents repeats
  read: boolean;
  createdAt: number;
};

export type NewNotification = Pick<NotificationType, 'kind' | 'message' | 'href' | 'dedupeKey'>;

let activeUserId = 'guest';
export const setNotificationUser = (id?: string | null) => { activeUserId = id ?? 'guest'; };
const storageKey = () => `notifications:${activeUserId}`;

export const getNotifications = (): NotificationType[] => {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(storageKey()) || '[]');
  } catch { return []; }
};

const save = (list: NotificationType[]) =>
  localStorage.setItem(storageKey(), JSON.stringify(list));

export const addNotification = (
  n: NewNotification,
  cooldownMs = 12 * 60 * 60 * 1000
): boolean => {
  const list = getNotifications();
  const now = Date.now();
  if (n.dedupeKey && list.some(x => x.dedupeKey === n.dedupeKey && now - x.createdAt < cooldownMs)) {
    return false; // already sent recently
  }
  save([{ ...n, id: now, read: false, createdAt: now }, ...list]);
  return true;
};

export const markAsRead = (id: number) =>
  save(getNotifications().map(n => (n.id === id ? { ...n, read: true } : n)));

export const markAllAsRead = () =>
  save(getNotifications().map(n => ({ ...n, read: true })));

export const deleteNotification = (id: number) =>
  save(getNotifications().filter(n => n.id !== id));

export const cleanOldNotifications = () => {
  const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;
  save(getNotifications().filter(n => Date.now() - n.createdAt < THREE_DAYS));
};

export const getUnreadCount = () => getNotifications().filter(n => !n.read).length;