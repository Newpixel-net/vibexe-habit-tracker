/**
 * Habit Tracker - TypeScript Types
 * Central type definitions for the application
 */

// User types from Vibexe SDK
export interface User {
  id: string;
  email: string;
  display_name: string;
  role: string;
  email_verified: boolean;
  auth_provider: string;
  avatar_url: string | null;
  created_at: string;
}

// App-specific types
export type HabitColor = 'blue' | 'green' | 'purple' | 'orange' | 'pink';

export interface Habit {
  id: string;
  name: string;
  color: HabitColor;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface HabitCompletion {
  id: string;
  habit_id: string;
  completed_date: string; // ISO date string (midnight normalized)
  user_id: string;
  created_at: string;
}

export interface HabitWithCompletions extends Habit {
  completions: HabitCompletion[];
}

export interface WeekDay {
  date: Date;
  isCompleted: boolean;
  isToday: boolean;
  dayLabel: string;
}

export interface WeeklyProgress {
  days: WeekDay[];
  completionsCount: number;
  streak: number;
}

export type AuthView = 'signup' | 'signin';

export interface AuthError {
  field?: string;
  message: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export const HABIT_COLORS: { name: HabitColor; class: string; bgClass: string }[] = [
  { name: 'blue', class: 'text-blue-500', bgClass: 'bg-blue-500' },
  { name: 'green', class: 'text-green-500', bgClass: 'bg-green-500' },
  { name: 'purple', class: 'text-purple-500', bgClass: 'bg-purple-500' },
  { name: 'orange', class: 'text-orange-500', bgClass: 'bg-orange-500' },
  { name: 'pink', class: 'text-pink-500', bgClass: 'bg-pink-500' },
];

export const DEFAULT_HABIT_COLOR: HabitColor = 'blue';
