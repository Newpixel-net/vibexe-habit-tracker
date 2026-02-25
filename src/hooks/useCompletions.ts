/**
 * Completions hook
 * Manages habit completion tracking with real-time updates
 */

import { useState, useEffect, useCallback } from 'react';
import { VibexeApp } from '@vibexe/sdk';
import { HabitCompletion } from '../types';
import { toISODate, isSameDay, normalizeDate } from '../utils/date';

const app = new VibexeApp({ appId: 'bldr_fcjZ7dIk2Ahq3xsZbHJhW' });

interface UseCompletionsReturn {
  completions: HabitCompletion[];
  loading: boolean;
  error: string | null;
  toggleCompletion: (habitId: string, date: Date) => Promise<void>;
  isCompleted: (habitId: string, date: Date) => boolean;
  getHabitCompletions: (habitId: string) => HabitCompletion[];
  refetch: () => Promise<void>;
}

export function useCompletions(userId: string | null): UseCompletionsReturn {
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCompletions = useCallback(async () => {
    if (!userId) {
      setCompletions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const result = await app.data.list('habit_completions', {
        filter: { user_id: userId },
        sort: 'completed_date',
        order: 'desc',
      });
      
      setCompletions(result.data as unknown as HabitCompletion[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load completions');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Initial fetch
  useEffect(() => {
    fetchCompletions();
  }, [fetchCompletions]);

  // Real-time subscription
  useEffect(() => {
    if (!userId) return;

    const unsubscribe = app.data.subscribe('habit_completions', { filter: { user_id: userId } }, (event) => {
      if (event.action === 'created') {
        setCompletions(prev => [event.record as unknown as HabitCompletion, ...prev]);
      } else if (event.action === 'deleted') {
        setCompletions(prev => prev.filter(c => c.id !== (event.record as { id: string }).id));
      }
    });

    return unsubscribe;
  }, [userId]);

  const isCompleted = useCallback((habitId: string, date: Date): boolean => {
    return completions.some(c => 
      c.habit_id === habitId && isSameDay(c.completed_date, date)
    );
  }, [completions]);

  const getHabitCompletions = useCallback((habitId: string): HabitCompletion[] => {
    return completions.filter(c => c.habit_id === habitId);
  }, [completions]);

  const toggleCompletion = useCallback(async (habitId: string, date: Date): Promise<void> => {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const existing = completions.find(c => 
      c.habit_id === habitId && isSameDay(c.completed_date, date)
    );

    const dateKey = toISODate(date);

    if (existing) {
      // Remove completion (optimistic)
      setCompletions(prev => prev.filter(c => c.id !== existing.id));
      
      try {
        await app.data.delete('habit_completions', existing.id);
      } catch (err) {
        // Revert on error
        await fetchCompletions();
        throw err instanceof Error ? err : new Error('Failed to toggle completion');
      }
    } else {
      // Add completion (optimistic)
      const optimisticCompletion: HabitCompletion = {
        id: `temp-${Date.now()}`,
        habit_id: habitId,
        completed_date: dateKey,
        user_id: userId,
        created_at: new Date().toISOString(),
      };
      
      setCompletions(prev => [optimisticCompletion, ...prev]);
      
      try {
        const result = await app.data.create('habit_completions', {
          habit_id: habitId,
          completed_date: dateKey,
          user_id: userId,
        });

        // Replace optimistic with real
        setCompletions(prev => 
          prev.map(c => c.id === optimisticCompletion.id ? result as unknown as HabitCompletion : c)
        );
      } catch (err) {
        // Revert on error
        await fetchCompletions();
        throw err instanceof Error ? err : new Error('Failed to toggle completion');
      }
    }
  }, [userId, completions, fetchCompletions]);

  return {
    completions,
    loading,
    error,
    toggleCompletion,
    isCompleted,
    getHabitCompletions,
    refetch: fetchCompletions,
  };
}
