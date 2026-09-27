import { PixelIcon } from '../pixel-icon';

import type { IconProps } from './icon';

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

export const HelpIcon = ({ size = 24, color }: IconProps) => (
  <PixelIcon name="question" size={size} color={color} />
);
