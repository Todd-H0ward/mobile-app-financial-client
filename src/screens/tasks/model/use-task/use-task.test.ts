import { createElement, type ReactElement } from 'react';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { listTasks, rewardForTask, TASK_WRONG_SHARE } from '@/entities/task';
import {
  createInitialUser,
  endPeriod,
  finishPeriod,
  startPeriod,
  type UserSave,
  useUserStore,
} from '@/entities/user';

import { STORAGE_KEYS } from '@/shared/constants';
import { makeDemoTimeSource } from '@/shared/lib/time-source';

import { useTaskPlay, useTasksList } from './use-task';

import { createRequire } from 'node:module';

// Only the server renderer is used; this project ships react-dom for Expo web
// but does not otherwise need its DOM type declarations.
const { renderToString } = createRequire(import.meta.url)(
  'react-dom/server',
) as {
  renderToString: (element: ReactElement) => string;
};

// ═══════════════════════════════════════════
// MOCKS
// ═══════════════════════════════════════════

const { storage, showFeedback, hapticSuccess } = vi.hoisted(() => ({
  storage: new Map<string, string>(),
  showFeedback: vi.fn(),
  hapticSuccess: vi.fn(),
}));

vi.mock(
  '@/shared/constants',
  async () => await import('@/shared/constants/storage-keys'),
);

vi.mock('expo-sqlite/kv-store', () => ({
  default: {
    getItemSync: (key: string) => storage.get(key) ?? null,
    setItemSync: (key: string, value: string) => storage.set(key, value),
    /** The async variant used by persist-storage for non-blocking writes. */
    setItem: async (key: string, value: string) => storage.set(key, value),
    setItemAsync: async (key: string, value: string) => storage.set(key, value),
    removeItemSync: (key: string) => storage.delete(key),
  },
}));

vi.mock('@/features/feedback', () => ({
  useShowFeedback: () => showFeedback,
}));

vi.mock('@/shared/hooks', () => ({
  useReducedMotion: () => false,
}));

vi.mock('@/shared/lib', () => ({
  hapticSuccess,
  useTimeSource: () => makeDemoTimeSource(),
}));

// Only React subscriptions are replaced. Transitions, persistence and the
// store updater stay real, including the state change between two presses.
vi.mock('@/entities/user', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/entities/user')>();
  return {
    ...original,
    useUser: () => original.useUserStore.getState().user,
    useUpdateUser: () => original.useUserStore.getState().updateUser,
  };
});

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

const activeUser = () => {
  const user = createInitialUser({ createdAt: 100 });
  return startPeriod({
    ...user,
    period: { ...user.period, plan: { needs: 20, wants: 10, savings: 10 } },
  });
};

// Rendering captures the same callbacks that a mounted screen retains until
// React renders again. No native view or emulator is needed for this race.
const captureHook = <T>(hook: () => T): T => {
  const result: T[] = [];
  const Probe = () => {
    result.push(hook());
    return null;
  };
  renderToString(createElement(Probe));
  return result[0];
};

const currentUser = (): UserSave => {
  const user = useUserStore.getState().user;
  if (!user) throw new Error('Expected a profile');
  return user;
};

const reopenFromDisk = async () => {
  const raw = storage.get(STORAGE_KEYS.USER);
  if (!raw) throw new Error('Expected a persisted profile');
  useUserStore.setState({ user: null });
  storage.set(STORAGE_KEYS.USER, raw);
  await useUserStore.persist.rehydrate();
};

// ═══════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════

beforeEach(() => {
  storage.clear();
  useUserStore.setState({ user: activeUser(), demoBackup: null });
  showFeedback.mockReset();
  hapticSuccess.mockReset();
});

