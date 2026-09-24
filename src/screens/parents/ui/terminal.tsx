import { type ReactNode, useEffect } from 'react';

import {
  type StyleProp,
  StyleSheet,
  type TextStyle,
  View,
  type ViewStyle,
} from 'react-native';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, Pattern, Rect } from 'react-native-svg';

import { FONTS, RADII, SPACING, type ThemeColor } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import { useMotionEnabled } from '@/shared/model';
import { Text, type TextProps } from '@/shared/ui';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface TerminalRootProps {
  children?: ReactNode;
  /** Caption burned into the top bar of the monitor. */
  label: string;
  style?: StyleProp<ViewStyle>;
}

type TerminalLineTone = 'bright' | 'dim' | 'alert';

interface TerminalLineProps extends TextProps {
  tone?: TerminalLineTone;
  /** Draws the `>` prompt in front — a line the terminal "says". */
  isPrompt?: boolean;
  /** Order in the boot-up reveal; lines without it appear at once. */
  order?: number;
}

interface TerminalRowProps {
  /** Left column, padded with dots up to the value. */
  name: string;
  value: string;
  order?: number;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/** Gap between lines in the boot-up reveal. Short: this is a door, not a show. */
const REVEAL_STEP_MS = 90;
const CURSOR_HALF_PERIOD_MS = 480;

const TONE_COLOR: Record<TerminalLineTone, ThemeColor> = {
  bright: 'arcadeLcd',
  dim: 'arcadeLcdDim',
  // Amber, not red: a miss is not a danger. The text says it too — colour is
  // never the only signal (§3.6).
  alert: 'coin',
};

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

const useReveal = (order: number | undefined) => {
  const isMotionEnabled = useMotionEnabled();

  if (order === undefined || !isMotionEnabled) {
    return undefined;
  }

  return FadeIn.delay(order * REVEAL_STEP_MS).duration(160);
};

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

const TerminalLine = ({
  tone = 'bright',
  isPrompt = false,
  order,
  style,
  children,
  ...props
}: TerminalLineProps) => {
  const entering = useReveal(order);

  return (
    <Animated.View entering={entering}>
      <Text
        themeColor={TONE_COLOR[tone]}
        style={[styles.line, style as StyleProp<TextStyle>]}
        {...props}
      >
        {isPrompt ? '> ' : ''}
        {children}
      </Text>
    </Animated.View>
  );
};

const TerminalRow = ({ name, value, order }: TerminalRowProps) => {
  const entering = useReveal(order);

  return (
    <Animated.View
      entering={entering}
      style={styles.row}
      accessible
      accessibilityLabel={`${name}: ${value}`}
    >
      <Text themeColor="arcadeLcdDim" style={styles.line}>
        {name}
      </Text>
      <View style={styles.leader}>
        <Text
          themeColor="arcadeLcdDim"
          style={styles.line}
          numberOfLines={1}
          ellipsizeMode="clip"
        >
          {' ................................................'}
        </Text>
      </View>
      <Text themeColor="arcadeLcd" style={[styles.line, styles.value]}>
        {value}
      </Text>
    </Animated.View>
  );
};

const TerminalRule = () => {
  const theme = useTheme();

  return <View style={[styles.rule, { borderColor: theme.arcadeLcdDim }]} />;
};

/** A solid block that blinks where the next digit goes. Still with motion off. */
const TerminalCursor = () => {
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
        withTiming(0, { duration: CURSOR_HALF_PERIOD_MS }),
        withTiming(1, { duration: CURSOR_HALF_PERIOD_MS }),
      ),
      -1,
    );
  }, [isMotionEnabled, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      importantForAccessibility="no"
      accessibilityElementsHidden
      style={[
        styles.cursor,
        { backgroundColor: theme.arcadeLcd },
        animatedStyle,
      ]}
    />
  );
};

/** Thin dark lines over the glass — the CRT look without a shader. */
const Scanlines = () => (
  <Svg
    style={StyleSheet.absoluteFill}
    pointerEvents="none"
    importantForAccessibility="no-hide-descendants"
  >
    <Defs>
      <Pattern id="scan" width={4} height={4} patternUnits="userSpaceOnUse">
        <Rect width={4} height={1} fill="#000000" opacity={0.28} />
      </Pattern>
    </Defs>
    <Rect width="100%" height="100%" fill="url(#scan)" />
  </Svg>
);

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

/**
 * The grown-ups' monitor — the service terminal of the scene's AI screen.
 *
 * Plain React Native on purpose: the barrier needs a real keyboard and system
 * font scaling, which a text texture on a 3D plane cannot give. The scene can
 * keep the monitor as an object and open this on tap (team board, SCN-12
 * fallback).
 */
const TerminalRoot = ({ children, label, style }: TerminalRootProps) => {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: theme.arcadeDpad,
          borderColor: theme.arcadeScreenGlow,
        },
        style,
      ]}
    >
      <View style={styles.bar}>
        <View style={[styles.lamp, { backgroundColor: theme.arcadeLcd }]} />
        <Text themeColor="arcadeLcdDim" style={[styles.line, styles.barText]}>
          {label}
        </Text>
      </View>

      <View
        style={[
          styles.glass,
          {
            backgroundColor: theme.arcadeScreen,
            borderColor: theme.arcadeScreenGlow,
            shadowColor: theme.arcadeLcd,
          },
        ]}
      >
        <View style={styles.content}>{children}</View>
        <Scanlines />
      </View>
    </View>
  );
};

// ═══════════════════════════════════════════
// COMPOUND EXPORT
// ═══════════════════════════════════════════

export const Terminal = Object.assign(TerminalRoot, {
  Line: TerminalLine,
  Row: TerminalRow,
  Rule: TerminalRule,
  Cursor: TerminalCursor,
});

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  bar: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: SPACING.two,
    paddingBottom: SPACING.two,
    paddingHorizontal: SPACING.one,
  },
  barText: {
    flexShrink: 1,
    letterSpacing: 1,
  },
  content: {
    gap: SPACING.one,
    padding: SPACING.three,
  },
  cursor: {
    height: 24,
    width: 12,
  },
  glass: {
    borderRadius: RADII.m,
    borderWidth: 2,
    elevation: 6,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
  lamp: {
    borderRadius: RADII.pill,
    height: 8,
    width: 8,
  },
  leader: {
    flex: 1,
    overflow: 'hidden',
  },
  line: {
    fontFamily: FONTS.mono,
    fontSize: 16,
    lineHeight: 22,
  },
  root: {
    borderBottomWidth: 6,
    borderRadius: RADII.xl,
    borderWidth: 2,
    padding: SPACING.two,
  },
  row: {
    alignItems: 'flex-end',
    flexDirection: 'row',
  },
  rule: {
    borderStyle: 'dashed',
    borderTopWidth: 1,
    marginVertical: SPACING.two,
  },
  value: {
    flexShrink: 0,
  },
});

export type {
  TerminalLineProps,
  TerminalLineTone,
  TerminalRootProps,
  TerminalRowProps,
};
