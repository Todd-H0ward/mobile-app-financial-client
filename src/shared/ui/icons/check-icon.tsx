import { PixelIcon } from '../pixel-icon';

import type { IconProps } from './icon';

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

export const CheckIcon = ({ size = 20, color }: IconProps) => (
  <PixelIcon name="check20" size={size} color={color} />
);
