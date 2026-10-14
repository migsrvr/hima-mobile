import { Pressable, StyleSheet, View } from 'react-native';

import { HimaEmptyState } from '@/components/ui/HimaEmptyState';
import { Text } from '@/components/ui/Text';
import { colors, font, layout, radius } from '@/theme';
import type { Transaction } from '@/types/finance';

import { TransactionRow } from './TransactionRow';

type Props = {
  transactions: Transaction[];
  now: Date;
  onSeeAll: () => void;
  onHowItWorks: () => void;
};

/** 07 Home "Recent activity": latest payments, or the empty state before the first one. */
export function RecentActivityCard({ transactions, now, onSeeAll, onHowItWorks }: Props) {
  return (
    <View style={styles.card} accessibilityLabel="Recent activity">
      <View style={styles.head}>
        <Text style={styles.title} accessibilityRole="header">
          Recent activity
        </Text>
        {transactions.length > 0 && (
          <Pressable onPress={onSeeAll} accessibilityRole="link" style={styles.link}>
            <Text style={styles.linkText}>See all</Text>
          </Pressable>
        )}
      </View>
      {transactions.length === 0 ? (
        <HimaEmptyState
          title="No payments yet"
          message="Tap to Pay at a Hima merchant and it shows up here, sorted into your budget."
          action={{ label: 'How Tap to Pay works', onPress: onHowItWorks }}
          style={styles.empty}
        />
      ) : (
        transactions.map((t, i) => (
          <TransactionRow key={t.id} transaction={t} now={now} isLast={i === transactions.length - 1} />
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius[20],
    paddingTop: 8,
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: layout.minTouch,
  },
  title: {
    fontFamily: font.jakarta[700],
    fontSize: 18,
    color: colors.textPrimary,
  },
  link: {
    minHeight: layout.minTouch,
    justifyContent: 'center',
  },
  linkText: {
    fontFamily: font.jakarta[700],
    fontSize: 14,
    color: colors.deepSkyBlue,
  },
  empty: {
    paddingBottom: 16,
  },
});
