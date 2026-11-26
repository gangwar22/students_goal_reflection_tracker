// Date utility functions for Week boundaries (Monday-Sunday IST)
// Backfill window checks (48 hours), lock checks (Monday 23:59 IST)

/**
 * Get current date string in YYYY-MM-DD for a given timezone
 */
export function getTodayString(tz: string = "Asia/Kolkata"): string {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(now); // returns YYYY-MM-DD
}

/**
 * Returns Monday and Sunday of the week for a given date string or now (Monday-Sunday)
 */
export function getWeekBoundaries(dateStr?: string, tz: string = "Asia/Kolkata"): {
  weekStart: string; // YYYY-MM-DD Monday
  weekEnd: string;   // YYYY-MM-DD Sunday
  isLocked: boolean;
  hoursUntilLock: number;
} {
  const targetDate = dateStr ? new Date(dateStr + "T12:00:00Z") : new Date();
  
  // Get day of week in target timezone (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  const dayFormatter = new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short" });
  const dayName = dayFormatter.format(targetDate);
  const dayMap: Record<string, number> = {
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
    Sun: 7,
  };
  const currentDayIndex = dayMap[dayName] || 1; // 1-7, Mon=1, Sun=7

  // Distance to Monday: currentDayIndex - 1
  const monday = new Date(targetDate);
  monday.setDate(targetDate.getDate() - (currentDayIndex - 1));

  // Distance to Sunday: 7 - currentDayIndex
  const sunday = new Date(targetDate);
  sunday.setDate(targetDate.getDate() + (7 - currentDayIndex));

  const formatToYMD = (d: Date) => {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d);
  };

  const weekStart = formatToYMD(monday);
  const weekEnd = formatToYMD(sunday);

  // Check lock status: locked if current time is after Monday 23:59:59 IST of this week
  // Create Monday 23:59:59 in target timezone
  const now = new Date();
  // Monday lock cutoff: Monday + 23h 59m 59s
  const mondayMidnight = new Date(`${weekStart}T23:59:59+05:30`);
  const isLocked = now.getTime() > mondayMidnight.getTime();
  const msUntilLock = mondayMidnight.getTime() - now.getTime();
  const hoursUntilLock = Math.max(0, Math.floor(msUntilLock / (1000 * 60 * 60)));

  return {
    weekStart,
    weekEnd,
    isLocked,
    hoursUntilLock,
  };
}

/**
 * Check if a date is within the allowable 48-hour backfill window
 */
export function isWithinBackfillWindow(goalDateStr: string, tz: string = "Asia/Kolkata"): {
  allowed: boolean;
  hoursAgo: number;
} {
  const todayStr = getTodayString(tz);
  if (goalDateStr === todayStr) {
    return { allowed: true, hoursAgo: 0 };
  }

  const goalDate = new Date(`${goalDateStr}T23:59:59+05:30`);
  const now = new Date();
  const diffMs = now.getTime() - goalDate.getTime();
  const hoursAgo = Math.floor(diffMs / (1000 * 60 * 60));

  // If goalDate is in the future, allow writing today's reflection
  if (diffMs < 0) {
    return { allowed: true, hoursAgo: 0 };
  }

  // Allowed if within 48 hours
  const allowed = hoursAgo <= 48;
  return { allowed, hoursAgo };
}

/**
 * According to PRD edge cases: "Week belongs to the month in which it ends"
 */
export function getMonthForWeek(weekEnd: string): string {
  // weekEnd is YYYY-MM-DD
  return weekEnd.substring(0, 7); // returns YYYY-MM
}

/**
 * Format date nicely for UI
 */
export function formatFriendlyDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

