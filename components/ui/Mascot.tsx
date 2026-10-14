import { Image, type ImageStyle, type StyleProp } from 'react-native';

import { mascot, mascotSize, type MascotPose } from '@/assets';

type Props = {
  pose: MascotPose;
  /** Rendered height in dp. Width follows the art's own aspect ratio (CSS `width: auto`). */
  height: number;
  /** Only for art that carries meaning. Decorative art (alt="" in the design) stays hidden from screen readers. */
  accessibilityLabel?: string;
  style?: StyleProp<ImageStyle>;
};

/** The tiger mascot. Never stretched, cropped through the body or recolored. */
export function Mascot({ pose, height, accessibilityLabel, style }: Props) {
  const { width: w, height: h } = mascotSize[pose];
  const decorative = accessibilityLabel == null;
  return (
    <Image
      source={mascot[pose]}
      style={[{ height, width: (height * w) / h }, style]}
      resizeMode="contain"
      accessible={!decorative}
      accessibilityLabel={accessibilityLabel}
      accessibilityElementsHidden={decorative}
      importantForAccessibility={decorative ? 'no-hide-descendants' : 'yes'}
    />
  );
}
