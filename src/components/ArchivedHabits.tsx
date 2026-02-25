/**
 * ArchivedHabits — collapsible list of archived habits with unarchive/delete
 */

import React, { useState } from 'react';
import { Habit } from '../types';
import { ConfirmDialog } from './ConfirmDialog';

interface ArchivedHabitsProps {
  habits: Habit[];
  onUnarchive: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function ArchivedHabits({ habits, onUnarchive, onDelete }: ArchivedHabitsProps) {
  const [expanded, setExpanded] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Habit | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  if (habits.length === 0) return null;

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await onDelete(deleteTarget.id);
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <>
      <div className="mt-8">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          <svg
            className={`w-4 h-4 transition-transform ${expanded ? 'rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          Archived ({habits.length})
        </button>

        {expanded && (
          <div className="mt-3 space-y-2">
            {habits.map(habit => (
              <div
                key={habit.id}
                className="flex items-center justify-between gap-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg px-4 py-3 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-3 h-3 rounded-full bg-${habit.color}-500 opacity-50 flex-shrink-0`} />
                  <span className="text-sm text-gray-500 dark:text-gray-400 truncate">{habit.name}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => onUnarchive(habit.id)}
                    className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
                  >
                    Restore
                  </button>
                  <button
                    onClick={() => setDeleteTarget(habit)}
                    className="text-xs font-medium text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete archived habit"
        message={`Permanently delete "${deleteTarget?.name}" and all its data?`}
        confirmLabel="Delete"
        variant="danger"
        loading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
