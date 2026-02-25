/**
 * DailyJournal — a small note field per day saved to localStorage.
 * We use localStorage since the data model doesn't have a notes entity.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { getToday, toDateString, formatDate } from '../utils/date';

const JOURNAL_KEY = 'habit-tracker-journal';

function loadJournal(): Record<string, string> {
  try {
    const raw = localStorage.getItem(JOURNAL_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveJournal(data: Record<string, string>) {
  try {
    localStorage.setItem(JOURNAL_KEY, JSON.stringify(data));
  } catch {}
}

export function DailyJournal() {
  const today = getToday();
  const todayStr = toDateString(today);
  const [journal, setJournal] = useState<Record<string, string>>({});
  const [text, setText] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    const data = loadJournal();
    setJournal(data);
    setText(data[todayStr] || '');
  }, [todayStr]);

  const handleSave = useCallback(() => {
    const updated = { ...journal, [todayStr]: text };
    if (!text.trim()) delete updated[todayStr];
    setJournal(updated);
    saveJournal(updated);
  }, [journal, todayStr, text]);

  // Auto-save on blur
  const handleBlur = () => handleSave();

  // Recent entries (last 7 that have content)
  const recentEntries = Object.entries(journal)
    .filter(([k, v]) => k !== todayStr && v.trim())
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 7);

  return (
    <div className="glass-card rounded-2xl p-4 sm:p-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Daily Journal
        </h3>
        <span className="text-xs text-gray-400 dark:text-gray-500">{formatDate(today)}</span>
      </div>

      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        onBlur={handleBlur}
        placeholder="How was your day? Any reflections on your habits..."
        rows={3}
        className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200/60 dark:border-gray-700/60 bg-white/50 dark:bg-gray-900/50 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent resize-none transition-all"
      />

      {recentEntries.length > 0 && (
        <div className="mt-3">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors flex items-center gap-1"
          >
            <svg className={`w-3 h-3 transition-transform ${showHistory ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            Previous entries ({recentEntries.length})
          </button>

          {showHistory && (
            <div className="mt-2 space-y-2">
              {recentEntries.map(([date, entry]) => (
                <div key={date} className="bg-gray-50/80 dark:bg-gray-800/80 rounded-lg p-3">
                  <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500 mb-1">
                    {formatDate(date)}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{entry}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
