import { getSessions } from "@/datastore/sessionstorage";

/**
 * Get minutes per weekday (Sun-Sat)
 */
/**
 * Get minutes per weekday (Sun-Sat) for the CURRENT week only
 */
export function getWeeklyActivity() {
  const sessions = getSessions();
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const result = days.map(day => ({
    day,
    seconds: 0,
  }));

  // Get the start of the current week (Sunday)
  const now = new Date();
  const currentDay = now.getDay();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - currentDay);
  startOfWeek.setHours(0, 0, 0, 0);

  // Get the end of the current week (Saturday)
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);

  sessions.forEach(session => {
    if (!session.startedAt || !session.endedAt) return;
    
    // Timestamps are already in milliseconds, no need to multiply
    const date = new Date(session.startedAt);
    
    // Only include sessions from the current week
    if (date < startOfWeek || date >= endOfWeek) return;
    
    const dayIndex = date.getDay();
    
    // Use the durationSec field if available, otherwise calculate
    const seconds = session.durationSec || Math.round((session.endedAt - session.startedAt) / 1000);
    
    result[dayIndex].seconds += seconds;
  });

  // Convert seconds to minutes AFTER summing
  return result.map(day => ({
    day: day.day,
    minutes: Math.round(day.seconds / 60)
  }));
}

/**
 * Get minutes per month (Jan-Dec) for the CURRENT year only
 */
export function getMonthlyActivity() {
  const sessions = getSessions();
  const months = [
    "Jan","Feb","Mar","Apr","May","Jun",
    "Jul","Aug","Sep","Oct","Nov","Dec"
  ];
  const result = months.map(month => ({
    month,
    seconds: 0,
  }));

  // Get current year
  const currentYear = new Date().getFullYear();

  sessions.forEach(session => {
    if (!session.startedAt || !session.endedAt) return;
    
    // Timestamps are already in milliseconds
    const date = new Date(session.startedAt);
    
    // Only include sessions from the current year
    if (date.getFullYear() !== currentYear) return;
    
    const monthIndex = date.getMonth();
    
    // Use the durationSec field if available, otherwise calculate
    const seconds = session.durationSec || Math.round((session.endedAt - session.startedAt) / 1000);
    
    result[monthIndex].seconds += seconds;
  });

  // Convert seconds to minutes AFTER summing
  return result.map(month => ({
    month: month.month,
    minutes: Math.round(month.seconds / 60)
  }));
}