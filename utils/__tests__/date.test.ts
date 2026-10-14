import {
  formatDayHeading,
  formatWeekRangeLong,
  formatWeekdayDayShortMonth,
  formatActivityTime,
  formatClassHours,
  formatClock,
  formatDateRange,
  formatDayMonth,
  formatLongDate,
  formatWeekdayDayMonth,
} from '../date';

// "Today" in the sample data: Wednesday 14 October 2026, 9:00 AM.
const NOW = new Date(2026, 9, 14, 9, 0);

describe('date formatting', () => {
  it('formats clock times', () => {
    expect(formatClock(8 * 60)).toBe('8:00 AM');
    expect(formatClock(15 * 60)).toBe('3:00 PM');
    expect(formatClock(12 * 60 + 5)).toBe('12:05 PM');
    expect(formatClock(0)).toBe('12:00 AM');
  });

  it('formats class hours with an en dash', () => {
    expect(formatClassHours({ start: 600, end: 1020 })).toBe('10:00 AM – 5:00 PM');
  });

  it('formats dates like the design', () => {
    expect(formatDayMonth(new Date(2026, 9, 16))).toBe('16 Oct');
    expect(formatWeekdayDayMonth(new Date(2026, 9, 16))).toBe('Fri, 16 Oct');
    expect(formatLongDate(NOW)).toBe('Wednesday, 14 October');
    expect(formatDateRange(new Date(2026, 9, 12), new Date(2026, 9, 18))).toBe('Oct 12–18');
    expect(formatDateRange(new Date(2026, 9, 29), new Date(2026, 10, 4))).toBe('Oct 29–Nov 4');
  });

  it('formats activity times relative to now', () => {
    expect(formatActivityTime(new Date(2026, 9, 14, 7, 10), NOW)).toBe('Today, 7:10 AM');
    expect(formatActivityTime(new Date(2026, 9, 13, 16, 35), NOW)).toBe('Tue, 4:35 PM');
    expect(formatActivityTime(new Date(2026, 9, 12, 13, 15), NOW)).toBe('Mon, 1:15 PM');
    expect(formatActivityTime(new Date(2026, 9, 2, 13, 15), NOW)).toBe('2 Oct, 1:15 PM');
  });

  it('formats schedule and list headings', () => {
    expect(formatWeekdayDayShortMonth(NOW)).toBe('Wednesday, 14 Oct');
    expect(formatWeekRangeLong(new Date(2026, 9, 12), new Date(2026, 9, 18))).toBe('Oct 12 – 18, 2026');
    expect(formatWeekRangeLong(new Date(2026, 9, 26), new Date(2026, 10, 1))).toBe('Oct 26 – Nov 1, 2026');
    expect(formatDayHeading(new Date(2026, 9, 14, 7), NOW)).toBe('TODAY');
    expect(formatDayHeading(new Date(2026, 9, 13, 16), NOW)).toBe('TUE, 13 OCT');
  });
});
