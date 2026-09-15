import type { HintContent, HintScreenId } from '../../model';
import { assertHintsContent } from '../schema';

import HINTS_CONTENT from '@/content/hints.json';

// ═══════════════════════════════════════════
// CATALOGUE
// ═══════════════════════════════════════════

/** Validated once at module load — bad JSON fails in tests, not mid-session. */
const HINTS = assertHintsContent(HINTS_CONTENT).hints;

/** Every hint, in file order. */
export const listHints = (): readonly HintContent[] => HINTS;

/**
 * The hint for one screen. The schema guarantees a row for every screen id,
 * so the widget can render without a fallback branch.
 */
export const getHint = (screen: HintScreenId): HintContent =>
  HINTS.find((hint) => hint.id === screen) as HintContent;
