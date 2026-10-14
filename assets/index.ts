/**
 * Approved art, copied unchanged from design/assets/.
 * Never recolor, stretch or crop through the body. Size by height and keep the aspect ratio.
 */
export const mascot = {
  wave: require('./mascot/mascot-wave.png'), // login, empty states
  face: require('./mascot/mascot-face.png'), // AI avatar
  point: require('./mascot/mascot-point.png'), // onboarding tips
  hug: require('./mascot/mascot-hug.png'), // confirmed payments only
  rocket: require('./mascot/mascot-rocket.png'), // splash
} as const;

export type MascotPose = keyof typeof mascot;

/** Pixel size of each render, used to keep the aspect ratio when sizing by height. */
export const mascotSize: Record<MascotPose, { width: number; height: number }> = {
  wave: { width: 474, height: 560 },
  face: { width: 256, height: 256 },
  point: { width: 442, height: 560 },
  hug: { width: 501, height: 640 },
  rocket: { width: 691, height: 760 },
};

export const illustrations = {
  skyClouds: require('./illustrations/sky-clouds.jpg'), // splash background, 720 × 1600
} as const;
