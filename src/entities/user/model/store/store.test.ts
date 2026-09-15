import { beforeEach, describe, expect, it, vi } from 'vitest';

import { STORAGE_KEYS } from '@/shared/constants';

import { createInitialUser, USER_SAVE_VERSION } from '../initial-user';

import { useUserStore } from './store';

// ═══════════════════════════════════════════
// MOCKS
// ═══════════════════════════════════════════

/**
 * The `@/shared/constants` barrel pulls in `theme.ts` and `app-version.ts`,
 * and with them `react-native` (Flow sources node cannot parse) and
 * `expo-constants`. The factory swaps the barrel for the keys module alone:
 * the values are the real ones, so renaming a key breaks this test, as it
 * should.
 */
vi.mock(
  '@/shared/constants',
  async () => await import('@/shared/constants/storage-keys'),
);

/** In-memory storage instead of the native module — and, crucially, sync. */
const storage = new Map<string, string>();

vi.mock('expo-sqlite/kv-store', () => ({
  default: {
    getItemSync: (key: string) => storage.get(key) ?? null,
    setItemSync: (key: string, value: string) => {
      storage.set(key, value);
    },
    removeItemSync: (key: string) => {
      storage.delete(key);
    },
  },
}));

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

/** Puts what `persist` would have written into storage and re-reads it. */
const writeAndRehydrate = (state: unknown) => {
  storage.set(
    STORAGE_KEYS.USER,
    JSON.stringify({ state, version: USER_SAVE_VERSION }),
  );

  useUserStore.persist.rehydrate();
};

const readStorage = () => {
  const raw = storage.get(STORAGE_KEYS.USER);

  return raw === undefined ? undefined : JSON.parse(raw);
};

// ═══════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════

describe('useUserStore', () => {
  beforeEach(() => {
    storage.clear();
    useUserStore.setState({ user: null });
  });

  it('survives a restart: the whole save comes back from storage', () => {
    useUserStore.getState().createUser({ playerName: 'Аня' });
    useUserStore.getState().updateUser((user) => ({
      ...user,
      wallet: { ...user.wallet, balance: 137 },
      savings: {
        ...user.savings,
        goals: user.savings.goals.map((goal) => ({ ...goal, saved: 40 })),
      },
      period: { ...user.period, index: 3 },
    }));

    // A restart: in-memory state is gone, what is on disk is not.
    const written = readStorage();
    useUserStore.setState({ user: null });
    writeAndRehydrate(written.state);

    const { user } = useUserStore.getState();

    expect(user?.playerName).toBe('Аня');
    expect(user?.wallet.balance).toBe(137);
    expect(user?.savings.goals[0]?.saved).toBe(40);
    expect(user?.period.index).toBe(3);
  });

  it('hydrates synchronously: the save is there on the very first read', async () => {
    // A freshly created store picks the save up at import time — that is what
    // the synchronous storage buys. The synchrony itself is proven above, where
    // `rehydrate()` is called without `await` and the assertions follow it.
    storage.set(
      STORAGE_KEYS.USER,
      JSON.stringify({
        state: { user: createInitialUser({ playerName: 'Аня' }) },
        version: USER_SAVE_VERSION,
      }),
    );

    vi.resetModules();
    const { useUserStore: freshStore } = await import('./store');

    // No `await` between creating the store and reading it: the save must be here.
    expect(freshStore.getState().user?.playerName).toBe('Аня');
  });

  it('writes on every change — there is no explicit save', () => {
    useUserStore.getState().createUser({ playerName: 'Аня' });

    expect(readStorage().state.user.playerName).toBe('Аня');

    useUserStore.getState().updateUser((user) => ({
      ...user,
      wallet: { ...user.wallet, balance: 7 },
    }));

    expect(readStorage().state.user.wallet.balance).toBe(7);
  });

  it('keeps the actions out of the file', () => {
    useUserStore.getState().createUser({ playerName: 'Аня' });

    expect(Object.keys(readStorage().state)).toEqual(['user']);
  });

  it('starts clean, and still starts, when the save is unreadable', () => {
    writeAndRehydrate({ user: { version: 1, playerName: 42 } });

    expect(useUserStore.getState().user).toBeNull();
  });

  it('migrates a save written by an older version', () => {
    const save: Record<string, unknown> = {
      ...createInitialUser({ playerName: 'Аня' }),
    };
    delete save.version;
    delete save.home;

    storage.set(
      STORAGE_KEYS.USER,
      JSON.stringify({ state: { user: save }, version: 0 }),
    );
    useUserStore.persist.rehydrate();

    expect(useUserStore.getState().user?.version).toBe(USER_SAVE_VERSION);
    expect(useUserStore.getState().user?.playerName).toBe('Аня');
  });

  it('resets to the starting state, keeping the name and the settings', () => {
    useUserStore.getState().createUser({ playerName: 'Аня' });
    useUserStore.getState().updateUser((user) => ({
      ...user,
      wallet: { ...user.wallet, balance: 137 },
      settings: { ...user.settings, isSoundEnabled: false },
    }));

    useUserStore.getState().resetUser();

    const { user } = useUserStore.getState();

    expect(user).toEqual(
      createInitialUser({ playerName: 'Аня', settings: user?.settings }),
    );
    expect(user?.settings.isSoundEnabled).toBe(false);
    expect(readStorage().state.user.wallet.balance).not.toBe(137);
  });

  it('leaves no key behind when the profile is deleted', async () => {
    useUserStore.getState().createUser({ playerName: 'Аня' });

    useUserStore.getState().deleteUser();
    await vi.waitFor(() => expect(storage.has(STORAGE_KEYS.USER)).toBe(false));

    expect(useUserStore.getState().user).toBeNull();
  });

  it('ignores an update when there is no profile yet', () => {
    useUserStore.getState().updateUser((user) => ({
      ...user,
      playerName: 'somebody',
    }));

    expect(useUserStore.getState().user).toBeNull();
  });
});
