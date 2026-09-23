import type { ReactNode } from 'react';

import {
  Pressable,
  StyleSheet,
  Text,
  type TextProps,
  View,
  type ViewStyle,
} from 'react-native';

import { FONTS, SPACING, TERMINAL } from '@/shared/constants';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

type TerminalTone = 'amber' | 'cyan' | 'text' | 'dim';

interface TerminalLineProps extends TextProps {
  children?: ReactNode;
  /** Which phosphor it is written in. */
  tone?: TerminalTone;
  /** Headings are bigger and letter-spaced; body is not. */
  variant?: 'heading' | 'label' | 'body';
}

interface TerminalRowProps {
  children?: ReactNode;
  style?: ViewStyle;
}

interface TerminalChoiceProps {
  children?: ReactNode;
  /** Shown down the left as `01`, `02` — the machine numbers its options. */
  index: number;
  /** Struck through and cooled off once it has been tried and refused. */
  isSpent?: boolean;
  onPress: () => void;
}

interface TerminalKeyProps {
  children?: ReactNode;
  onPress: () => void;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/**
 * Scan lines laid down the screen, and how far apart.
 *
 * Drawn as plain views rather than a gradient: there is no gradient library
 * in the project and a CRT line is a hairline, not a ramp. Forty of them at
 * six points apart covers a phone without being a wall of views.
 */
const SCANLINE_COUNT = 90;
const SCANLINE_GAP = 8;

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

const TerminalLine = ({
  children,
  tone = 'text',
  variant = 'body',
  style,
  ...props
}: TerminalLineProps) => {
  return (
    <Text
      style={[styles.line, styles[variant], styles[tone], style]}
      {...props}
    >
      {children}
    </Text>
  );
};

/** A hairline. The whole look is drawn with rules rather than with shadows. */
const TerminalRule = () => <View style={styles.rule} />;

/** A block of the terminal: a panel with a hard edge, never a rounded card. */
const TerminalPanel = ({ children, style }: TerminalRowProps) => {
  return <View style={[styles.panel, style]}>{children}</View>;
};

/**
 * One answer, numbered.
 *
 * A refused answer is not taken away — it is struck through and left on
 * screen. The child can see what they already tried, which is the difference
 * between a machine that is testing them and one that is helping them.
 */
const TerminalChoice = ({
  children,
  index,
  isSpent = false,
  onPress,
}: TerminalChoiceProps) => {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.choice,
        pressed && styles.choicePressed,
        isSpent && styles.choiceSpent,
      ]}
    >
      <TerminalLine tone={isSpent ? 'dim' : 'amber'} variant="label">
        {String(index + 1).padStart(2, '0')}
      </TerminalLine>
      <TerminalLine
        tone={isSpent ? 'dim' : 'text'}
        style={[styles.choiceLabel, isSpent && styles.struck]}
      >
        {children}
      </TerminalLine>
    </Pressable>
  );
};

/** The one action at the bottom. A key on the machine, not a soft button. */
const TerminalKey = ({ children, onPress }: TerminalKeyProps) => {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.key, pressed && styles.keyPressed]}
    >
      <TerminalLine tone="cyan" variant="label">
        {children}
      </TerminalLine>
    </Pressable>
  );
};

/** The lines over everything. Purely decorative, and deaf to touch. */
const TerminalScanlines = () => {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {Array.from(
        { length: SCANLINE_COUNT },
        (_, index) => index * SCANLINE_GAP,
      ).map((top) => (
        <View key={top} style={[styles.scanline, { top }]} />
      ))}
    </View>
  );
};

// ═══════════════════════════════════════════
// COMPOUND EXPORT
// ═══════════════════════════════════════════

export const Terminal = Object.assign(TerminalPanel, {
  Choice: TerminalChoice,
  Key: TerminalKey,
  Line: TerminalLine,
  Rule: TerminalRule,
  Scanlines: TerminalScanlines,
});

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  amber: {
    color: TERMINAL.amber,
  },
  body: {
    fontSize: 17,
    lineHeight: 26,
  },
  choice: {
    alignItems: 'flex-start',
    backgroundColor: TERMINAL.panelRaised,
    borderColor: TERMINAL.rule,
    borderWidth: 1,
    flexDirection: 'row',
    gap: SPACING.two,
    padding: SPACING.three,
  },
  choiceLabel: {
    flex: 1,
  },
  choicePressed: {
    borderColor: TERMINAL.ruleLive,
  },
  choiceSpent: {
    backgroundColor: TERMINAL.panel,
  },
  cyan: {
    color: TERMINAL.cyan,
  },
  dim: {
    color: TERMINAL.textDim,
  },
  heading: {
    fontSize: 24,
    letterSpacing: 2,
    lineHeight: 30,
  },
  key: {
    alignItems: 'center',
    borderColor: TERMINAL.ruleLive,
    borderWidth: 1,
    paddingHorizontal: SPACING.four,
    paddingVertical: SPACING.three,
  },
  keyPressed: {
    backgroundColor: TERMINAL.panelRaised,
  },
  label: {
    fontSize: 13,
    letterSpacing: 2,
  },
  line: {
    fontFamily: FONTS.mono,
  },
  panel: {
    backgroundColor: TERMINAL.panel,
    borderColor: TERMINAL.rule,
    borderWidth: 1,
    gap: SPACING.two,
    padding: SPACING.three,
  },
  rule: {
    backgroundColor: TERMINAL.rule,
    height: 1,
  },
  scanline: {
    backgroundColor: TERMINAL.scanline,
    height: 1,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  struck: {
    textDecorationLine: 'line-through',
  },
  text: {
    color: TERMINAL.text,
  },
});

export type {
  TerminalChoiceProps,
  TerminalKeyProps,
  TerminalLineProps,
  TerminalRowProps,
  TerminalTone,
};
