import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { STORAGE_KEYS } from '@/shared/constants';
import { createPersistStorage } from '@/shared/model';

import { resetUser } from '../../lib/reset';
import {
  type CreateUserInput,
  createInitialUser,
  USER_SAVE_VERSION,
} from '../initial-user';
import { isUserSave, migrateUser } from '../migrations';
import type { UserSave } from '../types';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

/** What goes to storage. Actions and startup flags never reach it. */
interface UserPersistedState {
  /** The whole save, or `null` — no profile yet, the app goes to onboarding. */
  user: UserSave | null;
}

interface UserStore extends UserPersistedState {
  /** Creates the profile during onboarding. Overwrites an existing one. */
  createUser: (input: CreateUserInput) => void;
  /**
   * The only way to change the save. It takes a pure function because the rules
   * live in their own slices (`wallet`, `savings`, `period`) — the store just
   * holds the result and writes it to disk.
   */
  updateUser: (update: (user: UserSave) => UserSave) => void;
  /** Reset to the starting state, 2.5.12. Name, looks and settings survive. */
  resetUser: () => void;
  /** Deleting the profile, 2.5.12. Erases the whole key, irreversibly. */
  deleteUser: () => void;
}

// ═══════════════════════════════════════════
// STORE
// ═══════════════════════════════════════════

/**
 * One save for the whole app, see docs/game-state.md.
 *
 * There is no explicit "save": `persist` writes on every `set`, so a crash
 * loses nothing but the current animation frame.
 *
 * The storage is synchronous (`createPersistStorage`), so the save is already
 * read by the first render: `user === null` always means "no profile", never
 * "not loaded yet". The absence of a `hasHydrated` flag and of any waiting at
 * startup is deliberate.
 */
export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      user: null,

      createUser: (input) => set({ user: createInitialUser(input) }),

      updateUser: (update) => {
        const { user } = get();
        if (!user) return;

        set({ user: update(user) });
      },

      resetUser: () => {
        const { user } = get();
        if (!user) return;

        set({ user: resetUser(user) });
      },

      deleteUser: () => {
        // Order matters: `set` writes `{ user: null }` to storage first, and
        // only then `clearStorage` removes the key. The other way around would
        // leave a key holding an empty profile instead of a clean device.
        set({ user: null });
        useUserStore.persist.clearStorage();
      },
    }),
    {
      name: STORAGE_KEYS.USER,
      storage: createPersistStorage<UserPersistedState>(),
      version: USER_SAVE_VERSION,
      // Actions stay in memory: only the save goes to disk.
      partialize: ({ user }): UserPersistedState => ({ user }),
      migrate: (persisted, version) => ({
        user: migrateUser(
          (persisted as Partial<UserPersistedState> | undefined)?.user,
          version,
        ),
      }),
      // `migrate` only runs when the version changed, `merge` always does, so
      // the shape is checked here: a save of the current version can be broken
      // too.
      merge: (persisted, current) => ({
        ...current,
        user: isUserSave(
          (persisted as Partial<UserPersistedState> | undefined)?.user,
        )
          ? ((persisted as UserPersistedState).user as UserSave)
          : null,
      }),
    },
  ),
);

// ═══════════════════════════════════════════
// SELECTORS
// ═══════════════════════════════════════════

export const useUser = () => useUserStore((state) => state.user);

export type { UserPersistedState, UserStore };
