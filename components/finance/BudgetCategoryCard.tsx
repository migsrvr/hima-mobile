import { StyleSheet, View } from 'react-native';

import { ShieldCheck } from '@/components/ui/icons';
import { Text } from '@/components/ui/Text';
import { colors, font, radius, tabular } from '@/theme';
import type { BudgetCategory } from '@/types/finance';
import { formatPeso } from '@/utils/money';

import { categoryVisuals } from './categoryVisuals';
import { SpendingProgress } from './SpendingProgress';

type Props = {
  lines: Record<BudgetCategory, number>;
  spent: Record<BudgetCategory, number>;
  spentTotal: number;
  plannedTotal: number;
  savings: number;
  emergency: number;
};

const ORDER: BudgetCategory[] = ['food', 'transport', 'school', 'other'];
const peso = (n: number) => formatPeso(n, { compact: true });

/** 07 Home "This week's budget": one progress row per category and the protected reserves. */
export function BudgetCategoryCard({ lines, spent, spentTotal, plannedTotal, savings, emergency }: Props) {
  return (
    <View style={styles.card} accessibilityLabel="This week's budget">
      <View style={styles.head}>
        <Text style={styles.title} accessibilityRole="header">
          This week&apos;s budget
        </Text>
        <Text style={styles.total}>{`${peso(spentTotal)} of ${peso(plannedTotal)}`}</Text>
      </View>
      <View style={styles.rows}>
        {ORDER.map((c) => (
          <SpendingProgress
            key={c}
            label={categoryVisuals[c].label}
            labelNote={c === 'other' ? '· free days' : undefined}
            icon={categoryVisuals[c].icon}
            iconTone={categoryVisuals[c].tone}
            spent={spent[c]}
            planned={lines[c]}
          />
        ))}
      </View>
      <View style={styles.protected} accessible accessibilityLabel={`Protected: ${peso(savings)} savings, ${peso(emergency)} emergency`}>
        <ShieldCheck size={18} color={colors.safeText} strokeWidth={2} />
        <Text style={styles.protectedText}>{`Protected: ${peso(savings)} savings · ${peso(emergency)} emergency`}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius[20],
    padding: 16,
    gap: 16,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: {
    fontFamily: font.jakarta[700],
    fontSize: 18,
    color: colors.textPrimary,
  },
  total: {
    fontFamily: font.inter[400],
    fontSize: 13,
    color: colors.textSecondary,
    ...tabular,
  },
  rows: {
    gap: 14,
  },
  protected: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: radius[14],
    backgroundColor: colors.safeTint,
  },
  protectedText: {
    flex: 1,
    fontFamily: font.jakarta[600],
    fontSize: 13,
    color: colors.safeText,
  },
});
