// ═══════════════════════════════════════════
// COLORS
// ═══════════════════════════════════════════

/** Terminal 2b. Hardware keeps its phosphor palette in either system theme. */
const TERMINAL_COLORS = {
  sceneLight: '#D7D9D2',
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
  primaryShadow: '#4E8C5E',
  primarySoft: '#1B3A26',
  primaryStrong: '#9EF0A8',
  // Legacy action roles resolve to green: orange belongs to the Overseer's voice.
  accent: '#9EF0A8',
  accentPressed: '#7DCE8A',
  accentShadow: '#4E8C5E',
  accentSoft: '#1B3A26',
  accentStrong: '#9EF0A8',
  success: '#9EF0A8',
  successPressed: '#7DCE8A',
  successShadow: '#4E8C5E',
  successSoft: '#1B3A26',
  successStrong: '#9EF0A8',
  warning: '#F2C879',
  warningSoft: '#302B1C',
  warningStrong: '#F2C879',
  coin: '#F2C879',
  coinBorder: '#F2C879',
  coinSoft: '#302B1C',
  parent: '#8CC596',
  parentBackground: '#0E2016',
  parentSurface: '#132B1C',
  parentBorder: '#2F5E3E',
  parentText: '#E3F7E5',
  parentTextSecondary: '#A9D8B0',
  disabled: '#1B3A26',
  onDisabled: '#6FA87A',
  overlay: 'rgba(11, 26, 18, 0.72)',
  scanline: 'rgba(158, 240, 168, 0.04)',
  vignette: 'rgba(0, 0, 0, 0.32)',
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
  overseerLcdDim: '#A9D8B0',
  overseerScreen: '#0E2016',
  /** The Overseer's task card and speech bubble — amber-tinted screen. */
  overseerSurface: '#1F2416',
  overseerScreenGlow: '#1B3A26',
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

/** Compatibility names for lesson renderers, sharing the single palette. */
export const TERMINAL = {
  void: TERMINAL_COLORS.terminalScreen,
  panel: TERMINAL_COLORS.surface,
  panelRaised: TERMINAL_COLORS.surfaceSoft,
  rule: TERMINAL_COLORS.border,
  ruleLive: TERMINAL_COLORS.phosphor,
  amber: TERMINAL_COLORS.phosphor,
  amberDim: TERMINAL_COLORS.textMuted,
  cyan: TERMINAL_COLORS.phosphor,
  text: TERMINAL_COLORS.text,
  textDim: TERMINAL_COLORS.textSecondary,
  scanline: TERMINAL_COLORS.scanline,
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
  half: 2,
  one: 4,
  two: 8,
  compact: 12,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
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
type Spacing = keyof typeof SPACING;

export type { Spacing, ThemeColor };
