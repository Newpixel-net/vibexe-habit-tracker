/**
 * Week Grid Component
 * Displays 7-day completion history for a habit.
 * Days are clickable to toggle completions (including past days).
 */

import React from 'react';
import { WeekDay } from '../types';
import { getLast7Days, getToday, isDateCompleted } from '../utils/date';
import { HabitCompletion } from '../types';

interface WeekGridProps {
  completions: HabitCompletion[];
  color: string;
  onToggleDay?: (date: Date) => void;
}

export function WeekGrid({ completions, color, onToggleDay }: WeekGridProps) {
  const days = getLast7Days();
  const today = getToday(); // UTC-normalized — matches all other date logic

  const weekDays: WeekDay[] = days.map(date => ({
    date,
    isCompleted: isDateCompleted(completions, date),
    isToday: date.getTime() === today.getTime(),
    dayLabel: date.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0),
  }));

  const getColorClasses = (isCompleted: boolean, colorName: string) => {
    if (!isCompleted) {
      return 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500';
    }

    const colorMap: Record<string, string> = {
      blue: 'bg-blue-500 text-white',
      green: 'bg-green-500 text-white',
      purple: 'bg-purple-500 text-white',
      orange: 'bg-orange-500 text-white',
      pink: 'bg-pink-500 text-white',
    };

    return colorMap[colorName] || colorMap.blue;
  };

  const hoverClasses = onToggleDay
    ? 'cursor-pointer hover:scale-110 hover:shadow-md active:scale-95'
    : '';

  return (
    <div className="flex items-center gap-1">
      {weekDays.map((day, index) => (
        <div key={index} className="flex flex-col items-center">
          <span className="text-[10px] text-gray-400 dark:text-gray-500 mb-1 font-medium">
            {day.dayLabel}
          </span>
          <button
            type="button"
            onClick={() => onToggleDay?.(day.date)}
            disabled={!onToggleDay}
            className={`
              w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold
              transition-all duration-200 focus:outline-none
              ${getColorClasses(day.isCompleted, color)}
              ${day.isToday ? 'ring-2 ring-offset-1 ring-gray-300 dark:ring-gray-500 dark:ring-offset-gray-800' : ''}
              ${hoverClasses}
              ${!onToggleDay ? 'cursor-default' : ''}
            `}
            title={`${day.date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}${day.isCompleted ? ' (completed)' : ''}`}
          >
            {day.isCompleted && (
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </button>
        </div>
      ))}
    </div>
  );
}
