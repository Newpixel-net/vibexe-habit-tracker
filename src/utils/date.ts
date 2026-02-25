/**
 * Date utilities for habit tracking
 * Handles timezone-safe date operations
 */

/**
 * Normalize a date to midnight UTC
 * Used for storing completion dates consistently
 */
export function normalizeDate(date: Date | string): Date {
  const d = new Date(date);
  // Set to midnight UTC
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/**
 * Get today's date normalized to midnight UTC
 */
export function getToday(): Date {
  return normalizeDate(new Date());
}

/**
 * Format a date for display (e.g., "Mon", "Tue")
 */
export function getDayLabel(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'short' });
}

/**
 * Get short day label (first letter only)
 */
export function getDayLetter(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'narrow' });
}

/**
 * Format date for display (e.g., "Jan 15")
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Check if two dates are the same day (ignores time)
 */
export function isSameDay(date1: Date | string, date2: Date | string): boolean {
  const d1 = normalizeDate(date1);
  const d2 = normalizeDate(date2);
  return d1.getTime() === d2.getTime();
}

/**
 * Get the last 7 days including today
 * Returns array of dates, oldest first
 */
export function getLast7Days(): Date[] {
  const days: Date[] = [];
  const today = getToday();
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setUTCDate(today.getUTCDate() - i);
    days.push(date);
  }
  
  return days;
}

/**
 * Convert date to ISO string (for database storage)
 */
export function toISODate(date: Date): string {
  return normalizeDate(date).toISOString();
}

/**
 * Check if a date is today
 */
export function isToday(date: Date | string): boolean {
  return isSameDay(date, getToday());
}

/**
 * Get days difference between two dates
 * Returns positive if date1 is before date2
 */
export function getDaysDifference(date1: Date, date2: Date): number {
  const d1 = normalizeDate(date1).getTime();
  const d2 = normalizeDate(date2).getTime();
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((d2 - d1) / msPerDay);
}

/**
 * Get yesterday's date
 */
export function getYesterday(): Date {
  const yesterday = new Date(getToday());
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  return yesterday;
}

/**
 * Check if a specific date has a completion in the list.
 * Re-exported here so WeekGrid and other components can import from date utils.
 */
export function isDateCompleted(
  completions: { completed_date: string }[],
  date: Date
): boolean {
  return completions.some(c => isSameDay(c.completed_date, date));
}

/**
 * Get the last N days including today (oldest first)
 */
export function getLastNDays(n: number): Date[] {
  const days: Date[] = [];
  const today = getToday();

  for (let i = n - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setUTCDate(today.getUTCDate() - i);
    days.push(date);
  }

  return days;
}

/**
 * Format a date as YYYY-MM-DD for CSV/export
 */
export function toDateString(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().slice(0, 10);
}
