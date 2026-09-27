import { PixelIcon } from '../pixel-icon';

import type { IconProps } from './icon';

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

export const BackIcon = ({ size = 24, color }: IconProps) => (
  <PixelIcon name="back" size={size} color={color} />
);
