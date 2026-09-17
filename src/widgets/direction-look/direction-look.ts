import type { BudgetDirection } from '@/entities/economy';

import type { ThemeColor } from '@/shared/constants';
import type { ShapeVariant } from '@/shared/ui';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

/** How one direction looks wherever the three of them stand together. */
interface DirectionLook {
    surface: ThemeColor;
    accent: ThemeColor;
  /** Readable-on-`surface` color for the basket's title. */
  label: ThemeColor;
  /**
   * Marker shape. Colour is never the only carrier of a difference (3.6), so
   * each direction keeps a silhouette of its own — the same pairing `Chip`
   * already uses: needs is a circle, wants a diamond.
   */
  marker: ShapeVariant;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/**
 * The look of the three budget directions.
 *
 * Shared by onboarding and the real plan screen so the same three words keep
 * the same colours and markers everywhere — docs/budget.md.
 */
export const DIRECTION_LOOK: Record<BudgetDirection, DirectionLook> = {
  needs: {
    surface: 'primarySoft',
    accent: 'primary',
    label: 'primaryStrong',
    marker: 'circle',
  },
  wants: {
    surface: 'accentSoft',
    accent: 'accent',
    label: 'accentStrong',
    marker: 'diamond',
  },
  savings: {
    surface: 'successSoft',
    accent: 'success',
    label: 'successStrong',
    marker: 'leaf',
  },
};

export type { DirectionLook };
