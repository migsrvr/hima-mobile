import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { HimaBottomSheet } from '@/components/ui/HimaBottomSheet';
import { HimaButton } from '@/components/ui/HimaButton';
import { CircleAlert } from '@/components/ui/icons';
import { SelectButton } from '@/components/ui/SelectButton';
import { StatusText } from '@/components/ui/StatusText';
import { Text } from '@/components/ui/Text';
import { colors, font, radius } from '@/theme';
import { WEEKDAY_NAMES, type ClassHours, type Weekday } from '@/types/schedule';
import { formatClock } from '@/utils/date';

const DEFAULT_HOURS: ClassHours = { start: 8 * 60, end: 15 * 60 };
const STEP = 30;
const EARLIEST = 5 * 60;
const LATEST = 23 * 60;

type Props = {
  /** The day being edited; null hides the sheet. */
  day: Weekday | null;
  hours?: ClassHours;
  onSave: (day: Weekday, hours: ClassHours | undefined) => void;
  onClose: () => void;
};

/**
 * Class hours editor opened from 04 Schedule. Not drawn in the design: it reuses the
 * "Your week starts on" row, the select button and the bottom sheet. Times use the
 * native Android time picker; the web preview steps through half hours instead.
 */
export function ClassHoursSheet({ day, hours, onSave, onClose }: Props) {
  return (
    <HimaBottomSheet
      visible={day != null}
      onRequestClose={onClose}
      accessibilityLabel={day != null ? `${WEEKDAY_NAMES[day]} class hours` : 'Class hours'}>
      {day != null && (
        // Keyed by day so the draft resets whenever a different day is opened.
        <Editor key={day} day={day} initial={hours} onSave={onSave} onClose={onClose} />
      )}
    </HimaBottomSheet>
  );
}

function Editor({
  day,
  initial,
  onSave,
  onClose,
}: {
  day: Weekday;
  initial?: ClassHours;
  onSave: Props['onSave'];
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<ClassHours>(initial ?? DEFAULT_HOURS);
  const invalid = draft.end <= draft.start;

  const pick = (which: 'start' | 'end') => {
    const current = draft[which];
    if (Platform.OS === 'android') {
      const value = new Date();
      value.setHours(Math.floor(current / 60), current % 60, 0, 0);
      DateTimePickerAndroid.open({
        mode: 'time',
        value,
        is24Hour: false,
        design: 'material',
        title: which === 'start' ? 'Class starts' : 'Class ends',
        onChange: (event, date) => {
          if (event.type !== 'set' || !date) return;
          setDraft((d) => ({ ...d, [which]: date.getHours() * 60 + date.getMinutes() }));
        },
      });
      return;
    }
    const next = current + STEP > LATEST ? EARLIEST : current + STEP;
    setDraft((d) => ({ ...d, [which]: next }));
  };

  return (
    <>
      <Text style={styles.title} accessibilityRole="header">
        {`${WEEKDAY_NAMES[day]} class hours`}
      </Text>
      <View style={styles.rows}>
        <TimeRow label="Starts" value={formatClock(draft.start)} onPress={() => pick('start')} />
        <TimeRow label="Ends" value={formatClock(draft.end)} onPress={() => pick('end')} />
      </View>
      {invalid && (
        <StatusText
          icon={CircleAlert}
          color={colors.dangerText}
          iconSize={15}
          gap={6}
          textStyle={styles.error}
          style={styles.errorRow}>
          Classes need to end after they start
        </StatusText>
      )}
      <HimaButton
        label="Save hours"
        disabled={invalid}
        onPress={() => {
          onSave(day, draft);
          onClose();
        }}
      />
      {initial && (
        <HimaButton
          label="Remove hours"
          variant="text"
          size="dialog"
          onPress={() => {
            onSave(day, undefined);
            onClose();
          }}
        />
      )}
    </>
  );
}

function TimeRow({ label, value, onPress }: { label: string; value: string; onPress: () => void }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <SelectButton value={value} onPress={onPress} accessibilityLabel={`Class ${label.toLowerCase()}`} />
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    alignSelf: 'stretch',
    fontFamily: font.jakarta[700],
    fontSize: 18,
    color: colors.textPrimary,
  },
  rows: {
    alignSelf: 'stretch',
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingTop: 4,
    paddingRight: 4,
    paddingBottom: 4,
    paddingLeft: 16,
    borderRadius: radius[16],
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowLabel: {
    fontFamily: font.inter[400],
    fontSize: 14,
    color: colors.textSecondary,
  },
  errorRow: {
    alignSelf: 'stretch',
  },
  error: {
    fontFamily: font.inter[500],
    fontSize: 13,
  },
});
