/**
 * Streak calculation utilities
 * Calculates consecutive days completed from completion history
 */

import { HabitCompletion } from '../types';
import { normalizeDate, getToday, getYesterday, isSameDay, getDaysDifference } from './date';

/**
 * Calculate the current streak for a habit
 * A streak is the number of consecutive days completed up to today
 * 
 * Rules:
 * - Streak increases by completing the habit on consecutive days
 * - If today is completed, streak includes today
 * - If yesterday is completed but not today, streak counts up to yesterday
 * - If yesterday is NOT completed, streak is 0 (or 1 if today is completed)
 */
export function calculateStreak(completions: HabitCompletion[]): number {
  if (completions.length === 0) return 0;
  
  const today = getToday();
  const yesterday = getYesterday();
  
  // Sort completions by date, newest first
  const sortedDates = [...completions]
    .map(c => normalizeDate(c.completed_date))
    .sort((a, b) => b.getTime() - a.getTime());
  
  // Get unique dates (remove duplicates)
  const uniqueDates = sortedDates.filter((date, index, array) => {
    if (index === 0) return true;
    return !isSameDay(date, array[index - 1]);
  });
  
  // Check if we have a completion today
  const completedToday = uniqueDates.some(d => isSameDay(d, today));
  // Check if we have a completion yesterday
  const completedYesterday = uniqueDates.some(d => isSameDay(d, yesterday));
  
  // If nothing completed yesterday (and not today either), streak is broken
  if (!completedYesterday && !completedToday) {
    return 0;
  }
  
  // Start counting the streak
  let streak = 0;
  let checkDate = completedToday ? new Date(today) : new Date(yesterday);
  
  // Iterate through unique dates to count consecutive completions
  for (const date of uniqueDates) {
    if (isSameDay(date, checkDate)) {
      streak++;
      // Move to previous day
      checkDate.setUTCDate(checkDate.getUTCDate() - 1);
    } else {
      // Gap in the chain, stop counting
      break;
    }
  }
  
  return streak;
}

/**
 * Check if a specific date is completed
 */
export function isDateCompleted(
  completions: HabitCompletion[],
  date: Date
): boolean {
  return completions.some(c => isSameDay(c.completed_date, date));
}

/**
 * Get the last completion date for a habit
 */
export function getLastCompletionDate(completions: HabitCompletion[]): Date | null {
  if (completions.length === 0) return null;
  
  const dates = completions.map(c => normalizeDate(c.completed_date));
  const sorted = dates.sort((a, b) => b.getTime() - a.getTime());
  return sorted[0];
}

/**
 * Get longest streak from completion history
 * (historical max, not just current)
 */
export function calculateLongestStreak(completions: HabitCompletion[]): number {
  if (completions.length === 0) return 0;
  
  // Get unique sorted dates (oldest first)
  const sortedDates = [...completions]
    .map(c => normalizeDate(c.completed_date).getTime())
    .filter((value, index, self) => self.indexOf(value) === index)
    .sort((a, b) => a - b);
  
  let maxStreak = 1;
  let currentStreak = 1;
  
  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = new Date(sortedDates[i - 1]);
    const currDate = new Date(sortedDates[i]);
    const diff = getDaysDifference(prevDate, currDate);
    
    if (diff === 1) {
      // Consecutive day
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      // Streak broken
      currentStreak = 1;
    }
  }
  
  return maxStreak;
}

/**
 * Get completion percentage for the last 7 days
 */
export function getWeeklyCompletionRate(
  completions: HabitCompletion[],
  days = 7
): number {
  const today = getToday();
  let count = 0;
  
  for (let i = 0; i < days; i++) {
    const checkDate = new Date(today);
    checkDate.setUTCDate(today.getUTCDate() - i);
    if (isDateCompleted(completions, checkDate)) {
      count++;
    }
  }
  
  return Math.round((count / days) * 100);
}

/**
 * Get total completions count
 */
export function getTotalCompletions(completions: HabitCompletion[]): number {
  const uniqueDates = new Set(
    completions.map(c => normalizeDate(c.completed_date).toISOString())
  );
  return uniqueDates.size;
}
