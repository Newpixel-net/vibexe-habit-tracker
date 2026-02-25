/**
 * Habit Item Component
 * Displays a single habit with toggle, streak, and week grid
 */

import React, { useState } from 'react';
import { Habit, HabitCompletion } from '../types';
import { WeekGrid } from './WeekGrid';
import { calculateStreak } from '../utils/streaks';
import { getDayLabel, getToday } from '../utils/date';

interface HabitItemProps {
  habit: Habit;
  completions: HabitCompletion[];
  isCompletedToday: boolean;
  onToggle: () => Promise<void>;
  onDelete: () => Promise<void>;
}

export function HabitItem({ habit, completions, isCompletedToday, onToggle, onDelete }: HabitItemProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const streak = calculateStreak(completions);
  const today = getToday();

  const getColorClasses = (colorName: string) => {
    const colorMap: Record<string, { border: string; bg: string; text: string; ring: string }> = {
      blue: { border: 'border-blue-500', bg: 'bg-blue-500', text: 'text-blue-600', ring: 'ring-blue-200' },
      green: { border: 'border-green-500', bg: 'bg-green-500', text: 'text-green-600', ring: 'ring-green-200' },
      purple: { border: 'border-purple-500', bg: 'bg-purple-500', text: 'text-purple-600', ring: 'ring-purple-200' },
      orange: { border: 'border-orange-500', bg: 'bg-orange-500', text: 'text-orange-600', ring: 'ring-orange-200' },
      pink: { border: 'border-pink-500', bg: 'bg-pink-500', text: 'text-pink-600', ring: 'ring-pink-200' },
    };
    return colorMap[colorName] || colorMap.blue;
  };

  const colors = getColorClasses(habit.color);

  const handleToggle = async () => {
    if (isToggling) return;
    setIsToggling(true);
    try {
      await onToggle();
    } finally {
      setIsToggling(false);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete();
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        {/* Left: Toggle and Name */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Today's Toggle */}
          <button
            onClick={handleToggle}
            disabled={isToggling}
            className={`
              flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 flex items-center justify-center
              transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${colors.ring}
              ${isCompletedToday 
                ? `${colors.border} ${colors.bg} text-white` 
                : `border-gray-300 hover:border-gray-400 bg-white`}
              ${isToggling ? 'opacity-70' : ''}
            `}
            aria-label={`Mark ${habit.name} as ${isCompletedToday ? 'incomplete' : 'complete'} for today`}
          >
            {isCompletedToday && (
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </button>

          {/* Habit Name and Streak */}
          <div className="flex-1 min-w-0">
            <h3 className={`font-semibold text-gray-900 text-base sm:text-lg truncate ${isCompletedToday ? 'line-through opacity-60' : ''}`}>
              {habit.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center gap-1 text-sm font-medium text-amber-500">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{streak} day{streak !== 1 ? 's' : ''}</span>
              </span>
              <span className="text-gray-300">•</span>
              <span className="text-sm text-gray-500">
                Today
              </span>
            </div>
          </div>
        </div>

        {/* Right: Week Grid and Delete */}
        <div className="flex flex-col items-end gap-3">
          <WeekGrid completions={completions} color={habit.color} />
          
          {!showDeleteConfirm ? (
            <button
              onClick={handleDeleteClick}
              className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded hover:bg-red-50"
              aria-label={`Delete ${habit.name}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleCancelDelete}
                disabled={isDeleting}
                className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-3 py-1 text-xs font-medium text-white bg-red-500 rounded hover:bg-red-600 transition-colors flex items-center gap-1"
              >
                {isDeleting ? (
                  <>
                    <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete</span>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
