/**
 * Completions hook
 * Manages habit completion tracking with real-time updates.
 * Fetches a rolling 90-day window for performance.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import app from '../sdk';
import { HabitCompletion } from '../types';
import { toISODate, isSameDay } from '../utils/date';

interface UseCompletionsReturn {
  completions: HabitCompletion[];
  loading: boolean;
  error: string | null;
  toggleCompletion: (habitId: string, date: Date) => Promise<void>;
  isCompleted: (habitId: string, date: Date) => boolean;
  getHabitCompletions: (habitId: string) => HabitCompletion[];
  getAllCompletions: () => Promise<HabitCompletion[]>;
  refetch: () => Promise<void>;
}

export function useCompletions(userId: string | null): UseCompletionsReturn {
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const optimisticIds = useRef<Map<string, string>>(new Map()); // tempId -> real habit_id

  const fetchCompletions = useCallback(async () => {
    if (!userId) {
      setCompletions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch 90-day window for main view
      const since = new Date();
      since.setUTCDate(since.getUTCDate() - 90);
      since.setUTCHours(0, 0, 0, 0);

      const result = await app.data.list('habit_completions', {
        filter: {
          user_id: userId,
          completed_date: { gte: since.toISOString() },
        },
        sort: 'completed_date',
        order: 'desc',
        limit: 5000,
      });

      setCompletions(result.data as unknown as HabitCompletion[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load completions');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchCompletions();
  }, [fetchCompletions]);

  // Real-time subscription — skip events we originated locally
  useEffect(() => {
    if (!userId) return;

    const unsubscribe = app.data.subscribe('habit_completions', { filter: { user_id: userId } }, (event) => {
      const record = event.record as unknown as HabitCompletion;

      if (event.action === 'created') {
        // Check if we already have this (from optimistic create)
        setCompletions(prev => {
          if (prev.some(c => c.id === record.id)) return prev;
          // Also skip if there's an optimistic temp entry for same habit+date
          const hasTempForThis = prev.some(
            c => c.id.startsWith('temp-') && c.habit_id === record.habit_id && c.completed_date === record.completed_date
          );
          if (hasTempForThis) return prev;
          return [record, ...prev];
        });
      } else if (event.action === 'deleted') {
        setCompletions(prev => prev.filter(c => c.id !== record.id));
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

  // Fetch ALL completions (no date window) — used by stats/export
  const getAllCompletions = useCallback(async (): Promise<HabitCompletion[]> => {
    if (!userId) return [];

    const all: HabitCompletion[] = [];
    let page = 1;
    const limit = 200;

    while (true) {
      const result = await app.data.list('habit_completions', {
        filter: { user_id: userId },
        sort: 'completed_date',
        order: 'desc',
        page,
        limit,
      });

      const data = result.data as unknown as HabitCompletion[];
      all.push(...data);

      if (!result.pagination || page >= result.pagination.totalPages) break;
      page++;
    }

    return all;
  }, [userId]);

  const toggleCompletion = useCallback(async (habitId: string, date: Date): Promise<void> => {
    if (!userId) throw new Error('User not authenticated');

    const existing = completions.find(c =>
      c.habit_id === habitId && isSameDay(c.completed_date, date)
    );

    const dateKey = toISODate(date);

    if (existing) {
      setCompletions(prev => prev.filter(c => c.id !== existing.id));

      try {
        await app.data.delete('habit_completions', existing.id);
      } catch (err) {
        await fetchCompletions();
        throw err instanceof Error ? err : new Error('Failed to toggle completion');
      }
    } else {
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const optimistic: HabitCompletion = {
        id: tempId,
        habit_id: habitId,
        completed_date: dateKey,
        user_id: userId,
        created_at: new Date().toISOString(),
      };

      setCompletions(prev => [optimistic, ...prev]);

      try {
        const result = await app.data.create('habit_completions', {
          habit_id: habitId,
          completed_date: dateKey,
          user_id: userId,
        });

        const real = result as unknown as HabitCompletion;
        setCompletions(prev =>
          prev.map(c => c.id === tempId ? real : c)
        );
      } catch (err) {
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
    getAllCompletions,
    refetch: fetchCompletions,
  };
}
