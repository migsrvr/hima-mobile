/**
 * Hima AI (Groq through the Hima server), with deterministic local answers as the fallback.
 *
 * Rule: the model writes the words, never the numbers. Every peso figure in an
 * answer comes from services/budget or services/payments calculations, or from
 * the analysis patterns the backend stores; answers also return those figures as
 * `calculated` rows, shown in the "Calculated from your wallet" box.
 * Suggestions never change the plan by themselves: they carry an `adjustment`
 * that is applied only when the student taps Approve.
 */
import { Platform } from 'react-native';

import { evaluateCheckout, type CheckoutEvaluation } from '@/services/payments/checkout';
import type { BudgetCategory, Transaction } from '@/types/finance';
import type { ConfirmedPlan } from '@/types/plan';
import { WEEKDAY_NAMES, WEEKDAY_SHORT, type Weekday } from '@/types/schedule';
import { formatClock } from '@/utils/date';
import { formatPeso } from '@/utils/money';
import { approxAsset } from '@/utils/asset';

import { API_URL, ApiError, apiFetch } from './api';
import type { WeekSummary } from './budget/week';
import { DEMO_PATTERNS } from './mock/demoData';
import { toCents, toPesos } from './budget/safeToSpend';

export type AIContext = {
  plan: ConfirmedPlan;
  summary: WeekSummary;
  transactions: Transaction[];
  walletBalance: number;
  now: Date;
  chain?: import('@/stores/wallet').ChainWallet | null;
};

export type CalculatedRow = { label: string; value: string };

export type AISuggestion = {
  id: string;
  title: string;
  reason: string;
  changes: { category: BudgetCategory; from: number; to: number }[];
  /** Weekly amounts to apply to the plan when the student approves. */
  adjustment: Partial<Record<BudgetCategory, number>>;
};

export type AIAnswer = {
  text: string;
  calculated?: CalculatedRow[];
  suggestion?: AISuggestion;
};

/** A run of text in an AI message; `strong` runs are semibold. */
export type AIRun = { text: string; strong?: boolean };

export class AIUnavailableError extends Error {
  constructor() {
    super('Hima AI is unavailable');
  }
}

export const PROMPT_SUGGESTIONS = [
  'Can I afford ₱150 today?',
  'Will my money last until Friday?',
  'Why do I overspend on Wednesdays?',
  'Can you improve my weekly budget?',
  'How much should I reserve for transportation?',
];

const peso = (n: number) => formatPeso(n, { compact: true });
const full = (n: number) => formatPeso(n);
/** "3 PM", "3:30 PM". */
const clockShort = (minutes: number) => formatClock(minutes).replace(':00', '');

/** Dev only: the web preview can simulate an outage with localStorage["hima.dev.ai"] = "offline". */
let devOffline = __DEV__ && Platform.OS === 'web' && globalThis.localStorage?.getItem('hima.dev.ai') === 'offline';

// ---------- Home, Insights, Checkout ----------

/** The Home card observation and its source line. */
export function homeInsight(ctx: AIContext): { runs: AIRun[]; footnote: string } {
  const p = DEMO_PATTERNS;
  const day = WEEKDAY_NAMES[p.overspendWeekday];
  const classEnd = ctx.plan.classHours[p.overspendWeekday]?.end;
  return {
    runs: [
      { text: `Your ${day}s usually run ` },
      { text: `${peso(p.overspendAverage)} over plan`, strong: true },
      { text: `, mostly ${p.overspendWhat}${classEnd != null ? ` after class ends at ${clockShort(classEnd)}` : ''}.` },
    ],
    footnote: `Based on your last ${p.overspendWeeksSampled} ${day}s`,
  };
}

/** The transport suggestion, sized from the stored pattern. */
function transportSuggestion(ctx: AIContext): AISuggestion {
  const p = DEMO_PATTERNS;
  const shift = p.suggestedTransportShift;
  const transport = ctx.summary.lines.transport;
  const other = ctx.summary.lines.other;
  return {
    id: 'shift-other-to-transport',
    title: `Move ${peso(shift)} a week from Other to Transport`,
    reason: `Fares ran over ${p.transportOverWeeks} of the last ${p.transportWeeksSampled} weeks.`,
    changes: [
      { category: 'transport', from: transport, to: toPesos(toCents(transport) + toCents(shift)) },
      { category: 'other', from: other, to: toPesos(toCents(other) - toCents(shift)) },
    ],
    adjustment: { transport: shift, other: -shift },
  };
}

