import { useCallback, useEffect, useRef, useState } from 'react';

import {
  type LayoutChangeEvent,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { RADII, SPACING } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';

import { Text } from './text';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface ScratchCardProps {
  /** What sits under the foil — coins, art, a message. */
  children: React.ReactNode;
  /** Hint on the foil before the child starts scratching. */
  foilLabel?: string;
  /** Fired once when enough of the foil is gone. */
  onReveal?: () => void;
  /** Fraction of tiles that must clear before reveal (0…1). */
  revealAt?: number;
  style?: StyleProp<ViewStyle>;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

const COLS = 10;
const ROWS = 7;
const BRUSH_RADIUS = 28;
/** Default: about a third of the ticket is enough to peek. */
const DEFAULT_REVEAL_AT = 0.32;

const TILE_TOTAL = COLS * ROWS;

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

/**
 * Lottery-ticket foil: the child rubs with a finger and the prize peeks out.
 *
 * Implemented as a tile grid (no Skia) so it stays Expo-Go friendly. Clearing
 * enough tiles fires `onReveal` once; the rest of the foil then fades away.
 *
 * Pan samples are batched to one React update per animation frame — every
 * `onUpdate` used to call `setState`, which janked mid-tier Android.
 */
export const ScratchCard = ({
  children,
  foilLabel,
  onReveal,
  revealAt = DEFAULT_REVEAL_AT,
  style,
}: ScratchCardProps) => {
  const theme = useTheme();
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [cleared, setCleared] = useState(() =>
    Array.from({ length: TILE_TOTAL }, () => false),
  );
  const [clearedCount, setClearedCount] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const didReveal = useRef(false);
  const foilOpacity = useSharedValue(1);

  // Mutable scratch buffer — gesture writes here; a single rAF flushes to React.
  const clearedRef = useRef(cleared);
  const clearedCountRef = useRef(0);
  const sizeRef = useRef(size);
  const rafId = useRef<number | null>(null);
  const isDirty = useRef(false);

  sizeRef.current = size;

  const flushCleared = useCallback(() => {
    rafId.current = null;
    if (!isDirty.current) return;
    isDirty.current = false;
    setCleared(clearedRef.current.slice());
    setClearedCount(clearedCountRef.current);
  }, []);

  const clearAt = useCallback(
    (x: number, y: number) => {
      const { width, height } = sizeRef.current;
      if (width <= 0 || height <= 0 || didReveal.current) return;

      const col = Math.floor((x / width) * COLS);
      const row = Math.floor((y / height) * ROWS);
      if (col < 0 || row < 0 || col >= COLS || row >= ROWS) return;

      const brushCols = Math.max(1, Math.round((BRUSH_RADIUS / width) * COLS));
      const brushRows = Math.max(1, Math.round((BRUSH_RADIUS / height) * ROWS));

      const next = clearedRef.current.slice();
      let added = 0;
      for (let r = row - brushRows; r <= row + brushRows; r += 1) {
        for (let c = col - brushCols; c <= col + brushCols; c += 1) {
          if (c < 0 || r < 0 || c >= COLS || r >= ROWS) continue;
          const i = r * COLS + c;
          if (!next[i]) {
            next[i] = true;
            added += 1;
          }
        }
      }

      if (added === 0) return;

      clearedRef.current = next;
      clearedCountRef.current += added;
      isDirty.current = true;

      if (rafId.current == null) {
        rafId.current = requestAnimationFrame(flushCleared);
      }
    },
    [flushCleared],
  );

  useEffect(
    () => () => {
      if (rafId.current != null) cancelAnimationFrame(rafId.current);
    },
    [],
  );

  useEffect(() => {
    if (didReveal.current) return;
    if (clearedCount / TILE_TOTAL < revealAt) return;
    didReveal.current = true;
    setIsRevealed(true);
    foilOpacity.value = withTiming(0, { duration: 280 });
    onReveal?.();
  }, [clearedCount, foilOpacity, onReveal, revealAt]);

  const pan = Gesture.Pan()
    .onBegin((e) => {
      runOnJS(clearAt)(e.x, e.y);
    })
    .onUpdate((e) => {
      runOnJS(clearAt)(e.x, e.y);
    })
    .minDistance(0);

  const foilStyle = useAnimatedStyle(() => ({
    opacity: foilOpacity.value,
  }));

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSize({ width, height });
  };

  const tileW = size.width > 0 ? size.width / COLS : 0;
  const tileH = size.height > 0 ? size.height / ROWS : 0;

  return (
    <View
      onLayout={onLayout}
      style={[
        styles.root,
        {
          backgroundColor: theme.surface,
          borderColor: theme.coinBorder,
        },
        style,
      ]}
    >
      <View style={styles.prize} pointerEvents="none">
        {children}
      </View>

      <GestureDetector gesture={pan}>
        <Animated.View
          pointerEvents={isRevealed ? 'none' : 'auto'}
          style={[styles.foil, foilStyle]}
        >
          {tileW > 0 &&
            cleared.map((isGone, index) => {
              if (isGone) return null;
              const col = index % COLS;
              const row = Math.floor(index / COLS);
              return (
                <View
                  key={index}
                  pointerEvents="none"
                  style={[
                    styles.tile,
                    {
                      backgroundColor:
                        (col + row) % 2 === 0
                          ? 'rgba(176, 178, 188, 0.97)'
                          : 'rgba(148, 150, 162, 0.97)',
                      height: tileH + 1,
                      left: col * tileW,
                      top: row * tileH,
                      width: tileW + 1,
                    },
                  ]}
                />
              );
            })}

          {foilLabel != null && clearedCount === 0 && (
            <View style={styles.labelWrap} pointerEvents="none">
              <Text
                variant="bodyBold"
                themeColor="inverseText"
                style={styles.label}
              >
                {foilLabel}
              </Text>
            </View>
          )}
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  foil: {
    ...StyleSheet.absoluteFill,
    borderRadius: RADII.l,
    overflow: 'hidden',
  },
  label: {
    textAlign: 'center',
  },
  labelWrap: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    backgroundColor: 'rgba(90, 92, 104, 0.25)',
    justifyContent: 'center',
    paddingHorizontal: SPACING.three,
  },
  prize: {
    alignItems: 'center',
    gap: SPACING.two,
    justifyContent: 'center',
    minHeight: 160,
    padding: SPACING.four,
  },
  root: {
    borderRadius: RADII.l,
    borderWidth: 2,
    overflow: 'hidden',
  },
  tile: {
    position: 'absolute',
  },
});

export type { ScratchCardProps };
