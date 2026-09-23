import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { STORAGE_KEYS } from '@/shared/constants';
import { createPersistStorage } from '@/shared/model';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface LessonPersistedState {
  /**
   * Cells whose lesson has been passed, as `cellKey` strings.
   *
   * An array rather than a `Set` because this goes to disk as JSON and a
   * `Set` does not survive the trip. Order carries no meaning; membership is
   * the whole of it, and the scene reads it to know which tiles have sunk.
   */
  doneCells: string[];
}

interface LessonProgressStore extends LessonPersistedState {
  /**
   * Marks a cell's lesson passed. Idempotent: answering right twice is the
   * same as answering right once, and the tile does not sink any further.
   */
  completeCell: (cellKey: string) => void;
}

// ═══════════════════════════════════════════
// STORE
// ═══════════════════════════════════════════

/**
 * What the child has learnt, keyed by the tile they learnt it on.
 *
 * Its own key rather than a corner of the profile: a reset wipes the save,
 * and what a child has understood is not undone by starting the game over.
 */
export const useLessonProgress = create<LessonProgressStore>()(
  persist(
    (set) => ({
      doneCells: [],
      completeCell: (cellKey) =>
        set((state) =>
          state.doneCells.includes(cellKey)
            ? state
            : { doneCells: [...state.doneCells, cellKey] },
        ),
    }),
    {
      name: STORAGE_KEYS.LESSONS,
      storage: createPersistStorage<LessonPersistedState>(),
      partialize: (state) => ({ doneCells: state.doneCells }),
    },
  ),
);

// ═══════════════════════════════════════════
// SELECTORS
// ═══════════════════════════════════════════

/** Every sunk cell, for the scene to apply in one go. */
export const useDoneCells = (): string[] =>
  useLessonProgress((state) => state.doneCells);

/** Whether one cell is already behind the child. */
export const useIsCellDone = (cellKey: string): boolean =>
  useLessonProgress((state) => state.doneCells.includes(cellKey));

/** The one way to record a pass. */
export const useCompleteLesson = (): ((cellKey: string) => void) =>
  useLessonProgress((state) => state.completeCell);

export type { LessonPersistedState, LessonProgressStore };
