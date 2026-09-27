import type { BudgetDirection } from '@/entities/economy';

import type { ThemeColor } from '@/shared/constants';
import type { PixelIconName, ShapeVariant } from '@/shared/ui';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

/** How one direction looks wherever the three of them stand together. */
interface DirectionLook {
  icon: PixelIconName;
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
 * Shared by the plan screen, the shop and the summary so the same three words
 * keep the same icons everywhere — colour is never the only category signal.
 */
export const DIRECTION_LOOK: Record<BudgetDirection, DirectionLook> = {
  needs: {
    icon: 'battery',
    surface: 'surface',
    accent: 'primary',
    label: 'text',
    marker: 'circle',
  },
  wants: {
    icon: 'gear',
    surface: 'surface',
    accent: 'primary',
    label: 'text',
    marker: 'diamond',
  },
  savings: {
    icon: 'piggy',
    surface: 'surface',
    accent: 'primary',
    label: 'text',
    marker: 'leaf',
  },
};

export type { DirectionLook };
