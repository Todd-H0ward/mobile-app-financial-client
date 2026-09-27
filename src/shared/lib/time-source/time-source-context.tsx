import { createContext, useContext } from 'react';

import type { TimeSource } from './time-source';
import { realTimeSource } from './time-source';

// ═══════════════════════════════════════════
// CONTEXT
// ═══════════════════════════════════════════

/** Wallet / content stamps only — period engine never reads the clock (0.3-R). */
export const TimeSourceContext = createContext<TimeSource>(realTimeSource);

/** Active `TimeSource`; never call `Date.now()` outside `realTimeSource`. */
export const useTimeSource = (): TimeSource => useContext(TimeSourceContext);
