import type { ReactNode } from 'react';
import { createContext, memo, useContext, useEffect } from 'react';

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

import type { WatcherId } from '@/entities/watcher';

import { FONTS, RADII, SPACING, type ThemeColor } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import { useTranslation } from '@/shared/i18n';
import { useMotionEnabled } from '@/shared/model';
import { Text } from '@/shared/ui';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface TerminalTones {
  lcd: string;
  lcdDim: string;
}

interface TerminalShellProps {
  watcher: WatcherId;
  /** First prompt line, e.g. "хранитель на связи". */
  title: string;
  /** Dim subtitle under the title. */
  subtitle?: string;
  children?: ReactNode;
  /** Leave the session — returns to the pit. */
  onLeave: () => void;
  style?: StyleProp<ViewStyle>;
}

interface TerminalPromptProps {
  children: string;
  /** When true, shows a blinking block after the label. */
  isCursorVisible?: boolean;
  onPress?: () => void;
  disabled?: boolean;
}

interface TerminalMenuRowProps {
  label: string;
  onPress: () => void;
}

interface TerminalRuleProps {
  style?: StyleProp<ViewStyle>;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

const CURSOR_HALF_PERIOD_MS = 480;

const THEME_KEYS: Record<
  WatcherId,
  { screen: ThemeColor; glow: ThemeColor; lcd: ThemeColor; lcdDim: ThemeColor }
> = {
  keeper: {
    screen: 'arcadeScreen',
    glow: 'arcadeScreenGlow',
    lcd: 'arcadeLcd',
    lcdDim: 'arcadeLcdDim',
  },
  overseer: {
    screen: 'overseerScreen',
    glow: 'overseerScreenGlow',
    lcd: 'overseerLcd',
    lcdDim: 'overseerLcdDim',
  },
};

const TerminalToneContext = createContext<TerminalTones>({
  lcd: '#7CFF9A',
  lcdDim: '#3D8F5A',
});

const useTerminalTones = () => useContext(TerminalToneContext);

export { useTerminalTones };

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

const Scanlines = () => (
  <Svg
    style={StyleSheet.absoluteFill}
    pointerEvents="none"
    importantForAccessibility="no-hide-descendants"
  >
    <Defs>
      <Pattern id="wscan" width={4} height={4} patternUnits="userSpaceOnUse">
        <Rect width={4} height={1} fill="#000000" opacity={0.28} />
      </Pattern>
    </Defs>
    <Rect width="100%" height="100%" fill="url(#wscan)" />
  </Svg>
);

const TerminalCursor = ({ color }: { color: string }) => {
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
      style={[styles.cursor, { backgroundColor: color }, animatedStyle]}
    />
  );
};

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

export const TerminalRule = ({ style }: TerminalRuleProps) => {
  const { lcdDim } = useTerminalTones();
  return <View style={[styles.rule, { borderColor: lcdDim }, style]} />;
};

export const TerminalPrompt = memo(
  ({
    children,
    isCursorVisible = false,
    onPress,
    disabled,
  }: TerminalPromptProps) => {
    const { lcd } = useTerminalTones();
    const content = (
      <View style={styles.promptRow}>
        <Text style={[styles.mono, { color: lcd }]}>{`> ${children}`}</Text>
        {isCursorVisible ? <TerminalCursor color={lcd} /> : null}
      </View>
    );

    if (!onPress) return content;

    return (
      <Pressable
        accessibilityRole="button"
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => [pressed && styles.pressed]}
      >
        {content}
      </Pressable>
    );
  },
);

export const TerminalMenuRow = memo(
  ({ label, onPress }: TerminalMenuRowProps) => {
    const { lcd } = useTerminalTones();
    return (
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [styles.menuRow, pressed && styles.pressed]}
      >
        <Text style={[styles.mono, { color: lcd }]}>{`> ${label}`}</Text>
      </Pressable>
    );
  },
);

export const TerminalText = memo(
  ({ children, isDim = false }: { children: string; isDim?: boolean }) => {
    const { lcd, lcdDim } = useTerminalTones();
    return (
      <Text style={[styles.mono, { color: isDim ? lcdDim : lcd }]}>
        {children}
      </Text>
    );
  },
);

/**
 * CRT glass under the 3D face — green for Keeper, red for Overseer.
 *
 * Plain RN on purpose: touch targets and system font scaling must work.
 */
export const TerminalShell = ({
  watcher,
  title,
  subtitle,
  children,
  onLeave,
  style,
}: TerminalShellProps) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const keys = THEME_KEYS[watcher];
  const tones: TerminalTones = {
    lcd: theme[keys.lcd],
    lcdDim: theme[keys.lcdDim],
  };

  return (
    <TerminalToneContext.Provider value={tones}>
      <View
        style={[
          styles.root,
          {
            backgroundColor: theme[keys.screen],
            borderColor: theme[keys.glow],
            shadowColor: tones.lcd,
          },
          style,
        ]}
        accessibilityRole="summary"
        accessibilityLabel={title}
      >
        <Scanlines />
        <View style={styles.body}>
          <Text style={[styles.mono, styles.title, { color: tones.lcd }]}>
            {`> ${title}`}
          </Text>
          {subtitle ? (
            <Text
              style={[styles.mono, styles.subtitle, { color: tones.lcdDim }]}
            >
              {subtitle}
            </Text>
          ) : null}
          <View style={styles.content}>{children}</View>
          <Pressable
            accessibilityRole="button"
            onPress={onLeave}
            style={({ pressed }) => [styles.leave, pressed && styles.pressed]}
          >
            <Text style={[styles.mono, { color: tones.lcdDim }]}>
              {t('watcher.terminal.leave')}
            </Text>
          </Pressable>
        </View>
      </View>
    </TerminalToneContext.Provider>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  body: {
    flex: 1,
    gap: SPACING.two,
    padding: SPACING.three,
    zIndex: 1,
  },
  content: {
    flex: 1,
    gap: SPACING.two,
  },
  cursor: {
    height: 16,
    marginLeft: 4,
    width: 10,
  },
  leave: {
    alignSelf: 'center',
    justifyContent: 'center',
    minHeight: 44,
    paddingVertical: SPACING.one,
  },
  menuRow: {
    justifyContent: 'center',
    minHeight: 44,
  },
  mono: {
    fontFamily: FONTS.mono,
    fontSize: 14,
    lineHeight: 20,
  },
  pressed: { opacity: 0.7 },
  promptRow: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 44,
  },
  root: {
    borderRadius: RADII.l,
    borderWidth: 2,
    flex: 1,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
  rule: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginVertical: SPACING.one,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
  },
});

export type { TerminalShellProps };
