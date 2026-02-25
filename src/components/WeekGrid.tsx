/**
 * Week Grid Component
 * Displays 7-day completion history for a habit
 */

import React from 'react';
import { WeekDay } from '../types';
import { getLast7Days, isDateCompleted } from '../utils/date';
import { HabitCompletion } from '../types';

interface WeekGridProps {
  completions: HabitCompletion[];
  color: string;
}

export function WeekGrid({ completions, color }: WeekGridProps) {
  const days = getLast7Days();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const weekDays: WeekDay[] = days.map(date => ({
    date,
    isCompleted: isDateCompleted(completions, date),
    isToday: date.getTime() === today.getTime(),
    dayLabel: date.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0),
  }));

  const getColorClasses = (isCompleted: boolean, colorName: string) => {
    if (!isCompleted) {
      return 'bg-gray-100 text-gray-400';
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

  return (
    <div className="flex items-center gap-1">
      {weekDays.map((day, index) => (
        <div key={index} className="flex flex-col items-center">
          <span className="text-[10px] text-gray-400 mb-1 font-medium">
            {day.dayLabel}
          </span>
          <div
            className={`
              w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold
              transition-all duration-200
              ${getColorClasses(day.isCompleted, color)}
              ${day.isToday ? 'ring-2 ring-offset-1 ring-gray-300' : ''}
            `}
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
          </div>
        </div>
      ))}
    </div>
  );
}
