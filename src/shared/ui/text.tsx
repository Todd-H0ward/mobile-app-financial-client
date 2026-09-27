import { memo } from 'react';

import {
  Text as RNText,
  type TextProps as RNTextProps,
  StyleSheet,
} from 'react-native';

import { FONTS, type ThemeColor } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

type TextVariant =
  | 'display'
  | 'title'
  | 'subtitle'
  | 'body'
  | 'bodyBold'
  | 'small'
  | 'smallBold'
  | 'label'
  | 'link'
  | 'linkPrimary'
  | 'code'
  | 'machine'
  | 'number'
  | 'numberLarge'
  | 'numberSmall';
interface TextProps extends RNTextProps {
  variant?: TextVariant;
  themeColor?: ThemeColor;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/** Only machine output glows — numbers and voice labels, never reading text. */
const GLOWING_VARIANTS: ReadonlySet<TextVariant> = new Set([
  'machine',
  'number',
  'numberLarge',
  'numberSmall',
]);

const VARIANT_COLOR: Partial<Record<TextVariant, ThemeColor>> = {
  linkPrimary: 'phosphor',
  machine: 'phosphor',
  number: 'phosphor',
  numberLarge: 'phosphor',
  numberSmall: 'phosphor',
};

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

export const Text = memo(
  ({ style, variant = 'body', themeColor, ...props }: TextProps) => {
    const theme = useTheme();
    const tone = themeColor ?? VARIANT_COLOR[variant] ?? 'text';
    const isGlowing = GLOWING_VARIANTS.has(variant) && tone === 'phosphor';
    return (
      <RNText
        // Keep whole words on one line — no mid-word hyphenation on either platform.
        android_hyphenationFrequency="none"
        lineBreakStrategyIOS="none"
        textBreakStrategy="simple"
        style={[
          styles[variant],
          { color: theme[tone] },
          isGlowing && [styles.glow, { textShadowColor: theme.glow }],
          style,
        ]}
        {...props}
      />
    );
  },
);

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  body: { fontFamily: FONTS.sans, fontSize: 16, lineHeight: 23 },
  bodyBold: { fontFamily: FONTS.sansStrong, fontSize: 16, lineHeight: 23 },
  code: { fontFamily: FONTS.mono, fontSize: 14, lineHeight: 21 },
  display: { fontFamily: FONTS.rounded, fontSize: 28, lineHeight: 33 },
  glow: { textShadowOffset: { height: 0, width: 0 }, textShadowRadius: 10 },
  label: { fontFamily: FONTS.sansStrong, fontSize: 14, lineHeight: 20 },
  link: {
    fontFamily: FONTS.sansStrong,
    fontSize: 16,
    lineHeight: 23,
    textDecorationLine: 'underline',
  },
  linkPrimary: {
    fontFamily: FONTS.sansStrong,
    fontSize: 16,
    lineHeight: 23,
    textDecorationLine: 'underline',
  },
  machine: { fontFamily: FONTS.monoStrong, fontSize: 13, lineHeight: 18 },
  number: {
    fontFamily: FONTS.monoStrong,
    fontSize: 28,
    fontVariant: ['tabular-nums'],
    lineHeight: 36,
  },
  numberLarge: {
    fontFamily: FONTS.monoStrong,
    fontSize: 48,
    fontVariant: ['tabular-nums'],
    lineHeight: 58,
  },
  numberSmall: {
    fontFamily: FONTS.monoStrong,
    fontSize: 20,
    fontVariant: ['tabular-nums'],
    lineHeight: 28,
  },
  small: { fontFamily: FONTS.sans, fontSize: 14, lineHeight: 20 },
  smallBold: { fontFamily: FONTS.sansStrong, fontSize: 14, lineHeight: 20 },
  subtitle: { fontFamily: FONTS.rounded, fontSize: 18, lineHeight: 24 },
  title: { fontFamily: FONTS.rounded, fontSize: 22, lineHeight: 27 },
});

export type { TextProps, TextVariant };
