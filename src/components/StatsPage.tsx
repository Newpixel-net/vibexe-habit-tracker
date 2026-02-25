/**
 * Statistics Dashboard
 * Shows completion rates, streaks, weekly/monthly bar charts, and category breakdown.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Habit, HabitCompletion, HABIT_CATEGORIES } from '../types';
import { getToday, isSameDay, normalizeDate, getDaysDifference, toDateString, getLastNDays } from '../utils/date';
import { calculateStreak, calculateLongestStreak, getWeeklyCompletionRate, getTotalCompletions } from '../utils/streaks';

interface StatsPageProps {
  habits: Habit[];
  completions: HabitCompletion[];
  getAllCompletions: () => Promise<HabitCompletion[]>;
}

export function StatsPage({ habits, completions, getAllCompletions }: StatsPageProps) {
  const [allCompletions, setAllCompletions] = useState<HabitCompletion[]>(completions);
  const [loadingAll, setLoadingAll] = useState(false);

  // Load full history for stats
  useEffect(() => {
    let cancelled = false;
    setLoadingAll(true);
    getAllCompletions().then(data => {
      if (!cancelled) {
        setAllCompletions(data);
        setLoadingAll(false);
      }
    }).catch(() => {
      if (!cancelled) setLoadingAll(false);
    });
    return () => { cancelled = true; };
  }, [getAllCompletions]);

  const activeHabits = useMemo(() => habits.filter(h => !h.archived), [habits]);
  const today = useMemo(() => getToday(), []);

  // Per-habit stats
  const habitStats = useMemo(() => {
    return activeHabits.map(habit => {
      const hCompletions = allCompletions.filter(c => c.habit_id === habit.id);
      return {
        habit,
        streak: calculateStreak(hCompletions),
        longestStreak: calculateLongestStreak(hCompletions),
        weeklyRate: getWeeklyCompletionRate(hCompletions),
        totalDays: getTotalCompletions(hCompletions),
      };
    });
  }, [activeHabits, allCompletions]);

  // Global stats
  const globalStats = useMemo(() => {
    const totalHabits = activeHabits.length;
    const todayCompleted = activeHabits.filter(h =>
      allCompletions.some(c => c.habit_id === h.id && isSameDay(c.completed_date, today))
    ).length;

    const bestStreak = habitStats.reduce((max, s) => Math.max(max, s.longestStreak), 0);
    const avgWeekly = habitStats.length > 0
      ? Math.round(habitStats.reduce((sum, s) => sum + s.weeklyRate, 0) / habitStats.length)
      : 0;

    return { totalHabits, todayCompleted, bestStreak, avgWeekly };
  }, [activeHabits, allCompletions, habitStats, today]);

  // Last 28 days bar chart data (daily completion count)
  const dailyData = useMemo(() => {
    const days = getLastNDays(28);
    return days.map(date => {
      const count = activeHabits.filter(h =>
        allCompletions.some(c => c.habit_id === h.id && isSameDay(c.completed_date, date))
      ).length;
      return { date, count };
    });
  }, [activeHabits, allCompletions]);

  const maxDaily = Math.max(...dailyData.map(d => d.count), 1);

  // Category breakdown
  const categoryBreakdown = useMemo(() => {
    return HABIT_CATEGORIES.map(cat => {
      const catHabits = activeHabits.filter(h => h.category === cat.value);
      return { label: cat.label, count: catHabits.length };
    }).filter(c => c.count > 0);
  }, [activeHabits]);

  if (activeHabits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No stats yet</h3>
        <p className="text-gray-500 dark:text-gray-400 max-w-xs">
          Create some habits and start tracking to see your statistics here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {loadingAll && (
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">Loading full history...</div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Active Habits" value={globalStats.totalHabits} />
        <StatCard label="Done Today" value={`${globalStats.todayCompleted}/${globalStats.totalHabits}`} />
        <StatCard label="Best Streak" value={`${globalStats.bestStreak}d`} />
        <StatCard label="Avg Week" value={`${globalStats.avgWeekly}%`} />
      </div>

      {/* 28-day chart */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Last 28 Days</h3>
        <div className="flex items-end gap-[3px] h-32">
          {dailyData.map((d, i) => {
            const pct = (d.count / maxDaily) * 100;
            const isToday = i === dailyData.length - 1;
            return (
              <div
                key={i}
                className="flex-1 flex flex-col items-center justify-end"
                title={`${toDateString(d.date)}: ${d.count}/${activeHabits.length}`}
              >
                <div
                  className={`w-full rounded-sm transition-all ${
                    isToday
                      ? 'bg-indigo-600 dark:bg-indigo-500'
                      : d.count > 0
                      ? 'bg-indigo-400 dark:bg-indigo-600'
                      : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                  style={{ height: `${Math.max(pct, 4)}%` }}
                />
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-2 text-[10px] text-gray-400">
          <span>{toDateString(dailyData[0].date)}</span>
          <span>Today</span>
        </div>
      </div>

      {/* Per-habit table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Per-Habit Breakdown</h3>
        <div className="space-y-3">
          {habitStats
            .sort((a, b) => b.weeklyRate - a.weeklyRate)
            .map(({ habit, streak, longestStreak, weeklyRate, totalDays }) => (
              <div key={habit.id} className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full bg-${habit.color}-500 flex-shrink-0`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{habit.name}</p>
                  <div className="flex gap-3 text-xs text-gray-500 dark:text-gray-400">
                    <span>Streak: {streak}d</span>
                    <span>Best: {longestStreak}d</span>
                    <span>Total: {totalDays}d</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{weeklyRate}%</span>
                  <p className="text-[10px] text-gray-400">this week</p>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Category breakdown */}
      {categoryBreakdown.length > 1 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">By Category</h3>
          <div className="space-y-2">
            {categoryBreakdown.map(cat => (
              <div key={cat.label} className="flex items-center gap-3">
                <span className="text-sm text-gray-700 dark:text-gray-300 w-24 flex-shrink-0">{cat.label}</span>
                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-indigo-500 h-2 rounded-full transition-all"
                    style={{ width: `${(cat.count / activeHabits.length) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400 w-8 text-right">{cat.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-center">
      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{label}</p>
    </div>
  );
}
