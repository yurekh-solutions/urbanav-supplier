// Shared animation timings and easings. Use these so motion feels consistent.
import { Easing } from 'react-native-reanimated';

export const DURATION = {
  instant: 120,
  fast: 200,
  base: 320,
  slow: 480,
  slower: 640,
};

export const EASE = {
  standard: Easing.bezier(0.2, 0.8, 0.2, 1),
  out: Easing.bezier(0, 0, 0.2, 1),
  in: Easing.bezier(0.4, 0, 1, 1),
  spring: Easing.bezier(0.34, 1.56, 0.64, 1),
};

export const STAGGER = {
  tight: 40,
  base: 60,
  loose: 90,
};

export const SCALE = {
  press: 0.96,
  tap: 0.94,
  hero: 1.02,
};
