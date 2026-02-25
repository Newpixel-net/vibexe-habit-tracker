/**
 * HeatmapCalendar — GitHub-style yearly heatmap showing completion density.
 * Shows the last 365 days with green shading by completion count.
 */

import React, { useMemo } from 'react';
import { Habit, HabitCompletion } from '../types';
import { normalizeDate, isSameDay } from '../utils/date';

interface HeatmapCalendarProps {
  habits: Habit[];
  completions: HabitCompletion[];
}

export function HeatmapCalendar({ habits, completions }: HeatmapCalendarProps) {
  const activeHabits = useMemo(() => habits.filter(h => !h.archived), [habits]);
  const maxPerDay = activeHabits.length || 1;

  // Build 365-day grid
  const days = useMemo(() => {
    const result: { date: Date; count: number; dateStr: string }[] = [];
    const today = normalizeDate(new Date());

    for (let i = 364; i >= 0; i--) {
      const d = new Date(today);
      d.setUTCDate(d.getUTCDate() - i);
      const count = activeHabits.filter(h =>
        completions.some(c => c.habit_id === h.id && isSameDay(c.completed_date, d))
      ).length;
      result.push({
        date: d,
        count,
        dateStr: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      });
    }
    return result;
  }, [activeHabits, completions]);

  // Group by weeks (columns)
  const weeks: typeof days[] = [];
  let week: typeof days = [];
  // Pad start to align with Sunday
  const firstDayOfWeek = days[0]?.date.getUTCDay() || 0;
  for (let i = 0; i < firstDayOfWeek; i++) {
    week.push({ date: new Date(0), count: -1, dateStr: '' }); // empty padding
  }
  for (const day of days) {
    week.push(day);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length > 0) weeks.push(week);

  const getColor = (count: number) => {
    if (count < 0) return 'bg-transparent';
    if (count === 0) return 'bg-gray-100 dark:bg-gray-800';
    const ratio = count / maxPerDay;
    if (ratio <= 0.25) return 'bg-green-200 dark:bg-green-900';
    if (ratio <= 0.5) return 'bg-green-400 dark:bg-green-700';
    if (ratio <= 0.75) return 'bg-green-500 dark:bg-green-600';
    return 'bg-green-600 dark:bg-green-500';
  };

  const months = useMemo(() => {
    const labels: { label: string; col: number }[] = [];
    let lastMonth = -1;
    weeks.forEach((w, i) => {
      const realDays = w.filter(d => d.count >= 0);
      if (realDays.length === 0) return;
      const m = realDays[0].date.getUTCMonth();
      if (m !== lastMonth) {
        labels.push({
          label: realDays[0].date.toLocaleDateString('en-US', { month: 'short' }),
          col: i,
        });
        lastMonth = m;
      }
    });
    return labels;
  }, [weeks]);

  return (
    <div className="glass-card rounded-2xl p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Yearly Heatmap</h3>
        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
          <span>Less</span>
          {[0, 0.25, 0.5, 0.75, 1].map((r, i) => (
            <div key={i} className={`w-3 h-3 rounded-sm ${getColor(r * maxPerDay || (i === 0 ? 0 : 1))}`} />
          ))}
          <span>More</span>
        </div>
      </div>

      {/* Month labels */}
      <div className="overflow-x-auto scrollbar-hide">
        <div style={{ minWidth: weeks.length * 14 + 30 }}>
          <div className="flex gap-0 ml-8 mb-1">
            {months.map((m, i) => (
              <div
                key={i}
                className="text-[10px] text-gray-400 dark:text-gray-500 absolute"
                style={{ left: m.col * 14 + 30 }}
              >
                {m.label}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="flex gap-[2px] relative mt-4">
            {/* Day labels */}
            <div className="flex flex-col gap-[2px] pr-1">
              {['S','M','T','W','T','F','S'].map((d, i) => (
                <div key={i} className="w-5 h-[12px] text-[9px] text-gray-400 dark:text-gray-500 flex items-center">
                  {i % 2 === 1 ? d : ''}
                </div>
              ))}
            </div>

            {weeks.map((w, wi) => (
              <div key={wi} className="flex flex-col gap-[2px]">
                {w.map((d, di) => (
                  <div
                    key={di}
                    className={`w-[12px] h-[12px] rounded-sm ${getColor(d.count)} transition-colors`}
                    title={d.count >= 0 ? `${d.dateStr}: ${d.count}/${maxPerDay}` : ''}
                  />
                ))}
                {/* Pad remaining slots if week is incomplete */}
                {w.length < 7 && Array.from({ length: 7 - w.length }).map((_, i) => (
                  <div key={`pad-${i}`} className="w-[12px] h-[12px]" />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
        {completions.length} total completions across {activeHabits.length} habits
      </p>
    </div>
  );
}
