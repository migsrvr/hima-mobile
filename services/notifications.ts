import type { WeekSummary } from '@/services/budget/week';
import type { Transaction } from '@/types/finance';
import { formatPeso } from '@/utils/money';

export type AppNotification = { id: string; title: string; body: string };

/**
 * In-app notifications: payment updates this week (failed or still pending)
 * and the latest Hima AI insight when AI suggestions are on.
 */
export function deriveNotifications(summary: WeekSummary, transactions: Transaction[], aiOn: boolean): AppNotification[] {
  const start = summary.start.getTime();
  const items: AppNotification[] = transactions
    .filter((t) => (t.status === 'failed' || t.status === 'pending') && new Date(t.createdAt).getTime() >= start)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((t) => ({
      id: t.id,
      title: t.status === 'failed' ? `Payment to ${t.merchantName} failed` : `Payment to ${t.merchantName} pending`,
      body:
        t.status === 'failed'
          ? `${formatPeso(t.amount)} was not charged.`
          : `${formatPeso(t.amount)} is waiting for network confirmation.`,
    }));
  if (aiOn) items.push({ id: 'ai-insight', title: 'New Hima AI insight', body: 'See it on your dashboard.' });
  return items;
}
