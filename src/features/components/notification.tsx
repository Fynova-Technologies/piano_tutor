'use client'
// import Image from 'next/image';
import { useEffect, useRef, useState } from "react";
import { startHourlyNotification } from "@/utils/schedular";
import {
  cleanOldNotifications,
  getNotifications,
  deleteNotification,
  addNotification
} from "@/utils/notification";

type NotificationType = {
  id: number;
  message: string;
  createdAt: number;
};

export default function NotificationPopup({
  notificationOpen,
  setNotificationOpen
}: {
  notificationOpen: boolean;
  setNotificationOpen: (open: boolean) => void;
}) {
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const popupRef = useRef<HTMLDivElement>(null);

  const loadNotifications = () => {
    setNotifications(getNotifications());
  };

  useEffect(() => {
    cleanOldNotifications();
    startHourlyNotification();
    if ("Notification" in window) Notification.requestPermission();
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

  const handleDelete = (id: number) => {
    deleteNotification(id);
    loadNotifications();
  };

  if (!notificationOpen) return null;

  return (
    <div
      ref={popupRef}
      className="bg-[#FEFEFE] rounded-2xl shadow-xl overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E5EA]">
        <div className="flex items-center gap-2">
          {/* Bell icon */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <span className="text-[#1C1C1E] text-[18px] font-bold">Notifications</span>
          {notifications.length > 0 && (
            <span className="bg-[#D4AF37] text-[#0a0a0a] text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {notifications.length}
            </span>
          )}
        </div>
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

      {/* Test notification button */}
      <div className="px-4 py-3 border-b border-[#E5E5EA]">
        <button
          onClick={() => {
            addNotification("🎹 Time to practice! Open a piano lesson and play for 10 minutes.");
            loadNotifications();
          }}
          className="w-full flex items-center justify-center gap-2 text-sm bg-[#D4AF37] text-[#0a0a0a] font-semibold py-2 px-4 rounded-full hover:opacity-90 transition"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          Test Notification
        </button>
      </div>

      {/* Notification list */}
      <div className="max-h-[360px] overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2 text-gray-400">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <p className="text-sm">No notifications yet</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className="flex items-start justify-between gap-3 px-4 py-3 border-b border-[#F0F0F0] hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <div className="mt-0.5 shrink-0 w-7 h-7 rounded-full bg-[#D4AF37]/15 flex items-center justify-center">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-[#1C1C1E] leading-snug">{n.message}</p>
                  <span className="text-[11px] text-gray-400 mt-0.5 block">
                    {new Date(n.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
              <button
                onClick={() => handleDelete(n.id)}
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