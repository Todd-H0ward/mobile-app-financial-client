// ═══════════════════════════════════════════
// TERMINAL VOICE & SCREEN CHROME
// ═══════════════════════════════════════════

export const TERMINAL_VARIANT = {
  KEEPER: 'keeper',
  OVERSEER: 'overseer',
  ADULT: 'adult',
} as const;

export const SCREEN_PRESENTATION = {
  FULL: 'full',
  SHEET: 'sheet',
} as const;

type TerminalVariant = (typeof TERMINAL_VARIANT)[keyof typeof TERMINAL_VARIANT];
type ScreenPresentation =
  (typeof SCREEN_PRESENTATION)[keyof typeof SCREEN_PRESENTATION];

export type { ScreenPresentation, TerminalVariant };
