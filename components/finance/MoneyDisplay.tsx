import { StyleSheet, type StyleProp, type TextStyle } from 'react-native';

import { Text } from '@/components/ui/Text';
import { colors, font, letterSpacing, lineHeight, tabular } from '@/theme';
import { formatPeso, spokenPeso } from '@/utils/money';

/** Sizes from the Components board "Money" card, plus the 20 used for wallet balances. */
const SIZES = {
  hero: { fontSize: 40, fontFamily: font.jakarta[800], lineHeight: lineHeight(40, 1.1), letterSpacing: letterSpacing(40, -0.02) },
  large: { fontSize: 24, fontFamily: font.jakarta[700] },
  balance: { fontSize: 20, fontFamily: font.jakarta[700] },
  body: { fontSize: 15, fontFamily: font.jakarta[700] },
} satisfies Record<string, TextStyle>;

type Props = {
  amount: number;
  size?: keyof typeof SIZES;
  /**
   * default  = Primary Text (outgoing amounts show "−₱")
   * incoming = Safe text with "+₱"
   * struck   = failed payment: Secondary Text, struck through
   * inverse  = white, on the blue hero card
   */
  tone?: 'default' | 'incoming' | 'struck' | 'inverse';
  /** Whole pesos without ".00" where the design shows them. */
  compact?: boolean;
  style?: StyleProp<TextStyle>;
};

/** Peso amount: tabular figures, comma thousands, two decimals, true minus. Never truncated. */
export function MoneyDisplay({ amount, size = 'body', tone = 'default', compact, style }: Props) {
  const text = formatPeso(amount, { sign: tone === 'incoming', compact });
  return (
    <Text
      style={[styles.base, SIZES[size], toneStyles[tone], style]}
      accessibilityLabel={`${tone === 'incoming' ? 'plus ' : ''}${spokenPeso(amount)}${tone === 'struck' ? ', not charged' : ''}`}>
      {text}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    color: colors.textPrimary,
    ...tabular,
  },
});

const toneStyles = StyleSheet.create({
  default: {},
  incoming: { color: colors.safeText },
  struck: { color: colors.textSecondary, textDecorationLine: 'line-through' },
  inverse: { color: colors.white },
});
