/**
 * Notification utilities for the Habit Tracker
 * Added via Claude Code — simulating external development
 */

export interface Notification {
  id: string;
  type: "streak" | "reminder" | "achievement";
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
}

/**
 * Generate a streak notification when user hits a milestone
 */
export function createStreakNotification(
  habitName: string,
  streakDays: number
): Notification {
  const milestones = [7, 14, 30, 60, 90, 180, 365];
  const isMilestone = milestones.includes(streakDays);

  return {
    id: `streak-${Date.now()}`,
    type: "streak",
    title: isMilestone
      ? `Milestone reached!`
      : `Keep it up!`,
    message: isMilestone
      ? `You've maintained "${habitName}" for ${streakDays} days straight!`
      : `${streakDays} day streak on "${habitName}". Keep going!`,
    read: false,
    createdAt: new Date(),
  };
}

/**
 * Generate a daily reminder notification
 */
export function createReminderNotification(
  pendingHabits: string[]
): Notification {
  return {
    id: `reminder-${Date.now()}`,
    type: "reminder",
    title: "Daily check-in",
    message:
      pendingHabits.length === 1
        ? `Don't forget to complete "${pendingHabits[0]}" today!`
        : `You have ${pendingHabits.length} habits left to complete today.`,
    read: false,
    createdAt: new Date(),
  };
}
