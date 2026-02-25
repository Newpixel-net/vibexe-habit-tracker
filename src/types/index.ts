/**
 * Habit Tracker — TypeScript Types
 */

// ── User ─────────────────────────────────────────────
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

// ── Habit Colors ─────────────────────────────────────
export type HabitColor = 'blue' | 'green' | 'purple' | 'orange' | 'pink';

export const HABIT_COLORS: { name: HabitColor; class: string; bgClass: string }[] = [
  { name: 'blue', class: 'text-blue-500', bgClass: 'bg-blue-500' },
  { name: 'green', class: 'text-green-500', bgClass: 'bg-green-500' },
  { name: 'purple', class: 'text-purple-500', bgClass: 'bg-purple-500' },
  { name: 'orange', class: 'text-orange-500', bgClass: 'bg-orange-500' },
  { name: 'pink', class: 'text-pink-500', bgClass: 'bg-pink-500' },
];

export const DEFAULT_HABIT_COLOR: HabitColor = 'blue';

// ── Categories ───────────────────────────────────────
export type HabitCategory =
  | 'health'
  | 'productivity'
  | 'learning'
  | 'fitness'
  | 'mindfulness'
  | 'social'
  | 'finance'
  | 'creativity'
  | 'other';

export const HABIT_CATEGORIES: { value: HabitCategory; label: string }[] = [
  { value: 'health', label: 'Health' },
  { value: 'productivity', label: 'Productivity' },
  { value: 'learning', label: 'Learning' },
  { value: 'fitness', label: 'Fitness' },
  { value: 'mindfulness', label: 'Mindfulness' },
  { value: 'social', label: 'Social' },
  { value: 'finance', label: 'Finance' },
  { value: 'creativity', label: 'Creativity' },
  { value: 'other', label: 'Other' },
];

export const DEFAULT_CATEGORY: HabitCategory = 'other';

// ── Habit ────────────────────────────────────────────
export interface Habit {
  id: string;
  name: string;
  color: HabitColor;
  category: HabitCategory;
  archived: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
}

// ── HabitCompletion ──────────────────────────────────
export interface HabitCompletion {
  id: string;
  habit_id: string;
  completed_date: string;
  user_id: string;
  created_at: string;
}

// ── UI helper types ──────────────────────────────────
export interface WeekDay {
  date: Date;
  isCompleted: boolean;
  isToday: boolean;
  dayLabel: string;
}

export type AuthView = 'signup' | 'signin';

export type AppPage = 'habits' | 'stats';

// ── Theme ────────────────────────────────────────────
export type Theme = 'light' | 'dark' | 'system';

// ── Toast ────────────────────────────────────────────
export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}
