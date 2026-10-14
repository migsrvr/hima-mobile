import {
  BookOpen,
  Bus,
  Coffee,
  PiggyBank,
  Printer,
  Shield,
  ShoppingBag,
  Store,
  Utensils,
  type LucideIcon,
} from '@/components/ui/icons';
import type { Tone } from '@/theme';
import type { BudgetCategory, MerchantIcon, ProtectedCategory } from '@/types/finance';

/** Icon tile tone, icon and label for each category, as drawn on 06 Budget and 07 Home. */
export const categoryVisuals: Record<BudgetCategory | ProtectedCategory, { tone: Tone; icon: LucideIcon; label: string }> = {
  food: { tone: 'blue', icon: Utensils, label: 'Food' },
  transport: { tone: 'blue', icon: Bus, label: 'Transport' },
  school: { tone: 'yellow', icon: BookOpen, label: 'School' },
  other: { tone: 'muted', icon: ShoppingBag, label: 'Other' },
  savings: { tone: 'safe', icon: PiggyBank, label: 'Savings' },
  emergency: { tone: 'safe', icon: Shield, label: 'Emergency reserve' },
};

export const merchantIcons: Record<MerchantIcon, LucideIcon> = {
  utensils: Utensils,
  bus: Bus,
  coffee: Coffee,
  printer: Printer,
  store: Store,
  book: BookOpen,
};
