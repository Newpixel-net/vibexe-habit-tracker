/**
 * HabitEditModal — edit habit name, color, and category
 * Supports Escape key to close, auto-focuses name input.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Habit, HabitColor, HabitCategory, HABIT_COLORS, HABIT_CATEGORIES } from '../types';

interface HabitEditModalProps {
  habit: Habit;
  open: boolean;
  onSave: (updates: { name: string; color: HabitColor; category: HabitCategory }) => Promise<void>;
  onClose: () => void;
}

export function HabitEditModal({ habit, open, onSave, onClose }: HabitEditModalProps) {
  const [name, setName] = useState(habit.name);
  const [color, setColor] = useState<HabitColor>(habit.color);
  const [category, setCategory] = useState<HabitCategory>(habit.category || 'other');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset form state when the modal reopens or habit changes
  useEffect(() => {
    if (open) {
      setName(habit.name);
      setColor(habit.color);
      setCategory(habit.category || 'other');
      setError(null);
      setSaving(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open, habit]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, saving, onClose]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Name is required');
      return;
    }
    if (trimmed.length > 50) {
      setError('Name must be 50 characters or less');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onSave({ name: trimmed, color, category });
      onClose();
    } catch {
      setError('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="edit-title">
      <div className="fixed inset-0 bg-black/40 dark:bg-black/60 animate-fade-in" onClick={onClose} />

      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6 animate-scale-in">
        <h3 id="edit-title" className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Edit Habit</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
            <input
              ref={inputRef}
              id="edit-name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={50}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Color</label>
            <div className="flex gap-2" role="radiogroup" aria-label="Habit color">
              {HABIT_COLORS.map(({ name: cn, bgClass }) => (
                <button
                  key={cn}
                  type="button"
                  onClick={() => setColor(cn)}
                  className={`w-8 h-8 rounded-full ${bgClass} transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 ${
                    color === cn ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''
                  }`}
                  role="radio"
                  aria-checked={color === cn}
                  aria-label={`Select ${cn}`}
                />
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <label htmlFor="edit-category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
            <select
              id="edit-category"
              value={category}
              onChange={e => setCategory(e.target.value as HabitCategory)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {HABIT_CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          {error && <p className="text-sm text-red-600 dark:text-red-400" role="alert">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
