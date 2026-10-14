import { useEffect, useState, type ReactNode } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAnimatedValue } from '@/hooks/useAnimatedValue';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { colors, radius, shadow } from '@/theme';

type SurfaceProps = {
  children: ReactNode;
  /** 24 on the Components board, 28 on 13a. */
  cornerRadius?: number;
  /** Extra bottom padding (system navigation inset). */
  bottomInset?: number;
  /** Space between items (12) and below them (20) on the board; 13a lays its items out with margins instead. */
  gap?: number;
  paddingBottom?: number;
  style?: StyleProp<ViewStyle>;
};

/** The sheet itself: white, rounded top, grabber, centered content. */
export function BottomSheetSurface({
  children,
  cornerRadius = radius[24],
  bottomInset = 0,
  gap = 12,
  paddingBottom = 20,
  style,
}: SurfaceProps) {
  return (
    <View
      style={[
        styles.surface,
        { borderTopLeftRadius: cornerRadius, borderTopRightRadius: cornerRadius, paddingBottom: paddingBottom + bottomInset, gap },
        style,
      ]}>
      <View style={styles.grabber} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
      {children}
    </View>
  );
}

type Props = Omit<SurfaceProps, 'bottomInset'> & {
  visible: boolean;
  /** Back button / scrim tap. Omit to make the sheet non-dismissable (e.g. while authorizing). */
  onRequestClose?: () => void;
  accessibilityLabel: string;
  /** Sheets with a text field rise above the keyboard. */
  avoidKeyboard?: boolean;
};

/** Modal bottom sheet over a Dark Navy scrim. Slides up; appears instantly with reduced motion. */
export function HimaBottomSheet({ visible, onRequestClose, accessibilityLabel, avoidKeyboard, children, ...surface }: Props) {
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const progress = useAnimatedValue(0);
  // Stay mounted while the close animation runs.
  const [mounted, setMounted] = useState(visible);
  if (visible && !mounted) setMounted(true);

  useEffect(() => {
    const anim = Animated.timing(progress, {
      toValue: visible ? 1 : 0,
      duration: reduced ? 0 : 250,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    anim.start(({ finished }) => {
      if (finished && !visible) setMounted(false);
    });
    return () => anim.stop();
  }, [visible, reduced, progress]);

  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [480, 0] });

  const content = (
    <>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: progress }]}>
        <Pressable
          style={[StyleSheet.absoluteFill, styles.scrim]}
          onPress={onRequestClose}
          disabled={!onRequestClose}
          accessibilityLabel="Close"
          accessibilityRole="button"
          importantForAccessibility={onRequestClose ? 'yes' : 'no-hide-descendants'}
        />
      </Animated.View>
      <Animated.View
        style={{ transform: [{ translateY }] }}
        accessibilityViewIsModal
        accessibilityLabel={accessibilityLabel}>
        <BottomSheetSurface bottomInset={insets.bottom} style={styles.raised} {...surface}>
          {children}
        </BottomSheetSurface>
      </Animated.View>
    </>
  );

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onRequestClose ?? (() => {})}>
      {avoidKeyboard ? (
        <KeyboardAvoidingView behavior="padding" style={styles.root}>
          {content}
        </KeyboardAvoidingView>
      ) : (
        <View style={styles.root}>{content}</View>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  scrim: {
    backgroundColor: colors.scrim,
  },
  surface: {
    backgroundColor: colors.white,
    paddingTop: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  raised: {
    boxShadow: shadow.sheet,
  },
  grabber: {
    width: 40,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.border,
  },
});
