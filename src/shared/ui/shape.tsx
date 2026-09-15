import { StyleSheet, View, type ViewProps } from 'react-native';

import { RADII } from '@/shared/constants';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

type ShapeVariant = 'circle' | 'square' | 'diamond' | 'pill' | 'leaf' | 'dome';

interface ShapeProps extends ViewProps {
  /** Geometry of the placeholder. */
  variant?: ShapeVariant;
  /** Side of the bounding box, in design points. */
  size?: number;
  color: string;
  /** Draw only the outline — used for inactive navigation icons. */
  isOutlined?: boolean;
}

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

/**
 * Geometric icon placeholder. The icon set is not drawn yet, so the kit ships
 * the shapes the mockups use; swap this for the real icon component later.
 */
export const Shape = ({
  variant = 'square',
  size = 22,
  color,
  isOutlined = false,
  style,
  ...props
}: ShapeProps) => {
  const side = size;

  return (
    <View
      style={[
        {
          backgroundColor: isOutlined ? 'transparent' : color,
          borderColor: color,
          borderWidth: isOutlined ? 3 : 0,
          height: variant === 'pill' ? side * 0.72 : side,
          width: side,
        },
        variant === 'circle' && styles.circle,
        variant === 'square' && { borderRadius: side * 0.3 },
        variant === 'diamond' && {
          borderRadius: side * 0.18,
          transform: [{ rotate: '45deg' }],
          width: side * 0.82,
          height: side * 0.82,
        },
        variant === 'pill' && styles.pill,
        variant === 'leaf' && {
          borderRadius: side * 0.4,
          borderBottomLeftRadius: side * 0.14,
        },
        variant === 'dome' && {
          borderRadius: side * 0.5,
          borderBottomLeftRadius: side * 0.36,
          borderBottomRightRadius: side * 0.36,
        },
        style,
      ]}
      {...props}
    />
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  circle: {
    borderRadius: RADII.pill,
  },
  pill: {
    borderRadius: RADII.pill,
  },
});

export type { ShapeProps, ShapeVariant };
