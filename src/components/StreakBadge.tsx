import React from "react";

interface StreakBadgeProps {
  streakDays: number;
  size?: "sm" | "md" | "lg";
}

/**
 * StreakBadge — Shows streak count with fire emoji and milestone colors.
 * Added via Claude Code.
 */
export function StreakBadge({ streakDays, size = "md" }: StreakBadgeProps) {
  const sizeClasses = {
    sm: "text-xs px-1.5 py-0.5",
    md: "text-sm px-2 py-1",
    lg: "text-base px-3 py-1.5",
  };

  const getColor = (days: number) => {
    if (days >= 365) return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
    if (days >= 90) return "bg-purple-500/20 text-purple-300 border-purple-500/30";
    if (days >= 30) return "bg-blue-500/20 text-blue-300 border-blue-500/30";
    if (days >= 7) return "bg-green-500/20 text-green-300 border-green-500/30";
    return "bg-zinc-500/20 text-zinc-400 border-zinc-500/30";
  };

  if (streakDays === 0) return null;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-medium ${sizeClasses[size]} ${getColor(streakDays)}`}
    >
      <span>{streakDays >= 7 ? "🔥" : "✨"}</span>
      <span>{streakDays}d</span>
    </span>
  );
}
