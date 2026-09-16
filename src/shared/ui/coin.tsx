import { useEffect, useMemo, useState } from 'react';

import {
  AccessibilityInfo,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  Defs,
  G,
  Line,
  LinearGradient,
  Stop,
} from 'react-native-svg';

import { useTheme } from '@/shared/hooks';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface CoinProps {
  /** Diameter in design points. */
  size?: number;
  /**
   * Runs a soft shimmer across the face. Off when the system asks for
   * reduced motion.
   */
  isActive?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

const DEFAULT_SIZE = 28;

/** How many reed marks around the rim — enough to read as a milled edge. */
const REED_COUNT = 28;

const SHIMMER_MS = 1600;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

const reedLines = (cx: number, cy: number, outer: number, inner: number) => {
  const lines = [];
  for (let i = 0; i < REED_COUNT; i += 1) {
    const angle = (i / REED_COUNT) * Math.PI * 2;
    lines.push({
      key: i,
      x1: cx + Math.cos(angle) * inner,
      y1: cy + Math.sin(angle) * inner,
      x2: cx + Math.cos(angle) * outer,
      y2: cy + Math.sin(angle) * outer,
    });
  }
  return lines;
};

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

/**
 * A tactile coin: milled rim, soft shadow, optional shimmer when active.
 *
 * Money is always shown as coins, never as roubles — see design-system.md.
 */
export const Coin = ({
  size = DEFAULT_SIZE,
  isActive = false,
  style,
  accessibilityLabel,
}: CoinProps) => {
  const theme = useTheme();
  const [isReduceMotion, setIsReduceMotion] = useState(false);
  const shimmer = useSharedValue(0.15);

  const vb = 48;
  const cx = 24;
  const cy = 24;
  const reeds = useMemo(() => reedLines(cx, cy, 22.2, 19.4), []);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setIsReduceMotion(enabled);
    });
    const sub = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setIsReduceMotion,
    );
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  useEffect(() => {
    if (!isActive || isReduceMotion) {
      shimmer.value = 0.2;
      return;
    }
    shimmer.value = withRepeat(
      withTiming(0.55, {
        duration: SHIMMER_MS,
        easing: Easing.inOut(Easing.quad),
      }),
      -1,
      true,
    );
  }, [isActive, isReduceMotion, shimmer]);

  const highlightProps = useAnimatedProps(() => ({
    opacity: shimmer.value,
  }));

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.root,
        {
          height: size,
          shadowColor: theme.coinBorder,
          width: size,
        },
        style,
      ]}
    >
      <Svg width={size} height={size} viewBox={`0 0 ${vb} ${vb}`}>
        <Defs>
          <LinearGradient id="coinFace" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={theme.coin} stopOpacity="1" />
            <Stop offset="1" stopColor={theme.coinBorder} stopOpacity="1" />
          </LinearGradient>
        </Defs>

        {/* Soft under-disc for depth */}
        <Circle
          cx={cx}
          cy={cy + 1.2}
          r={21.5}
          fill={theme.coinBorder}
          opacity={0.35}
        />

        {/* Face */}
        <Circle cx={cx} cy={cy} r={21} fill="url(#coinFace)" />
        <Circle
          cx={cx}
          cy={cy}
          r={21}
          fill="none"
          stroke={theme.coinBorder}
          strokeWidth={1.6}
        />

        {/* Reeded edge */}
        <G
          stroke={theme.coinBorder}
          strokeWidth={1.1}
          strokeLinecap="round"
          opacity={0.85}
        >
          {reeds.map((reed) => (
            <Line
              key={reed.key}
              x1={reed.x1}
              y1={reed.y1}
              x2={reed.x2}
              y2={reed.y2}
            />
          ))}
        </G>

        {/* Inner ring */}
        <Circle
          cx={cx}
          cy={cy}
          r={12.5}
          fill="none"
          stroke={theme.coinBorder}
          strokeWidth={1.4}
          opacity={0.7}
        />

        {/* Static catch-light */}
        <Circle cx={16} cy={15} r={5.5} fill="#FFFFFF" opacity={0.35} />

        {/* Animated shimmer blob */}
        <AnimatedCircle
          cx={28}
          cy={18}
          r={7}
          fill="#FFFFFF"
          animatedProps={highlightProps}
        />
      </Svg>
    </View>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  root: {
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 3,
  },
});

export type { CoinProps };
