/**
 * Habits hook
 * Manages habit CRUD operations with real-time updates.
 * Supports categories, archiving, and editing.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import app from '../sdk';
import { Habit, HabitColor, HabitCategory, DEFAULT_HABIT_COLOR, DEFAULT_CATEGORY } from '../types';

interface UseHabitsReturn {
  habits: Habit[];
  loading: boolean;
  error: string | null;
  createHabit: (name: string, color?: HabitColor, category?: HabitCategory) => Promise<Habit>;
  updateHabit: (id: string, updates: { name?: string; color?: HabitColor; category?: HabitCategory }) => Promise<void>;
  archiveHabit: (id: string) => Promise<void>;
  unarchiveHabit: (id: string) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useHabits(userId: string | null): UseHabitsReturn {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Track IDs we've just created locally to avoid SSE duplicates
  const recentlyCreatedIds = useRef<Set<string>>(new Set());

  const fetchHabits = useCallback(async () => {
    if (!userId) {
      setHabits([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await app.data.list('habits', {
        filter: { user_id: userId },
        sort: 'created_at',
        order: 'desc',
        limit: 200,
      });

      setHabits(result.data as unknown as Habit[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load habits');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchHabits();
  }, [fetchHabits]);

  // Real-time subscription — only handles events from OTHER clients/tabs.
  // Local mutations apply state directly; we skip SSE events for IDs we just created.
  useEffect(() => {
    if (!userId) return;

    const unsubscribe = app.data.subscribe('habits', { filter: { user_id: userId } }, (event) => {
      const record = event.record as unknown as Habit;

      if (event.action === 'created') {
        if (recentlyCreatedIds.current.has(record.id)) {
          recentlyCreatedIds.current.delete(record.id);
          return; // skip — we already added this locally
        }
        setHabits(prev => {
          if (prev.some(h => h.id === record.id)) return prev;
          return [record, ...prev];
        });
      } else if (event.action === 'updated') {
        setHabits(prev => prev.map(h => h.id === record.id ? record : h));
      } else if (event.action === 'deleted') {
        setHabits(prev => prev.filter(h => h.id !== record.id));
      }
    });

    return unsubscribe;
  }, [userId]);

  const createHabit = useCallback(async (name: string, color?: HabitColor, category?: HabitCategory): Promise<Habit> => {
    if (!userId) throw new Error('User not authenticated');

    const result = await app.data.create('habits', {
      name: name.trim(),
      color: color || DEFAULT_HABIT_COLOR,
      category: category || DEFAULT_CATEGORY,
      archived: false,
      user_id: userId,
    });

    const newHabit = result as unknown as Habit;
    recentlyCreatedIds.current.add(newHabit.id);
    setHabits(prev => [newHabit, ...prev]);
    return newHabit;
  }, [userId]);

  const updateHabit = useCallback(async (id: string, updates: { name?: string; color?: HabitColor; category?: HabitCategory }): Promise<void> => {
    if (!userId) throw new Error('User not authenticated');

    const prev = habits.find(h => h.id === id);
    if (!prev) return;

    // Optimistic update
    setHabits(list => list.map(h => h.id === id ? { ...h, ...updates } : h));

    try {
      await app.data.update('habits', id, updates);
    } catch (err) {
      // Revert
      setHabits(list => list.map(h => h.id === id ? prev : h));
      throw err instanceof Error ? err : new Error('Failed to update habit');
    }
  }, [userId, habits]);

  const archiveHabit = useCallback(async (id: string): Promise<void> => {
    if (!userId) throw new Error('User not authenticated');

    setHabits(list => list.map(h => h.id === id ? { ...h, archived: true } : h));

    try {
      await app.data.update('habits', id, { archived: true });
    } catch (err) {
      setHabits(list => list.map(h => h.id === id ? { ...h, archived: false } : h));
      throw err instanceof Error ? err : new Error('Failed to archive habit');
    }
  }, [userId]);

  const unarchiveHabit = useCallback(async (id: string): Promise<void> => {
    if (!userId) throw new Error('User not authenticated');

    setHabits(list => list.map(h => h.id === id ? { ...h, archived: false } : h));

    try {
      await app.data.update('habits', id, { archived: false });
    } catch (err) {
      setHabits(list => list.map(h => h.id === id ? { ...h, archived: true } : h));
      throw err instanceof Error ? err : new Error('Failed to unarchive habit');
    }
  }, [userId]);

  const deleteHabit = useCallback(async (id: string): Promise<void> => {
    if (!userId) throw new Error('User not authenticated');

    const snapshot = habits;
    setHabits(prev => prev.filter(h => h.id !== id));

    try {
      await app.data.delete('habits', id);
    } catch (err) {
      setHabits(snapshot);
      throw err instanceof Error ? err : new Error('Failed to delete habit');
    }
  }, [userId, habits]);

  return {
    habits,
    loading,
    error,
    createHabit,
    updateHabit,
    archiveHabit,
    unarchiveHabit,
    deleteHabit,
    refetch: fetchHabits,
  };
}
