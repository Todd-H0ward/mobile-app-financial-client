/**
 * Cue ids matching files in `assets/audio/*.wav`.
 *
 * Keep values in lockstep with `scripts/generate-game-audio.py` and the
 * players registered in `GameAudioImpl`.
 */
export const SOUNDS = {
  UI_TAP: 'ui_tap',
  UI_CONFIRM: 'ui_confirm',
  UI_BACK: 'ui_back',
  NAV_WHOOSH: 'nav_whoosh',
  CELL_HOLD: 'cell_hold',
  CELL_OPEN: 'cell_open',
  COIN: 'coin',
  SPEND: 'spend',
  COMPLETE: 'complete',
  LIFT: 'lift',
  CORRECT: 'correct',
  WRONG: 'wrong',
  KEEPER_ON: 'keeper_on',
  KEEPER_TALK: 'keeper_talk',
  KEEPER_OFF: 'keeper_off',
  OVERSEER_ON: 'overseer_on',
  OVERSEER_TALK: 'overseer_talk',
  OVERSEER_OFF: 'overseer_off',
  DOG_ENTER: 'dog_enter',
  DOG_EXIT: 'dog_exit',
  DOG_STROKE_JOY: 'dog_stroke_joy',
  DOG_STROKE_SOFT: 'dog_stroke_soft',
  DOG_KICK_PLAY: 'dog_kick_play',
  DOG_KICK_FLINCH: 'dog_kick_flinch',
} as const;

type SoundId = (typeof SOUNDS)[keyof typeof SOUNDS];

export type { SoundId };
