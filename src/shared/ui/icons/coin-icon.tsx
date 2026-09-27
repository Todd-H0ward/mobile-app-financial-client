import { PixelIcon } from '../pixel-icon';

import type { IconProps } from './icon';

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

export const CoinIcon = ({ size = 24, color }: IconProps) => (
  <PixelIcon name="coin" size={size} color={color} />
);
