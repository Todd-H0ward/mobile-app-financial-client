import type { ReactNode } from 'react';

import {
  Pressable,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';

import { FONTS, SPACING, type ThemeColor } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import { hitSlopFor } from '@/shared/utils';

import { PixelIcon } from './pixel-icon';
import { Shape } from './shape';
import { Text } from './text';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

type ChipVariant =
  | 'neutral'
  | 'selected'
  | 'need'
  | 'want'
  | 'muted'
  | 'success'
  | 'warning'
  | 'rule'
  | 'locked';

interface ChipProps {
  children: ReactNode;
  variant?: ChipVariant;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

const CHIP_VISUAL_HEIGHT = 36;

const VARIANT_COLORS: Record<
  ChipVariant,
  { background: ThemeColor; label: ThemeColor; border: ThemeColor }
> = {
  neutral: { background: 'surface', label: 'textSecondary', border: 'border' },
  selected: { background: 'primary', label: 'onAccent', border: 'primary' },
  need: { background: 'surfaceDeep', label: 'primary', border: 'border' },
  want: { background: 'surfaceDeep', label: 'primary', border: 'border' },
  muted: { background: 'surface', label: 'textMuted', border: 'border' },
  success: { background: 'surfaceSoft', label: 'text', border: 'surfaceSoft' },
  warning: {
    background: 'terminalScreen',
    label: 'warning',
    border: 'warning',
  },
  rule: {
    background: 'terminalScreen',
    label: 'textSecondary',
    border: 'borderStrong',
  },
  locked: { background: 'surface', label: 'textMuted', border: 'surface' },
};

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

export const Chip = ({
  children,
  variant = 'neutral',
  onPress,
  style,
}: ChipProps) => {
  const theme = useTheme();
  const colors = VARIANT_COLORS[variant];
  const content = (
    <>
      {(variant === 'need' || variant === 'want') && (
        <Shape
          variant={variant === 'need' ? 'circle' : 'diamond'}
          size={8}
          color={theme.primary}
        />
      )}
      {variant === 'selected' && (
        <PixelIcon name="check" size={12} tone={colors.label} />
      )}
      {variant === 'success' && <PixelIcon name="check" size={12} />}
      {variant === 'locked' && <PixelIcon name="lock" size={12} />}
      {(variant === 'warning' || variant === 'rule') && (
        <Text variant="code" themeColor={colors.label} style={styles.mark}>
          {variant === 'warning' ? '!' : 'i'}
        </Text>
      )}
      <Text variant="small" themeColor={colors.label} style={styles.label}>
        {children}
      </Text>
    </>
  );
  const chipStyle: StyleProp<ViewStyle> = [
    styles.root,
    {
      backgroundColor: theme[colors.background],
      borderColor: theme[colors.border],
    },
    variant === 'rule' && styles.rule,
    style,
  ];

  if (!onPress) return <View style={chipStyle}>{content}</View>;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: variant === 'selected' }}
      hitSlop={hitSlopFor(CHIP_VISUAL_HEIGHT)}
      onPress={onPress}
      style={({ pressed }) => [chipStyle, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  label: { flexShrink: 1 },
  mark: { fontFamily: FONTS.monoStrong },
  pressed: { opacity: 0.8 },
  root: {
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 2,
    flexDirection: 'row',
    gap: SPACING.two,
    minHeight: CHIP_VISUAL_HEIGHT,
    paddingHorizontal: SPACING.compact,
    paddingVertical: SPACING.one,
  },
  rule: { borderStyle: 'dashed' },
});

export type { ChipProps, ChipVariant };