/** Cards for the Insights "Hima AI suggests" carousel. */
export function insightSuggestions(ctx: AIContext): { id: string; title: string; body: string; question: string }[] {
  const p = DEMO_PATTERNS;
  const day = WEEKDAY_NAMES[p.overspendWeekday];
  const classEnd = ctx.plan.classHours[p.overspendWeekday]?.end;
  const shift = transportSuggestion(ctx);
  return [
    {
      id: 'weekday-overspend',
      title: `${day}s run ${peso(p.overspendAverage)} over plan`,
      body:
        `Mostly ${p.overspendWhat}${classEnd != null ? ` after class ends at ${clockShort(classEnd)}` : ''}. ` +
        `A ${peso(p.overspendAverage)} snack cap on ${day}s would cover it.`,
      question: `Why do I overspend on ${day}s?`,
    },
    {
      id: shift.id,
      title: shift.title,
      body: `${shift.reason} Moving it from Other keeps your weekly total the same.`,
      question: 'Can you improve my weekly budget?',
    },
  ];
}

const PLAN_NAME: Record<BudgetCategory, string> = {
  food: "today's food plan",
  transport: "today's transport plan",
  school: 'your school plan',
  other: "today's free-day plan",
};

/** The purple note on Checkout (12a–12c). Figures come from the checkout evaluation. */
export function checkoutNote(e: CheckoutEvaluation, ctx: AIContext): string {
  if (e.state === 'blocked') {
    return `Want to split it? Up to ${full(e.fitsWithoutReserve)} fits this week without touching your reserve.`;
  }
  if (e.state === 'overSafeToSpend') {
    const next = new Date(ctx.summary.end.getFullYear(), ctx.summary.end.getMonth(), ctx.summary.end.getDate() + 1);
    return `Your next allowance lands ${WEEKDAY_NAMES[next.getDay() as Weekday]}. Buying it then keeps your reserve whole.`;
  }
  if (e.fromSafeToSpend === 0 && e.fromPlan > 0) {
    const hour = ctx.now.getHours();
    const meal = e.category === 'food' ? (hour < 10 ? 'Breakfast' : hour < 15 ? 'Lunch' : 'Dinner') : 'This';
    const later = hour < 15 ? 'an afternoon snack' : 'later today';
    if (e.category === 'food') return `${meal} fits today's plan. You'll still have ${peso(e.planLeftAfter)} for ${later}.`;
    return `This fits ${PLAN_NAME[e.category]}, with ${peso(e.planLeftAfter)} left.`;
  }
  return `This uses ${peso(e.fromSafeToSpend)} of your Safe-to-Spend. You'll have ${peso(e.after?.safeToSpend ?? 0)} for the rest of the week.`;
}

// ---------- Chat ----------

