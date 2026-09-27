import { PixelIcon } from '../pixel-icon';

import type { IconProps } from './icon';

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

export const SettingsIcon = ({ size = 24, color }: IconProps) => (
  <PixelIcon name="settings" size={size} color={color} />
);
