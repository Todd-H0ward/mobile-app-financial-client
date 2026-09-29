import type { StyleProp, ViewStyle } from 'react-native';

import { PixelArt } from '@/shared/ui';

import { SPRITE_PALETTE, SPRITES, type SpriteName } from '../model';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface SpriteProps {
  name: SpriteName;
  /** Width in design points; the height follows the sprite's proportions. */
  size?: number;
  style?: StyleProp<ViewStyle>;
}

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

/** One sprite of the sheet in the game's own palette. Decorative. */
export const Sprite = ({ name, size = 32, style }: SpriteProps) => {
  return (
    <PixelArt
      rows={SPRITES[name]}
      palette={SPRITE_PALETTE}
      size={size}
      style={style}
    />
  );
};

export type { SpriteProps };
