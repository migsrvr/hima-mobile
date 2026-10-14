/**
 * Demo data for the testnet build. Matches the sample week in design/README.md:
 * Bea, ₱3,000 a week, school on Mon / Wed / Fri. Screens never read this file
 * directly. Real payments and the wallet address come from the Hima server.
 */
import type { BudgetCategory, MerchantIcon, Transaction } from '@/types/finance';

const at = (weekStart: Date, dayOffset: number, hour: number, minute: number) =>
  new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + dayOffset, hour, minute);

type DemoCharge = {
  day: number;
  hour: number;
  minute: number;
  merchantName: string;
  merchantIcon: MerchantIcon;
  category: BudgetCategory;
  amount: number;
  status: Transaction['status'];
  description?: string;
  failureReason?: string;
};

/** By Wednesday morning: ₱420 spent (food 145, transport 120, school 60, other 95), one failed retry. */
const DEMO_WEEK: DemoCharge[] = [
  { day: 0, hour: 7, minute: 5, merchantName: 'Campus Shuttle', merchantIcon: 'bus', category: 'transport', amount: 40, status: 'confirmed' },
  { day: 0, hour: 7, minute: 40, merchantName: 'Campus Canteen', merchantIcon: 'utensils', category: 'food', amount: 60, status: 'confirmed', description: 'Breakfast set' },
  { day: 0, hour: 12, minute: 10, merchantName: 'Campus Canteen', merchantIcon: 'utensils', category: 'food', amount: 85, status: 'confirmed', description: 'Chicken rice meal' },
  { day: 0, hour: 13, minute: 20, merchantName: 'Print & Copy Hub', merchantIcon: 'printer', category: 'school', amount: 60, status: 'confirmed', description: 'Lab report printing' },
  { day: 0, hour: 15, minute: 20, merchantName: 'Campus Shuttle', merchantIcon: 'bus', category: 'transport', amount: 40, status: 'confirmed' },
  { day: 1, hour: 16, minute: 31, merchantName: 'Kape Corner', merchantIcon: 'coffee', category: 'other', amount: 95, status: 'failed', failureReason: 'Network timeout' },
  { day: 1, hour: 16, minute: 35, merchantName: 'Kape Corner', merchantIcon: 'coffee', category: 'other', amount: 95, status: 'confirmed' },
  { day: 2, hour: 7, minute: 10, merchantName: 'Campus Shuttle', merchantIcon: 'bus', category: 'transport', amount: 40, status: 'confirmed' },
];

/**
 * Demo activity for the week starting `weekStart`, up to `now`. Placeholder history
 * only: it never touched the network, so it carries no transaction hashes.
 */
export function demoWeekTransactions(weekStart: Date, now: Date): Transaction[] {
  return DEMO_WEEK.map((c, i) => {
    const created = at(weekStart, c.day, c.hour, c.minute);
    return {
      id: `demo-${weekStart.getTime()}-${i}`,
      merchantName: c.merchantName,
      merchantIcon: c.merchantIcon,
      category: c.category,
      amount: c.amount,
      direction: 'out' as const,
      status: c.status,
      createdAt: created.toISOString(),
      description: c.description,
      failureReason: c.failureReason,
    };
  }).filter((t) => new Date(t.createdAt) <= now);
}

/** Spending in the four weeks before this one (Insights trend), oldest first. */
export const DEMO_WEEKLY_HISTORY = [1860, 2260, 1720, 1980];

/**
 * Patterns the analysis service found in earlier weeks. Hima AI reads these
 * numbers; it never invents them.
 */
export const DEMO_PATTERNS = {
  /** Wednesdays ran ₱60 over plan on average over the last 4 Wednesdays, mostly snacks. */
  overspendWeekday: 3 as const,
  overspendAverage: 60,
  overspendWeeksSampled: 4,
  overspendWhat: 'snacks',
  /** Fares ran over in 3 of the last 4 weeks; moving ₱50 a week from Other would cover it. */
  transportOverWeeks: 3,
  transportWeeksSampled: 4,
  suggestedTransportShift: 50,
};
