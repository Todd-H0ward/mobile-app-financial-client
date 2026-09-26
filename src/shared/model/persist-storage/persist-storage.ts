import Store from 'expo-sqlite/kv-store';

import type { SyncStorage } from '../durable-persist';

/** Synchronous JSON storage: no deferred write can resurrect a deleted save. */
export const createPersistStorage = <State>(): SyncStorage<State> => ({
  getItem: (name) => {
    const raw = Store.getItemSync(name);
    return raw === null ? null : JSON.parse(raw);
  },
  setItem: (name, value) => Store.setItemSync(name, JSON.stringify(value)),
  removeItem: (name) => {
    Store.removeItemSync(name);
  },
});

/** Preserve raw evidence before an explicitly requested new profile. A failed copy never erases the source. */
export const quarantineStorage = (name: string): void => {
  const raw = Store.getItemSync(name);
  if (raw !== null) Store.setItemSync(`${name}:recovery:${Date.now()}`, raw);
  Store.removeItemSync(name);
};
