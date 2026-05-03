// utils/scheduler.js

import { addNotification } from "./notification";

export const startDailyNotification = () => {
  const now = new Date();

  const nextNoon = new Date();
  nextNoon.setHours(12, 0, 0, 0);

  // if already past 12 today → schedule tomorrow
  if (now > nextNoon) {
    nextNoon.setDate(nextNoon.getDate() + 1);
  }

  

  const delay = nextNoon.getTime() - now.getTime();

  setTimeout(() => {
    triggerNotification();

    // repeat every 24h
    setInterval(triggerNotification, 24 * 60 * 60 * 1000);
  }, delay);
};

const triggerNotification = () => {
  addNotification("🎹 Try out our new piano lesson today!");

  // optional browser notification
  if (Notification.permission === "granted") {
    new Notification("New Lesson 🎹", {
      body: "Try out our new piano lesson!",
    });
  }
};