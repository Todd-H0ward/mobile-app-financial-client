import { PixelIcon } from '../pixel-icon';

import type { IconProps } from './icon';

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

export const PiggyIcon = ({ size = 24, color }: IconProps) => (
  <PixelIcon name="piggy" size={size} color={color} />
);
