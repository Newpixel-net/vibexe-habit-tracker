/**
 * Habits hook
 * Manages habit CRUD operations with real-time updates
 */

import { useState, useEffect, useCallback } from 'react';
import { VibexeApp } from '@vibexe/sdk';
import { Habit, HabitColor, DEFAULT_HABIT_COLOR } from '../types';

const app = new VibexeApp({ appId: 'bldr_fcjZ7dIk2Ahq3xsZbHJhW' });

interface UseHabitsReturn {
  habits: Habit[];
  loading: boolean;
  error: string | null;
  createHabit: (name: string, color?: HabitColor) => Promise<Habit>;
  deleteHabit: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useHabits(userId: string | null): UseHabitsReturn {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      });
      
      setHabits(result.data as unknown as Habit[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load habits');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Initial fetch
  useEffect(() => {
    fetchHabits();
  }, [fetchHabits]);

  // Real-time subscription
  useEffect(() => {
    if (!userId) return;

    const unsubscribe = app.data.subscribe('habits', { filter: { user_id: userId } }, (event) => {
      if (event.action === 'created') {
        setHabits(prev => [event.record as unknown as Habit, ...prev]);
      } else if (event.action === 'updated') {
        setHabits(prev => 
          prev.map(h => h.id === (event.record as Habit).id ? event.record as Habit : h)
        );
      } else if (event.action === 'deleted') {
        setHabits(prev => prev.filter(h => h.id !== (event.record as { id: string }).id));
      }
    });

    return unsubscribe;
  }, [userId]);

  const createHabit = useCallback(async (name: string, color?: HabitColor): Promise<Habit> => {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    try {
      const habitColor = color || DEFAULT_HABIT_COLOR;
      
      const result = await app.data.create('habits', {
        name: name.trim(),
        color: habitColor,
        user_id: userId,
      });

      // Optimistically add to local state
      const newHabit = result as unknown as Habit;
      setHabits(prev => [newHabit, ...prev]);
      
      return newHabit;
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to create habit');
    }
  }, [userId]);

  const deleteHabit = useCallback(async (id: string): Promise<void> => {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    try {
      // Optimistically remove from local state
      setHabits(prev => prev.filter(h => h.id !== id));
      
      await app.data.delete('habits', id);
    } catch (err) {
      // Revert on error
      await fetchHabits();
      throw err instanceof Error ? err : new Error('Failed to delete habit');
    }
  }, [userId, fetchHabits]);

  return {
    habits,
    loading,
    error,
    createHabit,
    deleteHabit,
    refetch: fetchHabits,
  };
}
