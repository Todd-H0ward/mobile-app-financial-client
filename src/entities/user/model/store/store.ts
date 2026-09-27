import { useMemo } from 'react';

import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

import {
  activeLessonIndexForCell,
  completedCellKeysFromLessons,
  isLessonPlayable,
  lessonAt,
  lessonOrdinalForKey,
} from '@/entities/lesson';

import { STORAGE_KEYS } from '@/shared/constants';
import {
  createPersistStorage,
  durablePersist,
  reportStorageIssue,
  useStorageHealth,
} from '@/shared/model';

import { enterDemoMode, exitDemoMode } from '../../lib/demo';
import { importLegacyProgress } from '../../lib/legacy-progress';
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
  /** The whole save, or `null` — no profile yet; the entry screen makes one. */
  user: UserSave | null;
  /**
   * Child's save parked while demo runs; `null` when demo is off. Persisted on
   * purpose so a demo can outlive a restart and still restore progress.
   */
  demoBackup: UserSave | null;
}

interface UserStore extends UserPersistedState {
  /** Marks one arena cell complete inside the current profile, idempotently. */
  completeLesson: (cellKey: string) => void;
  /** Creates the guest profile. Overwrites an existing one. */
  createUser: (input: CreateUserInput) => void;
  /**
   * The only way to change the save. Takes a pure function because the rules
   * live in their own slices — the store just holds the result and writes it.
   */
  updateUser: (update: (user: UserSave) => UserSave) => void;
  /** Commits a reviewed action only if its source snapshot is still current. */
  commitUser: (before: UserSave, after: UserSave) => boolean;
  /**
   * Turns demo mode on/off (2.5.13). On: parks the save in `demoBackup` and
   * plays a demo profile; off: restores the parked save untouched.
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

/** App save via durablePersist; sync reads so `null` means no profile, not loading. */
export const useUserStore = create<UserStore>()(
  durablePersist(
    (set, get) => ({
      user: null,
      demoBackup: null,

      completeLesson: (cellKey) => {
        const { user } = get();
        const ordinal = lessonOrdinalForKey(cellKey);
        if (!user || ordinal === null) return;
        if (
          !isLessonPlayable(
            ordinal,
            user.completedLessonIds,
            user.platform.level,
          )
        ) {
          return;
        }
        const active = activeLessonIndexForCell(
          ordinal,
          user.completedLessonIds,
        );
        if (active === null) return;
        const lesson = lessonAt(active);
        if (user.completedLessonIds.includes(lesson.id)) return;
        const completedLessonIds = [...user.completedLessonIds, lesson.id];
        set({
          user: {
            ...user,
            completedLessonIds,
            completedLessonCells:
              completedCellKeysFromLessons(completedLessonIds),
          },
        });
      },

      createUser: (input) =>
        set({ user: createInitialUser(input), demoBackup: null }),

      updateUser: (update) => {
        const { user } = get();
        if (!user) return;

        set({ user: update(user) });
      },

      commitUser: (before, after) => {
        if (get().user !== before || before === after) return false;
        set({ user: after });
        return get().user === after;
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
        // Order matters: `set` writes `{ user: null }` to storage first, and only then
        // `clearStorage` removes the key.
        set({ user: null, demoBackup: null });
        if (get().user !== null) return;
        useUserStore.persist.clearStorage();
        const legacy = createPersistStorage();
        legacy.removeItem(STORAGE_KEYS.LESSONS);
        legacy.removeItem(STORAGE_KEYS.ARCADE_SCORES);
      },
    }),
    {
      name: STORAGE_KEYS.USER,
      onWriteError: (_error, retry) =>
        reportStorageIssue({ kind: 'write', retry }),
      onRehydrateStorage: () => (_state, error) => {
        if (error) reportStorageIssue({ kind: 'read' });
        else useStorageHealth.getState().clear();
      },
      storage: createPersistStorage<UserPersistedState>(),
      version: USER_SAVE_VERSION,
      // Actions stay in memory: only the save goes to disk.
      partialize: ({ user, demoBackup }): UserPersistedState => ({
        user,
        demoBackup,
      }),
      migrate: (persisted, version) => {
        const saved = persisted as Partial<UserPersistedState> | undefined;

        if (!saved || typeof saved !== 'object' || !('user' in saved))
          throw new Error('Invalid saved envelope');
        const migrated = {
          user: migrateUser(saved?.user, version),
          demoBackup: migrateUser(saved?.demoBackup, version),
        };
        if (
          (saved?.user != null && !migrated.user) ||
          (saved?.demoBackup != null && !migrated.demoBackup)
        )
          throw new Error('Cannot migrate save');
        if (version < 9) {
          const readLegacy = (key: string): unknown => {
            try {
              return createPersistStorage<unknown>().getItem(key)?.state;
            } catch {
              return undefined;
            }
          };
          const target = migrated.demoBackup ? 'demoBackup' : 'user';
          const profile = migrated[target];
          if (profile)
            migrated[target] = importLegacyProgress(
              profile,
              readLegacy(STORAGE_KEYS.LESSONS),
              readLegacy(STORAGE_KEYS.ARCADE_SCORES),
            );
        }
        return migrated;
      },
      // `migrate` only runs when the version changed, `merge` always does, so the shape is
      // checked here: a save of the current version can be broken too.
      merge: (persisted, current) => {
        const saved = persisted as Partial<UserPersistedState> | undefined;
        if (
          persisted !== undefined &&
          (!saved || typeof saved !== 'object' || !('user' in saved))
        )
          throw new Error('Invalid saved envelope');
        const readSave = (value: unknown): UserSave | null => {
          if (value == null) return null;
          if (!isUserSave(value)) throw new Error('Invalid user save');
          return value;
        };

        return {
          ...current,
          user: readSave(saved?.user),
          // A broken backup only costs the parked profile, never the launch: leaving demo mode then
          // hands out a clean starting profile.
          demoBackup: readSave(saved?.demoBackup),
        };
      },
    },
  ),
);

// ═══════════════════════════════════════════
// SELECTORS
// ═══════════════════════════════════════════

/** The whole save, or `null` before the first profile exists. */
export const useUser = () => useUserStore((state) => state.user);

export const useHomeScreenData = () =>
  useUserStore(
    useShallow((state) => {
      const user = state.user;
      if (!user) return null;
      return {
        playerName: user.playerName,
        robotName: user.robot.name,
        seenStoryIds: user.seenStoryIds,
        platformLevel: user.platform.level,
        periodPhase: user.period.phase,
        periodIndex: user.period.index,
        periodFact: user.period.fact,
        periodPlan: user.period.plan,
        robotCharge: user.robot.charge,
        robotSpirit: user.robot.spirit,
        robotAssembly: user.robot.assembly,
        robotStage: user.robot.stage,
        activeTaskId: user.tasks.activeTaskId,
        balance: user.wallet.balance,
        moduleTier: user.modules.tier,
      };
    }),
  );

const EMPTY_COMPLETED_CELLS: string[] = [];
const EMPTY_COMPLETED_LESSONS: string[] = [];

/**
 * Done cells derived from lesson ids — not `completedLessonCells` — so a
 * layout re-cut keeps sunk tiles correct.
 */
export const useDoneCells = () => {
  const lessonIds = useUserStore(
    (state) => state.user?.completedLessonIds ?? EMPTY_COMPLETED_LESSONS,
  );
  return useMemo(
    () =>
      lessonIds.length === 0
        ? EMPTY_COMPLETED_CELLS
        : completedCellKeysFromLessons(lessonIds),
    [lessonIds],
  );
};
/** Lesson ids finished — cells may host more than one when content grows. */
export const useDoneLessonIds = () =>
  useUserStore(
    (state) => state.user?.completedLessonIds ?? EMPTY_COMPLETED_LESSONS,
  );
export const useCompleteLesson = () =>
  useUserStore((state) => state.completeLesson);

export const useUserRobot = () => useUserStore((state) => state.user?.robot);

/**
 * Home HUD fields only — wallet balance ticks must not rebuild the robot's mood when
 * charge / spirit did not change, and vice versa.
 */
export const useHomeHudSource = () =>
  useUserStore(
    useShallow((state) => {
      const user = state.user;
      if (!user) return null;

      return {
        robot: user.robot,
        modules: user.modules,
        balance: user.wallet.balance,
        /** Newest earn — 2.5.4 on home; spends must not steal the badge. */
        lastEarn:
          user.wallet.history.find((entry) => entry.kind === 'earn') ?? null,
        savings: user.savings,
        tasks: user.tasks,
        phase: user.period.phase,
        /** 1-based — the planning card says "период 3 · начало". */
        periodIndex: user.period.index,
        isAnimationEnabled: user.settings.isAnimationEnabled,
      };
    }),
  );

export const useCreateUser = () => useUserStore((state) => state.createUser);

/** The only way to change the save — takes a pure update function. */
export const useUpdateUser = () => useUserStore((state) => state.updateUser);

/** Rejects stale confirmations and repeat taps before displaying success. */
export const useCommitUser = () => useUserStore((state) => state.commitUser);

/** Turns demo mode on and off, parking and restoring the child's save. */
export const useSetDemoMode = () => useUserStore((state) => state.setDemoMode);

/** Resets progress; name, looks and settings survive — 2.5.12. */
export const useResetUser = () => useUserStore((state) => state.resetUser);

/** Deletes the profile key irreversibly — 2.5.12. */
export const useDeleteUser = () => useUserStore((state) => state.deleteUser);

export type { UserPersistedState, UserStore };
