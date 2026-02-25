/**
 * Daily Quote Component
 * Displays a motivational quote that changes daily
 */

import React from 'react';
import { getDailyQuote } from '../utils/quotes';

export function DailyQuote() {
  const quote = getDailyQuote();

  return (
    <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 rounded-xl p-4 sm:p-5 mb-6 border border-indigo-100">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
          <svg
            className="w-4 h-4 text-indigo-600"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-gray-800 text-sm sm:text-base leading-relaxed italic">
            &ldquo;{quote.text}&rdquo;
          </p>
          <p className="mt-2 text-xs sm:text-sm text-gray-500 font-medium">
            — {quote.author}
          </p>
        </div>
      </div>
    </div>
  );
}
