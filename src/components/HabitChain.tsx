/**
 * HabitChain — "Don't Break the Chain" visual chain/link display.
 * Shows a horizontal chain of links growing for each consecutive day.
 */

import React, { useMemo } from 'react';
import { HabitCompletion } from '../types';
import { calculateStreak } from '../utils/streaks';
import { getToday, isSameDay } from '../utils/date';

interface HabitChainProps {
  completions: HabitCompletion[];
  color: string;
  maxDisplay?: number;
}

export function HabitChain({ completions, color, maxDisplay = 14 }: HabitChainProps) {
  const streak = calculateStreak(completions);
  const today = getToday();

  const chainDays = useMemo(() => {
    const days: { date: Date; completed: boolean; inStreak: boolean }[] = [];
    for (let i = maxDisplay - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setUTCDate(d.getUTCDate() - i);
      const completed = completions.some(c => isSameDay(c.completed_date, d));
      days.push({ date: d, completed, inStreak: false });
    }

    // Mark chain links from today backward
    let chainActive = true;
    for (let i = days.length - 1; i >= 0; i--) {
      if (chainActive && days[i].completed) {
        days[i].inStreak = true;
      } else if (i === days.length - 1 && !days[i].completed) {
        // Today not completed, check if yesterday was
        chainActive = true;
        continue;
      } else {
        chainActive = false;
      }
    }

    return days;
  }, [completions, today, maxDisplay]);

  if (streak === 0) return null;

  const colorMap: Record<string, string> = {
    blue: '#3b82f6',
    green: '#22c55e',
    purple: '#a855f7',
    orange: '#f97316',
    pink: '#ec4899',
  };
  const chainColor = colorMap[color] || colorMap.blue;

  return (
    <div className="flex items-center gap-0.5 overflow-hidden">
      {chainDays.map((d, i) => (
        <div key={i} className="flex items-center">
          {/* Chain link */}
          <div
            className={`
              w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center
              transition-all duration-300
              ${d.inStreak
                ? 'scale-110'
                : d.completed
                ? 'opacity-40'
                : 'opacity-20'}
            `}
            style={{
              borderColor: d.completed ? chainColor : 'transparent',
              backgroundColor: d.inStreak ? chainColor : 'transparent',
            }}
            title={d.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          >
            {d.inStreak && (
              <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          {/* Chain connector */}
          {i < chainDays.length - 1 && d.inStreak && chainDays[i + 1]?.inStreak && (
            <div className="w-1 h-0.5 rounded-full" style={{ backgroundColor: chainColor, opacity: 0.5 }} />
          )}
        </div>
      ))}
      {streak > 0 && (
        <span className="ml-1.5 text-xs font-bold" style={{ color: chainColor }}>
          {streak}d
        </span>
      )}
    </div>
  );
}
