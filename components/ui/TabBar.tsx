import type { ComponentProps } from 'react';
import type { Tabs } from 'expo-router';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, font, radius } from '@/theme';

import { Calendar, ChartColumn, House, User, type LucideIcon } from './icons';
import { Text } from './Text';

export type TabItem = { key: string; label: string; icon: LucideIcon };

/** The four main tabs, in order. Keys match the route names in app/(tabs). */
export const MAIN_TABS: TabItem[] = [
  { key: 'home', label: 'Home', icon: House },
  { key: 'schedule', label: 'Schedule', icon: Calendar },
  { key: 'insights', label: 'Insights', icon: ChartColumn },
  { key: 'profile', label: 'Profile', icon: User },
];

type Props = {
  items: TabItem[];
  activeKey: string;
  onPress: (key: string) => void;
  /** Space under the labels: the design's 20 plus the system navigation inset. */
  bottomPadding?: number;
  style?: StyleProp<ViewStyle>;
};

/** Bottom navigation: white bar, active tab in a Secondary-background pill. */
export function TabBar({ items, activeKey, onPress, bottomPadding = 20, style }: Props) {
  return (
    <View style={[styles.bar, { paddingBottom: bottomPadding }, style]} accessibilityRole="tablist">
      {items.map((item) => {
        const active = item.key === activeKey;
        const color = active ? colors.deepSkyBlue : colors.textSecondary;
        const Icon = item.icon;
        return (
          <Pressable
            key={item.key}
            onPress={() => onPress(item.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={item.label}
            style={styles.item}>
            <View style={[styles.pill, active && styles.pillActive]}>
              <Icon size={20} color={color} strokeWidth={2} />
            </View>
            <Text style={[styles.label, { color }, active ? styles.labelActive : styles.labelIdle]}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

type TabBarRenderProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

/** Adapter for expo-router <Tabs tabBar={...}>. */
export function HimaTabBar({ state, navigation, insets }: TabBarRenderProps) {
  const active = state.routes[state.index];
  return (
    <TabBar
      items={MAIN_TABS.filter((t) => state.routes.some((r) => r.name === t.key))}
      activeKey={active.name}
      bottomPadding={20 + insets.bottom}
      onPress={(key) => {
        const route = state.routes.find((r) => r.name === key);
        if (!route) return;
        const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
        if (route.key !== active.key && !event.defaultPrevented) navigation.navigate(route.name, route.params);
      }}
    />
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
    paddingHorizontal: 8,
  },
  item: {
    flex: 1,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  pill: {
    width: 56,
    height: 30,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillActive: {
    backgroundColor: colors.backgroundSecondary,
  },
  label: {
    fontSize: 12,
  },
  labelActive: {
    fontFamily: font.jakarta[700],
  },
  labelIdle: {
    fontFamily: font.jakarta[600],
  },
});
