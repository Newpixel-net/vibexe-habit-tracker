/**
 * Habit Tracker App — Main application component
 */

import React, { useState, useCallback, useMemo } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ThemeProvider } from './hooks/useTheme';
import { ToastProvider, useToast } from './hooks/useToast';
import { useHabits } from './hooks/useHabits';
import { useCompletions } from './hooks/useCompletions';
import { Header } from './components/Header';
import { LoginPage } from './components/LoginPage';
import { HabitForm } from './components/HabitForm';
import { HabitItem } from './components/HabitItem';
import { EmptyState } from './components/EmptyState';
import { DailyQuote } from './components/DailyQuote';
import { CategoryFilter } from './components/CategoryFilter';
import { ArchivedHabits } from './components/ArchivedHabits';
import { StatsPage } from './components/StatsPage';
import { ToastContainer } from './components/ToastContainer';
import { getToday, isSameDay } from './utils/date';
import { exportHabitsToCSV } from './utils/export';
import { HabitColor, HabitCategory, AppPage } from './types';

function HabitTrackerContent() {
  const { user } = useAuth();
  const userId = user?.id || null;
  const {
    habits, loading: habitsLoading, error: habitsError,
    createHabit, updateHabit, archiveHabit, unarchiveHabit, deleteHabit,
  } = useHabits(userId);
  const {
    completions, loading: completionsLoading, error: completionsError,
    toggleCompletion, isCompleted, getHabitCompletions, getAllCompletions,
  } = useCompletions(userId);

  const { addToast } = useToast();
  const [currentPage, setCurrentPage] = useState<AppPage>('habits');
  const [categoryFilter, setCategoryFilter] = useState<HabitCategory | 'all'>('all');

  const today = useMemo(() => getToday(), []);

  // Split habits into active and archived
  const activeHabits = useMemo(() => habits.filter(h => !h.archived), [habits]);
  const archivedHabits = useMemo(() => habits.filter(h => h.archived), [habits]);

  // Category counts (active only)
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const h of activeHabits) {
      const cat = h.category || 'other';
      counts[cat] = (counts[cat] || 0) + 1;
    }
    return counts;
  }, [activeHabits]);

  // Filter by selected category
  const filteredHabits = useMemo(() => {
    if (categoryFilter === 'all') return activeHabits;
    return activeHabits.filter(h => (h.category || 'other') === categoryFilter);
  }, [activeHabits, categoryFilter]);

  // Today's completion count — BUG FIX: now filters by today's date
  const todayCompletionsCount = useMemo(() => {
    if (!activeHabits.length) return 0;
    const habitIds = new Set(activeHabits.map(h => h.id));
    return completions.filter(c =>
      habitIds.has(c.habit_id) && isSameDay(c.completed_date, today)
    ).length;
  }, [completions, activeHabits, today]);

  const handleAddHabit = useCallback(async (name: string, color: HabitColor, category: HabitCategory) => {
    await createHabit(name, color, category);
    addToast('success', `"${name}" added`);
  }, [createHabit, addToast]);

  const handleToggle = useCallback(async (habitId: string) => {
    await toggleCompletion(habitId, today);
  }, [toggleCompletion, today]);

  const handleEdit = useCallback(async (id: string, updates: { name?: string; color?: HabitColor; category?: HabitCategory }) => {
    await updateHabit(id, updates);
    addToast('success', 'Habit updated');
  }, [updateHabit, addToast]);

  const handleArchive = useCallback(async (id: string) => {
    const h = habits.find(h => h.id === id);
    await archiveHabit(id);
    addToast('info', `"${h?.name}" archived`);
  }, [archiveHabit, habits, addToast]);

  const handleUnarchive = useCallback(async (id: string) => {
    await unarchiveHabit(id);
    addToast('success', 'Habit restored');
  }, [unarchiveHabit, addToast]);

  const handleDelete = useCallback(async (id: string) => {
    await deleteHabit(id);
    addToast('success', 'Habit deleted');
  }, [deleteHabit, addToast]);

  const handleExport = useCallback(async () => {
    try {
      addToast('info', 'Preparing export...');
      const allCompletions = await getAllCompletions();
      exportHabitsToCSV(habits, allCompletions);
      addToast('success', 'Data exported successfully');
    } catch {
      addToast('error', 'Export failed');
    }
  }, [habits, getAllCompletions, addToast]);

  const isLoading = habitsLoading || completionsLoading;
  const error = habitsError || completionsError;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <Header
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        onExport={handleExport}
      />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Stats page */}
        {currentPage === 'stats' && (
          <StatsPage
            habits={habits}
            completions={completions}
            getAllCompletions={getAllCompletions}
          />
        )}

        {/* Habits page */}
        {currentPage === 'habits' && (
          <>
            <DailyQuote />

            <div className="mb-8">
              <HabitForm onSubmit={handleAddHabit} disabled={isLoading} />
            </div>

            {/* Error State */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-xl">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-red-800 dark:text-red-300">Something went wrong</p>
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Category Filter */}
            {activeHabits.length > 0 && Object.keys(categoryCounts).length > 1 && (
              <div className="mb-4">
                <CategoryFilter selected={categoryFilter} onChange={setCategoryFilter} counts={categoryCounts} />
              </div>
            )}

            {/* Loading State */}
            {isLoading && habits.length === 0 && (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 animate-pulse">
                    <div className="flex items-start gap-4">
                      <div className="w-7 h-7 bg-gray-200 dark:bg-gray-700 rounded-full" />
                      <div className="flex-1 space-y-3">
                        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Habits List */}
            {!isLoading && filteredHabits.length === 0 && activeHabits.length === 0 ? (
              <EmptyState />
            ) : !isLoading && filteredHabits.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                No habits in this category.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredHabits.map((habit) => (
                  <HabitItem
                    key={habit.id}
                    habit={habit}
                    completions={getHabitCompletions(habit.id)}
                    isCompletedToday={isCompleted(habit.id, today)}
                    onToggle={() => handleToggle(habit.id)}
                    onToggleDay={(date) => toggleCompletion(habit.id, date)}
                    onEdit={(updates) => handleEdit(habit.id, updates)}
                    onArchive={() => handleArchive(habit.id)}
                    onDelete={() => handleDelete(habit.id)}
                  />
                ))}
              </div>
            )}

            {/* Archived Habits */}
            <ArchivedHabits
              habits={archivedHabits}
              onUnarchive={handleUnarchive}
              onDelete={handleDelete}
            />

            {/* Footer Stats */}
            {activeHabits.length > 0 && (
              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full" />
                    <span>{activeHabits.length} habit{activeHabits.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full" />
                    <span>{todayCompletionsCount}/{activeHabits.length} today</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <ToastContainer />
    </div>
  );
}

function AppContent() {
  const { isAuthenticated, loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-200 dark:border-indigo-800 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
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
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
