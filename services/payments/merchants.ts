import type { BudgetCategory, MerchantIcon } from '@/types/finance';

export type Merchant = {
  id: string;
  name: string;
  category: BudgetCategory;
  icon: MerchantIcon;
  verified: boolean;
};

/** What the merchant's terminal is asking for. */
export type MerchantOrder = { amount: number; description: string };

/** Demo merchants on the Paiflow testnet. */
export const MERCHANTS: Record<string, Merchant> = {
  'campus-canteen': { id: 'campus-canteen', name: 'Campus Canteen', category: 'food', icon: 'utensils', verified: true },
  'campus-bookstore': { id: 'campus-bookstore', name: 'Campus Bookstore', category: 'school', icon: 'book', verified: true },
  'campus-shuttle': { id: 'campus-shuttle', name: 'Campus Shuttle', category: 'transport', icon: 'bus', verified: true },
  'kape-corner': { id: 'kape-corner', name: 'Kape Corner', category: 'other', icon: 'coffee', verified: true },
  'print-copy-hub': { id: 'print-copy-hub', name: 'Print & Copy Hub', category: 'school', icon: 'printer', verified: true },
};

/** Open orders the demo terminals are showing. */
const ORDERS: Record<string, MerchantOrder> = {
  'campus-canteen': { amount: 85, description: 'Chicken rice meal' },
  'campus-bookstore': { amount: 1150, description: 'Biology textbook' },
  'campus-shuttle': { amount: 40, description: 'Shuttle fare' },
  'kape-corner': { amount: 95, description: 'Iced coffee' },
  'print-copy-hub': { amount: 60, description: 'Printing' },
};

/**
 * Demo tag registry: NFC tag UID (hex, as Android reports it) -> merchant.
 * The demo uses a registered student ID as the merchant tag. Put the UID of the
 * card you will demo with here; Hima only reads the UID and never writes to the card.
 */
export const DEMO_TAG_REGISTRY: Record<string, string> = {
  '04A1B2C34F2A': 'campus-canteen',
  '22:E9:4A:7A': 'campus-canteen',
  '22E94A7A': 'campus-canteen',
};

export function merchantForTag(uid: string): Merchant | null {
  const upper = uid.toUpperCase();
  const normalized = upper.replace(/[^A-F0-9]/g, '');
  const id = DEMO_TAG_REGISTRY[upper] ?? DEMO_TAG_REGISTRY[normalized];
  return id ? MERCHANTS[id] ?? null : null;
}

export function openOrder(merchantId: string): MerchantOrder | null {
  return ORDERS[merchantId] ?? null;
}

/** "•••• 4F2A": only the last four characters of a tag UID are ever shown. */
export function maskTagId(uid: string): string {
  const clean = uid.replace(/[^a-zA-Z0-9]/g, '');
  const tail = (clean.length >= 4 ? clean : uid).slice(-4).toUpperCase();
  return `•••• ${tail}`;
}
