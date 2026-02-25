/**
 * HabitTemplates — quick-add buttons for popular habits
 */

import React, { useState } from 'react';
import { HabitColor, HabitCategory } from '../types';

interface HabitTemplate {
  name: string;
  color: HabitColor;
  category: HabitCategory;
}

const TEMPLATES: HabitTemplate[] = [
  { name: 'Drink 8 glasses of water', color: 'blue', category: 'health' },
  { name: 'Exercise 30 minutes', color: 'green', category: 'fitness' },
  { name: 'Read for 20 minutes', color: 'purple', category: 'learning' },
  { name: 'Meditate 10 minutes', color: 'pink', category: 'mindfulness' },
  { name: 'No social media before noon', color: 'orange', category: 'productivity' },
  { name: 'Write in journal', color: 'purple', category: 'creativity' },
  { name: 'Walk 10,000 steps', color: 'green', category: 'fitness' },
  { name: 'Practice gratitude', color: 'pink', category: 'mindfulness' },
  { name: 'Learn something new', color: 'blue', category: 'learning' },
  { name: 'Save money (no impulse buys)', color: 'orange', category: 'finance' },
  { name: 'Get 8 hours of sleep', color: 'blue', category: 'health' },
  { name: 'Call a friend or family', color: 'pink', category: 'social' },
];

interface HabitTemplatesProps {
  onSelect: (name: string, color: HabitColor, category: HabitCategory) => Promise<void>;
}

export function HabitTemplates({ onSelect }: HabitTemplatesProps) {
  const [expanded, setExpanded] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);

  const handleAdd = async (tpl: HabitTemplate) => {
    if (adding) return;
    setAdding(tpl.name);
    try {
      await onSelect(tpl.name, tpl.color, tpl.category);
    } finally {
      setAdding(null);
    }
  };

  return (
    <div className="mb-6">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        Quick add from templates
        <svg
          className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="mt-3 flex flex-wrap gap-2">
          {TEMPLATES.map(tpl => {
            const isAdding = adding === tpl.name;
            return (
              <button
                key={tpl.name}
                onClick={() => handleAdd(tpl)}
                disabled={!!adding}
                className={`
                  inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
                  border border-gray-200 dark:border-gray-700
                  bg-white dark:bg-gray-800
                  text-gray-700 dark:text-gray-300
                  hover:bg-gray-50 dark:hover:bg-gray-750 hover:border-indigo-300 dark:hover:border-indigo-600
                  transition-colors
                  ${isAdding ? 'opacity-60' : ''}
                  ${adding && !isAdding ? 'opacity-40 cursor-not-allowed' : ''}
                `}
              >
                {isAdding ? (
                  <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                )}
                {tpl.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
