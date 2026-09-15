import type { ReactNode } from 'react';

import {
  Pressable,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';

import { RADII, type ThemeColor } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import { hitSlopFor } from '@/shared/utils';

import { Shape } from './shape';
import { Text } from './text';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

type ChipVariant = 'neutral' | 'selected' | 'need' | 'want' | 'muted';

interface ChipProps {
  children: ReactNode;
  variant?: ChipVariant;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/**
 * Approximate chip height: paddingVertical 8×2 + smallBold line 18.
 * hitSlop expands the press target to HIT_SLOP_SIZE without changing the pill.
 */
const CHIP_VISUAL_HEIGHT = 34;

const VARIANT_COLORS: Record<
  ChipVariant,
  { background: ThemeColor; label: ThemeColor; marker?: ThemeColor }
> = {
  neutral: { background: 'surface', label: 'textSecondary' },
  selected: { background: 'text', label: 'background' },
  need: {
    background: 'primarySoft',
    label: 'primaryStrong',
    marker: 'primary',
  },
  want: { background: 'accentSoft', label: 'accentStrong', marker: 'accent' },
  muted: { background: 'surfaceDeep', label: 'textDisabled' },
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
      {colors.marker != null && (
        <Shape
          variant={variant === 'need' ? 'circle' : 'diamond'}
          size={9}
          color={theme[colors.marker]}
        />
      )}
      <Text variant="smallBold" themeColor={colors.label}>
        {children}
      </Text>
    </>
  );

  const chipStyle: StyleProp<ViewStyle> = [
    styles.root,
    {
      backgroundColor: theme[colors.background],
      borderColor: variant === 'neutral' ? theme.border : 'transparent',
    },
    style,
  ];

  if (!onPress) {
    return <View style={chipStyle}>{content}</View>;
  }

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
  root: {
    alignItems: 'center',
    borderRadius: RADII.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  pressed: {
    opacity: 0.8,
  },
});

export type { ChipProps, ChipVariant };
