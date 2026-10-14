import { useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Line, Path, Rect } from 'react-native-svg';

import { Text } from '@/components/ui/Text';
import { colors, font, radius, tabular } from '@/theme';
import { formatPeso, spokenPeso } from '@/utils/money';

export type TrendBar = {
  label: string;
  amount: number;
  /** The week in progress: drawn dashed. */
  current?: boolean;
};

type Props = {
  bars: TrendBar[];
  /** Weekly spending limit (allowance minus protected reserves). */
  limit: number;
};

const CHART_HEIGHT = 120;
const LIMIT_Y = 110;
const BAR_WIDTH = 30;
const DASH = '3 2';

/** Rounded bar: 8 radius on top, 3 at the bottom (matches the design's border-radius: 8px 8px 3px 3px). */
function barPath(x: number, y: number, w: number, h: number, inset = 0): string {
  const top = Math.min(8, h / 2);
  const bottom = Math.min(3, h / 2);
  const l = x + inset;
  const r = x + w - inset;
  const t = y + inset;
  const b = y + h - inset;
  return [
    `M${l} ${t + top}`,
    `Q${l} ${t} ${l + top} ${t}`,
    `L${r - top} ${t}`,
    `Q${r} ${t} ${r} ${t + top}`,
    `L${r} ${b - bottom}`,
    `Q${r} ${b} ${r - bottom} ${b}`,
    `L${l + bottom} ${b}`,
    `Q${l} ${b} ${l} ${b - bottom}`,
    'Z',
  ].join(' ');
}

/** 09 Insights "Weekly spending": last weeks against the limit; over-limit weeks in amber. */
export function WeeklyTrendChart({ bars, limit }: Props) {
  const [width, setWidth] = useState(0);
  const scale = limit > 0 ? LIMIT_Y / limit : 0;
  // justify-content: space-around
  const free = Math.max(0, width - bars.length * BAR_WIDTH);
  const slot = bars.length > 0 ? free / bars.length : 0;

  const summary = bars
    .map((b) => `${b.label} ${spokenPeso(b.amount)}${b.amount > limit ? ', over the limit' : ''}${b.current ? ' so far' : ''}`)
    .join('; ');

  return (
    <View>
      <View
        style={styles.chart}
        onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
        accessible
        accessibilityRole="image"
        accessibilityLabel={`Weekly spending: ${summary}. Limit ${spokenPeso(limit)}.`}>
        {width > 0 && (
          <Svg width={width} height={CHART_HEIGHT}>
            <Line
              x1={0}
              x2={width}
              y1={CHART_HEIGHT - LIMIT_Y - 0.75}
              y2={CHART_HEIGHT - LIMIT_Y - 0.75}
              stroke={colors.textDisabled}
              strokeWidth={1.5}
              strokeDasharray={DASH}
            />
            {bars.map((b, i) => {
              const h = Math.max(4, Math.min(CHART_HEIGHT, b.amount * scale));
              const x = slot / 2 + i * (BAR_WIDTH + slot);
              const y = CHART_HEIGHT - h;
              if (b.current) {
                return (
                  <Path
                    key={b.label}
                    d={barPath(x, y, BAR_WIDTH, h, 0.75)}
                    fill={colors.backgroundSecondary}
                    stroke={colors.deepSkyBlue}
                    strokeWidth={1.5}
                    strokeDasharray={DASH}
                  />
                );
              }
              return (
                <Path key={b.label} d={barPath(x, y, BAR_WIDTH, h)} fill={b.amount > limit ? colors.warning : colors.skyBlue} />
              );
            })}
          </Svg>
        )}
        <View style={styles.limitLabel}>
          <Text style={styles.limitText}>{`${formatPeso(limit, { compact: true })} limit`}</Text>
        </View>
      </View>

      <View style={styles.labels} importantForAccessibility="no-hide-descendants">
        {bars.map((b) => (
          <View key={b.label} style={styles.label}>
            <Text style={styles.labelDate}>{b.label}</Text>
            <Text style={[styles.labelAmount, b.amount > limit && !b.current && styles.labelOver]}>
              {formatPeso(b.amount, { compact: true })}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.swatch, { backgroundColor: colors.warning }]} />
          <Text style={styles.legendText}>Over the limit</Text>
        </View>
        <View style={styles.legendItem}>
          <Svg width={10} height={10}>
            <Rect
              x={0.75}
              y={0.75}
              width={8.5}
              height={8.5}
              rx={2.25}
              fill={colors.backgroundSecondary}
              stroke={colors.deepSkyBlue}
              strokeWidth={1.5}
              strokeDasharray={DASH}
            />
          </Svg>
          <Text style={styles.legendText}>So far this week</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chart: {
    height: CHART_HEIGHT,
    marginTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    // The bottom border sits under the bars, as in the design.
    boxSizing: 'content-box',
  },
  limitLabel: {
    position: 'absolute',
    right: 0,
    bottom: 114,
    paddingHorizontal: 4,
    backgroundColor: colors.white,
  },
  limitText: {
    fontFamily: font.inter[600],
    fontSize: 11,
    color: colors.textSecondary,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  label: {
    width: 56,
    alignItems: 'center',
  },
  labelDate: {
    fontFamily: font.inter[400],
    fontSize: 11,
    color: colors.textSecondary,
    ...tabular,
  },
  labelAmount: {
    fontFamily: font.inter[600],
    fontSize: 11,
    color: colors.textPrimary,
    ...tabular,
  },
  labelOver: {
    fontFamily: font.inter[700],
    color: colors.warningText,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  swatch: {
    width: 10,
    height: 10,
    borderRadius: radius[3],
  },
  legendText: {
    fontFamily: font.inter[400],
    fontSize: 12,
    color: colors.textSecondary,
  },
});
