import type { ComponentType } from 'react';

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

/**
 * Whether the binary has the audio module at all.
 *
 * Read off the same JSI registry `expo-modules-core` looks in first. Asking
 * before `require` matters in development: a dev client built before
 * `expo-audio` joined the project throws from inside the package, and even
 * caught, that throw surfaces as an "Uncaught Error" overlay.
 */
const hasAudioModule = (): boolean =>
  Boolean(
    (globalThis as { expo?: { modules?: Record<string, unknown> } }).expo
      ?.modules?.ExpoAudio,
  );

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

/**
 * Sound cues when the native ExpoAudio module is linked.
 *
 * A binary built without the plugin (Expo Go, a stale dev client) has no
 * module to play through — missing audio is silence, not a red screen.
 */
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
