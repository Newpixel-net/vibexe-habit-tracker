/**
 * Habit Tracker App — Main application component
 * Integrates all features: heatmap, focus mode, insights, journal,
 * chains, confetti, weekly report, onboarding, drag & drop, FAB.
 */

import React, { useState, useCallback, useMemo, useRef } from 'react';
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
import { HeatmapCalendar } from './components/HeatmapCalendar';
import { FocusMode } from './components/FocusMode';
import { HabitInsights } from './components/HabitInsights';
import { DailyJournal } from './components/DailyJournal';
import { HabitChain } from './components/HabitChain';
import { Confetti } from './components/Confetti';
import { WeeklyReport } from './components/WeeklyReport';
import { OnboardingTour } from './components/OnboardingTour';
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
  const [showConfetti, setShowConfetti] = useState(false);
  const [showFAB, setShowFAB] = useState(false);

  // Drag & Drop state
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [habitOrder, setHabitOrder] = useState<string[]>([]);
  const orderInitialized = useRef(false);

  const today = useMemo(() => getToday(), []);

  // Split habits into active and archived
  const activeHabits = useMemo(() => habits.filter(h => !h.archived), [habits]);
  const archivedHabits = useMemo(() => habits.filter(h => h.archived), [habits]);

  // Initialize drag order when habits load
  useMemo(() => {
    if (activeHabits.length > 0 && !orderInitialized.current) {
      setHabitOrder(activeHabits.map(h => h.id));
      orderInitialized.current = true;
    }
  }, [activeHabits]);

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
        // Apply custom drag order if available
        if (habitOrder.length > 0) {
          sorted.sort((a, b) => {
            const ai = habitOrder.indexOf(a.id);
            const bi = habitOrder.indexOf(b.id);
            if (ai === -1 && bi === -1) return 0;
            if (ai === -1) return 1;
            if (bi === -1) return -1;
            return ai - bi;
          });
        }
        break;
    }

    return sorted;
  }, [activeHabits, categoryFilter, searchQuery, sortBy, completions, habitOrder]);

  // Today's completion count
  const todayCompletionsCount = useMemo(() => {
    if (!activeHabits.length) return 0;
    const habitIds = new Set(activeHabits.map(h => h.id));
    return completions.filter(c =>
      habitIds.has(c.habit_id) && isSameDay(c.completed_date, today)
    ).length;
  }, [completions, activeHabits, today]);

  const handleAddHabit = useCallback(async (name: string, color: HabitColor, category: HabitCategory) => {
    const newHabit = await createHabit(name, color, category);
    addToast('success', `"${name}" added`);
    // Add to drag order
    setHabitOrder(prev => [newHabit.id, ...prev]);
  }, [createHabit, addToast]);

  // Streak milestones to celebrate
  const MILESTONES = [7, 14, 21, 30, 50, 75, 100, 150, 200, 365];

  const handleToggle = useCallback(async (habitId: string) => {
    const wasCompleted = isCompleted(habitId, today);
    await toggleCompletion(habitId, today);

    if (!wasCompleted) {
      setTimeout(() => {
        const habit = habits.find(h => h.id === habitId);
        if (!habit) return;

        // Streak milestone check
        const hCompletions = completions.filter(c => c.habit_id === habitId);
        const streak = calculateStreak(hCompletions);
        if (MILESTONES.includes(streak)) {
          addToast('success', `${streak}-day streak on "${habit.name}"! Keep going!`);
          setShowConfetti(true);
        }

        // All-done celebration
        const otherCompleted = activeHabits.every(h => {
          if (h.id === habitId) return true;
          return completions.some(c => c.habit_id === h.id && isSameDay(c.completed_date, today));
        });
        if (otherCompleted && activeHabits.length > 1) {
          addToast('success', 'All habits done for today! Amazing work!');
          setShowConfetti(true);
        }
      }, 100);
    }
  }, [toggleCompletion, today, isCompleted, habits, completions, addToast, activeHabits]);

  const handleEdit = useCallback(async (id: string, updates: { name?: string; color?: HabitColor; category?: HabitCategory }) => {
    await updateHabit(id, updates);
    addToast('success', 'Habit updated');
  }, [updateHabit, addToast]);

  const handleArchive = useCallback(async (id: string) => {
    const h = habits.find(h => h.id === id);
    await archiveHabit(id);
    addToast('info', `"${h?.name}" archived`);
    setHabitOrder(prev => prev.filter(hid => hid !== id));
  }, [archiveHabit, habits, addToast]);

  const handleUnarchive = useCallback(async (id: string) => {
    await unarchiveHabit(id);
    addToast('success', 'Habit restored');
    setHabitOrder(prev => [id, ...prev]);
  }, [unarchiveHabit, addToast]);

  const handleDelete = useCallback(async (id: string) => {
    await deleteHabit(id);
    addToast('success', 'Habit deleted');
    setHabitOrder(prev => prev.filter(hid => hid !== id));
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

  // Drag & Drop handlers
  const handleDragStart = useCallback((index: number) => {
    setDragIndex(index);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  }, []);

  const handleDragEnd = useCallback(() => {
    if (dragIndex !== null && dragOverIndex !== null && dragIndex !== dragOverIndex) {
      const newOrder = [...habitOrder];
      // Find actual IDs from filtered list
      const draggedId = filteredHabits[dragIndex]?.id;
      const targetId = filteredHabits[dragOverIndex]?.id;
      if (draggedId && targetId) {
        const fromIdx = newOrder.indexOf(draggedId);
        const toIdx = newOrder.indexOf(targetId);
        if (fromIdx !== -1 && toIdx !== -1) {
          newOrder.splice(fromIdx, 1);
          newOrder.splice(toIdx, 0, draggedId);
          setHabitOrder(newOrder);
        }
      }
    }
    setDragIndex(null);
    setDragOverIndex(null);
  }, [dragIndex, dragOverIndex, habitOrder, filteredHabits]);

  // Focus mode toggle handler
  const handleFocusToggle = useCallback(async (habitId: string) => {
    await handleToggle(habitId);
  }, [handleToggle]);

  const isLoading = habitsLoading || completionsLoading;
  const error = habitsError || completionsError;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <Header
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        onExport={handleExport}
      />

      {/* Confetti overlay */}
      {showConfetti && <Confetti onComplete={() => setShowConfetti(false)} />}

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Heatmap page */}
        {currentPage === 'heatmap' && (
          <div className="animate-fade-in">
            <HeatmapCalendar habits={activeHabits} completions={completions} />
          </div>
        )}

        {/* Focus page */}
        {currentPage === 'focus' && (
          <div className="animate-fade-in">
            <FocusMode
              habits={habits}
              completions={completions}
              onToggle={handleFocusToggle}
              onExit={() => setCurrentPage('habits')}
            />
          </div>
        )}

        {/* Insights page */}
        {currentPage === 'insights' && (
          <div className="animate-fade-in">
            <HabitInsights habits={activeHabits} completions={completions} />
          </div>
        )}

        {/* Report page */}
        {currentPage === 'report' && (
          <div className="animate-fade-in">
            <WeeklyReport habits={habits} completions={completions} />
          </div>
        )}

        {/* Stats page */}
        {currentPage === 'stats' && (
          <div className="animate-fade-in">
            <StatsPage
              habits={habits}
              completions={completions}
              getAllCompletions={getAllCompletions}
            />
          </div>
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
              <div className="mb-6 p-4 bg-red-50/80 dark:bg-red-900/20 border border-red-200/60 dark:border-red-800/40 rounded-xl backdrop-blur-sm">
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
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200/60 dark:border-gray-700/60 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
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
                  className="px-3 py-2 text-sm rounded-lg border border-gray-200/60 dark:border-gray-700/60 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="newest">Sort: Custom</option>
                  <option value="name">Sort: Name</option>
                  <option value="streak">Sort: Streak</option>
                  <option value="category">Sort: Category</option>
                </select>
              </div>
            )}

            {/* Loading State — skeleton cards */}
            {isLoading && habits.length === 0 && (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="glass-card rounded-xl p-5 animate-pulse">
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

            {/* Habits List with Drag & Drop */}
            {!isLoading && filteredHabits.length === 0 && activeHabits.length === 0 ? (
              <EmptyState />
            ) : !isLoading && filteredHabits.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                No habits in this category.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredHabits.map((habit, index) => (
                  <div
                    key={habit.id}
                    draggable={sortBy === 'newest'}
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`transition-all duration-200 ${
                      dragIndex === index ? 'opacity-50 scale-95' : ''
                    } ${
                      dragOverIndex === index && dragIndex !== index ? 'border-t-2 border-indigo-400' : ''
                    } ${sortBy === 'newest' ? 'cursor-grab active:cursor-grabbing' : ''}`}
                  >
                    <HabitItem
                      habit={habit}
                      completions={getHabitCompletions(habit.id)}
                      isCompletedToday={isCompleted(habit.id, today)}
                      onToggle={() => handleToggle(habit.id)}
                      onToggleDay={(date) => toggleCompletion(habit.id, date)}
                      onEdit={(updates) => handleEdit(habit.id, updates)}
                      onArchive={() => handleArchive(habit.id)}
                      onDelete={() => handleDelete(habit.id)}
                    />
                    {/* Habit chain shown below each habit */}
                    <div className="mt-1 px-2">
                      <HabitChain completions={getHabitCompletions(habit.id)} color={habit.color} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Daily Journal */}
            {activeHabits.length > 0 && (
              <div className="mt-8">
                <DailyJournal />
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
              <div className="mt-8 pt-6 border-t border-gray-200/60 dark:border-gray-700/60">
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

      {/* Floating Action Button — quick-add (habits page only) */}
      {currentPage === 'habits' && activeHabits.length > 0 && (
        <button
          onClick={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white transition-all hover:scale-110 hover:shadow-xl active:scale-95 z-20 animate-scale-in"
          style={{ background: 'var(--accent-gradient)' }}
          aria-label="Scroll to add habit"
          title="Add a new habit"
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      )}

      {/* Onboarding tour */}
      <OnboardingTour />

      <ToastContainer />
    </div>
  );
}

function AppContent() {
  const { isAuthenticated, loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors">
        <div className="text-center animate-fade-in">
          <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'var(--accent-gradient)' }}>
            <div className="w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">Loading...</p>
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
/* ── Keyframes ─────────────────────────────── */
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
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

/* ── Utility Classes ──────────────────────── */
.animate-slide-up { animation: slide-up 0.3s ease-out; }
.animate-scale-in { animation: scale-in 0.2s ease-out; }
.animate-bounce-once { animation: bounce-once 0.5s ease-out; }
.animate-completion-flash { animation: completion-flash 0.6s ease-out; }
.animate-fade-in { animation: fade-in 0.3s ease-out; }
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }

/* ── Glassmorphism Cards ──────────────────── */
.glass-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(229, 231, 235, 0.6);
  transition: all 0.2s ease;
}
.dark .glass-card {
  background: rgba(31, 41, 55, 0.7);
  border-color: rgba(55, 65, 81, 0.6);
}
.glass-card:hover {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
}
.dark .glass-card:hover {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

/* ── Glass Header ─────────────────────────── */
.glass-header {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}
.dark .glass-header {
  background: rgba(17, 24, 39, 0.8);
}

/* ── Accent Gradient text ─────────────────── */
.gradient-text {
  background: var(--accent-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
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
