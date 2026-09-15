// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

/**
 * Abstraction over the wall clock. Nothing outside this file calls `Date.now()`
 * directly — see docs/game-period.md §TimeSource.
 *
 * Two implementations ship:
 * - `realTimeSource`    — production, delegates to the system clock.
 * - `makeDemoTimeSource` — demo mode, a manually controlled counter so that
 *   five periods can be run back-to-back without waiting for real time.
 */
interface TimeSource {
  /** Current moment, epoch ms. */
  now: () => number;
}

/**
 * Demo-mode time source. `tick()` advances the clock by one millisecond, which
 * is enough to produce a distinct, ordered timestamp without blocking the thread.
 */
interface DemoTimeSource extends TimeSource {
  /**
   * Advance the clock by one millisecond. Call once after each period
   * transition so that `phaseEnteredAt` values are strictly ascending in the
   * history.
   */
  tick: () => void;
}

// ═══════════════════════════════════════════
// REAL TIME SOURCE
// ═══════════════════════════════════════════

/**
 * The production time source.
 *
 * `Date.now()` is the **only** call in the entire codebase that reads the
 * system clock. Every other module that needs a timestamp receives it as a
 * parameter or through a `TimeSource`. Changing a system clock or running in
 * demo mode therefore affects only this single line.
 */
export const realTimeSource: TimeSource = {
  now: () => Date.now(),
};

// ═══════════════════════════════════════════
// DEMO TIME SOURCE
// ═══════════════════════════════════════════

/**
 * A time source whose clock advances only when `tick()` is called.
 *
 * Used by demo mode (2.5.13): five periods can be completed without any real
 * time passing. All formulas receive the same kind of timestamps they would
 * get in production, so the demo exercises the real code paths.
 *
 * @param startMs - The initial value returned by `now()`. Defaults to a fixed
 *   epoch value so that tests never depend on when they run.
 */
export const makeDemoTimeSource = (startMs = 0): DemoTimeSource => {
  let current = startMs;

  return {
    now: () => current,
    tick: () => {
      current += 1;
    },
  };
};

export type { DemoTimeSource, TimeSource };
