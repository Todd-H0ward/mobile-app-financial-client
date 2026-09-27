import type { ComponentType } from 'react';

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

/**
 * Probe before `require('expo-audio')` — missing native module throws inside
 * the package and paints Uncaught Error even when caught.
 */
const hasAudioModule = (): boolean =>
  Boolean(
    (globalThis as { expo?: { modules?: Record<string, unknown> } }).expo
      ?.modules?.ExpoAudio,
  );

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

/** Sound host, or a no-op when the native audio module is missing. */
export const GameAudio: ComponentType = (() => {
  if (!hasAudioModule()) return () => null;
  try {
    require('expo-audio');
    return (require('./game-audio-impl') as { GameAudioImpl: ComponentType })
      .GameAudioImpl;
  } catch {
    return () => null;
  }
})();
