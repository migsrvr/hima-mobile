import { StyleSheet, View, Modal, type StyleProp, type ViewStyle } from 'react-native';

import { colors, font, lineHeight, radius, type Tone } from '@/theme';

import { HimaButton, type ButtonVariant } from './HimaButton';
import { IconTile } from './IconTile';
import type { LucideIcon } from './icons';
import { Text } from './Text';

type Action = { label: string; onPress: () => void; variant: ButtonVariant };

type SurfaceProps = {
  icon: LucideIcon;
  iconTone?: Tone;
  title: string;
  message: string;
  /** Rendered side by side, equal width. */
  actions: Action[];
  style?: StyleProp<ViewStyle>;
};

/** The dialog card: tinted icon, title, message, side-by-side actions. */
export function DialogSurface({ icon, iconTone = 'yellow', title, message, actions, style }: SurfaceProps) {
  return (
    <View style={[styles.dialog, style]} accessibilityRole="alert" accessibilityLabel={title}>
      <IconTile icon={icon} tone={iconTone} size={44} iconSize={22} />
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      <Text style={styles.message}>{message}</Text>
      <View style={styles.actions}>
        {actions.map((a) => (
          <HimaButton
            key={a.label}
            label={a.label}
            onPress={a.onPress}
            variant={a.variant}
            size="dialog"
            style={styles.action}
          />
        ))}
      </View>
    </View>
  );
}

type Props = SurfaceProps & {
  visible: boolean;
  /** Android back button. Usually the safe choice (e.g. keep reserve). */
  onRequestClose: () => void;
};

/** Centered dialog over a Dark Navy scrim. Used for decisions about money (e.g. using the emergency reserve). */
export function HimaModal({ visible, onRequestClose, ...surface }: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onRequestClose}>
      <View style={styles.scrim} accessibilityViewIsModal>
        <DialogSurface {...surface} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: colors.scrim,
  },
  dialog: {
    backgroundColor: colors.white,
    borderRadius: radius[20],
    padding: 20,
    gap: 10,
  },
  title: {
    fontFamily: font.jakarta[700],
    fontSize: 17,
    color: colors.textPrimary,
  },
  message: {
    fontFamily: font.inter[400],
    fontSize: 14,
    lineHeight: lineHeight(14, 1.5),
    color: colors.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  action: {
    flex: 1,
  },
});
