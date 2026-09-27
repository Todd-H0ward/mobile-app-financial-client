import { type ReactNode, useState } from 'react';

import {
  type LayoutChangeEvent,
  Platform,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import Svg, { Polygon } from 'react-native-svg';

import { SPACING, type ThemeColor } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

/** `both` cuts top-left and bottom-right; `topRight` is a speech bubble. */
type ChamferVariant = 'both' | 'topRight';

interface ChamferCardProps {
  children?: ReactNode;
  variant?: ChamferVariant;
  borderTone?: ThemeColor;
  fillTone?: ThemeColor;
  /** Fill override for the one tinted bubble that has no theme token. */
  fillColor?: string;
  /** Length of the cut along each edge, in points. */
  cut?: number;
  style?: StyleProp<ViewStyle>;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

const STROKE = 2;

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

const pointsFor = (
  variant: ChamferVariant,
  width: number,
  height: number,
  cut: number,
) => {
  const h = STROKE / 2;
  const right = width - h;
  const bottom = height - h;
  const corners =
    variant === 'both'
      ? [
          [cut, h],
          [right, h],
          [right, bottom - cut],
          [right - cut, bottom],
          [h, bottom],
          [h, cut],
        ]
      : [
          [h, h],
          [right - cut, h],
          [right, cut],
          [right, bottom],
          [h, bottom],
        ];
  return corners.map(([x, y]) => `${x},${y}`).join(' ');
};

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

/**
 * A card with its corners cut off — the Overseer's signature. The child's own
 * interface never uses it, so a cut corner always means "the Overseer speaks".
 * React Native has no clip-path, so the frame is drawn behind the content.
 */
export const ChamferCard = ({
  children,
  variant = 'both',
  borderTone = 'overseerLcd',
  fillTone = 'surface',
  fillColor,
  cut = 14,
  style,
}: ChamferCardProps) => {
  const theme = useTheme();
  const [size, setSize] = useState({ height: 0, width: 0 });

  const handleLayout = (event: LayoutChangeEvent) => {
    const { height, width } = event.nativeEvent.layout;
    if (height !== size.height || width !== size.width) {
      setSize({ height, width });
    }
  };

  return (
    <View onLayout={handleLayout} style={[styles.root, style]}>
      {size.width > 0 ? (
        <Svg
          width={size.width}
          height={size.height}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
          {...(Platform.OS === 'web'
            ? { 'aria-hidden': true }
            : {
                accessible: false,
                accessibilityElementsHidden: true,
                importantForAccessibility: 'no-hide-descendants' as const,
              })}
        >
          <Polygon
            points={pointsFor(variant, size.width, size.height, cut)}
            fill={fillColor ?? theme[fillTone]}
            stroke={theme[borderTone]}
            strokeWidth={STROKE}
          />
        </Svg>
      ) : null}
      {children}
    </View>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  root: {
    gap: SPACING.one,
    paddingHorizontal: 14,
    paddingVertical: SPACING.compact,
  },
});

export type { ChamferCardProps, ChamferVariant };
