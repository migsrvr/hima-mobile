/**
 * Date and time text in the design's style. Formatting is manual (not Intl)
 * so output is identical on every device and in tests.
 */

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAYS_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** En dash with spaces, as used for time ranges ("8:00 AM – 3:00 PM"). */
export const RANGE_DASH = ' – ';

/** Minutes after midnight -> "8:00 AM". */
export function formatClock(minutes: number): string {
  const h24 = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${m.toString().padStart(2, '0')} ${h24 < 12 ? 'AM' : 'PM'}`;
}

/** Date -> "12:05 PM". */
export function formatTimeOfDay(date: Date): string {
  return formatClock(date.getHours() * 60 + date.getMinutes());
}

/** {start, end} minutes -> "8:00 AM – 3:00 PM". */
export function formatClassHours(hours: { start: number; end: number }): string {
  return `${formatClock(hours.start)}${RANGE_DASH}${formatClock(hours.end)}`;
}

/** "16 Oct". */
export function formatDayMonth(date: Date): string {
  return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]}`;
}

/** "Fri, 16 Oct". */
export function formatWeekdayDayMonth(date: Date): string {
  return `${DAYS_SHORT[date.getDay()]}, ${formatDayMonth(date)}`;
}

/** "Wednesday, 14 October". */
export function formatLongDate(date: Date): string {
  return `${DAYS_LONG[date.getDay()]}, ${date.getDate()} ${MONTHS_LONG[date.getMonth()]}`;
}

/** "Oct 12–18", or "Oct 29–Nov 4" across months. */
export function formatDateRange(start: Date, end: Date): string {
  const sm = MONTHS_SHORT[start.getMonth()];
  const em = MONTHS_SHORT[end.getMonth()];
  return sm === em
    ? `${sm} ${start.getDate()}–${end.getDate()}`
    : `${sm} ${start.getDate()}–${em} ${end.getDate()}`;
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Whole calendar days from `a` to `b` (positive when b is later). */
export function calendarDaysBetween(a: Date, b: Date): number {
  return Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / 86_400_000);
}

/**
 * Transaction time: "Today, 12:05 PM", "Tue, 4:35 PM" within the past week,
 * otherwise "12 Oct, 1:15 PM".
 */
export function formatActivityTime(date: Date, now: Date): string {
  const days = calendarDaysBetween(date, now);
  const time = formatTimeOfDay(date);
  if (days === 0) return `Today, ${time}`;
  if (days > 0 && days < 7) return `${DAYS_SHORT[date.getDay()]}, ${time}`;
  return `${formatDayMonth(date)}, ${time}`;
}

export const weekdayShort = (day: number) => DAYS_SHORT[day];
export const weekdayLong = (day: number) => DAYS_LONG[day];

/** "Wednesday, 14 Oct". */
export function formatWeekdayDayShortMonth(date: Date): string {
  return `${DAYS_LONG[date.getDay()]}, ${formatDayMonth(date)}`;
}

/** "Oct 12 – 18, 2026" or "Oct 29 – Nov 4, 2026" (week navigator). */
export function formatWeekRangeLong(start: Date, end: Date): string {
  const sm = MONTHS_SHORT[start.getMonth()];
  const em = MONTHS_SHORT[end.getMonth()];
  const tail = sm === em ? `${end.getDate()}` : `${em} ${end.getDate()}`;
  return `${sm} ${start.getDate()}${RANGE_DASH}${tail}, ${end.getFullYear()}`;
}

/** Day heading in transaction lists: "TODAY" or "TUE, 13 OCT". */
export function formatDayHeading(date: Date, now: Date): string {
  if (calendarDaysBetween(date, now) === 0) return 'TODAY';
  return `${DAYS_SHORT[date.getDay()]}, ${date.getDate()} ${MONTHS_SHORT[date.getMonth()]}`.toUpperCase();
}


/** "Sep 14" (chart labels). */
export function formatMonthDay(date: Date): string {
  return `${MONTHS_SHORT[date.getMonth()]} ${date.getDate()}`;
}

/** "Wed, 14 Oct 2026 · 12:06 PM" (receipts). */
export function formatReceiptDate(date: Date): string {
  return `${DAYS_SHORT[date.getDay()]}, ${formatDayMonth(date)} ${date.getFullYear()} · ${formatTimeOfDay(date)}`;
}

/** "just now", "1 min ago", "2 min ago", "1 hr ago". */
export function formatAgo(date: Date, now: Date): string {
  const minutes = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 60_000));
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours} hr ago`;
}
