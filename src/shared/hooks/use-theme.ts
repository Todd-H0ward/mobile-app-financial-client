import { createContext, useContext } from 'react';

import {
  COLORS,
  TERMINAL_VOICE_PALETTES,
  type TerminalVoice,
  type ThemeColors,
} from '@/shared/constants/theme';

import { useColorScheme } from './use-color-scheme';

// ═══════════════════════════════════════════
// CONTEXT
// ═══════════════════════════════════════════

const TerminalPaletteContext = createContext<Partial<ThemeColors> | null>(null);

export const TerminalPaletteProvider = TerminalPaletteContext.Provider;

export const paletteForVoice = (voice: TerminalVoice): Partial<ThemeColors> =>
  TERMINAL_VOICE_PALETTES[voice];

/** Current voice tint, if any — Sheet.Modal re-provides it past the native portal. */
export const useTerminalPalette = (): Partial<ThemeColors> | null =>
  useContext(TerminalPaletteContext);

// ═══════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════

export const useTheme = (): ThemeColors => {
  const base = COLORS[useColorScheme()];
  const overlay = useContext(TerminalPaletteContext);
  return overlay ? { ...base, ...overlay } : base;
};
