import { memo } from 'react';

import { Platform, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import type { ThemeColor } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

type PixelIconName = keyof typeof GLYPHS;
interface PixelIconProps {
  name: PixelIconName;
  size?: number;
  tone?: ThemeColor;
  color?: string;
  style?: StyleProp<ViewStyle>;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/** Paths from the accepted handoff set; rejected alternatives are not bundled. */
const GLYPHS = {
  arrow: {
    viewBox: '0 0 12 12',
    path: 'M5 1h1v1h-1zM6 1h1v1h-1zM5 2h1v1h-1zM6 2h1v1h-1zM7 2h1v1h-1zM5 3h1v1h-1zM6 3h1v1h-1zM7 3h1v1h-1zM8 3h1v1h-1zM5 4h1v1h-1zM6 4h1v1h-1zM7 4h1v1h-1zM8 4h1v1h-1zM9 4h1v1h-1zM0 5h1v1h-1zM1 5h1v1h-1zM2 5h1v1h-1zM3 5h1v1h-1zM4 5h1v1h-1zM5 5h1v1h-1zM6 5h1v1h-1zM7 5h1v1h-1zM8 5h1v1h-1zM9 5h1v1h-1zM10 5h1v1h-1zM0 6h1v1h-1zM1 6h1v1h-1zM2 6h1v1h-1zM3 6h1v1h-1zM4 6h1v1h-1zM5 6h1v1h-1zM6 6h1v1h-1zM7 6h1v1h-1zM8 6h1v1h-1zM9 6h1v1h-1zM10 6h1v1h-1zM5 7h1v1h-1zM6 7h1v1h-1zM7 7h1v1h-1zM8 7h1v1h-1zM9 7h1v1h-1zM5 8h1v1h-1zM6 8h1v1h-1zM7 8h1v1h-1zM8 8h1v1h-1zM5 9h1v1h-1zM6 9h1v1h-1zM7 9h1v1h-1zM5 10h1v1h-1zM6 10h1v1h-1z',
  },
  back: {
    viewBox: '0 0 12 12',
    path: 'M7 1h1v1h-1zM8 1h1v1h-1zM6 2h1v1h-1zM7 2h1v1h-1zM8 2h1v1h-1zM5 3h1v1h-1zM6 3h1v1h-1zM7 3h1v1h-1zM4 4h1v1h-1zM5 4h1v1h-1zM6 4h1v1h-1zM3 5h1v1h-1zM4 5h1v1h-1zM5 5h1v1h-1zM3 6h1v1h-1zM4 6h1v1h-1zM5 6h1v1h-1zM4 7h1v1h-1zM5 7h1v1h-1zM6 7h1v1h-1zM5 8h1v1h-1zM6 8h1v1h-1zM7 8h1v1h-1zM6 9h1v1h-1zM7 9h1v1h-1zM8 9h1v1h-1zM7 10h1v1h-1zM8 10h1v1h-1z',
  },
  battery: {
    viewBox: '0 0 12 12',
    path: 'M4 0h1v1h-1zM5 0h1v1h-1zM6 0h1v1h-1zM7 0h1v1h-1zM2 1h1v1h-1zM3 1h1v1h-1zM4 1h1v1h-1zM5 1h1v1h-1zM6 1h1v1h-1zM7 1h1v1h-1zM8 1h1v1h-1zM9 1h1v1h-1zM2 2h1v1h-1zM9 2h1v1h-1zM2 3h1v1h-1zM4 3h1v1h-1zM5 3h1v1h-1zM6 3h1v1h-1zM7 3h1v1h-1zM9 3h1v1h-1zM2 4h1v1h-1zM4 4h1v1h-1zM5 4h1v1h-1zM6 4h1v1h-1zM7 4h1v1h-1zM9 4h1v1h-1zM2 5h1v1h-1zM9 5h1v1h-1zM2 6h1v1h-1zM4 6h1v1h-1zM5 6h1v1h-1zM6 6h1v1h-1zM7 6h1v1h-1zM9 6h1v1h-1zM2 7h1v1h-1zM4 7h1v1h-1zM5 7h1v1h-1zM6 7h1v1h-1zM7 7h1v1h-1zM9 7h1v1h-1zM2 8h1v1h-1zM9 8h1v1h-1zM2 9h1v1h-1zM4 9h1v1h-1zM5 9h1v1h-1zM6 9h1v1h-1zM7 9h1v1h-1zM9 9h1v1h-1zM2 10h1v1h-1zM9 10h1v1h-1zM2 11h1v1h-1zM3 11h1v1h-1zM4 11h1v1h-1zM5 11h1v1h-1zM6 11h1v1h-1zM7 11h1v1h-1zM8 11h1v1h-1zM9 11h1v1h-1z',
  },
  book: {
    viewBox: '0 0 12 12',
    path: 'M0 1h1v1h-1zM1 1h1v1h-1zM2 1h1v1h-1zM3 1h1v1h-1zM8 1h1v1h-1zM9 1h1v1h-1zM10 1h1v1h-1zM11 1h1v1h-1zM0 2h1v1h-1zM1 2h1v1h-1zM2 2h1v1h-1zM3 2h1v1h-1zM4 2h1v1h-1zM7 2h1v1h-1zM8 2h1v1h-1zM9 2h1v1h-1zM10 2h1v1h-1zM11 2h1v1h-1zM0 3h1v1h-1zM1 3h1v1h-1zM4 3h1v1h-1zM5 3h1v1h-1zM6 3h1v1h-1zM7 3h1v1h-1zM10 3h1v1h-1zM11 3h1v1h-1zM0 4h1v1h-1zM1 4h1v1h-1zM5 4h1v1h-1zM6 4h1v1h-1zM10 4h1v1h-1zM11 4h1v1h-1zM0 5h1v1h-1zM1 5h1v1h-1zM5 5h1v1h-1zM6 5h1v1h-1zM10 5h1v1h-1zM11 5h1v1h-1zM0 6h1v1h-1zM1 6h1v1h-1zM5 6h1v1h-1zM6 6h1v1h-1zM10 6h1v1h-1zM11 6h1v1h-1zM0 7h1v1h-1zM1 7h1v1h-1zM5 7h1v1h-1zM6 7h1v1h-1zM10 7h1v1h-1zM11 7h1v1h-1zM0 8h1v1h-1zM1 8h1v1h-1zM5 8h1v1h-1zM6 8h1v1h-1zM10 8h1v1h-1zM11 8h1v1h-1zM0 9h1v1h-1zM1 9h1v1h-1zM2 9h1v1h-1zM3 9h1v1h-1zM4 9h1v1h-1zM5 9h1v1h-1zM6 9h1v1h-1zM7 9h1v1h-1zM8 9h1v1h-1zM9 9h1v1h-1zM10 9h1v1h-1zM11 9h1v1h-1zM0 10h1v1h-1zM1 10h1v1h-1zM2 10h1v1h-1zM3 10h1v1h-1zM4 10h1v1h-1zM7 10h1v1h-1zM8 10h1v1h-1zM9 10h1v1h-1zM10 10h1v1h-1zM11 10h1v1h-1z',
  },
  check: {
    viewBox: '0 0 12 12',
    path: 'M10 1h1v1h-1zM11 1h1v1h-1zM9 2h1v1h-1zM10 2h1v1h-1zM11 2h1v1h-1zM8 3h1v1h-1zM9 3h1v1h-1zM10 3h1v1h-1zM7 4h1v1h-1zM8 4h1v1h-1zM9 4h1v1h-1zM0 5h1v1h-1zM1 5h1v1h-1zM6 5h1v1h-1zM7 5h1v1h-1zM8 5h1v1h-1zM0 6h1v1h-1zM1 6h1v1h-1zM2 6h1v1h-1zM5 6h1v1h-1zM6 6h1v1h-1zM7 6h1v1h-1zM1 7h1v1h-1zM2 7h1v1h-1zM3 7h1v1h-1zM4 7h1v1h-1zM5 7h1v1h-1zM6 7h1v1h-1zM2 8h1v1h-1zM3 8h1v1h-1zM4 8h1v1h-1zM5 8h1v1h-1zM3 9h1v1h-1zM4 9h1v1h-1z',
  },
  check20: {
    viewBox: '0 0 10 10',
    path: 'M8 1h1v1h-1zM9 1h1v1h-1zM7 2h1v1h-1zM8 2h1v1h-1zM9 2h1v1h-1zM6 3h1v1h-1zM7 3h1v1h-1zM8 3h1v1h-1zM0 4h1v1h-1zM1 4h1v1h-1zM5 4h1v1h-1zM6 4h1v1h-1zM7 4h1v1h-1zM0 5h1v1h-1zM1 5h1v1h-1zM2 5h1v1h-1zM4 5h1v1h-1zM5 5h1v1h-1zM6 5h1v1h-1zM1 6h1v1h-1zM2 6h1v1h-1zM3 6h1v1h-1zM4 6h1v1h-1zM5 6h1v1h-1zM2 7h1v1h-1zM3 7h1v1h-1zM4 7h1v1h-1zM3 8h1v1h-1z',
  },
  chevron: {
    viewBox: '0 0 12 12',
    path: 'M3 1h1v1h-1zM4 1h1v1h-1zM3 2h1v1h-1zM4 2h1v1h-1zM5 2h1v1h-1zM4 3h1v1h-1zM5 3h1v1h-1zM6 3h1v1h-1zM5 4h1v1h-1zM6 4h1v1h-1zM7 4h1v1h-1zM6 5h1v1h-1zM7 5h1v1h-1zM8 5h1v1h-1zM6 6h1v1h-1zM7 6h1v1h-1zM8 6h1v1h-1zM5 7h1v1h-1zM6 7h1v1h-1zM7 7h1v1h-1zM4 8h1v1h-1zM5 8h1v1h-1zM6 8h1v1h-1zM3 9h1v1h-1zM4 9h1v1h-1zM5 9h1v1h-1zM3 10h1v1h-1zM4 10h1v1h-1z',
  },
  clock: {
    viewBox: '0 0 12 12',
    path: 'M3 0h1v1h-1zM4 0h1v1h-1zM5 0h1v1h-1zM6 0h1v1h-1zM7 0h1v1h-1zM8 0h1v1h-1zM1 1h1v1h-1zM2 1h1v1h-1zM3 1h1v1h-1zM4 1h1v1h-1zM5 1h1v1h-1zM6 1h1v1h-1zM7 1h1v1h-1zM8 1h1v1h-1zM9 1h1v1h-1zM10 1h1v1h-1zM1 2h1v1h-1zM2 2h1v1h-1zM3 2h1v1h-1zM4 2h1v1h-1zM6 2h1v1h-1zM7 2h1v1h-1zM8 2h1v1h-1zM9 2h1v1h-1zM10 2h1v1h-1zM0 3h1v1h-1zM1 3h1v1h-1zM2 3h1v1h-1zM3 3h1v1h-1zM4 3h1v1h-1zM6 3h1v1h-1zM7 3h1v1h-1zM8 3h1v1h-1zM9 3h1v1h-1zM10 3h1v1h-1zM11 3h1v1h-1zM0 4h1v1h-1zM1 4h1v1h-1zM2 4h1v1h-1zM3 4h1v1h-1zM4 4h1v1h-1zM6 4h1v1h-1zM7 4h1v1h-1zM8 4h1v1h-1zM9 4h1v1h-1zM10 4h1v1h-1zM11 4h1v1h-1zM0 5h1v1h-1zM1 5h1v1h-1zM2 5h1v1h-1zM3 5h1v1h-1zM4 5h1v1h-1zM9 5h1v1h-1zM10 5h1v1h-1zM11 5h1v1h-1zM0 6h1v1h-1zM1 6h1v1h-1zM2 6h1v1h-1zM3 6h1v1h-1zM4 6h1v1h-1zM5 6h1v1h-1zM6 6h1v1h-1zM7 6h1v1h-1zM8 6h1v1h-1zM9 6h1v1h-1zM10 6h1v1h-1zM11 6h1v1h-1zM0 7h1v1h-1zM1 7h1v1h-1zM2 7h1v1h-1zM3 7h1v1h-1zM4 7h1v1h-1zM5 7h1v1h-1zM6 7h1v1h-1zM7 7h1v1h-1zM8 7h1v1h-1zM9 7h1v1h-1zM10 7h1v1h-1zM11 7h1v1h-1zM1 8h1v1h-1zM2 8h1v1h-1zM3 8h1v1h-1zM4 8h1v1h-1zM5 8h1v1h-1zM6 8h1v1h-1zM7 8h1v1h-1zM8 8h1v1h-1zM9 8h1v1h-1zM10 8h1v1h-1zM1 9h1v1h-1zM2 9h1v1h-1zM3 9h1v1h-1zM4 9h1v1h-1zM5 9h1v1h-1zM6 9h1v1h-1zM7 9h1v1h-1zM8 9h1v1h-1zM9 9h1v1h-1zM10 9h1v1h-1zM3 10h1v1h-1zM4 10h1v1h-1zM5 10h1v1h-1zM6 10h1v1h-1zM7 10h1v1h-1zM8 10h1v1h-1z',
  },
  close: {
    viewBox: '0 0 12 12',
    path: 'M1 1h1v1h-1zM2 1h1v1h-1zM9 1h1v1h-1zM10 1h1v1h-1zM1 2h1v1h-1zM2 2h1v1h-1zM3 2h1v1h-1zM8 2h1v1h-1zM9 2h1v1h-1zM10 2h1v1h-1zM2 3h1v1h-1zM3 3h1v1h-1zM4 3h1v1h-1zM7 3h1v1h-1zM8 3h1v1h-1zM9 3h1v1h-1zM3 4h1v1h-1zM4 4h1v1h-1zM5 4h1v1h-1zM6 4h1v1h-1zM7 4h1v1h-1zM8 4h1v1h-1zM4 5h1v1h-1zM5 5h1v1h-1zM6 5h1v1h-1zM7 5h1v1h-1zM4 6h1v1h-1zM5 6h1v1h-1zM6 6h1v1h-1zM7 6h1v1h-1zM3 7h1v1h-1zM4 7h1v1h-1zM5 7h1v1h-1zM6 7h1v1h-1zM7 7h1v1h-1zM8 7h1v1h-1zM2 8h1v1h-1zM3 8h1v1h-1zM4 8h1v1h-1zM7 8h1v1h-1zM8 8h1v1h-1zM9 8h1v1h-1zM1 9h1v1h-1zM2 9h1v1h-1zM3 9h1v1h-1zM8 9h1v1h-1zM9 9h1v1h-1zM10 9h1v1h-1zM1 10h1v1h-1zM2 10h1v1h-1zM9 10h1v1h-1zM10 10h1v1h-1z',
  },
  coin: {
    viewBox: '0 0 12 12',
    path: 'M4 0h1v1h-1zM5 0h1v1h-1zM6 0h1v1h-1zM7 0h1v1h-1zM2 1h1v1h-1zM3 1h1v1h-1zM4 1h1v1h-1zM5 1h1v1h-1zM6 1h1v1h-1zM7 1h1v1h-1zM8 1h1v1h-1zM9 1h1v1h-1zM1 2h1v1h-1zM2 2h1v1h-1zM3 2h1v1h-1zM4 2h1v1h-1zM5 2h1v1h-1zM6 2h1v1h-1zM7 2h1v1h-1zM8 2h1v1h-1zM9 2h1v1h-1zM10 2h1v1h-1zM1 3h1v1h-1zM2 3h1v1h-1zM3 3h1v1h-1zM4 3h1v1h-1zM7 3h1v1h-1zM8 3h1v1h-1zM9 3h1v1h-1zM10 3h1v1h-1zM0 4h1v1h-1zM1 4h1v1h-1zM2 4h1v1h-1zM3 4h1v1h-1zM4 4h1v1h-1zM7 4h1v1h-1zM8 4h1v1h-1zM9 4h1v1h-1zM10 4h1v1h-1zM11 4h1v1h-1zM0 5h1v1h-1zM1 5h1v1h-1zM2 5h1v1h-1zM3 5h1v1h-1zM4 5h1v1h-1zM7 5h1v1h-1zM8 5h1v1h-1zM9 5h1v1h-1zM10 5h1v1h-1zM11 5h1v1h-1zM0 6h1v1h-1zM1 6h1v1h-1zM2 6h1v1h-1zM3 6h1v1h-1zM4 6h1v1h-1zM7 6h1v1h-1zM8 6h1v1h-1zM9 6h1v1h-1zM10 6h1v1h-1zM11 6h1v1h-1zM0 7h1v1h-1zM1 7h1v1h-1zM2 7h1v1h-1zM3 7h1v1h-1zM4 7h1v1h-1zM7 7h1v1h-1zM8 7h1v1h-1zM9 7h1v1h-1zM10 7h1v1h-1zM11 7h1v1h-1zM1 8h1v1h-1zM2 8h1v1h-1zM3 8h1v1h-1zM4 8h1v1h-1zM7 8h1v1h-1zM8 8h1v1h-1zM9 8h1v1h-1zM10 8h1v1h-1zM1 9h1v1h-1zM2 9h1v1h-1zM3 9h1v1h-1zM4 9h1v1h-1zM5 9h1v1h-1zM6 9h1v1h-1zM7 9h1v1h-1zM8 9h1v1h-1zM9 9h1v1h-1zM10 9h1v1h-1zM2 10h1v1h-1zM3 10h1v1h-1zM4 10h1v1h-1zM5 10h1v1h-1zM6 10h1v1h-1zM7 10h1v1h-1zM8 10h1v1h-1zM9 10h1v1h-1zM4 11h1v1h-1zM5 11h1v1h-1zM6 11h1v1h-1zM7 11h1v1h-1z',
  },
  face: {
    viewBox: '0 0 12 12',
    path: 'M0 1h1v1h-1zM1 1h1v1h-1zM2 1h1v1h-1zM3 1h1v1h-1zM4 1h1v1h-1zM5 1h1v1h-1zM6 1h1v1h-1zM7 1h1v1h-1zM8 1h1v1h-1zM9 1h1v1h-1zM10 1h1v1h-1zM11 1h1v1h-1zM0 2h1v1h-1zM11 2h1v1h-1zM0 3h1v1h-1zM2 3h1v1h-1zM3 3h1v1h-1zM8 3h1v1h-1zM9 3h1v1h-1zM11 3h1v1h-1zM0 4h1v1h-1zM3 4h1v1h-1zM4 4h1v1h-1zM7 4h1v1h-1zM8 4h1v1h-1zM11 4h1v1h-1zM0 5h1v1h-1zM11 5h1v1h-1zM0 6h1v1h-1zM3 6h1v1h-1zM4 6h1v1h-1zM5 6h1v1h-1zM6 6h1v1h-1zM7 6h1v1h-1zM8 6h1v1h-1zM11 6h1v1h-1zM0 7h1v1h-1zM11 7h1v1h-1zM0 8h1v1h-1zM1 8h1v1h-1zM2 8h1v1h-1zM3 8h1v1h-1zM4 8h1v1h-1zM5 8h1v1h-1zM6 8h1v1h-1zM7 8h1v1h-1zM8 8h1v1h-1zM9 8h1v1h-1zM10 8h1v1h-1zM11 8h1v1h-1zM4 9h1v1h-1zM5 9h1v1h-1zM6 9h1v1h-1zM7 9h1v1h-1zM2 10h1v1h-1zM3 10h1v1h-1zM4 10h1v1h-1zM5 10h1v1h-1zM6 10h1v1h-1zM7 10h1v1h-1zM8 10h1v1h-1zM9 10h1v1h-1z',
  },
  gear: {
    viewBox: '0 0 12 12',
    path: 'M5 0h1v1h-1zM6 0h1v1h-1zM2 1h1v1h-1zM4 1h1v1h-1zM5 1h1v1h-1zM6 1h1v1h-1zM7 1h1v1h-1zM9 1h1v1h-1zM1 2h1v1h-1zM2 2h1v1h-1zM3 2h1v1h-1zM4 2h1v1h-1zM5 2h1v1h-1zM6 2h1v1h-1zM7 2h1v1h-1zM8 2h1v1h-1zM9 2h1v1h-1zM10 2h1v1h-1zM2 3h1v1h-1zM3 3h1v1h-1zM4 3h1v1h-1zM7 3h1v1h-1zM8 3h1v1h-1zM9 3h1v1h-1zM1 4h1v1h-1zM2 4h1v1h-1zM3 4h1v1h-1zM8 4h1v1h-1zM9 4h1v1h-1zM10 4h1v1h-1zM0 5h1v1h-1zM1 5h1v1h-1zM2 5h1v1h-1zM3 5h1v1h-1zM8 5h1v1h-1zM9 5h1v1h-1zM10 5h1v1h-1zM11 5h1v1h-1zM0 6h1v1h-1zM1 6h1v1h-1zM2 6h1v1h-1zM3 6h1v1h-1zM8 6h1v1h-1zM9 6h1v1h-1zM10 6h1v1h-1zM11 6h1v1h-1zM1 7h1v1h-1zM2 7h1v1h-1zM3 7h1v1h-1zM8 7h1v1h-1zM9 7h1v1h-1zM10 7h1v1h-1zM2 8h1v1h-1zM3 8h1v1h-1zM4 8h1v1h-1zM7 8h1v1h-1zM8 8h1v1h-1zM9 8h1v1h-1zM1 9h1v1h-1zM2 9h1v1h-1zM3 9h1v1h-1zM4 9h1v1h-1zM5 9h1v1h-1zM6 9h1v1h-1zM7 9h1v1h-1zM8 9h1v1h-1zM9 9h1v1h-1zM10 9h1v1h-1zM2 10h1v1h-1zM4 10h1v1h-1zM5 10h1v1h-1zM6 10h1v1h-1zM7 10h1v1h-1zM9 10h1v1h-1zM5 11h1v1h-1zM6 11h1v1h-1z',
  },
  heart: {
    viewBox: '0 0 12 12',
    path: 'M1 1h1v1h-1zM2 1h1v1h-1zM3 1h1v1h-1zM8 1h1v1h-1zM9 1h1v1h-1zM10 1h1v1h-1zM0 2h1v1h-1zM1 2h1v1h-1zM2 2h1v1h-1zM3 2h1v1h-1zM4 2h1v1h-1zM7 2h1v1h-1zM8 2h1v1h-1zM9 2h1v1h-1zM10 2h1v1h-1zM11 2h1v1h-1zM0 3h1v1h-1zM1 3h1v1h-1zM2 3h1v1h-1zM3 3h1v1h-1zM4 3h1v1h-1zM5 3h1v1h-1zM6 3h1v1h-1zM7 3h1v1h-1zM8 3h1v1h-1zM9 3h1v1h-1zM10 3h1v1h-1zM11 3h1v1h-1zM0 4h1v1h-1zM1 4h1v1h-1zM2 4h1v1h-1zM3 4h1v1h-1zM4 4h1v1h-1zM5 4h1v1h-1zM6 4h1v1h-1zM7 4h1v1h-1zM8 4h1v1h-1zM9 4h1v1h-1zM10 4h1v1h-1zM11 4h1v1h-1zM0 5h1v1h-1zM1 5h1v1h-1zM2 5h1v1h-1zM3 5h1v1h-1zM4 5h1v1h-1zM5 5h1v1h-1zM6 5h1v1h-1zM7 5h1v1h-1zM8 5h1v1h-1zM9 5h1v1h-1zM10 5h1v1h-1zM11 5h1v1h-1zM1 6h1v1h-1zM2 6h1v1h-1zM3 6h1v1h-1zM4 6h1v1h-1zM5 6h1v1h-1zM6 6h1v1h-1zM7 6h1v1h-1zM8 6h1v1h-1zM9 6h1v1h-1zM10 6h1v1h-1zM2 7h1v1h-1zM3 7h1v1h-1zM4 7h1v1h-1zM5 7h1v1h-1zM6 7h1v1h-1zM7 7h1v1h-1zM8 7h1v1h-1zM9 7h1v1h-1zM3 8h1v1h-1zM4 8h1v1h-1zM5 8h1v1h-1zM6 8h1v1h-1zM7 8h1v1h-1zM8 8h1v1h-1zM4 9h1v1h-1zM5 9h1v1h-1zM6 9h1v1h-1zM7 9h1v1h-1zM5 10h1v1h-1zM6 10h1v1h-1z',
  },
  lock: {
    viewBox: '0 0 12 12',
    path: 'M4 1h1v1h-1zM5 1h1v1h-1zM6 1h1v1h-1zM7 1h1v1h-1zM3 2h1v1h-1zM4 2h1v1h-1zM7 2h1v1h-1zM8 2h1v1h-1zM3 3h1v1h-1zM8 3h1v1h-1zM3 4h1v1h-1zM8 4h1v1h-1zM2 5h1v1h-1zM3 5h1v1h-1zM4 5h1v1h-1zM5 5h1v1h-1zM6 5h1v1h-1zM7 5h1v1h-1zM8 5h1v1h-1zM9 5h1v1h-1zM2 6h1v1h-1zM3 6h1v1h-1zM4 6h1v1h-1zM5 6h1v1h-1zM6 6h1v1h-1zM7 6h1v1h-1zM8 6h1v1h-1zM9 6h1v1h-1zM2 7h1v1h-1zM3 7h1v1h-1zM4 7h1v1h-1zM7 7h1v1h-1zM8 7h1v1h-1zM9 7h1v1h-1zM2 8h1v1h-1zM3 8h1v1h-1zM4 8h1v1h-1zM7 8h1v1h-1zM8 8h1v1h-1zM9 8h1v1h-1zM2 9h1v1h-1zM3 9h1v1h-1zM4 9h1v1h-1zM5 9h1v1h-1zM6 9h1v1h-1zM7 9h1v1h-1zM8 9h1v1h-1zM9 9h1v1h-1zM2 10h1v1h-1zM3 10h1v1h-1zM4 10h1v1h-1zM5 10h1v1h-1zM6 10h1v1h-1zM7 10h1v1h-1zM8 10h1v1h-1zM9 10h1v1h-1z',
  },
  piggy: {
    viewBox: '0 0 12 12',
    path: 'M7 1h1v1h-1zM8 1h1v1h-1zM2 2h1v1h-1zM3 2h1v1h-1zM6 2h1v1h-1zM7 2h1v1h-1zM8 2h1v1h-1zM1 3h1v1h-1zM2 3h1v1h-1zM3 3h1v1h-1zM4 3h1v1h-1zM5 3h1v1h-1zM6 3h1v1h-1zM7 3h1v1h-1zM8 3h1v1h-1zM9 3h1v1h-1zM1 4h1v1h-1zM2 4h1v1h-1zM3 4h1v1h-1zM4 4h1v1h-1zM5 4h1v1h-1zM6 4h1v1h-1zM8 4h1v1h-1zM9 4h1v1h-1zM10 4h1v1h-1zM11 4h1v1h-1zM1 5h1v1h-1zM2 5h1v1h-1zM3 5h1v1h-1zM4 5h1v1h-1zM5 5h1v1h-1zM6 5h1v1h-1zM7 5h1v1h-1zM8 5h1v1h-1zM9 5h1v1h-1zM10 5h1v1h-1zM11 5h1v1h-1zM0 6h1v1h-1zM1 6h1v1h-1zM2 6h1v1h-1zM3 6h1v1h-1zM4 6h1v1h-1zM5 6h1v1h-1zM6 6h1v1h-1zM7 6h1v1h-1zM8 6h1v1h-1zM9 6h1v1h-1zM10 6h1v1h-1zM11 6h1v1h-1zM1 7h1v1h-1zM2 7h1v1h-1zM3 7h1v1h-1zM4 7h1v1h-1zM5 7h1v1h-1zM6 7h1v1h-1zM7 7h1v1h-1zM8 7h1v1h-1zM9 7h1v1h-1zM10 7h1v1h-1zM1 8h1v1h-1zM2 8h1v1h-1zM3 8h1v1h-1zM4 8h1v1h-1zM5 8h1v1h-1zM6 8h1v1h-1zM7 8h1v1h-1zM8 8h1v1h-1zM9 8h1v1h-1zM10 8h1v1h-1zM2 9h1v1h-1zM3 9h1v1h-1zM8 9h1v1h-1zM9 9h1v1h-1zM2 10h1v1h-1zM3 10h1v1h-1zM8 10h1v1h-1zM9 10h1v1h-1z',
  },
  plan: {
    viewBox: '0 0 12 12',
    path: 'M4 0h1v1h-1zM5 0h1v1h-1zM6 0h1v1h-1zM7 0h1v1h-1zM1 1h1v1h-1zM2 1h1v1h-1zM3 1h1v1h-1zM5 1h1v1h-1zM6 1h1v1h-1zM8 1h1v1h-1zM9 1h1v1h-1zM10 1h1v1h-1zM1 2h1v1h-1zM10 2h1v1h-1zM1 3h1v1h-1zM3 3h1v1h-1zM4 3h1v1h-1zM5 3h1v1h-1zM6 3h1v1h-1zM7 3h1v1h-1zM8 3h1v1h-1zM10 3h1v1h-1zM1 4h1v1h-1zM10 4h1v1h-1zM1 5h1v1h-1zM3 5h1v1h-1zM4 5h1v1h-1zM5 5h1v1h-1zM6 5h1v1h-1zM7 5h1v1h-1zM8 5h1v1h-1zM10 5h1v1h-1zM1 6h1v1h-1zM10 6h1v1h-1zM1 7h1v1h-1zM3 7h1v1h-1zM4 7h1v1h-1zM5 7h1v1h-1zM6 7h1v1h-1zM10 7h1v1h-1zM1 8h1v1h-1zM10 8h1v1h-1zM1 9h1v1h-1zM3 9h1v1h-1zM4 9h1v1h-1zM5 9h1v1h-1zM6 9h1v1h-1zM7 9h1v1h-1zM10 9h1v1h-1zM1 10h1v1h-1zM10 10h1v1h-1zM1 11h1v1h-1zM2 11h1v1h-1zM3 11h1v1h-1zM4 11h1v1h-1zM5 11h1v1h-1zM6 11h1v1h-1zM7 11h1v1h-1zM8 11h1v1h-1zM9 11h1v1h-1zM10 11h1v1h-1z',
  },
  question: {
    viewBox: '0 0 12 12',
    path: 'M4 0h1v1h-1zM5 0h1v1h-1zM6 0h1v1h-1zM7 0h1v1h-1zM3 1h1v1h-1zM4 1h1v1h-1zM5 1h1v1h-1zM6 1h1v1h-1zM7 1h1v1h-1zM8 1h1v1h-1zM2 2h1v1h-1zM3 2h1v1h-1zM4 2h1v1h-1zM7 2h1v1h-1zM8 2h1v1h-1zM9 2h1v1h-1zM7 3h1v1h-1zM8 3h1v1h-1zM9 3h1v1h-1zM6 4h1v1h-1zM7 4h1v1h-1zM8 4h1v1h-1zM5 5h1v1h-1zM6 5h1v1h-1zM7 5h1v1h-1zM5 6h1v1h-1zM6 6h1v1h-1zM5 7h1v1h-1zM6 7h1v1h-1zM5 9h1v1h-1zM6 9h1v1h-1zM5 10h1v1h-1zM6 10h1v1h-1z',
  },
  settings: {
    viewBox: '0 0 12 12',
    path: 'M2 1h1v1h-1zM8 1h1v1h-1zM2 2h1v1h-1zM7 2h1v1h-1zM8 2h1v1h-1zM9 2h1v1h-1zM2 3h1v1h-1zM7 3h1v1h-1zM8 3h1v1h-1zM9 3h1v1h-1zM1 4h1v1h-1zM2 4h1v1h-1zM3 4h1v1h-1zM8 4h1v1h-1zM1 5h1v1h-1zM2 5h1v1h-1zM3 5h1v1h-1zM8 5h1v1h-1zM2 6h1v1h-1zM8 6h1v1h-1zM2 7h1v1h-1zM8 7h1v1h-1zM2 8h1v1h-1zM7 8h1v1h-1zM8 8h1v1h-1zM9 8h1v1h-1zM2 9h1v1h-1zM7 9h1v1h-1zM8 9h1v1h-1zM9 9h1v1h-1zM2 10h1v1h-1zM8 10h1v1h-1z',
  },
  up: {
    viewBox: '0 0 12 12',
    path: 'M5 1h1v1h-1zM6 1h1v1h-1zM4 2h1v1h-1zM5 2h1v1h-1zM6 2h1v1h-1zM7 2h1v1h-1zM3 3h1v1h-1zM4 3h1v1h-1zM5 3h1v1h-1zM6 3h1v1h-1zM7 3h1v1h-1zM8 3h1v1h-1zM2 4h1v1h-1zM3 4h1v1h-1zM4 4h1v1h-1zM5 4h1v1h-1zM6 4h1v1h-1zM7 4h1v1h-1zM8 4h1v1h-1zM9 4h1v1h-1zM1 5h1v1h-1zM2 5h1v1h-1zM3 5h1v1h-1zM4 5h1v1h-1zM5 5h1v1h-1zM6 5h1v1h-1zM7 5h1v1h-1zM8 5h1v1h-1zM9 5h1v1h-1zM10 5h1v1h-1zM1 6h1v1h-1zM2 6h1v1h-1zM3 6h1v1h-1zM4 6h1v1h-1zM5 6h1v1h-1zM6 6h1v1h-1zM7 6h1v1h-1zM8 6h1v1h-1zM9 6h1v1h-1zM10 6h1v1h-1zM5 7h1v1h-1zM6 7h1v1h-1zM5 8h1v1h-1zM6 8h1v1h-1zM5 9h1v1h-1zM6 9h1v1h-1zM5 10h1v1h-1zM6 10h1v1h-1zM5 11h1v1h-1zM6 11h1v1h-1z',
  },
  wrench: {
    viewBox: '0 0 12 12',
    path: 'M8 0h1v1h-1zM11 0h1v1h-1zM8 1h1v1h-1zM11 1h1v1h-1zM8 2h1v1h-1zM9 2h1v1h-1zM10 2h1v1h-1zM11 2h1v1h-1zM7 3h1v1h-1zM8 3h1v1h-1zM9 3h1v1h-1zM10 3h1v1h-1zM6 4h1v1h-1zM7 4h1v1h-1zM8 4h1v1h-1zM5 5h1v1h-1zM6 5h1v1h-1zM7 5h1v1h-1zM4 6h1v1h-1zM5 6h1v1h-1zM6 6h1v1h-1zM3 7h1v1h-1zM4 7h1v1h-1zM5 7h1v1h-1zM2 8h1v1h-1zM3 8h1v1h-1zM4 8h1v1h-1zM1 9h1v1h-1zM2 9h1v1h-1zM3 9h1v1h-1zM1 10h1v1h-1zM2 10h1v1h-1z',
  },
  plus: {
    viewBox: '0 0 12 12',
    path: 'M5 2h2v3h3v2H7v3H5V7H2V5h3z',
  },
  minus: {
    viewBox: '0 0 12 12',
    path: 'M2 5h8v2H2z',
  },
} as const;

export const PIXEL_ICON_NAMES = Object.keys(GLYPHS) as PixelIconName[];

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

/** Decorative: the surrounding control supplies the accessible name. */
export const PixelIcon = memo(
  ({ name, size = 24, tone = 'phosphor', color, style }: PixelIconProps) => {
    const theme = useTheme();
    const glyph = GLYPHS[name];
    return (
      <Svg
        style={style}
        width={size}
        height={size}
        viewBox={glyph.viewBox}
        {...(Platform.OS === 'web'
          ? { 'aria-hidden': true }
          : {
              accessible: false,
              accessibilityElementsHidden: true,
              importantForAccessibility: 'no-hide-descendants' as const,
            })}
        pointerEvents="none"
      >
        <Path d={glyph.path} fill={color ?? theme[tone]} />
      </Svg>
    );
  },
);

export type { PixelIconName, PixelIconProps };
