/**
 * Habit Tracker App
 * Main application component
 */

import React, { useState, useCallback, useMemo } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { useHabits } from './hooks/useHabits';
import { useCompletions } from './hooks/useCompletions';
import { Header } from './components/Header';
import { LoginPage } from './components/LoginPage';
import { HabitForm } from './components/HabitForm';
import { HabitItem } from './components/HabitItem';
import { EmptyState } from './components/EmptyState';
import { DailyQuote } from './components/DailyQuote';
import { getToday } from './utils/date';
import { HabitColor } from './types';

function HabitTrackerContent() {
  const { user, isAuthenticated } = useAuth();
  const { habits, loading: habitsLoading, error: habitsError, createHabit, deleteHabit } = useHabits(user?.id || null);
  const { completions, loading: completionsLoading, error: completionsError, toggleCompletion, isCompleted, getHabitCompletions } = useCompletions(user?.id || null);
  const [deletingHabitId, setDeletingHabitId] = useState<string | null>(null);

  const today = useMemo(() => getToday(), []);

  const handleAddHabit = useCallback(async (name: string, color: HabitColor) => {
    await createHabit(name, color);
  }, [createHabit]);

  const handleToggleCompletion = useCallback(async (habitId: string, date: Date) => {
    await toggleCompletion(habitId, date);
  }, [toggleCompletion]);

  const handleDeleteHabit = useCallback(async (id: string) => {
    setDeletingHabitId(id);
    try {
      await deleteHabit(id);
    } finally {
      setDeletingHabitId(null);
    }
  }, [deleteHabit]);

  const isLoading = habitsLoading || completionsLoading;
  const error = habitsError || completionsError;

  // Get today's completion count
  const todayCompletionsCount = useMemo(() => {
    if (!habits.length) return 0;
    const habitIdSet = new Set(habits.map(h => h.id));
    return completions.filter(c => habitIdSet.has(c.habit_id)).length;
  }, [completions, habits]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Daily Quote */}
        <DailyQuote />

        {/* Add Habit Form */}
        <div className="mb-8">
          <HabitForm onSubmit={handleAddHabit} disabled={isLoading} />
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <p className="text-sm font-medium text-red-800">Something went wrong</p>
                <p className="text-sm text-red-600 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && habits.length === 0 && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
                <div className="flex items-start gap-4">
                  <div className="w-7 h-7 bg-gray-200 rounded-full" />
                  <div className="flex-1 space-y-3">
                    <div className="h-5 bg-gray-200 rounded w-1/3" />
                    <div className="h-4 bg-gray-200 rounded w-1/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Habits List */}
        {!isLoading && habits.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-4">
            {habits.map((habit) => (
              <HabitItem
                key={habit.id}
                habit={habit}
                completions={getHabitCompletions(habit.id)}
                isCompletedToday={isCompleted(habit.id, today)}
                onToggle={() => handleToggleCompletion(habit.id, today)}
                onDelete={() => handleDeleteHabit(habit.id)}
              />
            ))}
          </div>
        )}

        {/* Footer Stats */}
        {habits.length > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-indigo-500 rounded-full" />
                <span>{habits.length} habit{habits.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full" />
                <span>{todayCompletionsCount} completion{todayCompletionsCount !== 1 ? 's' : ''} today</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function AppContent() {
  const { isAuthenticated, loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <HabitTrackerContent />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
