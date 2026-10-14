import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { colors, font, radius } from '@/theme';

type Props = {
  title: string;
  detail: string;
  selected: boolean;
  onPress: () => void;
};

/** Radio option on 06b: "Lower savings to ₱410 a week" / "Savings ₱500 → ₱410". */
export function QuickFixOption({ title, detail, selected, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={`${title}. ${detail}`}
      style={[styles.option, selected ? styles.optionOn : styles.optionOff]}>
      <View style={[styles.radio, selected ? styles.radioOn : styles.radioOff]} />
      <View style={styles.texts}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.detail}>{detail}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 60,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderRadius: radius[16],
  },
  optionOn: {
    borderColor: colors.deepSkyBlue,
    backgroundColor: colors.backgroundSecondary,
  },
  optionOff: {
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  radio: {
    width: 20,
    height: 20,
    flexShrink: 0,
    borderRadius: radius.full,
    backgroundColor: colors.white,
  },
  radioOn: {
    borderWidth: 6,
    borderColor: colors.deepSkyBlue,
  },
  radioOff: {
    borderWidth: 2,
    borderColor: colors.textDisabled,
  },
  texts: {
    flex: 1,
  },
  title: {
    fontFamily: font.inter[600],
    fontSize: 14,
    color: colors.textPrimary,
  },
  detail: {
    marginTop: 2,
    fontFamily: font.inter[400],
    fontSize: 12,
    color: colors.textSecondary,
  },
});
