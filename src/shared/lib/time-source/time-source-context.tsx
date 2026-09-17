import { createContext, useContext } from 'react';

import type { TimeSource } from './time-source';
import { realTimeSource } from './time-source';

// ═══════════════════════════════════════════
// CONTEXT
// ═══════════════════════════════════════════

/**
 * Carries the active `TimeSource` through the React tree.
 *
 * `realTimeSource` is the default and the only production value (0.3-R): the
 * period engine never reads the clock. Wallet and content stamps still go
 * through this context so tests can inject `makeDemoTimeSource(seed)`.
 */
export const TimeSourceContext = createContext<TimeSource>(realTimeSource);

/**
 * Returns the `TimeSource` that is currently active.
 *
 * Use this anywhere a **wallet / content** timestamp is needed — never call
 * `Date.now()` outside `realTimeSource`. Period transitions do not use this
 * hook; see docs/game-period.md.
 */
export const useTimeSource = (): TimeSource => useContext(TimeSourceContext);
