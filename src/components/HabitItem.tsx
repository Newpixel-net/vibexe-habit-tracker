/**
 * Habit Item Component
 * Displays a single habit with toggle, streak, week grid, edit, archive, delete.
 */

import React, { useState } from 'react';
import { Habit, HabitCompletion, HabitColor, HabitCategory, HABIT_CATEGORIES } from '../types';
import { WeekGrid } from './WeekGrid';
import { HabitEditModal } from './HabitEditModal';
import { ConfirmDialog } from './ConfirmDialog';
import { calculateStreak } from '../utils/streaks';

interface HabitItemProps {
  habit: Habit;
  completions: HabitCompletion[];
  isCompletedToday: boolean;
  onToggle: () => Promise<void>;
  onEdit: (updates: { name?: string; color?: HabitColor; category?: HabitCategory }) => Promise<void>;
  onArchive: () => Promise<void>;
  onDelete: () => Promise<void>;
}

export function HabitItem({ habit, completions, isCompletedToday, onToggle, onEdit, onArchive, onDelete }: HabitItemProps) {
  const [isToggling, setIsToggling] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const streak = calculateStreak(completions);

  const categoryLabel = HABIT_CATEGORIES.find(c => c.value === habit.category)?.label || '';

  const getColorClasses = (colorName: string) => {
    const colorMap: Record<string, { border: string; bg: string; ring: string }> = {
      blue: { border: 'border-blue-500', bg: 'bg-blue-500', ring: 'ring-blue-200' },
      green: { border: 'border-green-500', bg: 'bg-green-500', ring: 'ring-green-200' },
      purple: { border: 'border-purple-500', bg: 'bg-purple-500', ring: 'ring-purple-200' },
      orange: { border: 'border-orange-500', bg: 'bg-orange-500', ring: 'ring-orange-200' },
      pink: { border: 'border-pink-500', bg: 'bg-pink-500', ring: 'ring-pink-200' },
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

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete();
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-5 transition-colors">
        <div className="flex items-start justify-between gap-4">
          {/* Left: Toggle and Name */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <button
              onClick={handleToggle}
              disabled={isToggling}
              className={`
                flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 flex items-center justify-center
                transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${colors.ring}
                ${isCompletedToday
                  ? `${colors.border} ${colors.bg} text-white`
                  : 'border-gray-300 dark:border-gray-500 hover:border-gray-400 bg-white dark:bg-gray-700'}
                ${isToggling ? 'opacity-70' : ''}
              `}
              aria-label={`Mark ${habit.name} as ${isCompletedToday ? 'incomplete' : 'complete'} for today`}
            >
              {isCompletedToday && (
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>

            <div className="flex-1 min-w-0">
              <h3 className={`font-semibold text-gray-900 dark:text-gray-100 text-base sm:text-lg truncate ${isCompletedToday ? 'line-through opacity-60' : ''}`}>
                {habit.name}
              </h3>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {streak > 0 && (
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-amber-500">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                    </svg>
                    <span>{streak}d</span>
                  </span>
                )}
                {categoryLabel && categoryLabel !== 'Other' && (
                  <>
                    {streak > 0 && <span className="text-gray-300 dark:text-gray-600">·</span>}
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                      {categoryLabel}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right: Week Grid + Menu */}
          <div className="flex flex-col items-end gap-2">
            <WeekGrid completions={completions} color={habit.color} />

            {/* 3-dot menu */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="Habit options"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>

              {showMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-20">
                    <button
                      onClick={() => { setShowMenu(false); setShowEditModal(true); }}
                      className="w-full text-left px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => { setShowMenu(false); onArchive(); }}
                      className="w-full text-left px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Archive
                    </button>
                    <button
                      onClick={() => { setShowMenu(false); setShowDeleteConfirm(true); }}
                      className="w-full text-left px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <HabitEditModal
        habit={habit}
        open={showEditModal}
        onSave={(updates) => onEdit(updates)}
        onClose={() => setShowEditModal(false)}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete habit"
        message={`Are you sure you want to permanently delete "${habit.name}"? This will also remove all completion history for this habit.`}
        confirmLabel="Delete"
        variant="danger"
        loading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  );
}
