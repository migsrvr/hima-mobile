import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/theme';

type Props = {
  children: ReactNode;
  /**
   * Bottom actions. They follow the content, and sit at the bottom of the
   * screen when the content is shorter than the screen (the design's
   * `main { flex: 1 }` + footer layout).
   */
  footer?: ReactNode;
  background?: 'background' | 'white';
  /** Which system insets to pad. Tab screens leave the bottom to the tab bar. */
  edges?: ('top' | 'bottom')[];
  /** Scroll with keyboard avoidance (default). Turn off for fixed layouts like the splash. */
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
};

/**
 * Screen frame: background, safe areas, scrolling and keyboard avoidance.
 * The design frames start below the status bar, so design paddings are
 * applied on top of the system insets.
 */
export function Screen({
  children,
  footer,
  background = 'background',
  edges = ['top', 'bottom'],
  scroll = true,
  contentStyle,
}: Props) {
  const insets = useSafeAreaInsets();
  const bg = background === 'white' ? colors.white : colors.background;
  const padTop = edges.includes('top') ? insets.top : 0;
  const padBottom = edges.includes('bottom') ? insets.bottom : 0;

  const body = (
    <>
      <View style={[styles.main, contentStyle]}>{children}</View>
      {footer}
    </>
  );

  return (
    <View style={[styles.root, { backgroundColor: bg, paddingTop: padTop }]}>
      {scroll ? (
        <KeyboardAwareScrollView
          bottomOffset={24}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.grow, { paddingBottom: padBottom }]}>
          {body}
        </KeyboardAwareScrollView>
      ) : (
        <View style={[styles.grow, { paddingBottom: padBottom }]}>{body}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  grow: {
    flexGrow: 1,
  },
  main: {
    flex: 1,
  },
});
