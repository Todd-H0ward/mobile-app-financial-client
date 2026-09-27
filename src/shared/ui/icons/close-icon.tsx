import { PixelIcon } from '../pixel-icon';

import type { IconProps } from './icon';

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

export const CloseIcon = ({ size = 24, color }: IconProps) => (
  <PixelIcon name="close" size={size} color={color} />
);
