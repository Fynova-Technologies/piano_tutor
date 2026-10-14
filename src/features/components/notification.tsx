'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  getNotifications,
  deleteNotification,
  // addNotification,
  markAsRead,
  markAllAsRead,
  type NotificationType,
} from '@/utils/notification';

const BellIcon = ({ size = 13, stroke = '#D4AF37', sw = 2 }: { size?: number; stroke?: string; sw?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

export default function NotificationPopup({
  notificationOpen,
  setNotificationOpen,
}: {
  notificationOpen: boolean;
  setNotificationOpen: (open: boolean) => void;
}) {
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const popupRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const loadNotifications = () => setNotifications(getNotifications());

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 2000);
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!notificationOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setNotificationOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [notificationOpen, setNotificationOpen]);

  const handleOpen = (n: NotificationType) => {
    markAsRead(n.id);
    loadNotifications();
    if (n.href) {
      setNotificationOpen(false);
      router.push(n.href);
    }
  };

  const handleDelete = (id: number) => {
    deleteNotification(id);
    loadNotifications();
  };

  const unread = notifications.filter(n => !n.read).length;

  if (!notificationOpen) return null;

  return (
    <div ref={popupRef} className="bg-[#FEFEFE] rounded-2xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E5EA]">
        <div className="flex items-center gap-2">
          <BellIcon size={18} />
          <span className="text-[#1C1C1E] text-[18px] font-bold">Notifications</span>
          {unread > 0 && (
            <span className="bg-[#D4AF37] text-[#0a0a0a] text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {unread}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unread > 0 && (
            <button
              onClick={() => { markAllAsRead(); loadNotifications(); }}
              className="text-xs text-gray-500 hover:text-[#1C1C1E] underline"
            >
              Mark all read
            </button>
          )}
          <button
            onClick={() => setNotificationOpen(false)}
            className="text-gray-400 hover:text-[#1C1C1E] transition-colors p-1 rounded-full hover:bg-gray-100"
            aria-label="Close notifications"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Test notification button */}
      {/* <div className="px-4 py-3 border-b border-[#E5E5EA]">
        <button
          onClick={() => {
            addNotification(
              { kind: 'system', message: '🎹 Time to practice! Open a piano lesson and play for 10 minutes.', href: '/dashboard' },
              0
            );
            loadNotifications();
          }}
          className="w-full flex items-center justify-center gap-2 text-sm bg-[#D4AF37] text-[#0a0a0a] font-semibold py-2 px-4 rounded-full hover:opacity-90 transition"
        >
          <BellIcon size={14} stroke="currentColor" sw={2.5} />
          Test Notification
        </button>
      </div> */}

      {/* Notification list */}
      <div className="max-h-[360px] overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2 text-gray-400">
            <BellIcon size={32} stroke="currentColor" sw={1.5} />
            <p className="text-sm">No notifications yet</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => handleOpen(n)}
              className={`flex items-start justify-between gap-3 px-4 py-3 border-b border-[#F0F0F0] hover:bg-gray-50 transition-colors cursor-pointer ${n.read ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <div className="mt-0.5 shrink-0 w-7 h-7 rounded-full bg-[#D4AF37]/15 flex items-center justify-center">
                  <BellIcon />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-[#1C1C1E] leading-snug">{n.message}</p>
                  <span className="text-[11px] text-gray-400 mt-0.5 block">
                    {new Date(n.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(n.id); }}
                className="shrink-0 text-gray-300 hover:text-red-500 transition-colors mt-0.5"
                aria-label="Delete notification"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                </svg>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}