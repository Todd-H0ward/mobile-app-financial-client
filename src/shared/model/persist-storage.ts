import Store from 'expo-sqlite/kv-store';
import { createJSONStorage, type StateStorage } from 'zustand/middleware';

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/**
 * How long to wait before flushing a pending write.
 *
 * Short enough that a crash still keeps almost every change; long enough that
 * a burst of `set` calls (slider, demo periods, purchase + feedback) collapses
 * into one SQLite write instead of blocking the JS thread on every one.
 */
const PERSIST_DEBOUNCE_MS = 80;

// ═══════════════════════════════════════════
// WRITE QUEUE
// ═══════════════════════════════════════════

/** Latest value per key waiting for disk — newer `setItem` replaces older. */
const pending = new Map<string, string>();

let flushTimer: ReturnType<typeof setTimeout> | null = null;
let flushChain: Promise<void> = Promise.resolve();

const writeKey = async (name: string, value: string): Promise<void> => {
  try {
    await Store.setItemAsync(name, value);
  } catch {
    // Async path unavailable (tests, web without wasm) — sync is the fallback
    // so a save is never silently dropped.
    try {
      Store.setItemSync(name, value);
    } catch {
      // Storage is gone; the in-memory store still holds the truth for this session.
    }
  }
};

const runFlush = async (): Promise<void> => {
  const batch = [...pending.entries()];
  pending.clear();

  for (const [name, value] of batch) {
    await writeKey(name, value);
  }
};

/**
 * Drains the write queue now. Tests and `deleteUser` call this so disk matches
 * memory before the next assertion or before the key is removed.
 */
export const flushPersistWrites = async (): Promise<void> => {
  if (flushTimer != null) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }

  if (pending.size === 0) {
    await flushChain;
    return;
  }

  flushChain = flushChain.then(runFlush, runFlush);
  await flushChain;
};

const scheduleFlush = (): void => {
  if (flushTimer != null) clearTimeout(flushTimer);
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flushChain = flushChain.then(runFlush, runFlush);
  }, PERSIST_DEBOUNCE_MS);
};

// ═══════════════════════════════════════════
// STORAGE
// ═══════════════════════════════════════════

/**
 * Sync read, debounced async write.
 *
 * Hydration stays synchronous on purpose (`docs/game-state.md`): `user === null`
 * means "no profile", never "still loading". Writes follow `docs/performance.md`
 * — the UI must not wait on SQLite for every `set`.
 */
const hybridStorage: StateStorage = {
  getItem: (name) => {
    // Reads always hit disk (or the sync mock). Pending writes exist so the
    // UI stays responsive — the in-memory zustand state is already current;
    // prefering the queue here would make `rehydrate()` after a local `set`
    // resurrect a stale wipe still waiting to flush.
    try {
      return Store.getItemSync(name);
    } catch {
      // Storage unavailable (web without wasm, a corrupted database) is a
      // clean start, not a crash at launch.
      return null;
    }
  },
  setItem: (name, value) => {
    pending.set(name, value);
    scheduleFlush();
  },
  removeItem: (name) => {
    pending.delete(name);
    try {
      Store.removeItemSync(name);
    } catch {
      // Same as getItem: missing storage is a clean device, not a throw.
    }
  },
};

/**
 * Storage for `persist`, typed to one particular save.
 *
 * The single place where the whole game picks its storage: swapping it means
 * changing this one line, not every store.
 */
export const createPersistStorage = <State>() =>
  createJSONStorage<State>(() => hybridStorage);
