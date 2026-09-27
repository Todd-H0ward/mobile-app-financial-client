import { memo } from 'react';

import {
  Platform,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import Svg, { Ellipse } from 'react-native-svg';

import { useTheme } from '@/shared/hooks';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface RingsBackdropProps {
  /** Where the rings meet, 0…1 of the height; above 1 sits below the view. */
  centerY?: number;
  /** Ring count, outermost first. */
  count?: number;
  style?: StyleProp<ViewStyle>;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

const VIEW_WIDTH = 360;
const VIEW_HEIGHT = 640;
const RING_STEP = 22;

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

/**
 * Concentric bands of concrete — the terraces of the scene seen from above,
 * the backdrop every terminal hangs over. Decorative, never read aloud.
 */
export const RingsBackdrop = memo(
  ({ centerY = 0.6, count = 16, style }: RingsBackdropProps) => {
    const theme = useTheme();
    const rings = Array.from(
      { length: count },
      (_, index) => (count - index) * RING_STEP,
    );

    return (
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: theme.sceneBase },
          style,
        ]}
      >
        <Svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
          preserveAspectRatio="xMidYMid slice"
          {...(Platform.OS === 'web'
            ? { 'aria-hidden': true }
            : {
                accessible: false,
                accessibilityElementsHidden: true,
                importantForAccessibility: 'no-hide-descendants' as const,
              })}
        >
          {rings.map((rx, index) => (
            <Ellipse
              key={rx}
              cx={VIEW_WIDTH / 2}
              cy={VIEW_HEIGHT * centerY}
              rx={rx * 1.1}
              ry={rx * 0.5}
              fill={index % 2 === 0 ? theme.sceneLight : theme.sceneShade}
            />
          ))}
        </Svg>
      </View>
    );
  },
);

export type { RingsBackdropProps };
