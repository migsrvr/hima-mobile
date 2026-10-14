import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Text } from '@/components/ui/Text';
import { colors, font, radius, tabular } from '@/theme';

export type DetailRow = {
  label: string;
  value: string;
  /** Tabular figures for references, hashes and amounts. */
  numeric?: boolean;
  /** Extra control after the value (copy button). */
  accessory?: ReactNode;
};

type Props = {
  rows: DetailRow[];
  /**
   * receipt: white card, 13 text, 40 tall rows (14a–14c)
   * scan: white card, 14 text, 10 vertical padding (11c)
   * sheet: background-tinted box, 13 text, Border dividers (13a)
   */
  variant?: 'receipt' | 'scan' | 'sheet';
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

/** Label / value list used for tag details, the authorization sheet and receipts. */
export function DetailRows({ rows, variant = 'receipt', accessibilityLabel, style }: Props) {
  return (
    <View style={[styles.box, styles[variant], style]} accessibilityLabel={accessibilityLabel}>
      {rows.map((r, i) => (
        <View
          key={r.label}
          style={[
            styles.row,
            variant === 'receipt' ? styles.rowReceipt : styles.rowPadded,
            i < rows.length - 1 && (variant === 'sheet' ? styles.dividerSheet : styles.divider),
            // Content-box in the design: receipt rows are 40 plus their 1 px divider.
            variant === 'receipt' && i < rows.length - 1 && styles.rowReceiptDivided,
          ]}
          accessible
          accessibilityLabel={`${r.label}: ${r.value}`}>
          <Text style={[styles.label, variant === 'scan' ? styles.text14 : styles.text13]}>{r.label}</Text>
          <View style={styles.valueWrap}>
            <Text style={[styles.value, variant === 'scan' ? styles.text14 : styles.text13, r.numeric && tabular]}>{r.value}</Text>
            {r.accessory}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignSelf: 'stretch',
    borderRadius: radius[16],
  },
  receipt: {
    paddingVertical: 4,
    paddingHorizontal: 16,
    borderRadius: radius[20],
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  scan: {
    paddingVertical: 4,
    paddingHorizontal: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sheet: {
    paddingVertical: 4,
    paddingHorizontal: 14,
    backgroundColor: colors.background,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  rowReceipt: {
    minHeight: 40,
  },
  rowReceiptDivided: {
    minHeight: 41,
  },
  rowPadded: {
    paddingVertical: 10,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.muted,
  },
  dividerSheet: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  label: {
    fontFamily: font.inter[400],
    color: colors.textSecondary,
  },
  valueWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    flexShrink: 1,
  },
  value: {
    flexShrink: 1,
    textAlign: 'right',
    fontFamily: font.inter[600],
    color: colors.textPrimary,
  },
  text13: {
    fontSize: 13,
  },
  text14: {
    fontSize: 14,
  },
});