describe('task attempt lifecycle', () => {
  it.each(listTasks())(
    'leaving $id before confirmation pays nothing',
    async (task) => {
      const before = currentUser();
      captureHook(() => useTasksList()).openTask(task.id);
      expect(captureHook(() => useTaskPlay(task.id))?.canPlay).toBe(true);

      await reopenFromDisk();
      const reopened = captureHook(() => useTaskPlay(task.id));
      expect(reopened?.canPlay).toBe(true);
      expect(reopened?.isDone).toBe(false);
      expect(currentUser().tasks.activeTaskId).toBe(task.id);
      expect(currentUser().wallet).toEqual(before.wallet);
      expect(showFeedback).not.toHaveBeenCalled();
    },
  );

  it.each(
    listTasks().flatMap((task) =>
      [1, TASK_WRONG_SHARE].map((share) => ({ task, share })),
    ),
  )(
    'pays once after reopening $task.id, reward share $share',
    async ({ task, share }) => {
      const initialBalance = currentUser().wallet.balance;
      const play = captureHook(() => useTaskPlay(task.id));
      expect(play?.complete(share, share === 1)).toBe(true);
      const reward = Math.max(1, Math.round(rewardForTask(task) * share));

      await reopenFromDisk();
      const reopened = captureHook(() => useTaskPlay(task.id));
      expect(reopened?.isDone).toBe(true);
      expect(reopened?.canPlay).toBe(false);
      expect(reopened?.complete(1, true)).toBe(false);
      expect(currentUser().wallet.balance).toBe(initialBalance + reward);
      expect(
        currentUser().wallet.history.filter(
          (row) => row.source === `task:${task.id}`,
        ),
      ).toHaveLength(1);
    },
  );

  it('accepts only the first of two presses before another render', () => {
    const task = listTasks()[0];
    const play = captureHook(() => useTaskPlay(task.id));
    expect(play?.complete(TASK_WRONG_SHARE, false)).toBe(true);
    const saved = currentUser();
    expect(play?.complete(1, true)).toBe(false);
    expect(currentUser()).toBe(saved);
    expect(showFeedback).toHaveBeenCalledTimes(1);
    expect(hapticSuccess).toHaveBeenCalledTimes(1);
  });

  it('keeps changes made after the screen rendered and reports the actual delta', () => {
    const task = listTasks()[0];
    const play = captureHook(() => useTaskPlay(task.id));
    useUserStore.getState().updateUser((user) => ({
      ...user,
      wallet: { ...user.wallet, balance: user.wallet.balance + 7 },
      settings: { ...user.settings, isSoundEnabled: false },
    }));
    const before = currentUser();
    expect(play?.complete(1, true)).toBe(true);
    expect(currentUser().wallet.balance).toBe(
      before.wallet.balance + rewardForTask(task),
    );
    expect(currentUser().settings.isSoundEnabled).toBe(false);
    expect(showFeedback).toHaveBeenCalledWith(
      expect.objectContaining({ before, after: currentUser() }),
    );
  });

  it('writes the result before displaying feedback', () => {
    const task = listTasks()[0];
    showFeedback.mockImplementation(() => {
      expect(currentUser().tasks.completedThisPeriod).toContain(task.id);
    });
    expect(captureHook(() => useTaskPlay(task.id))?.complete(1, true)).toBe(
      true,
    );
  });

  it('does not complete an old attempt once the period is in its summary', () => {
    const task = listTasks()[0];
    const play = captureHook(() => useTaskPlay(task.id));
    useUserStore.getState().updateUser(finishPeriod);
    const before = currentUser();
    expect(play?.complete(1, true)).toBe(false);
    expect(currentUser()).toBe(before);
    expect(showFeedback).not.toHaveBeenCalled();
  });

  it('rejects an old callback in the next active period, but allows a new attempt', () => {
    const task = listTasks()[0];
    const oldAttempt = captureHook(() => useTaskPlay(task.id));
    useUserStore.getState().updateUser((user) => {
      const next = endPeriod(finishPeriod(user));
      return startPeriod({
        ...next,
        period: { ...next.period, plan: user.period.plan },
      });
    });
    const before = currentUser();
    expect(oldAttempt?.complete(1, true)).toBe(false);
    expect(currentUser()).toBe(before);
    expect(captureHook(() => useTaskPlay(task.id))?.complete(1, true)).toBe(
      true,
    );
    expect(currentUser().wallet.history[0].periodIndex).toBe(
      before.period.index,
    );
  });

  it('does not show success after deleting the profile', () => {
    const play = captureHook(() => useTaskPlay(listTasks()[0].id));
    useUserStore.getState().deleteUser();
    expect(play?.complete(1, true)).toBe(false);
    expect(useUserStore.getState().user).toBeNull();
    expect(showFeedback).not.toHaveBeenCalled();
  });

  it('does not transfer an old attempt into a replacement profile', () => {
    const play = captureHook(() => useTaskPlay(listTasks()[0].id));
    useUserStore.setState({ user: { ...activeUser(), createdAt: 200 } });
    const before = currentUser();
    expect(play?.complete(1, true)).toBe(false);
    expect(currentUser()).toBe(before);
    expect(showFeedback).not.toHaveBeenCalled();
  });

  it('does not transfer an old attempt into demo mode', () => {
    const play = captureHook(() => useTaskPlay(listTasks()[0].id));
    useUserStore.getState().setDemoMode(true);
    const before = currentUser();
    expect(play?.complete(1, true)).toBe(false);
    expect(currentUser()).toBe(before);
    expect(showFeedback).not.toHaveBeenCalled();
  });
});

describe('task selection', () => {
  it('does not overwrite a completion from the same rendered task list', () => {
    const [first, second] = listTasks();
    const list = captureHook(() => useTasksList());
    captureHook(() => useTaskPlay(first.id))?.complete(1, true);
    const saved = currentUser();
    list.openTask(second.id);
    expect(currentUser().wallet).toEqual(saved.wallet);
    expect(currentUser().tasks.completedThisPeriod).toContain(first.id);
    expect(currentUser().tasks.activeTaskId).toBe(second.id);
  });

  it('ignores an old selection after the active period ended', () => {
    const list = captureHook(() => useTasksList());
    useUserStore.getState().updateUser(finishPeriod);
    const before = currentUser();
    list.openTask(listTasks()[1].id);
    expect(currentUser()).toBe(before);
  });
});
