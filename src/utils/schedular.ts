import { addNotification } from "./notification";

// Messages to rotate through hourly
const PIANO_MESSAGES = [
  "🎹 Time to practice! Open a piano lesson and play for 10 minutes.",
  "🎵 Your fingers miss the keys! Jump into a piano session now.",
  "🎼 Consistency builds mastery — play piano for a few minutes today!",
  "🎹 A quick piano practice session is waiting for you!",
  "🎵 Keep the rhythm going — try a piano lesson right now!",
];

let hourlyIntervalId: ReturnType<typeof setInterval> | null = null;

const triggerNotification = () => {
  const msg = PIANO_MESSAGES[Math.floor(Math.random() * PIANO_MESSAGES.length)];
  addNotification(msg);

  if (Notification.permission === "granted") {
    new Notification("Piano Practice 🎹", { body: msg });
  }
};

export const startHourlyNotification = () => {
  // Prevent duplicate intervals if called multiple times
  if (hourlyIntervalId !== null) return;

  // Fire once immediately, then every hour
  triggerNotification();
  hourlyIntervalId = setInterval(triggerNotification, 60 * 60 * 1000);
};

// Keep your old daily scheduler if still needed, or remove it
export const startDailyNotification = () => {
  const now = new Date();
  const nextNoon = new Date();
  nextNoon.setHours(12, 0, 0, 0);
  if (now > nextNoon) nextNoon.setDate(nextNoon.getDate() + 1);
  const delay = nextNoon.getTime() - now.getTime();

  setTimeout(() => {
    triggerNotification();
    setInterval(triggerNotification, 24 * 60 * 60 * 1000);
  }, delay);
};