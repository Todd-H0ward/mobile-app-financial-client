import { describe, expect, it, vi } from 'vitest';
import type { StorageValue } from 'zustand/middleware';
import { createStore } from 'zustand/vanilla';

import { durablePersist } from './durable-persist';

interface Save {
  balance: number;
}
interface State extends Save {
  earn: (amount: number) => void;
}

const fixture = (initial: StorageValue<Save> | null = null) => {
  let disk = initial;
  const storage = {
    getItem: () => disk,
    setItem: vi.fn((_name: string, value: StorageValue<Save>) => {
      disk = value;
    }),
    removeItem: () => {
      disk = null;
    },
  };
  const store = createStore<State>()(
    durablePersist(
      (set) => ({
        balance: 50,
        earn: (amount) => set((state) => ({ balance: state.balance + amount })),
      }),
      {
        name: 'test',
        version: 2,
        storage,
        partialize: ({ balance }) => ({ balance }),
        migrate: (saved) => ({ balance: (saved as Save).balance + 1 }),
      },
    ),
  );
  return { store, storage, read: () => disk };
};

describe('durable persistence', () => {
  it('does not publish a failed action or change the previous disk snapshot', () => {
    const { store, storage, read } = fixture();
    store.getState().earn(10);
    const listener = vi.fn();
    store.subscribe(listener);
    storage.setItem.mockImplementationOnce(() => {
      throw new Error('disk full');
    });
    expect(() => store.getState().earn(20)).toThrow('disk full');
    expect(store.getState().balance).toBe(60);
    expect(read()?.state.balance).toBe(60);
    expect(listener).not.toHaveBeenCalled();
    store.getState().earn(20);
    expect(store.getState().balance).toBe(80);
  });

  it('commits once before a subscriber sees the action', () => {
    const { store, storage, read } = fixture();
    store.subscribe((state) =>
      expect(read()?.state.balance).toBe(state.balance),
    );
    store.getState().earn(5);
    expect(storage.setItem).toHaveBeenCalledTimes(1);
    expect(read()).toEqual({ state: { balance: 55 }, version: 2 });
  });

  it('also protects external setState on a failed write', () => {
    const { store, storage } = fixture();
    storage.setItem.mockImplementationOnce(() => {
      throw new Error('offline disk');
    });
    expect(() => store.setState({ balance: 0 })).toThrow('offline disk');
    expect(store.getState().balance).toBe(50);
  });

  it('hydrates and migrates synchronously without losing actions', () => {
    const { store, read } = fixture({ state: { balance: 80 }, version: 1 });
    expect(store.getState().balance).toBe(81);
    expect(read()?.version).toBe(2);
    store.getState().earn(4);
    expect(read()?.state.balance).toBe(85);
    store.persist.rehydrate();
    expect(store.getState().balance).toBe(85);
  });

  it('keeps a nested subscriber action as the latest durable state', () => {
    const { store, read } = fixture();
    store.subscribe((state) => {
      if (state.balance === 55) state.earn(10);
    });
    store.getState().earn(5);
    expect(store.getState().balance).toBe(65);
    expect(read()?.state.balance).toBe(65);
  });
});
