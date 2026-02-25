/**
 * Habit Form Component
 * Input for adding new habits
 */

import React, { useState } from 'react';
import { HabitColor, HABIT_COLORS, DEFAULT_HABIT_COLOR } from '../types';

interface HabitFormProps {
  onSubmit: (name: string, color: HabitColor) => Promise<void>;
  disabled?: boolean;
}

export function HabitForm({ onSubmit, disabled }: HabitFormProps) {
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState<HabitColor>(DEFAULT_HABIT_COLOR);
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
      await onSubmit(trimmedName, selectedColor);
      setName('');
      setSelectedColor(DEFAULT_HABIT_COLOR);
    } catch {
      setError('Failed to add habit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
      <div className="flex flex-col gap-4">
        <div className="flex-1">
          <label htmlFor="habit-name" className="block text-sm font-medium text-gray-700 mb-1.5">
            New Habit
          </label>
          <input
            id="habit-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Drink 8 glasses of water"
            disabled={disabled || isSubmitting}
            maxLength={50}
            className={`
              w-full px-4 py-2.5 rounded-lg border border-gray-300
              focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
              transition-colors placeholder:text-gray-400
              ${disabled || isSubmitting ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
            `}
          />
          {error && (
            <p className="mt-1.5 text-sm text-red-600">{error}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Color
          </label>
          <div className="flex gap-2">
            {HABIT_COLORS.map(({ name: colorName, bgClass }) => (
              <button
                key={colorName}
                type="button"
                onClick={() => setSelectedColor(colorName)}
                disabled={disabled || isSubmitting}
                className={`
                  w-8 h-8 rounded-full ${bgClass} transition-all
                  hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400
                  ${selectedColor === colorName ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''}
                  ${disabled || isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                aria-label={`Select ${colorName} color`}
              />
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={disabled || isSubmitting || !name.trim()}
          className={`
            w-full sm:w-auto px-6 py-2.5 rounded-lg font-medium
            text-white bg-indigo-600 hover:bg-indigo-700
            focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
            transition-all flex items-center justify-center gap-2
            ${disabled || isSubmitting || !name.trim() ? 'opacity-50 cursor-not-allowed' : ''}
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
