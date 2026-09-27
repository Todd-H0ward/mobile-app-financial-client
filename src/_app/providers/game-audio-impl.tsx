import { useEffect } from 'react';

import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { AppState } from 'react-native';

import { useUserStore } from '@/entities/user';

import { SOUNDS } from '@/shared/constants';
import {
  bindSfxAppActive,
  playSfx,
  registerSfxPlayers,
  type SfxId,
  type SfxPlayerMap,
  stopSfx,
} from '@/shared/lib';

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

const VOLUME = 0.5;

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

export const GameAudioImpl = () => {
  const ui_tap = useAudioPlayer(require('../../../assets/audio/ui_tap.wav'));
  const ui_confirm = useAudioPlayer(
    require('../../../assets/audio/ui_confirm.wav'),
  );
  const ui_back = useAudioPlayer(require('../../../assets/audio/ui_back.wav'));
  const nav_whoosh = useAudioPlayer(
    require('../../../assets/audio/nav_whoosh.wav'),
  );
  const cell_hold = useAudioPlayer(
    require('../../../assets/audio/cell_hold.wav'),
  );
  const cell_open = useAudioPlayer(
    require('../../../assets/audio/cell_open.wav'),
  );
  const coin = useAudioPlayer(require('../../../assets/audio/coin.wav'));
  const spend = useAudioPlayer(require('../../../assets/audio/spend.wav'));
  const complete = useAudioPlayer(
    require('../../../assets/audio/complete.wav'),
  );
  const lift = useAudioPlayer(require('../../../assets/audio/lift.wav'));
  const correct = useAudioPlayer(require('../../../assets/audio/correct.wav'));
  const wrong = useAudioPlayer(require('../../../assets/audio/wrong.wav'));
  const keeper_on = useAudioPlayer(
    require('../../../assets/audio/keeper_on.wav'),
  );
  const keeper_talk = useAudioPlayer(
    require('../../../assets/audio/keeper_talk.wav'),
  );
  const keeper_off = useAudioPlayer(
    require('../../../assets/audio/keeper_off.wav'),
  );
  const overseer_on = useAudioPlayer(
    require('../../../assets/audio/overseer_on.wav'),
  );
  const overseer_talk = useAudioPlayer(
    require('../../../assets/audio/overseer_talk.wav'),
  );
  const overseer_off = useAudioPlayer(
    require('../../../assets/audio/overseer_off.wav'),
  );
  const dog_enter = useAudioPlayer(
    require('../../../assets/audio/dog_enter.wav'),
  );
  const dog_exit = useAudioPlayer(
    require('../../../assets/audio/dog_exit.wav'),
  );
  const dog_stroke_joy = useAudioPlayer(
    require('../../../assets/audio/dog_stroke_joy.wav'),
  );
  const dog_stroke_soft = useAudioPlayer(
    require('../../../assets/audio/dog_stroke_soft.wav'),
  );
  const dog_kick_play = useAudioPlayer(
    require('../../../assets/audio/dog_kick_play.wav'),
  );
  const dog_kick_flinch = useAudioPlayer(
    require('../../../assets/audio/dog_kick_flinch.wav'),
  );

  useEffect(() => {
    const map: SfxPlayerMap = {
      ui_tap,
      ui_confirm,
      ui_back,
      nav_whoosh,
      cell_hold,
      cell_open,
      coin,
      spend,
      complete,
      lift,
      correct,
      wrong,
      keeper_on,
      keeper_talk,
      keeper_off,
      overseer_on,
      overseer_talk,
      overseer_off,
      dog_enter,
      dog_exit,
      dog_stroke_joy,
      dog_stroke_soft,
      dog_kick_play,
      dog_kick_flinch,
    };

    for (const player of Object.values(map)) {
      if (player && 'volume' in player) {
        (player as { volume: number }).volume = VOLUME;
      }
    }
    registerSfxPlayers(map);

    void setAudioModeAsync({
      allowsRecording: false,
      playsInSilentMode: false,
      shouldPlayInBackground: false,
      interruptionMode: 'mixWithOthers',
    }).catch(() => {});

    bindSfxAppActive(() => AppState.currentState === 'active');

    const appState = AppState.addEventListener('change', (state) => {
      bindSfxAppActive(() => state === 'active');
      if (state !== 'active') stopSfx();
    });

    const unsubscribe = useUserStore.subscribe((next, previous) => {
      const user = next.user;
      const before = previous.user;
      if (!user?.settings.isSoundEnabled) {
        stopSfx();
        return;
      }
      if (
        !before ||
        user.createdAt !== before.createdAt ||
        user.settings.isDemoMode !== before.settings.isDemoMode ||
        AppState.currentState !== 'active'
      )
        return;

      let cue: SfxId | null = null;

      if (user.platform.level > before.platform.level) {
        cue = SOUNDS.LIFT;
      } else if (
        user.completedLessonCells.length > before.completedLessonCells.length ||
        user.robot.stage !== before.robot.stage
      ) {
        cue = SOUNDS.COMPLETE;
      } else if (user.wallet.entryCount > before.wallet.entryCount) {
        const last = user.wallet.history[0];
        cue = last?.kind === 'spend' ? SOUNDS.SPEND : SOUNDS.COIN;
      }

      if (cue) playSfx(cue);
    });

    return () => {
      unsubscribe();
      appState.remove();
      registerSfxPlayers({});
      stopSfx();
    };
  }, [
    ui_tap,
    ui_confirm,
    ui_back,
    nav_whoosh,
    cell_hold,
    cell_open,
    coin,
    spend,
    complete,
    lift,
    correct,
    wrong,
    keeper_on,
    keeper_talk,
    keeper_off,
    overseer_on,
    overseer_talk,
    overseer_off,
    dog_enter,
    dog_exit,
    dog_stroke_joy,
    dog_stroke_soft,
    dog_kick_play,
    dog_kick_flinch,
  ]);

  return null;
};
