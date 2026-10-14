import { Pressable, StyleSheet, View } from 'react-native';

import { colors, font, radius } from '@/theme';

import { Text } from './Text';

type Props = {
  firstName: string;
  lastName: string;
  /** 44 on Home (outlined, opens Profile), 60 on Profile. */
  size?: 44 | 60;
  onPress?: () => void;
  accessibilityLabel?: string;
};

/** Circle with the student's initials ("BR"). */
export function InitialsAvatar({ firstName, lastName, size = 44, onPress, accessibilityLabel }: Props) {
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  const large = size === 60;
  const body = (
    <Text style={[styles.text, large ? styles.textLarge : styles.textSmall]} importantForAccessibility="no">
      {initials}
    </Text>
  );
  const circle = [styles.circle, { width: size, height: size }, !large && styles.outlined];
  if (!onPress) {
    return (
      <View style={circle} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {body}
      </View>
    );
  }
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={accessibilityLabel} style={circle}>
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  circle: {
    flexShrink: 0,
    borderRadius: radius.full,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlined: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  text: {
    color: colors.textPrimary,
  },
  textSmall: {
    fontFamily: font.jakarta[700],
    fontSize: 15,
  },
  textLarge: {
    fontFamily: font.jakarta[800],
    fontSize: 20,
  },
});
