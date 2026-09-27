import { PixelIcon } from '../pixel-icon';

import type { IconProps } from './icon';

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

export const MinusIcon = ({ size = 24, color }: IconProps) => (
  <PixelIcon name="minus" size={size} color={color} />
);
