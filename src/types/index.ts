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

export type AppPage = 'habits' | 'stats' | 'heatmap' | 'focus' | 'insights' | 'report';

// ── Theme ────────────────────────────────────────────
export type ThemeMode = 'light' | 'dark' | 'system';
export type ColorTheme = 'default' | 'ocean' | 'sunset' | 'forest' | 'midnight';
// Keep backward compat alias
export type Theme = ThemeMode;

export interface ColorThemeConfig {
  name: string;
  accent: string;       // primary accent (tailwind class prefix like 'indigo', 'cyan')
  accentGradient: string; // CSS gradient for accent backgrounds
  cardBg: string;       // card background class
  cardBorder: string;   // card border class
  headerBg: string;     // header background
}

export const COLOR_THEMES: Record<ColorTheme, ColorThemeConfig> = {
  default: {
    name: 'Default',
    accent: 'indigo',
    accentGradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    cardBg: 'bg-white/70 dark:bg-gray-800/70',
    cardBorder: 'border-gray-200/60 dark:border-gray-700/60',
    headerBg: 'bg-white/80 dark:bg-gray-900/80',
  },
  ocean: {
    name: 'Ocean',
    accent: 'cyan',
    accentGradient: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
    cardBg: 'bg-white/70 dark:bg-slate-800/70',
    cardBorder: 'border-cyan-200/40 dark:border-cyan-800/40',
    headerBg: 'bg-white/80 dark:bg-slate-900/80',
  },
  sunset: {
    name: 'Sunset',
    accent: 'orange',
    accentGradient: 'linear-gradient(135deg, #f97316, #ef4444)',
    cardBg: 'bg-white/70 dark:bg-gray-800/70',
    cardBorder: 'border-orange-200/40 dark:border-orange-800/40',
    headerBg: 'bg-white/80 dark:bg-gray-900/80',
  },
  forest: {
    name: 'Forest',
    accent: 'emerald',
    accentGradient: 'linear-gradient(135deg, #10b981, #059669)',
    cardBg: 'bg-white/70 dark:bg-gray-800/70',
    cardBorder: 'border-emerald-200/40 dark:border-emerald-800/40',
    headerBg: 'bg-white/80 dark:bg-gray-900/80',
  },
  midnight: {
    name: 'Midnight',
    accent: 'violet',
    accentGradient: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
    cardBg: 'bg-white/70 dark:bg-gray-800/70',
    cardBorder: 'border-violet-200/40 dark:border-violet-800/40',
    headerBg: 'bg-white/80 dark:bg-gray-900/80',
  },
};

// ── Toast ────────────────────────────────────────────
export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}
