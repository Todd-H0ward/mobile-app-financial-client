import type { ReactNode } from 'react';
import { useEffect } from 'react';

import {
  Pressable,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, Pattern, Rect } from 'react-native-svg';

import { FONTS, RADII, SPACING } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import { useMotionEnabled } from '@/shared/model';
import { Text } from '@/shared/ui';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface TrialPanelProps {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Dimmer inset well for the playfield. */
  isWell?: boolean;
}

interface TrialChipProps {
  label: string;
  isSelected?: boolean;
  onPress?: () => void;
  disabled?: boolean;
  /** Optional glyph left of the label. */
  glyph?: string;
  /** Compact dial / ± without flex grow. */
  isCompact?: boolean;
}

interface RoundLampsProps {
  round: number;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

const CURSOR_MS = 520;

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

/** Thin CRT scanlines — same trick as the watcher terminal. */
export const TrialScanlines = () => (
  <Svg
    style={StyleSheet.absoluteFill}
    pointerEvents="none"
    importantForAccessibility="no-hide-descendants"
  >
    <Defs>
      <Pattern id="tscan" width={3} height={3} patternUnits="userSpaceOnUse">
        <Rect width={3} height={1} fill="#000000" opacity={0.35} />
      </Pattern>
    </Defs>
    <Rect width="100%" height="100%" fill="url(#tscan)" />
  </Svg>
);

/** Blinking block cursor for “live” terminal lines. */
export const TrialCursor = () => {
  const theme = useTheme();
  const isMotionEnabled = useMotionEnabled();
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (!isMotionEnabled) {
      opacity.value = 1;
      return;
    }
    opacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: CURSOR_MS }),
        withTiming(1, { duration: CURSOR_MS }),
      ),
      -1,
    );
  }, [isMotionEnabled, opacity]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      importantForAccessibility="no"
      style={[styles.cursor, { backgroundColor: theme.overseerLcd }, style]}
    />
  );
};

/** Three industrial lamps — round progress without a countdown. */
export const RoundLamps = ({ round }: RoundLampsProps) => {
  const theme = useTheme();
  return (
    <View
      style={styles.lamps}
      accessibilityRole="progressbar"
      accessibilityValue={{ now: Math.min(3, round + 1), min: 1, max: 3 }}
    >
      {[0, 1, 2].map((n) => {
        const isDone = n < round;
        const isLive = n === round;
        return (
          <View
            key={n}
            style={[
              styles.lamp,
              {
                backgroundColor: isDone
                  ? theme.overseerLcd
                  : isLive
                    ? theme.overseerLcdDim
                    : theme.overseerScreenGlow,
                borderColor: isLive
                  ? theme.overseerLcd
                  : theme.overseerScreenGlow,
                shadowColor: theme.overseerLcd,
                shadowOpacity: isLive ? 0.55 : 0,
                shadowRadius: isLive ? 8 : 0,
              },
            ]}
          />
        );
      })}
    </View>
  );
};

/** Framed playfield plate inside the Overseer bay. */
export const TrialPanel = ({
  children,
  style,
  isWell = false,
}: TrialPanelProps) => {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.panel,
        {
          backgroundColor: isWell
            ? theme.overseerScreen
            : theme.overseerScreenGlow,
          borderColor: theme.overseerLcdDim,
        },
        style,
      ]}
    >
      {children}
      <TrialScanlines />
    </View>
  );
};

/** Selectable chute / pocket / card — large touch target, phosphor edge. */
export const TrialChip = ({
  label,
  isSelected = false,
  onPress,
  disabled,
  glyph,
  isCompact = false,
}: TrialChipProps) => {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        isCompact ? styles.chipCompact : styles.chipGrow,
        {
          borderColor: isSelected ? theme.overseerLcd : theme.overseerLcdDim,
          backgroundColor: isSelected
            ? 'rgba(255, 107, 107, 0.18)'
            : theme.overseerScreen,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      {glyph ? (
        <Text style={[styles.glyph, { color: theme.overseerLcd }]}>
          {glyph}
        </Text>
      ) : null}
      <Text style={[styles.chipLabel, { color: theme.overseerLcd }]}>
        {label}
      </Text>
    </Pressable>
  );
};

/** Mono readout line with optional prompt. */
export const TrialReadout = ({
  children,
  isPrompt = false,
  isDim = false,
}: {
  children: string;
  isPrompt?: boolean;
  isDim?: boolean;
}) => {
  const theme = useTheme();
  return (
    <View style={styles.readoutRow}>
      <Text
        style={[
          styles.readout,
          {
            color: isDim ? theme.overseerLcdDim : theme.overseerLcd,
          },
        ]}
      >
        {isPrompt ? `> ${children}` : children}
      </Text>
      {isPrompt ? <TrialCursor /> : null}
    </View>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  chip: {
    alignItems: 'center',
    borderRadius: RADII.m,
    borderWidth: 2,
    gap: SPACING.half,
    justifyContent: 'center',
    padding: SPACING.two,
  },
  chipCompact: {
    minHeight: 52,
    minWidth: 52,
  },
  chipGrow: {
    flex: 1,
    minHeight: 72,
  },
  chipLabel: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  cursor: {
    height: 14,
    marginLeft: 4,
    width: 8,
  },
  glyph: {
    fontFamily: FONTS.mono,
    fontSize: 22,
    fontWeight: '700',
  },
  lamp: {
    borderRadius: 8,
    borderWidth: 2,
    height: 14,
    width: 14,
  },
  lamps: {
    flexDirection: 'row',
    gap: SPACING.two,
  },
  panel: {
    borderRadius: RADII.m,
    borderWidth: 2,
    flex: 1,
    overflow: 'hidden',
    padding: SPACING.three,
  },
  readout: {
    fontFamily: FONTS.mono,
    fontSize: 14,
    lineHeight: 20,
  },
  readoutRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
});

export type { RoundLampsProps, TrialChipProps, TrialPanelProps };
