import { PixelIcon } from '../pixel-icon';

import type { IconProps } from './icon';

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

export const ShopIcon = ({ size = 24, color }: IconProps) => (
  <PixelIcon name="wrench" size={size} color={color} />
);
