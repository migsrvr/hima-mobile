import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, font } from '@/theme';

import { IconButton } from './IconButton';
import { ArrowLeft, X } from './icons';
import { Text } from './Text';

type Props = {
  /** Back arrow, close cross, or nothing. */
  leading?: 'back' | 'close' | null;
  onLeadingPress?: () => void;
  /** Overrides the spoken name of the leading button ("Cancel payment"). */
  leadingLabel?: string;
  title?: string;
  /** Right side, usually <TestnetBadge />. */
  trailing?: ReactNode;
  /** Custom middle content instead of a title (e.g. onboarding step progress). */
  children?: ReactNode;
  /** White leading button (Components board). */
  filledLeading?: boolean;
  /**
   * Header padding differs per screen; the default is the payment screens'
   * `24 16 8 8`. Safe-area insets are handled by <Screen>.
   */
  style?: StyleProp<ViewStyle>;
};

/** Screen header: 44 back/close button, 18 Bold title, optional trailing badge. */
export function HimaHeader({
  leading = 'back',
  onLeadingPress,
  leadingLabel,
  title,
  trailing,
  children,
  filledLeading,
  style,
}: Props) {
  return (
    <View style={[styles.header, style]}>
      {leading != null && (
        <IconButton
          icon={leading === 'back' ? ArrowLeft : X}
          accessibilityLabel={leadingLabel ?? (leading === 'back' ? 'Back' : 'Close')}
          onPress={onLeadingPress}
          filled={filledLeading}
          iconSize={filledLeading ? 20 : 22}
        />
      )}
      {children ??
        (title != null ? (
          <Text style={styles.title} accessibilityRole="header" numberOfLines={1}>
            {title}
          </Text>
        ) : (
          <View style={styles.spacer} />
        ))}
      {trailing}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 24,
    paddingRight: 16,
    paddingBottom: 8,
    paddingLeft: 8,
  },
  title: {
    flex: 1,
    fontFamily: font.jakarta[700],
    fontSize: 18,
    color: colors.textPrimary,
  },
  spacer: {
    flex: 1,
  },
});
