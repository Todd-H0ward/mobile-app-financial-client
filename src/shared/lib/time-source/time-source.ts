// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

/** Wall clock abstraction — nothing else calls `Date.now()` (docs/game-period.md). */
interface TimeSource {
  /** Current moment, epoch ms. */
  now: () => number;
}

/** Demo clock: advances only via `tick()`. */
interface DemoTimeSource extends TimeSource {
  /** +1 ms; call after each period transition so history stamps ascend. */
  tick: () => void;
}

// ═══════════════════════════════════════════
// REAL TIME SOURCE
// ═══════════════════════════════════════════

/** Production clock — sole `Date.now()` call in the app. */
export const realTimeSource: TimeSource = {
  now: () => Date.now(),
};

// ═══════════════════════════════════════════
// DEMO TIME SOURCE
// ═══════════════════════════════════════════

/** Clock that advances only on `tick()` — demo / tests (2.5.13). */
export const makeDemoTimeSource = (startMs = 0): DemoTimeSource => {
  let current = startMs;

  return {
    now: () => current,
    tick: () => {
      current += 1;
    },
  };
};

/** True when the active source can be advanced by hand (demo). */
export const isDemoTimeSource = (
  source: TimeSource,
): source is DemoTimeSource =>
  typeof (source as DemoTimeSource).tick === 'function';

/** App-wide demo clock; tests use `makeDemoTimeSource(seed)` for determinism. */
export const demoTimeSource: DemoTimeSource = makeDemoTimeSource(
  realTimeSource.now(),
);

export type { DemoTimeSource, TimeSource };
