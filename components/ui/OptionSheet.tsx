import { Pressable, StyleSheet, View } from 'react-native';

import { colors, font, radius } from '@/theme';

import { HimaBottomSheet } from './HimaBottomSheet';
import { Check } from './icons';
import { Text } from './Text';

type Option<T> = { value: T; label: string };

type Props<T> = {
  visible: boolean;
  title: string;
  options: readonly Option<T>[];
  value: T;
  onSelect: (value: T) => void;
  onClose: () => void;
};

/**
 * Bottom-sheet list picker. Not drawn in the design (it is what the "Monday ▾"
 * trigger opens); built only from existing tokens and the sheet component.
 */
export function OptionSheet<T extends string | number>({ visible, title, options, value, onSelect, onClose }: Props<T>) {
  return (
    <HimaBottomSheet visible={visible} onRequestClose={onClose} accessibilityLabel={title}>
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      <View style={styles.list} accessibilityRole="radiogroup">
        {options.map((o) => {
          const selected = o.value === value;
          return (
            <Pressable
              key={String(o.value)}
              onPress={() => {
                onSelect(o.value);
                onClose();
              }}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              style={({ pressed }) => [styles.row, selected && styles.rowSelected, pressed && styles.pressed]}>
              <Text style={[styles.label, selected && styles.labelSelected]}>{o.label}</Text>
              {selected && <Check size={18} color={colors.deepSkyBlue} strokeWidth={2.5} />}
            </Pressable>
          );
        })}
      </View>
    </HimaBottomSheet>
  );
}

const styles = StyleSheet.create({
  title: {
    alignSelf: 'stretch',
    fontFamily: font.jakarta[700],
    fontSize: 18,
    color: colors.textPrimary,
  },
  list: {
    alignSelf: 'stretch',
    gap: 4,
  },
  row: {
    minHeight: 48,
    paddingHorizontal: 14,
    borderRadius: radius[14],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowSelected: {
    backgroundColor: colors.backgroundSecondary,
  },
  pressed: {
    backgroundColor: colors.muted,
  },
  label: {
    fontFamily: font.jakarta[600],
    fontSize: 15,
    color: colors.textPrimary,
  },
  labelSelected: {
    fontFamily: font.jakarta[700],
    color: colors.blueText,
  },
});
