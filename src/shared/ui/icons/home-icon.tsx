import { PixelIcon } from '../pixel-icon';

import type { IconProps } from './icon';

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

export const HomeIcon = ({ size = 24, color }: IconProps) => (
  <PixelIcon name="up" size={size} color={color} />
);
