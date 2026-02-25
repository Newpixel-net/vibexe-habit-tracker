/**
 * CSV Export utility
 * Exports habit and completion data as a downloadable CSV file.
 */

import { Habit, HabitCompletion } from '../types';
import { toDateString } from './date';

export function exportHabitsToCSV(habits: Habit[], completions: HabitCompletion[]): void {
  const rows: string[] = [];
  rows.push('habit_name,category,color,completed_date,created_at');

  // Build a map of habit id -> habit for quick lookup
  const habitMap = new Map(habits.map(h => [h.id, h]));

  // Sort completions by date descending
  const sorted = [...completions].sort(
    (a, b) => new Date(b.completed_date).getTime() - new Date(a.completed_date).getTime()
  );

  for (const c of sorted) {
    const habit = habitMap.get(c.habit_id);
    if (!habit) continue;

    const name = escapeCsvField(habit.name);
    const category = habit.category || 'other';
    const color = habit.color;
    const completedDate = toDateString(c.completed_date);
    const createdAt = toDateString(c.created_at);

    rows.push(`${name},${category},${color},${completedDate},${createdAt}`);
  }

  const csv = rows.join('\n');
  downloadFile(csv, `habit-tracker-export-${toDateString(new Date())}.csv`, 'text/csv');
}

function escapeCsvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
