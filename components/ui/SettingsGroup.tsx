import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, font, letterSpacing, lineHeight, radius, tabular, type Tone } from '@/theme';

import { IconTile } from './IconTile';
import { ChevronRight, type LucideIcon } from './icons';
import { Text } from './Text';

type GroupProps = {
  title: string;
  children: ReactNode;
  /** Note under the card (Hima AI group). */
  footnote?: string;
  /** Purple border for the Hima AI group. */
  tone?: 'default' | 'ai';
  /** Rows ending in a switch use a tighter right padding (8 instead of 16). */
  tightRight?: boolean;
};

/** 15 Profile section: small caps heading, white card of rows, optional note. */
export function SettingsGroup({ title, children, footnote, tone = 'default', tightRight }: GroupProps) {
  return (
    <View>
      <Text style={styles.heading} accessibilityRole="header">
        {title}
      </Text>
      <View style={[styles.card, tone === 'ai' && styles.cardAi, tightRight && styles.cardTight]}>{children}</View>
      {footnote != null && <Text style={styles.footnote}>{footnote}</Text>}
    </View>
  );
}

type RowProps = {
  label: string;
  /** Second line under the label. */
  detail?: string;
  icon?: LucideIcon;
  iconTone?: Tone;
  /** Right-hand text before the chevron ("₱3,000.00 weekly"). */
  value?: string;
  /** Tabular figures, only where the design sets them (amounts, wallet address). */
  tabularValue?: boolean;
  tabularDetail?: boolean;
  /** Right-hand control or badge instead of a value + chevron. */
  trailing?: ReactNode;
  onPress?: () => void;
  /** Row height before its divider (56, 60 or 64 in the design). */
  minHeight?: number;
  divider?: boolean;
  /** Rows with a trailing chevron inside a tight-right card add 8 of their own (Change password). */
  padRight?: boolean;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
};

export function SettingsRow({
  label,
  detail,
  icon,
  iconTone = 'blue',
  value,
  tabularValue,
  tabularDetail,
  trailing,
  onPress,
  minHeight = 56,
  divider = false,
  padRight,
  accessibilityHint,
  style,
}: RowProps) {
  const content = (
    <>
      {icon && <IconTile icon={icon} tone={iconTone} size={32} />}
      {detail != null ? (
        <View style={styles.texts}>
          <Text style={styles.label}>{label}</Text>
          <Text style={[styles.detail, tabularDetail && tabular]}>{detail}</Text>
        </View>
      ) : (
        <Text style={[styles.label, styles.texts]}>{label}</Text>
      )}
      {value != null && <Text style={[styles.value, tabularValue && tabular]}>{value}</Text>}
      {trailing}
      {onPress && trailing == null && <ChevronRight size={18} color={colors.textDisabled} strokeWidth={2} />}
    </>
  );
  // The design's rows are content-box: a divider adds 1 to the row height.
  const rowStyle = [styles.row, { minHeight: minHeight + (divider ? 1 : 0) }, divider && styles.divider, padRight && styles.padRight, style];
  if (!onPress) return <View style={rowStyle}>{content}</View>;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={value ? `${label}, ${value}` : label}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [rowStyle, pressed && styles.pressed]}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  heading: {
    marginBottom: 8,
    marginLeft: 4,
    fontFamily: font.jakarta[700],
    fontSize: 12,
    letterSpacing: letterSpacing(12, 0.06),
    color: colors.textSecondary,
  },
  card: {
    borderRadius: radius[20],
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
  },
  cardAi: {
    borderColor: colors.aiBorder,
  },
  cardTight: {
    paddingRight: 8,
  },
  footnote: {
    marginTop: 8,
    marginHorizontal: 4,
    fontFamily: font.inter[400],
    fontSize: 12,
    lineHeight: lineHeight(12, 1.5),
    color: colors.textSecondary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.muted,
  },
  padRight: {
    paddingRight: 8,
  },
  pressed: {
    opacity: 0.7,
  },
  texts: {
    flex: 1,
    minWidth: 0,
  },
  label: {
    fontFamily: font.jakarta[600],
    fontSize: 15,
    color: colors.textPrimary,
  },
  detail: {
    marginTop: 2,
    fontFamily: font.inter[400],
    fontSize: 12,
    color: colors.textSecondary,
  },
  value: {
    fontFamily: font.inter[400],
    fontSize: 13,
    color: colors.textSecondary,
  },
});
