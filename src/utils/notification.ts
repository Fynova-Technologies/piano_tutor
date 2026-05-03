// utils/notifications.js

export const getNotifications = () => {
  const data = localStorage.getItem("notifications");
  return data ? JSON.parse(data) : [];
};

export const addNotification = (message: string) => {
  const notifications = getNotifications();

  const newNotification = {
    id: Date.now(),
    message,
    createdAt: Date.now(),
  };

  const updated = [newNotification, ...notifications];

  localStorage.setItem("notifications", JSON.stringify(updated));
};

export const deleteNotification = (id: number) => {
  const notifications = getNotifications().filter((n: { id: number; }) => n.id !== id);
  localStorage.setItem("notifications", JSON.stringify(notifications));
};

export const cleanOldNotifications = () => {
  const now = Date.now();
  const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;

  const notifications = getNotifications().filter(
    (n: { createdAt: number; }) => now - n.createdAt < THREE_DAYS
  );

  localStorage.setItem("notifications", JSON.stringify(notifications));
};

