// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

/**
 * Abstraction over the wall clock. Nothing outside this file calls `Date.now()`
 * directly — see docs/game-period.md §TimeSource.
 *
 * Two implementations ship:
 * - `realTimeSource`  — production, delegates to the system clock.
 * - `demoTimeSource`  — app-wide demo clock; advances only on `tick()`.
 * Tests build isolated clocks with `makeDemoTimeSource(seed)`.
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

/**
 * Whether a time source can be advanced by hand.
 *
 * The context carries a plain `TimeSource`; only demo mode puts a clock with a
 * `tick()` in it. A caller that needs to advance time asks this instead of
 * importing the demo clock directly, so it follows the provider rather than
 * ticking a clock nobody is reading.
 */
export const isDemoTimeSource = (
  source: TimeSource,
): source is DemoTimeSource =>
  typeof (source as DemoTimeSource).tick === 'function';

/**
 * App-wide demo clock. Starts at the real moment the module loads so dates in
 * history stay readable, and advances only when `tick()` is called from a demo
 * run — see docs/game-period.md §Демо-режим.
 *
 * Tests keep using `makeDemoTimeSource(seed)` so they stay deterministic.
 */
export const demoTimeSource: DemoTimeSource = makeDemoTimeSource(
  realTimeSource.now(),
);

export type { DemoTimeSource, TimeSource };