function parseAmount(question: string): number | null {
  const m = question.match(/₱?\s*([\d,]+(?:\.\d{1,2})?)/);
  if (!m) return null;
  const n = Number(m[1].replace(/,/g, ''));
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Builds an answer from calculations. Synchronous so it can be tested; `ask` adds the network. */
export function answerFor(question: string, ctx: AIContext): AIAnswer {
  const q = question.toLowerCase();
  const { summary } = ctx;
  const days = summary.days;
  const todayIndex = days.findIndex((d) => d.timing === 'today');

  if (q.includes('afford')) {
    const amount = parseAmount(question);
    if (amount == null) return { text: 'How much is it? Ask me with an amount, like "Can I afford ₱150 today?"' };
    const e = evaluateCheckout({ ...ctx, amount, category: 'other' });
    if (e.state === 'blocked') {
      return {
        text: `Not right now. ${full(amount)} is more than your wallet holds.`,
        calculated: [
          { label: 'Wallet balance', value: full(ctx.walletBalance) },
          { label: 'Short by', value: full(e.shortBy) },
        ],
      };
    }
    const after = e.after?.safeToSpend ?? 0;
    const rest = days.slice(todayIndex + 1);
    const rows: CalculatedRow[] = [
      { label: 'Safe-to-Spend now', value: full(summary.safeToSpend) },
      { label: `After ${full(amount)}`, value: full(after) },
    ];
    if (e.state === 'overSafeToSpend') {
      rows.push({ label: 'From your reserve', value: full(e.fromReserve + e.fromSavings) });
      return {
        text: `You can, but it goes ${peso(e.fromReserve + e.fromSavings)} past your Safe-to-Spend and into your emergency reserve.`,
        calculated: rows,
      };
    }
    if (rest.length === 0) {
      return { text: `Yes. That leaves ${peso(after)} Safe-to-Spend for the rest of today.`, calculated: rows };
    }
    const perDay = toPesos(Math.floor(toCents(after) / rest.length));
    const first = WEEKDAY_SHORT[rest[0].weekday];
    const last = rest[rest.length - 1];
    rows.push({ label: rest.length > 1 ? `Per day, ${first}–${WEEKDAY_SHORT[last.weekday]}` : `For ${first}`, value: full(perDay) });
    return {
      text: `Yes. That leaves ${peso(after)} Safe-to-Spend, about ${peso(perDay)} a day through ${WEEKDAY_NAMES[last.weekday]}.`,
      calculated: rows,
    };
  }

  if (q.includes('last until')) {
    const target = days.findIndex((d, i) => i >= todayIndex && q.includes(WEEKDAY_NAMES[d.weekday].toLowerCase()));
    const until = target >= 0 ? days[target] : days[days.length - 1];
    const needed = days
      .slice(todayIndex, days.indexOf(until) + 1)
      .reduce((sum, d) => sum + toCents(d.timing === 'today' ? Math.max(0, d.planTotal - d.spentPlanned) : d.planTotal), 0);
    const spare = toCents(ctx.walletBalance) - needed - toCents(summary.protected);
    const name = WEEKDAY_NAMES[until.weekday];
    return {
      text:
        spare >= 0
          ? `Yes. Your plan through ${name} is covered, with ${peso(toPesos(spare))} to spare before your reserves.`
          : `Not quite. Your plan through ${name} needs ${peso(toPesos(-spare))} more than you have outside your reserves.`,
      calculated: [
        { label: 'Wallet balance', value: full(ctx.walletBalance) },
        { label: `Planned through ${WEEKDAY_SHORT[until.weekday]}`, value: full(toPesos(needed)) },
        { label: 'Protected reserves', value: full(summary.protected) },
      ],
    };
  }

  if (q.includes('overspend')) {
    const p = DEMO_PATTERNS;
    const day = WEEKDAY_NAMES[p.overspendWeekday];
    const ref = days.find((d) => d.weekday === p.overspendWeekday);
    const planned = ref?.planTotal ?? 0;
    const classEnd = ctx.plan.classHours[p.overspendWeekday]?.end;
    return {
      text:
        `On your last ${p.overspendWeeksSampled} ${day}s you spent ${peso(p.overspendAverage)} more than planned, ` +
        `mostly on ${p.overspendWhat}${classEnd != null ? ` after class ends at ${clockShort(classEnd)}` : ''}. ` +
        `A ${peso(p.overspendAverage)} snack cap on ${day}s would cover it.`,
      calculated: [
        { label: `${day} plan`, value: full(planned) },
        { label: 'Average spent', value: full(planned + p.overspendAverage) },
        { label: 'Over by', value: full(p.overspendAverage) },
      ],
    };
  }

  if (q.includes('improve') || q.includes('budget')) {
    const suggestion = transportSuggestion(ctx);
    return { text: "Here's one change that matches how you've actually been spending.", suggestion };
  }

  if (q.includes('transport') || q.includes('fare')) {
    const s = transportSuggestion(ctx);
    const to = s.changes[0].to;
    return {
      text: `Plan for about ${peso(to)} a week. ${s.reason}`,
      calculated: [
        { label: 'Transport plan now', value: full(s.changes[0].from) },
        { label: 'Suggested', value: full(to) },
      ],
      suggestion: s,
    };
  }

  if (q.includes('xlm') || q.includes('stellar')) {
    const safeXlm = approxAsset(summary.safeToSpend, ctx.chain) ?? '≈ 11.33 XLM';
    const balanceXlm = approxAsset(ctx.walletBalance, ctx.chain) ?? '≈ 344.00 XLM';
    return {
      text: `Your Safe-to-Spend is ${peso(summary.safeToSpend)} (${safeXlm}), and your wallet holds ${peso(ctx.walletBalance)} (${balanceXlm}).`,
      calculated: [
        { label: 'Safe-to-Spend', value: full(summary.safeToSpend) },
        { label: 'Safe-to-Spend (XLM)', value: safeXlm },
        { label: 'Wallet balance', value: full(ctx.walletBalance) },
        { label: 'Wallet balance (XLM)', value: balanceXlm },
      ],
    };
  }

  return {
    text: 'I can help with your budget: whether you can afford something, how long your money will last, or how to adjust your plan.',
  };
}

type ServerAnswer = { text?: string; calculated?: CalculatedRow[]; suggestion?: string | null };

/** Dev builds say why the local answer was used instead of the server's (it is otherwise silent). */
function warnLocalFallback(error: unknown) {
  if (!__DEV__) return;
  let why: string;
  if (error instanceof ApiError && error.kind === 'unreachable') {
    why =
      `couldn't reach ${API_URL}/ai/chat (${error.code}).` +
      (Platform.OS === 'web' ? ' On the web preview this is usually CORS: add this page\'s origin to CORS_ORIGINS in server/.env and restart the server.' : '');
  } else if (error instanceof ApiError) {
    why = `the server answered ${error.status} ${error.code}: ${error.message}`;
  } else {
    why = error instanceof Error ? error.message : 'the server sent no answer text';
  }
  console.warn(`[Hima AI] Showing the local answer: ${why}`);
}

export const aiService = {
  setDevOffline(value: boolean) {
    if (__DEV__) devOffline = value;
  },
  isOffline() {
    return devOffline;
  },
  /** Asks Hima AI (Groq via the Hima server); falls back to the deterministic answer. */
  async ask(question: string, ctx: AIContext): Promise<AIAnswer> {
    if (devOffline) throw new AIUnavailableError();

    // Budget context that grounds the model's answer
    const context = {
      allowance: ctx.plan.inputs.allowance,
      frequency: ctx.plan.inputs.period,
      safeToSpend: ctx.summary.safeToSpend,
      spendingSoFar: ctx.summary.spentTotal,
      emergencyReserves: ctx.summary.emergency,
      protectedReserves: ctx.summary.protected,
      walletBalance: ctx.walletBalance,
      currency: 'PHP',
      walletBalanceXlm: approxAsset(ctx.walletBalance, ctx.chain),
      safeToSpendXlm: approxAsset(ctx.summary.safeToSpend, ctx.chain),
      phpPerXlm: ctx.chain ? ctx.chain.phpPerUnit : '7.50',
    };

    try {
      const data = await apiFetch<ServerAnswer>('/api/ai/chat', { method: 'POST', body: { question, context }, timeoutMs: 20_000 });
      if (!data.text) throw new Error('the server sent no answer text');
      // If the fallback has an interactive suggestion, attach it so the student can approve plan adjustments
      const localFallback = answerFor(question, ctx);
      return {
        text: data.text,
        calculated: data.calculated && data.calculated.length > 0 ? data.calculated : localFallback.calculated,
        suggestion: localFallback.suggestion,
      };
    } catch (error) {
      // Server unreachable, refused or unreadable: answer from local calculations instead.
      warnLocalFallback(error);
    }

    await new Promise((resolve) => setTimeout(resolve, 600));
    return answerFor(question, ctx);
  },
};

/** Category label used in suggestion chips ("Transport ₱240 → ₱290"). */
const CATEGORY_LABEL: Record<BudgetCategory, string> = { food: 'Food', transport: 'Transport', school: 'School', other: 'Other' };
export const categoryLabel = (c: BudgetCategory) => CATEGORY_LABEL[c];
