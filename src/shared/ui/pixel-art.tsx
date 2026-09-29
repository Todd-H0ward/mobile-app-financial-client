import { memo, useMemo } from 'react';

import { Platform, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { pixelPaths, pixelSize } from '@/shared/utils';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface PixelArtProps {
  /** One string per row, one character per pixel; `.` is transparent. */
  rows: readonly string[];
  /** Ink for every character the rows use. An unknown one stays transparent. */
  palette: Readonly<Record<string, string>>;
  /** Width in design points; the height follows the grid's proportions. */
  size?: number;
  style?: StyleProp<ViewStyle>;
}

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

/** Decorative: the surrounding control supplies the accessible name. */
export const PixelArt = memo(
  ({ rows, palette, size = 32, style }: PixelArtProps) => {
    const { width, height } = pixelSize(rows);
    const paths = useMemo(() => pixelPaths(rows, palette), [rows, palette]);

    return (
      <Svg
        style={style}
        width={size}
        height={(size * height) / width}
        viewBox={`0 0 ${width} ${height}`}
        {...(Platform.OS === 'web'
          ? { 'aria-hidden': true }
          : {
              accessible: false,
              accessibilityElementsHidden: true,
              importantForAccessibility: 'no-hide-descendants' as const,
            })}
        pointerEvents="none"
      >
        {paths.map((path) => (
          <Path key={path.ink} d={path.d} fill={path.color} />
        ))}
      </Svg>
    );
  },
);

export type { PixelArtProps };
