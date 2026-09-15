import Store from 'expo-sqlite/kv-store';
import { createJSONStorage, type StateStorage } from 'zustand/middleware';

// ═══════════════════════════════════════════
// STORAGE
// ═══════════════════════════════════════════

const syncStorage: StateStorage = {
  getItem: (name) => {
    try {
      return Store.getItemSync(name);
    } catch {
      // Storage unavailable (web without wasm, a corrupted database) is a
      // clean start, not a crash at launch.
      return null;
    }
  },
  setItem: (name, value) => {
    Store.setItemSync(name, value);
  },
  removeItem: (name) => {
    Store.removeItemSync(name);
  },
};

/**
 * Storage for `persist`, typed to one particular save.
 *
 * The single place where the whole game picks its storage: swapping it means
 * changing this one line, not every store.
 */
export const createPersistStorage = <State>() =>
  createJSONStorage<State>(() => syncStorage);
