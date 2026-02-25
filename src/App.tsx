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
import { ProgressRing } from './components/ProgressRing';
import { HabitTemplates } from './components/HabitTemplates';
import { getToday, isSameDay } from './utils/date';
import { exportHabitsToCSV } from './utils/export';
import { Habit, HabitCompletion, HabitColor, HabitCategory, AppPage } from './types';
import { calculateStreak } from './utils/streaks';

type SortOption = 'newest' | 'name' | 'streak' | 'category';

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
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [searchQuery, setSearchQuery] = useState('');

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

  // Filter by category + search, then sort
  const filteredHabits = useMemo(() => {
    let result = activeHabits;

    // Category filter
    if (categoryFilter !== 'all') {
      result = result.filter(h => (h.category || 'other') === categoryFilter);
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(h => h.name.toLowerCase().includes(q));
    }

    // Sort
    const sorted = [...result];
    switch (sortBy) {
      case 'name':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'streak': {
        const streakOf = (h: Habit) => calculateStreak(completions.filter(c => c.habit_id === h.id));
        sorted.sort((a, b) => streakOf(b) - streakOf(a));
        break;
      }
      case 'category':
        sorted.sort((a, b) => (a.category || 'other').localeCompare(b.category || 'other'));
        break;
      case 'newest':
      default:
        // Already sorted by created_at desc from the API
        break;
    }

    return sorted;
  }, [activeHabits, categoryFilter, searchQuery, sortBy, completions]);

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

  // Streak milestones to celebrate
  const MILESTONES = [7, 14, 21, 30, 50, 75, 100, 150, 200, 365];

  const handleToggle = useCallback(async (habitId: string) => {
    const wasCompleted = isCompleted(habitId, today);
    await toggleCompletion(habitId, today);

    // Check streak milestones only when marking complete (not unchecking)
    if (!wasCompleted) {
      // After toggle, recalculate streak from updated completions
      // We use a short delay to let state settle from optimistic update
      setTimeout(() => {
        const habit = habits.find(h => h.id === habitId);
        if (!habit) return;
        const hCompletions = completions.filter(c => c.habit_id === habitId);
        // The completion we just added won't be in the completions array yet (optimistic),
        // so add 1 to account for it if streak was continuing
        const streak = calculateStreak(hCompletions);
        // streak includes today's completion from the optimistic update
        if (MILESTONES.includes(streak)) {
          addToast('success', `${streak}-day streak on "${habit.name}"! Keep going!`);
        }
      }, 100);
    }
  }, [toggleCompletion, today, isCompleted, habits, completions, addToast]);

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

            <HabitTemplates onSelect={handleAddHabit} />

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

            {/* Search + Sort Toolbar */}
            {activeHabits.length > 2 && (
              <div className="mb-4 flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search habits..."
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="newest">Sort: Newest</option>
                  <option value="name">Sort: Name</option>
                  <option value="streak">Sort: Streak</option>
                  <option value="category">Sort: Category</option>
                </select>
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

            {/* Footer Stats with Progress Ring */}
            {activeHabits.length > 0 && (
              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                  <ProgressRing completed={todayCompletionsCount} total={activeHabits.length} />
                  <div className="flex flex-col gap-1">
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

const globalAnimations = `
@keyframes slide-up {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes scale-in {
  from { opacity: 0; transform: scale(0.92); }
  to { opacity: 1; transform: scale(1); }
}
@keyframes bounce-once {
  0%, 100% { transform: scale(1); }
  30% { transform: scale(1.35); }
  60% { transform: scale(0.9); }
  80% { transform: scale(1.05); }
}
@keyframes completion-flash {
  0% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4); }
  50% { box-shadow: 0 0 0 6px rgba(99, 102, 241, 0); }
  100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0); }
}
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
.animate-slide-up { animation: slide-up 0.3s ease-out; }
.animate-scale-in { animation: scale-in 0.2s ease-out; }
.animate-bounce-once { animation: bounce-once 0.5s ease-out; }
.animate-completion-flash { animation: completion-flash 0.6s ease-out; }
.animate-fade-in { animation: fade-in 0.3s ease-out; }
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
`;

export default function App() {
  return (
    <>
      <style>{globalAnimations}</style>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </>
  );
}
