import { Platform } from 'react-native';

// ═══════════════════════════════════════════
// COLORS
// ═══════════════════════════════════════════

export const COLORS = {
  light: {
    background: '#FBF3E7',
    backgroundAlt: '#F4F1EA',
    surface: '#FFFFFF',
    surfaceSoft: '#F8E7D2',
    surfaceDeep: '#EFE6D9',

    border: 'rgba(63, 51, 44, 0.10)',
    borderStrong: 'rgba(63, 51, 44, 0.16)',

    text: '#3F332C',
    textSecondary: '#6B5C51',
    textMuted: '#8A7A6E',
    textDisabled: '#A99788',

    primary: '#2AA4C0',
    primaryPressed: '#238BA3',
    primaryShadow: '#1E7A90',
    primarySoft: '#D6F0F6',
    primaryStrong: '#1A6F84',

    accent: '#FF8F2A',
    accentPressed: '#E07818',
    accentShadow: '#C96810',
    accentSoft: '#FFE8CC',
    accentStrong: '#B85E0E',

    success: '#6DA97C',
    successPressed: '#5C9469',
    successShadow: '#4E8A5D',
    successSoft: '#E4F0E6',
    successStrong: '#2F6B44',

    warning: '#E5A83B',
    warningSoft: '#F4EAD8',
    warningStrong: '#8A6A1E',

    coin: '#FFC84A',
    coinBorder: '#E8A820',
    coinSoft: '#FFE6A8',

    parent: '#5C6B7A',
    parentBackground: '#F4F5F7',
    parentSurface: '#FFFFFF',
    parentBorder: 'rgba(44, 55, 66, 0.10)',
    parentText: '#2C3742',
    parentTextSecondary: '#67737F',

    disabled: '#DFD6C8',
    onDisabled: '#A99788',

    overlay: 'rgba(63, 51, 44, 0.42)',
    inverseSurface: '#3F332C',
    inverseText: '#FBF3E7',

    /** Handheld plastic body — toys-shop console chrome. */
    arcadeShell: '#3A9AA8',
    arcadeShellDeep: '#2A7884',
    arcadeShellHighlight: '#6BC4D0',
    /** LCD well behind the playfield. */
    arcadeScreen: '#10241F',
    arcadeScreenGlow: '#1C3F36',
    /** On-LCD glyphs and score. */
    arcadeLcd: '#7CFF9A',
    arcadeLcdDim: '#3D8F5A',
    /** Face buttons on the shell. */
    arcadeButtonA: '#FF8F2A',
    arcadeButtonB: '#E85D75',
    arcadeDpad: '#2F3E42',
    arcadeDpadFace: '#E8F2F4',
    /** Snake palette on the LCD. */
    snakeHead: '#7CFF9A',
    snakeBody: '#3D8F5A',
    snakeApple: '#FF8F2A',
  },
  dark: {
    background: '#241E1A',
    backgroundAlt: '#2A2420',
    surface: '#2E2723',
    surfaceSoft: '#3A302A',
    surfaceDeep: '#201A17',

    border: 'rgba(251, 243, 231, 0.12)',
    borderStrong: 'rgba(251, 243, 231, 0.20)',

    text: '#FBF3E7',
    textSecondary: '#D8CBBB',
    textMuted: '#B3A493',
    textDisabled: '#8A7A6E',

    primary: '#3FA5BD',
    primaryPressed: '#348B9F',
    primaryShadow: '#26798C',
    primarySoft: '#1F3B42',
    primaryStrong: '#9AD3E2',

    accent: '#EE9A44',
    accentPressed: '#CE7F2C',
    accentShadow: '#B96C18',
    accentSoft: '#3D2C19',
    accentStrong: '#F3C08A',

    success: '#7CB98B',
    successPressed: '#699F77',
    successShadow: '#4E8A5D',
    successSoft: '#22301F',
    successStrong: '#A9D6B4',

    warning: '#E5A83B',
    warningSoft: '#3A2E1B',
    warningStrong: '#F0CE8C',

    coin: '#FFC84A',
    coinBorder: '#E8A820',
    coinSoft: '#4A3B1D',

    parent: '#8695A4',
    parentBackground: '#22272C',
    parentSurface: '#2C333A',
    parentBorder: 'rgba(233, 238, 243, 0.12)',
    parentText: '#E9EEF3',
    parentTextSecondary: '#A9B4BF',

    disabled: '#3A322C',
    onDisabled: '#7E7166',

    overlay: 'rgba(20, 15, 12, 0.56)',
    inverseSurface: '#FBF3E7',
    inverseText: '#3F332C',

    /** Handheld plastic body — toys-shop console chrome. */
    arcadeShell: '#2F7A86',
    arcadeShellDeep: '#1F5560',
    arcadeShellHighlight: '#4FA8B6',
    /** LCD well behind the playfield. */
    arcadeScreen: '#0A1814',
    arcadeScreenGlow: '#143028',
    /** On-LCD glyphs and score. */
    arcadeLcd: '#7CFF9A',
    arcadeLcdDim: '#2F6B48',
    /** Face buttons on the shell. */
    arcadeButtonA: '#EE9A44',
    arcadeButtonB: '#D4566C',
    arcadeDpad: '#1C282C',
    arcadeDpadFace: '#C5D4D8',
    /** Snake palette on the LCD. */
    snakeHead: '#7CFF9A',
    snakeBody: '#2F6B48',
    snakeApple: '#EE9A44',
  },
} as const;

export type ThemeColor = keyof typeof COLORS.light & keyof typeof COLORS.dark;

// ═══════════════════════════════════════════
// TYPOGRAPHY
// ═══════════════════════════════════════════

export const FONTS = Platform.select({
  ios: {
    sans: 'system-ui',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'Nunito, system-ui, sans-serif',
    rounded: 'Nunito, system-ui, sans-serif',
    mono: 'ui-monospace, monospace',
  },
});

// ═══════════════════════════════════════════
// SPACING & SHAPE
// ═══════════════════════════════════════════

export const SPACING_BASE = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const SPACING = {
  half: SPACING_BASE.half,
  one: SPACING_BASE.one,
  two: SPACING_BASE.two,
  three: SPACING_BASE.three,
  four: SPACING_BASE.four,
  five: SPACING_BASE.five,
  six: SPACING_BASE.six,
};

export type Spacing = keyof typeof SPACING;

export const RADII = {
  xs: 8,
  s: 12,
  m: 14,
  l: 18,
  xl: 20,
  xxl: 24,
  xxxl: 28,
  pill: 999,
};

/** Horizontal gutter every screen keeps between its content and the edge. */
export const CONTENT_PADDING = SPACING.three;
export const MAX_CONTENT_WIDTH = 560;

export const BOTTOM_TAB_INSET = Platform.select({ ios: 50, android: 80 }) ?? 0;
