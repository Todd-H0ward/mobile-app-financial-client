import type { ComponentType } from 'react';

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

/**
 * Sound cues when the native ExpoAudio module is linked.
 *
 * Importing `expo-audio` throws if the native binary was built without the
 * plugin (Expo Go / stale build). Catch that at load time — missing audio is
 * silence, not a red screen.
 */
export const GameAudio: ComponentType = (() => {
  try {
    require('expo-audio');
    return (require('./game-audio-impl') as { GameAudioImpl: ComponentType })
      .GameAudioImpl;
  } catch {
    return () => null;
  }
})();
