import { PixelIcon } from '../pixel-icon';

import type { IconProps } from './icon';

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

export const PlusIcon = ({ size = 24, color }: IconProps) => (
  <PixelIcon name="plus" size={size} color={color} />
);
