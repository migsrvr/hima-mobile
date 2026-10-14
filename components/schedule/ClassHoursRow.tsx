import { Pressable, StyleSheet, View } from 'react-native';

import { Clock } from '@/components/ui/icons';
import { Text } from '@/components/ui/Text';
import { colors, font, radius, tabular, tones } from '@/theme';
import { WEEKDAY_NAMES, WEEKDAY_SHORT, type ClassHours, type Weekday } from '@/types/schedule';
import { formatClassHours, formatClock } from '@/utils/date';

type Props = {
  day: Weekday;
  hours?: ClassHours;
  /** The next school day from today gets the yellow tile and "Next up". */
  isNext: boolean;
  onPressHours: () => void;
};

/** One school day on 04 Schedule: day tile, name, and a button showing its class hours. */
export function ClassHoursRow({ day, hours, isNext, onPressHours }: Props) {
  const tone = tones[isNext ? 'yellow' : 'blueText'];
  const name = WEEKDAY_NAMES[day];
  const hoursText = hours ? formatClassHours(hours) : 'Set hours';
  const spokenHours = hours ? `${formatClock(hours.start)} to ${formatClock(hours.end)}` : 'not set';

  return (
    <View style={styles.row}>
      <View style={[styles.tile, { backgroundColor: tone.bg }]} importantForAccessibility="no-hide-descendants">
        <Text style={[styles.tileText, { color: tone.fg }]}>{WEEKDAY_SHORT[day].toUpperCase()}</Text>
      </View>
      {isNext ? (
        <View style={styles.names}>
          <Text style={styles.name} numberOfLines={1} ellipsizeMode="clip">
            {name}
          </Text>
          <Text style={styles.next}>Next up</Text>
        </View>
      ) : (
        <Text style={[styles.name, styles.names]} numberOfLines={1} ellipsizeMode="clip">
          {name}
        </Text>
      )}
      <Pressable
        onPress={onPressHours}
        accessibilityRole="button"
        accessibilityLabel={`${name} class hours, ${spokenHours}`}
        accessibilityHint="Opens class hours"
        style={({ pressed }) => [styles.hours, pressed && styles.pressed]}>
        <Clock size={14} color={colors.textSecondary} strokeWidth={2} />
        <Text style={styles.hoursText}>{hoursText}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 8,
    paddingRight: 8,
    paddingBottom: 8,
    paddingLeft: 12,
    borderRadius: radius[16],
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tile: {
    width: 44,
    height: 44,
    flexShrink: 0,
    borderRadius: radius[12],
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileText: {
    fontFamily: font.jakarta[800],
    fontSize: 13,
  },
  names: {
    flex: 1,
    minWidth: 0,
  },
  // One line like the design. At 360 dp "Wednesday" is ~4 dp wider than its slot; the design
  // lets it run under the hours button, so it is clipped rather than wrapped.
  name: {
    fontFamily: font.jakarta[600],
    fontSize: 15,
    color: colors.textPrimary,
  },
  next: {
    marginTop: 1,
    fontFamily: font.inter[600],
    fontSize: 12,
    color: colors.warningText,
  },
  hours: {
    height: 44,
    paddingHorizontal: 12,
    borderRadius: radius[12],
    backgroundColor: colors.background,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pressed: {
    backgroundColor: colors.muted,
  },
  hoursText: {
    fontFamily: font.inter[600],
    fontSize: 13,
    color: colors.textPrimary,
    ...tabular,
  },
});
