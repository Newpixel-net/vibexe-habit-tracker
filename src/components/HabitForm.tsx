/**
 * Habit Form Component
 * Input for adding new habits with color and category
 */

import React, { useState } from 'react';
import { HabitColor, HabitCategory, HABIT_COLORS, HABIT_CATEGORIES, DEFAULT_HABIT_COLOR, DEFAULT_CATEGORY } from '../types';

interface HabitFormProps {
  onSubmit: (name: string, color: HabitColor, category: HabitCategory) => Promise<void>;
  disabled?: boolean;
}

export function HabitForm({ onSubmit, disabled }: HabitFormProps) {
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState<HabitColor>(DEFAULT_HABIT_COLOR);
  const [selectedCategory, setSelectedCategory] = useState<HabitCategory>(DEFAULT_CATEGORY);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError('Please enter a habit name');
      return;
    }

    if (trimmedName.length > 50) {
      setError('Habit name must be 50 characters or less');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await onSubmit(trimmedName, selectedColor, selectedCategory);
      setName('');
      setSelectedColor(DEFAULT_HABIT_COLOR);
      setSelectedCategory(DEFAULT_CATEGORY);
    } catch {
      setError('Failed to add habit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDisabled = disabled || isSubmitting;

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
      <div className="flex flex-col gap-4">
        <div className="flex-1">
          <label htmlFor="habit-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            New Habit
          </label>
          <input
            id="habit-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Drink 8 glasses of water"
            disabled={isDisabled}
            maxLength={50}
            className={`
              w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600
              focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
              transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-500
              text-gray-900 dark:text-gray-100
              ${isDisabled ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : 'bg-white dark:bg-gray-700'}
            `}
          />
          {error && <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{error}</p>}
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Color</label>
            <div className="flex gap-2">
              {HABIT_COLORS.map(({ name: colorName, bgClass }) => (
                <button
                  key={colorName}
                  type="button"
                  onClick={() => setSelectedColor(colorName)}
                  disabled={isDisabled}
                  className={`
                    w-8 h-8 rounded-full ${bgClass} transition-all
                    hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400
                    ${selectedColor === colorName ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''}
                    ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                  aria-label={`Select ${colorName} color`}
                />
              ))}
            </div>
          </div>

          {/* Category */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as HabitCategory)}
              disabled={isDisabled}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            >
              {HABIT_CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={isDisabled || !name.trim()}
          className={`
            w-full sm:w-auto px-6 py-2.5 rounded-lg font-medium
            text-white bg-indigo-600 hover:bg-indigo-700
            focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
            transition-all flex items-center justify-center gap-2
            ${isDisabled || !name.trim() ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>Adding...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add Habit</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
