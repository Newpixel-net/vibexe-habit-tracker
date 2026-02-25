/**
 * HabitInsights — per-habit analytics with completion rate chart, streaks, trends.
 */

import React, { useMemo, useState } from 'react';
import { Habit, HabitCompletion } from '../types';
import { getToday, isSameDay, normalizeDate, getLastNDays, toDateString } from '../utils/date';
import { calculateStreak, calculateLongestStreak, getWeeklyCompletionRate, getTotalCompletions } from '../utils/streaks';

interface HabitInsightsProps {
  habits: Habit[];
  completions: HabitCompletion[];
}

export function HabitInsights({ habits, completions }: HabitInsightsProps) {
  const activeHabits = useMemo(() => habits.filter(h => !h.archived), [habits]);
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);

  const selectedHabit = selectedHabitId
    ? activeHabits.find(h => h.id === selectedHabitId) || activeHabits[0]
    : activeHabits[0];

  const hCompletions = useMemo(
    () => (selectedHabit ? completions.filter(c => c.habit_id === selectedHabit.id) : []),
    [completions, selectedHabit]
  );

  const stats = useMemo(() => {
    if (!selectedHabit) return null;
    const streak = calculateStreak(hCompletions);
    const longestStreak = calculateLongestStreak(hCompletions);
    const weeklyRate = getWeeklyCompletionRate(hCompletions);
    const totalDays = getTotalCompletions(hCompletions);
    const monthlyRate = getWeeklyCompletionRate(hCompletions, 30);

    return { streak, longestStreak, weeklyRate, monthlyRate, totalDays };
  }, [selectedHabit, hCompletions]);

  // 30-day completion chart
  const chartData = useMemo(() => {
    if (!selectedHabit) return [];
    const days = getLastNDays(30);
    return days.map(d => ({
      date: d,
      label: d.getUTCDate().toString(),
      completed: hCompletions.some(c => isSameDay(c.completed_date, d)),
    }));
  }, [selectedHabit, hCompletions]);

  // Weekly averages for trend (last 8 weeks)
  const weeklyTrend = useMemo(() => {
    if (!selectedHabit) return [];
    const today = getToday();
    const weeks: { weekLabel: string; rate: number }[] = [];
    for (let w = 7; w >= 0; w--) {
      let count = 0;
      for (let d = 0; d < 7; d++) {
        const date = new Date(today);
        date.setUTCDate(date.getUTCDate() - (w * 7 + d));
        if (hCompletions.some(c => isSameDay(c.completed_date, date))) count++;
      }
      const startDate = new Date(today);
      startDate.setUTCDate(startDate.getUTCDate() - (w * 7 + 6));
      weeks.push({
        weekLabel: `W${8 - w}`,
        rate: Math.round((count / 7) * 100),
      });
    }
    return weeks;
  }, [selectedHabit, hCompletions]);

  if (activeHabits.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500 dark:text-gray-400">
        <p className="text-lg font-semibold mb-2">No insights yet</p>
        <p className="text-sm">Create habits and track them to see analytics.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Habit Selector */}
      <div className="flex flex-wrap gap-2">
        {activeHabits.map(h => (
          <button
            key={h.id}
            onClick={() => setSelectedHabitId(h.id)}
            className={`
              px-3 py-1.5 rounded-full text-sm font-medium transition-all
              ${selectedHabit?.id === h.id
                ? 'text-white shadow-md scale-105'
                : 'glass-card text-gray-700 dark:text-gray-300 hover:scale-105'}
            `}
            style={selectedHabit?.id === h.id ? { background: 'var(--accent-gradient)' } : {}}
          >
            {h.name}
          </button>
        ))}
      </div>

      {selectedHabit && stats && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <InsightCard label="Current Streak" value={`${stats.streak}d`} />
            <InsightCard label="Best Streak" value={`${stats.longestStreak}d`} />
            <InsightCard label="This Week" value={`${stats.weeklyRate}%`} />
            <InsightCard label="This Month" value={`${stats.monthlyRate}%`} />
          </div>

          {/* 30-Day Completion Grid */}
          <div className="glass-card rounded-2xl p-4 sm:p-6">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Last 30 Days</h4>
            <div className="flex gap-[3px] flex-wrap">
              {chartData.map((d, i) => (
                <div
                  key={i}
                  className={`w-[28px] h-[28px] sm:w-[32px] sm:h-[32px] rounded-md flex items-center justify-center text-[10px] font-medium transition-all ${
                    d.completed
                      ? `bg-${selectedHabit.color}-500 text-white`
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600'
                  }`}
                  title={toDateString(d.date)}
                >
                  {d.label}
                </div>
              ))}
            </div>
          </div>

          {/* Weekly Trend Line */}
          <div className="glass-card rounded-2xl p-4 sm:p-6">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Weekly Trend</h4>
            <div className="flex items-end gap-2 h-32">
              {weeklyTrend.map((w, i) => (
                <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1">
                  <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">{w.rate}%</span>
                  <div
                    className={`w-full rounded-t-md transition-all duration-500 ${
                      i !== weeklyTrend.length - 1 ? 'bg-gray-300 dark:bg-gray-600' : ''
                    }`}
                    style={{
                      height: `${Math.max(w.rate, 4)}%`,
                      ...(i === weeklyTrend.length - 1 ? { background: 'var(--accent-gradient)' } : {}),
                    }}
                  />
                  <span className="text-[9px] text-gray-400">{w.weekLabel}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            Total: <strong className="text-gray-700 dark:text-gray-200">{stats.totalDays} days</strong> completed
          </div>
        </>
      )}
    </div>
  );
}

function InsightCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-card rounded-xl p-4 text-center">
      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{label}</p>
    </div>
  );
}
