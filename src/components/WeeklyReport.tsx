/**
 * WeeklyReport — this week vs last week comparison with % changes.
 */

import React, { useMemo } from 'react';
import { Habit, HabitCompletion } from '../types';
import { getToday, isSameDay, normalizeDate } from '../utils/date';

interface WeeklyReportProps {
  habits: Habit[];
  completions: HabitCompletion[];
}

export function WeeklyReport({ habits, completions }: WeeklyReportProps) {
  const activeHabits = useMemo(() => habits.filter(h => !h.archived), [habits]);
  const today = useMemo(() => getToday(), []);

  // Get days for current and previous week
  const getWeekDays = (weeksAgo: number) => {
    const days: Date[] = [];
    const todayDay = today.getUTCDay(); // 0=Sun
    const startOfWeek = new Date(today);
    startOfWeek.setUTCDate(today.getUTCDate() - todayDay - (weeksAgo * 7));

    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setUTCDate(startOfWeek.getUTCDate() + i);
      days.push(normalizeDate(d));
    }
    return days;
  };

  const thisWeekDays = getWeekDays(0);
  const lastWeekDays = getWeekDays(1);

  // Count completions per habit per week
  const weekData = useMemo(() => {
    return activeHabits.map(habit => {
      const thisWeek = thisWeekDays.filter(d =>
        completions.some(c => c.habit_id === habit.id && isSameDay(c.completed_date, d))
      ).length;
      const lastWeek = lastWeekDays.filter(d =>
        completions.some(c => c.habit_id === habit.id && isSameDay(c.completed_date, d))
      ).length;
      const change = lastWeek > 0 ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100) : thisWeek > 0 ? 100 : 0;

      return { habit, thisWeek, lastWeek, change };
    });
  }, [activeHabits, completions, thisWeekDays, lastWeekDays]);

  // Totals
  const totalThis = weekData.reduce((sum, d) => sum + d.thisWeek, 0);
  const totalLast = weekData.reduce((sum, d) => sum + d.lastWeek, 0);
  const totalChange = totalLast > 0 ? Math.round(((totalThis - totalLast) / totalLast) * 100) : totalThis > 0 ? 100 : 0;

  // Best performers
  const bestPerformer = weekData.reduce((best, d) => d.thisWeek > best.thisWeek ? d : best, weekData[0]);
  const mostImproved = weekData.reduce((best, d) => d.change > best.change ? d : best, weekData[0]);

  if (activeHabits.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500 dark:text-gray-400">
        <p>No habits to report on yet.</p>
      </div>
    );
  }

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">Weekly Report</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          {thisWeekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — {thisWeekDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </p>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{totalThis}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">This Week</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{totalLast}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Last Week</p>
          </div>
          <div>
            <p className={`text-3xl font-bold ${totalChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {totalChange >= 0 ? '+' : ''}{totalChange}%
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Change</p>
          </div>
        </div>
      </div>

      {/* Highlights */}
      {weekData.length > 1 && (
        <div className="grid grid-cols-2 gap-3">
          {bestPerformer && (
            <div className="glass-card rounded-xl p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Best This Week</p>
              <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">{bestPerformer.habit.name}</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{bestPerformer.thisWeek}/7</p>
            </div>
          )}
          {mostImproved && mostImproved.change > 0 && (
            <div className="glass-card rounded-xl p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Most Improved</p>
              <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">{mostImproved.habit.name}</p>
              <p className="text-lg font-bold text-green-600 dark:text-green-400">+{mostImproved.change}%</p>
            </div>
          )}
        </div>
      )}

      {/* Per-Habit Comparison */}
      <div className="glass-card rounded-2xl p-4 sm:p-6">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Per-Habit Breakdown</h4>
        <div className="space-y-4">
          {weekData.map(({ habit, thisWeek, lastWeek, change }) => (
            <div key={habit.id} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-2.5 h-2.5 rounded-full bg-${habit.color}-500 flex-shrink-0`} />
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{habit.name}</span>
                </div>
                <span className={`text-xs font-semibold flex-shrink-0 ml-2 ${change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {change >= 0 ? '+' : ''}{change}%
                </span>
              </div>
              <div className="flex gap-1">
                {/* This week bars */}
                {[0,1,2,3,4,5,6].map(di => {
                  const d = thisWeekDays[di];
                  const done = completions.some(c => c.habit_id === habit.id && isSameDay(c.completed_date, d));
                  const isPast = d.getTime() <= today.getTime();
                  return (
                    <div key={di} className="flex-1 flex flex-col items-center gap-0.5">
                      <div
                        className={`w-full h-5 rounded-sm transition-colors ${
                          done ? `bg-${habit.color}-500` : isPast ? 'bg-gray-200 dark:bg-gray-700' : 'bg-gray-100 dark:bg-gray-800'
                        }`}
                      />
                      <span className="text-[8px] text-gray-400">{dayLabels[di]?.charAt(0)}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-[10px] text-gray-400 dark:text-gray-500">
                <span>This: {thisWeek}/7</span>
                <span>Last: {lastWeek}/7</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
