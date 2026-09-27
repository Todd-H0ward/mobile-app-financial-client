// ═══════════════════════════════════════════
// COLORS
// ═══════════════════════════════════════════

/** Terminal 2b. Hardware keeps its phosphor palette in either system theme. */
const TERMINAL_COLORS = {
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
  overseerLcd: '#F5A55A',
  /** The Overseer's task card and speech bubble — amber-tinted screen. */
  overseerSurface: '#1F2416',
  arcadeButtonA: '#9EF0A8',
  arcadeButtonB: '#A9D8B0',
  arcadeDpad: '#1E2A22',
  arcadeDpadFace: '#E3F7E5',
  snakeHead: '#9EF0A8',
  snakeBody: '#4E8C5E',
  snakeApple: '#F2C879',
} as const;

export const COLORS = {
  light: TERMINAL_COLORS,
  dark: TERMINAL_COLORS,
} as const;

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

type ThemeColor = keyof typeof TERMINAL_COLORS;
/** Pixel values from `SPACING` — use as `gap={SPACING.TWO}`. */
type Spacing = (typeof SPACING)[keyof typeof SPACING];

export type { Spacing, ThemeColor };
