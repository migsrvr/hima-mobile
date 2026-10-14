/** Day of week, JavaScript numbering: 0 = Sunday … 6 = Saturday. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const WEEKDAY_NAMES: Record<Weekday, string> = {
  0: 'Sunday',
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
};

export const WEEKDAY_SHORT: Record<Weekday, string> = {
  0: 'Sun',
  1: 'Mon',
  2: 'Tue',
  3: 'Wed',
  4: 'Thu',
  5: 'Fri',
  6: 'Sat',
};

/** The seven days in order, starting from `weekStartsOn`. */
export function orderedWeek(weekStartsOn: Weekday): Weekday[] {
  return Array.from({ length: 7 }, (_, i) => ((weekStartsOn + i) % 7) as Weekday);
}

/** Class hours in minutes after midnight (8:00 AM = 480). */
export type ClassHours = { start: number; end: number };
