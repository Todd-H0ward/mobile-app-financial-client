import { createContext, useContext } from 'react';

import type { TimeSource } from './time-source';
import { realTimeSource } from './time-source';

// ═══════════════════════════════════════════
// CONTEXT
// ═══════════════════════════════════════════

/**
 * Carries the active `TimeSource` through the React tree.
 *
 * `realTimeSource` is the default so that any component or test that does not
 * render inside a provider still gets a working implementation.
 * The only case where the context holds something else is demo mode, where
 * `Providers` swaps it for `makeDemoTimeSource`.
 */
export const TimeSourceContext = createContext<TimeSource>(realTimeSource);

/**
 * Returns the `TimeSource` that is currently active.
 *
 * Use this anywhere a timestamp is needed in a React component — never call
 * `Date.now()` outside `realTimeSource`. See docs/game-period.md §TimeSource.
 */
export const useTimeSource = (): TimeSource => useContext(TimeSourceContext);
