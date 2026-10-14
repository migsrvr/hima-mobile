import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { IconTile } from '@/components/ui/IconTile';
import { CircleAlert, TriangleAlert, type LucideIcon } from '@/components/ui/icons';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { StatusText } from '@/components/ui/StatusText';
import { Text } from '@/components/ui/Text';
import { percentUsed, spendingStatus } from '@/services/budget/spending';
import { colors, font, tabular, type Tone } from '@/theme';
import type { SpendingStatus } from '@/types/finance';
import { formatPeso } from '@/utils/money';

const FILL: Record<SpendingStatus, string> = {
  onTrack: colors.skyBlue,
  nearLimit: colors.warning,
  over: colors.danger,
};

type Props = {
  label: string;
  /** Lighter text after the label ("· free days" on 07 Home). */
  labelNote?: string;
  spent: number;
  planned: number;
  /** Category icon tile on the left (07 Home). */
  icon?: LucideIcon;
  iconTone?: Tone;
  /** Line under the bar: "₱305 left · on track", warnings and overruns (Components board). */
  showCaption?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Category spending against plan: label, "₱145 / ₱450", bar, and an optional status caption. */
export function SpendingProgress({
  label,
  labelNote,
  spent,
  planned,
  icon,
  iconTone = 'blue',
  showCaption = false,
  style,
}: Props) {
  const status = spendingStatus(spent, planned);
  const left = planned - spent;
  const percent = percentUsed(spent, planned);
  const peso = (n: number) => formatPeso(n, { compact: true });

  const spoken =
    `${label}, ${peso(spent)} of ${peso(planned)} spent, ` +
    (status === 'over' ? `${peso(-left)} over plan` : `${peso(left)} left, ${status === 'nearLimit' ? `${percent}% used` : 'on track'}`);

  return (
    <View style={style} accessible accessibilityLabel={spoken}>
      <View style={[styles.row, icon ? styles.rowWithIcon : styles.rowPlain]}>
        {icon && <IconTile icon={icon} tone={iconTone} size={32} />}
        <Text style={[styles.label, icon && styles.labelFlex]}>
          {label}
          {labelNote != null && <Text style={styles.labelNote}> {labelNote}</Text>}
        </Text>
        <Text style={styles.amounts}>
          <Text style={styles.spent}>{peso(spent)}</Text>
          {` / ${peso(planned)}`}
        </Text>
      </View>
      <ProgressBar value={planned > 0 ? spent / planned : 1} color={FILL[status]} style={styles.bar} />
      {showCaption &&
        (status === 'onTrack' ? (
          <Text style={[styles.caption, styles.captionIdle]}>{`${peso(left)} left · on track`}</Text>
        ) : status === 'nearLimit' ? (
          <StatusText
            icon={TriangleAlert}
            color={colors.warningText}
            iconSize={13}
            gap={4}
            textStyle={styles.captionStatus}
            style={styles.caption}>
            {`${peso(left)} left · ${percent}% used`}
          </StatusText>
        ) : (
          <StatusText
            icon={CircleAlert}
            color={colors.dangerText}
            iconSize={13}
            gap={4}
            textStyle={styles.captionStatus}
            style={styles.caption}>
            {`${peso(-left)} over plan`}
          </StatusText>
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowPlain: {
    justifyContent: 'space-between',
  },
  rowWithIcon: {
    gap: 10,
  },
  label: {
    fontFamily: font.jakarta[600],
    fontSize: 14,
    color: colors.textPrimary,
  },
  labelFlex: {
    flex: 1,
  },
  labelNote: {
    fontFamily: font.inter[400],
    fontSize: 12,
    color: colors.textSecondary,
  },
  amounts: {
    fontFamily: font.inter[400],
    fontSize: 13,
    color: colors.textSecondary,
    ...tabular,
  },
  spent: {
    fontFamily: font.inter[600],
    color: colors.textPrimary,
  },
  bar: {
    marginTop: 8,
  },
  caption: {
    marginTop: 6,
  },
  captionIdle: {
    fontFamily: font.inter[400],
    fontSize: 12,
    color: colors.textSecondary,
  },
  captionStatus: {
    fontFamily: font.inter[500],
    fontSize: 12,
  },
});
