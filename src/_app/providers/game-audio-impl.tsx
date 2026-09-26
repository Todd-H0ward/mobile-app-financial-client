import { useEffect } from 'react';

import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { AppState } from 'react-native';

import { useUserStore } from '@/entities/user';

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

/** Local cues observe committed saves, so rejected or duplicate actions stay silent. */
export const GameAudioImpl = () => {
  const coin = useAudioPlayer(require('../../../assets/audio/coin.wav'));
  const complete = useAudioPlayer(
    require('../../../assets/audio/complete.wav'),
  );

  useEffect(() => {
    let isMounted = true;
    let generation = 0;
    coin.volume = 0.5;
    complete.volume = 0.5;
    void setAudioModeAsync({
      allowsRecording: false,
      playsInSilentMode: false,
      shouldPlayInBackground: false,
      interruptionMode: 'mixWithOthers',
    }).catch(() => {});
    const stop = () => {
      generation += 1;
      coin.pause();
      complete.pause();
    };
    const appState = AppState.addEventListener('change', (state) => {
      if (state !== 'active') stop();
    });
    const unsubscribe = useUserStore.subscribe((next, previous) => {
      const user = next.user;
      const before = previous.user;
      if (!user?.settings.isSoundEnabled) {
        stop();
        return;
      }
      if (
        !before ||
        user.createdAt !== before.createdAt ||
        user.settings.isDemoMode !== before.settings.isDemoMode ||
        AppState.currentState !== 'active'
      )
        return;
      const isMilestone =
        user.platform.level > before.platform.level ||
        user.completedLessonCells.length > before.completedLessonCells.length ||
        user.robot.stage !== before.robot.stage;
      const player = isMilestone
        ? complete
        : user.wallet.entryCount > before.wallet.entryCount
          ? coin
          : null;
      if (!player) return;
      stop();
      const request = generation;
      void player
        .seekTo(0)
        .then(() => {
          if (isMounted && request === generation) player.play();
        })
        .catch(() => {});
    });
    return () => {
      isMounted = false;
      generation += 1;
      unsubscribe();
      appState.remove();
    };
  }, [coin, complete]);
  return null;
};
