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
  /** Silhouette per direction — colour is never the only signal (3.6). */
  marker: ShapeVariant;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/** Shared icons/colours for the three budget directions (colour ≠ only cue). */
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
