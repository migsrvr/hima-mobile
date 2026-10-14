import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';

import { colors, radius, shadow } from '@/theme';

type Props = ViewProps & {
  children: ReactNode;
  /** Card padding; screens use 16 (default) or 20. */
  padding?: number;
  /** Soft navy shadow used on summary cards (06 Budget plan summary). */
  elevated?: boolean;
  /** AI cards use the purple border. */
  tone?: 'default' | 'ai';
  style?: StyleProp<ViewStyle>;
};

/** White card: 1 px Border, 20 radius. */
export function HimaCard({ children, padding = 16, elevated, tone = 'default', style, ...rest }: Props) {
  return (
    <View
      style={[
        styles.card,
        { padding },
        tone === 'ai' && styles.ai,
        elevated && styles.elevated,
        style,
      ]}
      {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius[20],
  },
  ai: {
    borderColor: colors.aiBorder,
  },
  elevated: {
    boxShadow: shadow.cardSoft,
  },
});
