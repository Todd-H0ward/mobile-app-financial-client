import { PixelIcon } from '../pixel-icon';

import type { IconProps } from './icon';

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

export const PawIcon = ({ size = 24, color }: IconProps) => (
  <PixelIcon name="heart" size={size} color={color} />
);
