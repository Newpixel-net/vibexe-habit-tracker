/**
 * FocusMode — distraction-free view showing only uncompleted habits with a focus timer.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Habit, HabitCompletion } from '../types';
import { getToday, isSameDay } from '../utils/date';

interface FocusModeProps {
  habits: Habit[];
  completions: HabitCompletion[];
  onToggle: (habitId: string) => Promise<void>;
  onExit: () => void;
}

export function FocusMode({ habits, completions, onToggle, onExit }: FocusModeProps) {
  const today = getToday();
  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const uncompleted = habits
    .filter(h => !h.archived)
    .filter(h => !completions.some(c => c.habit_id === h.id && isSameDay(c.completed_date, today)));

  const completed = habits
    .filter(h => !h.archived)
    .filter(h => completions.some(c => c.habit_id === h.id && isSameDay(c.completed_date, today)));

  const total = habits.filter(h => !h.archived).length;
  const allDone = uncompleted.length === 0 && total > 0;

  // Timer
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRunning]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const handleToggle = useCallback(async (habitId: string) => {
    setTogglingId(habitId);
    try {
      await onToggle(habitId);
    } finally {
      setTogglingId(null);
    }
  }, [onToggle]);

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-8">
      {/* Timer */}
      <div className="text-center mb-8">
        <div className="text-5xl sm:text-7xl font-mono font-bold text-gray-900 dark:text-gray-100 tracking-wider">
          {formatTime(elapsed)}
        </div>
        <div className="flex items-center justify-center gap-3 mt-3">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className="text-sm px-4 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            {isRunning ? 'Pause' : 'Resume'}
          </button>
          <button
            onClick={() => { setElapsed(0); setIsRunning(true); }}
            className="text-sm px-4 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Progress */}
      <div className="text-center mb-8">
        <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
          {completed.length} of {total} completed
        </p>
        <div className="w-64 mx-auto mt-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${total > 0 ? (completed.length / total) * 100 : 0}%`,
              background: 'var(--accent-gradient)',
            }}
          />
        </div>
      </div>

      {allDone ? (
        <div className="text-center animate-scale-in">
          <div className="text-6xl mb-4">&#127881;</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">All Done!</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            You completed all {total} habits in {formatTime(elapsed)}
          </p>
          <button
            onClick={onExit}
            className="mt-6 px-6 py-2.5 rounded-xl font-semibold text-white transition-all hover:opacity-90"
            style={{ background: 'var(--accent-gradient)' }}
          >
            Back to Habits
          </button>
        </div>
      ) : (
        <div className="w-full max-w-md space-y-3">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 text-center mb-4">
            {uncompleted.length} remaining — focus on one at a time
          </p>
          {uncompleted.map((habit, i) => (
            <button
              key={habit.id}
              onClick={() => handleToggle(habit.id)}
              disabled={togglingId !== null}
              className={`
                w-full glass-card rounded-xl p-4 flex items-center gap-4 text-left
                transition-all duration-200
                hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]
                ${i === 0 ? 'ring-2 ring-offset-2 dark:ring-offset-gray-900' : 'opacity-70'}
                ${togglingId === habit.id ? 'opacity-50' : ''}
              `}
              style={i === 0 ? { '--tw-ring-color': 'rgb(99 102 241 / 0.5)' } as any : {}}
            >
              <div className={`w-8 h-8 rounded-full bg-${habit.color}-500 flex items-center justify-center flex-shrink-0`}>
                {togglingId === habit.id ? (
                  <svg className="w-4 h-4 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className="font-semibold text-gray-900 dark:text-gray-100">{habit.name}</span>
            </button>
          ))}
        </div>
      )}

      {!allDone && (
        <button
          onClick={onExit}
          className="mt-8 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
        >
          Exit Focus Mode
        </button>
      )}
    </div>
  );
}
