import type { StateCreator } from 'zustand';
import {
  type PersistOptions,
  persist,
  type StorageValue,
} from 'zustand/middleware';

interface SyncStorage<State> {
  getItem: (name: string) => StorageValue<State> | null;
  setItem: (name: string, value: StorageValue<State>) => void;
  removeItem: (name: string) => void;
}

type DurableOptions<State, Saved> = Omit<
  PersistOptions<State, Saved>,
  'storage' | 'partialize'
> & {
  storage: SyncStorage<Saved>;
  partialize: (state: State) => Saved;
};

/**
 * Keep Zustand's hydration, migrations and persist API, but commit actions to
 * synchronous storage before publishing to subscribers. A failed disk write
 * leaves both memory and the previous durable snapshot unchanged.
 */
export const durablePersist =
  <State extends object, Saved>(
    initializer: StateCreator<State, [], []>,
    options: DurableOptions<State, Saved>,
  ): StateCreator<State, [], [['zustand/persist', Saved]]> =>
  (set, get, api) => {
    const commit: typeof set = (partial, replace) => {
      const current = get();
      const update = typeof partial === 'function' ? partial(current) : partial;
      if (Object.is(update, current)) return;
      const next = replace
        ? (update as State)
        : Object.assign({}, current, update);
      options.storage.setItem(options.name, {
        state: options.partialize(next),
        version: options.version ?? 0,
      });
      // Always publish the snapshot that was just committed, including actions.
      set(next, true);
    };
    const initial = persist<State, [], [], Saved>(
      (_persistSet, read, store) => initializer(commit, read, store),
      options,
    )(set, get, api);
    // External setState must obey the same ordering as actions from initializer.
    api.setState = commit;
    return initial;
  };

export type { DurableOptions, SyncStorage };
