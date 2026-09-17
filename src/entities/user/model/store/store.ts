import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

import { STORAGE_KEYS } from '@/shared/constants';
import { createPersistStorage } from '@/shared/model';

import { enterDemoMode, exitDemoMode } from '../../lib/demo';
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
  /**
   * The child's save, parked while demo mode runs; `null` whenever demo mode is
   * off. It is persisted on purpose: a demo can outlive an app restart, and the
   * child's progress must still come back when the grown-up switches demo off.
   */
  demoBackup: UserSave | null;
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
  /**
   * Turns demo mode on and off, 2.5.13. Switching on parks the child's save in
   * `demoBackup` and plays a demo profile; switching off gives the parked save
   * back untouched. Nothing the child earned is lost to a demonstration.
   */
  setDemoMode: (isOn: boolean) => void;
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
 * There is no explicit "save": `persist` queues a write on every `set`. Disk
 * I/O is debounced and async so a burst of updates does not block input
 * (`docs/performance.md`); a crash can still lose only the last debounce
 * window.
 *
 * Reads stay synchronous (`createPersistStorage`), so the save is already
 * there on the first render: `user === null` always means "no profile", never
 * "not loaded yet". The absence of a `hasHydrated` flag and of any waiting at
 * startup is deliberate.
 */
export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      user: null,
      demoBackup: null,

      createUser: (input) =>
        set({ user: createInitialUser(input), demoBackup: null }),

      updateUser: (update) => {
        const { user } = get();
        if (!user) return;

        set({ user: update(user) });
      },

      setDemoMode: (isOn) => {
        const { user, demoBackup } = get();
        if (!user || user.settings.isDemoMode === isOn) return;

        if (isOn) {
          const { profile, parked } = enterDemoMode(user);
          set({ user: profile, demoBackup: parked });
          return;
        }

        set({ user: exitDemoMode(demoBackup, user), demoBackup: null });
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
        set({ user: null, demoBackup: null });
        useUserStore.persist.clearStorage();
      },
    }),
    {
      name: STORAGE_KEYS.USER,
      storage: createPersistStorage<UserPersistedState>(),
      version: USER_SAVE_VERSION,
      // Actions stay in memory: only the save goes to disk.
      partialize: ({ user, demoBackup }): UserPersistedState => ({
        user,
        demoBackup,
      }),
      migrate: (persisted, version) => {
        const saved = persisted as Partial<UserPersistedState> | undefined;

        return {
          user: migrateUser(saved?.user, version),
          demoBackup: migrateUser(saved?.demoBackup, version),
        };
      },
      // `migrate` only runs when the version changed, `merge` always does, so
      // the shape is checked here: a save of the current version can be broken
      // too.
      merge: (persisted, current) => {
        const saved = persisted as Partial<UserPersistedState> | undefined;
        const readSave = (value: unknown): UserSave | null =>
          isUserSave(value) ? value : null;

        return {
          ...current,
          user: readSave(saved?.user),
          // A broken backup only costs the parked profile, never the launch:
          // leaving demo mode then hands out a clean starting profile.
          demoBackup: readSave(saved?.demoBackup),
        };
      },
    },
  ),
);

// ═══════════════════════════════════════════
// SELECTORS
// ═══════════════════════════════════════════

/** The whole save, or `null` before onboarding finishes. */
export const useUser = () => useUserStore((state) => state.user);

/** The pet slice of the save, or `undefined` before there is a profile. */
export const useUserPet = () => useUserStore((state) => state.user?.pet);

/**
 * Home HUD fields only — wallet balance ticks must not rebuild pet appearance
 * when comfort / spirit did not change, and vice versa.
 */
export const useHomeHudSource = () =>
  useUserStore(
    useShallow((state) => {
      const user = state.user;
      if (!user) return null;

      return {
        pet: user.pet,
        balance: user.wallet.balance,
        lastEntry: user.wallet.history[0] ?? null,
        savings: user.savings,
        tasks: user.tasks,
        phase: user.period.phase,
        isAnimationEnabled: user.settings.isAnimationEnabled,
      };
    }),
  );

/** Creates the profile during onboarding. Overwrites an existing one. */
export const useCreateUser = () => useUserStore((state) => state.createUser);

/** The only way to change the save — takes a pure update function. */
export const useUpdateUser = () => useUserStore((state) => state.updateUser);

/** Turns demo mode on and off, parking and restoring the child's save. */
export const useSetDemoMode = () => useUserStore((state) => state.setDemoMode);

/** Resets progress; name, looks and settings survive — 2.5.12. */
export const useResetUser = () => useUserStore((state) => state.resetUser);

/** Deletes the profile key irreversibly — 2.5.12. */
export const useDeleteUser = () => useUserStore((state) => state.deleteUser);

export type { UserPersistedState, UserStore };
