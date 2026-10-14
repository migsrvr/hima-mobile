import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Text } from '@/components/ui/Text';
import { colors, font, radius } from '@/theme';
import { WEEKDAY_NAMES, orderedWeek, type Weekday } from '@/types/schedule';

type Props = {
  selected: readonly Weekday[];
  onToggle: (day: Weekday) => void;
  weekStartsOn?: Weekday;
  style?: StyleProp<ViewStyle>;
};

/** Seven equal day buttons. Selected days are Deep Sky Blue; others are outlined. */
export function WeekdaySelector({ selected, onToggle, weekStartsOn = 1, style }: Props) {
  return (
    <View style={[styles.row, style]} accessibilityLabel="School days">
      {orderedWeek(weekStartsOn).map((day) => {
        const on = selected.includes(day);
        return (
          <Pressable
            key={day}
            onPress={() => onToggle(day)}
            accessibilityRole="togglebutton"
            accessibilityLabel={WEEKDAY_NAMES[day]}
            accessibilityState={{ checked: on }}
            // Days are ~41 dp wide at 360 dp; reach into the 6 dp gaps so each target is at least 44 wide.
            hitSlop={{ left: 3, right: 3 }}
            style={[styles.day, on ? styles.dayOn : styles.dayOff]}>
            <Text style={[styles.letter, on ? styles.letterOn : styles.letterOff]}>{WEEKDAY_NAMES[day][0]}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 6,
  },
  day: {
    flex: 1,
    height: 52,
    borderRadius: radius[14],
    // Every day carries the 1.5 border so flex gives all seven the same width, like the CSS grid.
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayOn: {
    backgroundColor: colors.deepSkyBlue,
    borderColor: colors.deepSkyBlue,
  },
  dayOff: {
    backgroundColor: colors.white,
    borderColor: colors.border,
  },
  letter: {
    fontSize: 15,
  },
  letterOn: {
    fontFamily: font.jakarta[700],
    color: colors.white,
  },
  letterOff: {
    fontFamily: font.jakarta[600],
    color: colors.textPrimary,
  },
});
