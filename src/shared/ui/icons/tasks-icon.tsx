import { PixelIcon } from '../pixel-icon';

import type { IconProps } from './icon';

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

export const TasksIcon = ({ size = 24, color }: IconProps) => (
  <PixelIcon name="face" size={size} color={color} />
);
