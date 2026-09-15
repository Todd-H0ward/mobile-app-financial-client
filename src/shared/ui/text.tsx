import {
  Platform,
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
  | 'code';

interface TextProps extends RNTextProps {
  variant?: TextVariant;
  themeColor?: ThemeColor;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

const VARIANT_COLOR: Partial<Record<TextVariant, ThemeColor>> = {
  linkPrimary: 'primary',
};

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

export const Text = ({
  style,
  variant = 'body',
  themeColor,
  ...props
}: TextProps) => {
  const theme = useTheme();
  const color = theme[themeColor ?? VARIANT_COLOR[variant] ?? 'text'];

  return <RNText style={[styles[variant], { color }, style]} {...props} />;
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  /** Screen-level headline: splash, celebration screens. */
  display: {
    fontFamily: FONTS.rounded,
    fontSize: 32,
    fontWeight: 900,
    lineHeight: 36,
  },
  /** Screen title. */
  title: {
    fontFamily: FONTS.rounded,
    fontSize: 26,
    fontWeight: 900,
    lineHeight: 30,
  },
  /** Card and section heading. */
  subtitle: {
    fontFamily: FONTS.rounded,
    fontSize: 20,
    fontWeight: 800,
    lineHeight: 24,
  },
  /** Body copy — never smaller than this for content. */
  body: {
    fontFamily: FONTS.sans,
    fontSize: 16,
    fontWeight: 400,
    lineHeight: 23,
  },
  bodyBold: {
    fontFamily: FONTS.sans,
    fontSize: 16,
    fontWeight: 800,
    lineHeight: 23,
  },
  /** Secondary description. */
  small: {
    fontFamily: FONTS.sans,
    fontSize: 13,
    fontWeight: 400,
    lineHeight: 18,
  },
  /** Caption / list row subtitle. */
  smallBold: {
    fontFamily: FONTS.sans,
    fontSize: 13,
    fontWeight: 700,
    lineHeight: 18,
  },
  /** Navigation and icon captions only — the smallest allowed size. */
  label: {
    fontFamily: FONTS.sans,
    fontSize: 10,
    fontWeight: 700,
    lineHeight: 12,
  },
  link: {
    fontFamily: FONTS.sans,
    fontSize: 14,
    fontWeight: 700,
    lineHeight: 20,
  },
  /** Colour comes from `VARIANT_COLOR`, so it follows the theme. */
  linkPrimary: {
    fontFamily: FONTS.sans,
    fontSize: 14,
    fontWeight: 700,
    lineHeight: 20,
  },
  code: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    fontWeight: Platform.select({ android: 700 }) ?? 500,
  },
});

export type { TextProps, TextVariant };
