// ═══════════════════════════════════════════
// COLORS
// ═══════════════════════════════════════════

/** Terminal 2b. Hardware keeps its phosphor palette in either system theme. */
const TERMINAL_COLORS = {
  launchBackground: '#0D1830',
  sceneLight: '#D7D9D2',
  surfaceLight: '#F2F2EE',
  surfaceShade: '#E3E4DF',
  sceneBase: '#C9CBC4',
  sceneShade: '#B9BCB4',
  sceneInk: '#1E2A22',
  bezel: '#3C4A40',
  terminalScreen: '#0E2016',
  background: '#0E2016',
  backgroundAlt: '#132B1C',
  surface: '#132B1C',
  surfaceSoft: '#1B3A26',
  surfaceDeep: '#0B1A12',
  border: '#2F5E3E',
  borderStrong: '#4E8C5E',
  text: '#E3F7E5',
  textSecondary: '#A9D8B0',
  textMuted: '#8CC596',
  textDisabled: '#6FA87A',
  phosphor: '#9EF0A8',
  onAccent: '#0B1A12',
  primary: '#9EF0A8',
  primaryPressed: '#7FD08A',
  primarySoft: '#1B3A26',
  primaryStrong: '#9EF0A8',
  warning: '#F2C879',
  warningSoft: '#302B1C',
  coin: '#F2C879',
  parent: '#8CC596',
  disabled: '#1B3A26',
  onDisabled: '#6FA87A',
  overlay: 'rgba(11, 26, 18, 0.72)',
  /** Light veil behind a sheet: the game stays readable underneath. */
  scrim: 'rgba(11, 26, 18, 0.32)',
  scanline: 'rgba(158, 240, 168, 0.04)',
  glow: 'rgba(158, 240, 168, 0.45)',
  inverseSurface: '#9EF0A8',
  inverseText: '#0B1A12',
  arcadeShell: '#3C4A40',
  arcadeShellDeep: '#1E2A22',
  arcadeShellHighlight: '#4E8C5E',
  arcadeScreen: '#0E2016',
  arcadeScreenGlow: '#1B3A26',
  arcadeLcd: '#9EF0A8',
  arcadeLcdDim: '#8CC596',
  /** The Overseer's voice label — CRT red on his screen. */
  overseerLcd: '#F07167',
  /** The Overseer's task card and speech bubble — red-tinted screen. */
  overseerSurface: '#2A1414',
  arcadeButtonA: '#9EF0A8',
  arcadeButtonB: '#A9D8B0',
  arcadeDpad: '#1E2A22',
  arcadeDpadFace: '#E3F7E5',
  snakeHead: '#9EF0A8',
  snakeBody: '#4E8C5E',
  snakeApple: '#F2C879',
} as const;

type ThemeColor = keyof typeof TERMINAL_COLORS;
/** Runtime theme may swap voice tints; values are plain CSS colors. */
type ThemeColors = { [K in ThemeColor]: string };

/**
 * Full chrome tint for a watcher's terminal — screen, bezel, borders and the
 * phosphor accents (labels, icons, LED) so the whole panel reads as one voice.
 */
const KEEPER_TERMINAL_PALETTE: Partial<ThemeColors> = {
  bezel: '#2A3A4A',
  terminalScreen: '#0A1828',
  background: '#0A1828',
  backgroundAlt: '#122A3C',
  surface: '#143044',
  surfaceSoft: '#1C4060',
  surfaceDeep: '#061018',
  border: '#3A70A0',
  borderStrong: '#5AA0D0',
  text: '#E8F4FC',
  textSecondary: '#A8D0E8',
  textMuted: '#7EB4D4',
  textDisabled: '#5A90B0',
  phosphor: '#7EC8F0',
  primary: '#7EC8F0',
  primaryPressed: '#5EB0E0',
  primarySoft: '#1C4060',
  primaryStrong: '#7EC8F0',
  parent: '#7EB4D4',
  disabled: '#1C4060',
  onDisabled: '#5A90B0',
  onAccent: '#061018',
  inverseSurface: '#7EC8F0',
  inverseText: '#061018',
  scanline: 'rgba(126, 200, 240, 0.06)',
  glow: 'rgba(126, 200, 240, 0.5)',
  overlay: 'rgba(6, 16, 24, 0.72)',
};

const OVERSEER_TERMINAL_PALETTE: Partial<ThemeColors> = {
  bezel: '#4A2A28',
  terminalScreen: '#1A0A0A',
  background: '#1A0A0A',
  backgroundAlt: '#2A1414',
  surface: '#2E1616',
  surfaceSoft: '#3E1E1E',
  surfaceDeep: '#100606',
  border: '#8A4040',
  borderStrong: '#C06060',
  text: '#FCE8E8',
  textSecondary: '#E0A8A8',
  textMuted: '#C87878',
  textDisabled: '#A05858',
  phosphor: '#F07167',
  primary: '#F07167',
  primaryPressed: '#D85850',
  primarySoft: '#3E1E1E',
  primaryStrong: '#F07167',
  parent: '#C87878',
  disabled: '#3E1E1E',
  onDisabled: '#A05858',
  onAccent: '#100606',
  inverseSurface: '#F07167',
  inverseText: '#100606',
  scanline: 'rgba(240, 113, 103, 0.06)',
  glow: 'rgba(240, 113, 103, 0.5)',
  overlay: 'rgba(16, 6, 6, 0.72)',
  overseerLcd: '#F07167',
  overseerSurface: '#2E1616',
};

import { TERMINAL_VARIANT } from './terminal';

const TERMINAL_VOICE_PALETTES = {
  [TERMINAL_VARIANT.KEEPER]: KEEPER_TERMINAL_PALETTE,
  [TERMINAL_VARIANT.OVERSEER]: OVERSEER_TERMINAL_PALETTE,
} as const;

export const COLORS = {
  light: TERMINAL_COLORS as ThemeColors,
  dark: TERMINAL_COLORS as ThemeColors,
};

export const LESSON_FADE_MS = 240;

// ═══════════════════════════════════════════
// TYPOGRAPHY
// ═══════════════════════════════════════════

/** Static, bundled Cyrillic fonts; no network or variable-font support needed. */
export const FONTS = {
  sans: 'GolosText',
  sansStrong: 'GolosText-Semibold',
  rounded: 'GolosText-Bold',
  mono: 'MartianMono',
  monoStrong: 'MartianMono-Semibold',
} as const;

// ═══════════════════════════════════════════
// SPACING & SHAPE
// ═══════════════════════════════════════════

export const SPACING_BASE = {
  HALF: 2,
  ONE: 4,
  TWO: 8,
  COMPACT: 12,
  THREE: 16,
  FOUR: 24,
  FIVE: 32,
  SIX: 64,
} as const;
export const SPACING = SPACING_BASE;
export const RADII = {
  xs: 4,
  s: 10,
  m: 14,
  l: 14,
  xl: 20,
  xxl: 26,
  xxxl: 26,
  pill: 999,
} as const;
export const CONTENT_PADDING = 14;
export const MAX_CONTENT_WIDTH = 560;

/** Pixel values from `SPACING` — use as `gap={SPACING.TWO}`. */
type Spacing = (typeof SPACING)[keyof typeof SPACING];
type TerminalVoice = keyof typeof TERMINAL_VOICE_PALETTES;

export type { Spacing, TerminalVoice, ThemeColor, ThemeColors };
export { TERMINAL_VOICE_PALETTES };
