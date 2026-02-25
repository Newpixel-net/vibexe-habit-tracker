/**
 * CategoryFilter — horizontal scrollable category chips
 */

import React from 'react';
import { HabitCategory, HABIT_CATEGORIES } from '../types';

interface CategoryFilterProps {
  selected: HabitCategory | 'all';
  onChange: (category: HabitCategory | 'all') => void;
  counts: Record<string, number>;
}

export function CategoryFilter({ selected, onChange, counts }: CategoryFilterProps) {
  const totalCount = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      <button
        onClick={() => onChange('all')}
        className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
          selected === 'all'
            ? 'bg-indigo-600 text-white'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
        }`}
      >
        All ({totalCount})
      </button>
      {HABIT_CATEGORIES.filter(cat => (counts[cat.value] || 0) > 0).map(cat => (
        <button
          key={cat.value}
          onClick={() => onChange(cat.value)}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            selected === cat.value
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          {cat.label} ({counts[cat.value]})
        </button>
      ))}
    </div>
  );
}
