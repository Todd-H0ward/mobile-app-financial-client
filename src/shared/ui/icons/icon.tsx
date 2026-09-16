import { useTheme } from '@/shared/hooks';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface IconProps {
  /** Side of the square, in design points. */
  size?: number;
  /** Stroke color. Defaults to the theme's text color. */
  color?: string;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/**
 * The icon grid. Every icon is drawn in a 24 × 24 viewBox and rendered at
 * `ICON_SIZE` unless a caller asks for another size — see docs/design-system.md.
 */
const ICON_SIZE = 24;

/** Stroke width, in viewBox units. The whole set is one weight. */
const ICON_STROKE = 2;

// ═══════════════════════════════════════════
// HOOKS
// ═══════════════════════════════════════════

/**
 * The stroke an icon draws with.
 *
 * Icons carry meaning, so they take the reading color by default rather than a
 * decorative one; a caller passes `color` when the icon sits on a colored
 * surface. An icon is never the only carrier of a meaning — 3.6 asks for a text
 * label beside it.
 */
export const useIconColor = (color?: string): string => {
  const theme = useTheme();

  return color ?? theme.text;
};

export type { IconProps };
export { ICON_SIZE, ICON_STROKE };
