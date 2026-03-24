'use client'

import Image from 'next/image';
import { useEffect, useState } from "react";
import {
  startDailyNotification
} from "@/utils/schedular";
import {
  cleanOldNotifications,
  getNotifications,
  deleteNotification
} from "@/utils/notification";

type NotificationType = {
  id: number;
  message: string;
  createdAt: number;
};

export default function NotificationPopup({ notificationOpen, setNotificationOpen }: { notificationOpen: boolean; setNotificationOpen: (open: boolean) => void }) {
  const [notifications, setNotifications] = useState<NotificationType[]>([]);

  // 🔄 Load notifications
  const loadNotifications = () => {
    const data = getNotifications();
    setNotifications(data);
  };

  useEffect(() => {
    cleanOldNotifications();
    startDailyNotification();

    if ("Notification" in window) {
      Notification.requestPermission();
    }

    loadNotifications();

    // 👇 listen for updates (important)
    const interval = setInterval(loadNotifications, 2000);

    return () => clearInterval(interval);
  }, []);

  // ❌ delete handler
  const handleDelete = (id: number) => {
    deleteNotification(id);
    loadNotifications();
  };

  if (!notificationOpen) return null;

  return (
    <div className="">
      
      {/* Header */}
      <div className='flex items-center justify-between px-4 py-3 border-b border-[#E5E5EA]'>
        <span className='text-[#1C1C1E] text-[20px] font-bold'>
          Notifications
        </span>
        <Image src={"notificationclose.svg"} width={20} height={20} alt='close' onClick={() => setNotificationOpen(!notificationOpen)} />
      </div>

      {/* Notifications List */}
      <div className="max-h-[400px] overflow-y-auto">
        {notifications.length === 0 ? (
          <p className="text-center text-gray-500 py-6">
            No notifications yet
          </p>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className="flex items-start justify-between gap-3 px-4 py-3 border-b hover:bg-gray-50"
            >
              <div>
                <p className="text-sm text-gray-800">{n.message}</p>
                <span className="text-xs text-gray-400">
                  {new Date(n.createdAt).toLocaleString()}
                </span>
              </div>

              {/* Delete Button */}
              <button
                onClick={() => handleDelete(n.id)}
                className="text-red-500 text-xs"
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}