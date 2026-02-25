/**
 * ProgressRing — circular SVG progress indicator for daily completion ratio
 */

import React from 'react';

interface ProgressRingProps {
  completed: number;
  total: number;
  size?: number;
}

export function ProgressRing({ completed, total, size = 56 }: ProgressRingProps) {
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = total > 0 ? completed / total : 0;
  const offset = circumference - ratio * circumference;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  const colorClass =
    ratio >= 1
      ? 'text-green-500'
      : ratio >= 0.5
      ? 'text-indigo-500'
      : ratio > 0
      ? 'text-amber-500'
      : 'text-gray-300 dark:text-gray-600';

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-200 dark:text-gray-700"
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`${colorClass} transition-all duration-500 ease-out`}
        />
      </svg>
      <span className="absolute text-xs font-bold text-gray-700 dark:text-gray-300">
        {pct}%
      </span>
    </div>
  );
}
