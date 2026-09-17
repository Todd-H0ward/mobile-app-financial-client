import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { STORAGE_KEYS } from '@/shared/constants';
import { createPersistStorage } from '@/shared/model';

import {
  type ArcadeScoresSave,
  EMPTY_ARCADE_SCORES,
  recordSnakeScore,
  recordSpacewarTime,
} from '../lib';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface ArcadeScoresStore extends ArcadeScoresSave {
  /** Record a snake cash-out (apples eaten). */
  submitSnake: (apples: number) => void;
  /** Record a Spacewar clear time in ms. */
  submitSpacewar: (elapsedMs: number) => void;
}

// ═══════════════════════════════════════════
// STORE
// ═══════════════════════════════════════════

/**
 * Console high-score table. Lives beside the profile so a wipe of one does
 * not have to know about the other — and so we avoid a UserSave migration.
 */
export const useArcadeScoresStore = create<ArcadeScoresStore>()(
  persist(
    (set) => ({
      ...EMPTY_ARCADE_SCORES,

      submitSnake: (apples) =>
        set((state) => ({
          snake: recordSnakeScore(state.snake, apples),
        })),

      submitSpacewar: (elapsedMs) =>
        set((state) => ({
          spacewarMs: recordSpacewarTime(state.spacewarMs, elapsedMs),
        })),
    }),
    {
      name: STORAGE_KEYS.ARCADE_SCORES,
      storage: createPersistStorage(),
      partialize: (state) => ({
        snake: state.snake,
        spacewarMs: state.spacewarMs,
      }),
    },
  ),
);
