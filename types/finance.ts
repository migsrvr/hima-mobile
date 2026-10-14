/** Spending categories that make up the weekly plan. */
export type BudgetCategory = 'food' | 'transport' | 'school' | 'other';

export const BUDGET_CATEGORIES: readonly BudgetCategory[] = ['food', 'transport', 'school', 'other'];

/** Money set aside that never counts as Safe-to-Spend. */
export type ProtectedCategory = 'savings' | 'emergency';

/** Payment lifecycle. Pending payments are already deducted; failed ones never are. */
export type TransactionStatus = 'confirmed' | 'pending' | 'failed';

/** Icons merchants can carry; falls back to the category icon. */
export type MerchantIcon = 'utensils' | 'bus' | 'coffee' | 'printer' | 'store' | 'book';

export type Transaction = {
  id: string;
  merchantName: string;
  merchantIcon?: MerchantIcon;
  category: BudgetCategory;
  /** Always positive; `direction` says which way the money moved. */
  amount: number;
  direction: 'out' | 'in';
  status: TransactionStatus;
  /** ISO 8601 timestamp. */
  createdAt: string;
  /** What was bought ("Chicken rice meal"). */
  description?: string;
  /** Payment reference shown to the student ("HM-1014-0042"). */
  reference?: string;
  /** On-chain transaction hash, once submitted. */
  txHash?: string;
  /** Exact amount that settled on-chain ("11.3333333") and its asset ("XLM"). */
  assetAmount?: string;
  assetCode?: string;
  /** Ledger the payment was final in. */
  ledger?: number;
  /** PHP part of this payment the checkout Split sent to the student's savings wallet (10%). */
  autoSaved?: number;
  failureReason?: string;
};

/** How a category's spending compares with its plan. */
export type SpendingStatus = 'onTrack' | 'nearLimit' | 'over';
