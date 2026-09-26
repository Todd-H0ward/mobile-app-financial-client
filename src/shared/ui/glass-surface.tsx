import type { ReactNode } from 'react';

import {
  GlassView,
  isGlassEffectAPIAvailable,
  isLiquidGlassAvailable,
} from 'expo-glass-effect';
import {
  type Insets,
  Pressable,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';

import type { ThemeColor } from '@/shared/constants';
import { useColorScheme, useTheme } from '@/shared/hooks';
import { useGlassEnabled } from '@/shared/model';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface GlassSurfaceProps {
  children?: ReactNode;
  /** Solid fill tone when glass is off. */
  tone?: ThemeColor;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  disabled?: boolean;
  hitSlop?: number | Insets;
  accessibilityRole?: 'button' | 'none';
  accessibilityLabel?: string;
  accessibilityState?: { selected?: boolean; disabled?: boolean };
}

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

const canUseNativeGlass = (): boolean => {
  try {
    return isLiquidGlassAvailable() && isGlassEffectAPIAvailable();
  } catch {
    return false;
  }
};

/** Soft frosted plate when native liquid glass is unavailable. */
const frostFill = (hex: string, isDark: boolean): string => {
  const raw = hex.replace('#', '');
  if (raw.length !== 6) {
    return isDark ? 'rgba(46, 39, 35, 0.72)' : 'rgba(255, 255, 255, 0.72)';
  }
  const r = Number.parseInt(raw.slice(0, 2), 16);
  const g = Number.parseInt(raw.slice(2, 4), 16);
  const b = Number.parseInt(raw.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${isDark ? 0.72 : 0.78})`;
};

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

/**
 * Liquid-glass plate when the setting is on; solid theme fill when off.
 *
 * On iOS 26+ with the API present → native `GlassView`. Everywhere else → a
 * translucent frost that still reads as glass without a native blur module.
 */
export const GlassSurface = ({
  children,
  tone = 'surface',
  style,
  onPress,
  disabled,
  hitSlop,
  accessibilityRole,
  accessibilityLabel,
  accessibilityState,
}: GlassSurfaceProps) => {
  const theme = useTheme();
  const scheme = useColorScheme();
  const isGlass = useGlassEnabled();
  const isDark = scheme === 'dark';
  const solid = theme[tone];

  const content = (() => {
    if (!isGlass) {
      return (
        <View style={[styles.root, { backgroundColor: solid }, style]}>
          {children}
        </View>
      );
    }

    if (canUseNativeGlass()) {
      return (
        <GlassView
          glassEffectStyle="regular"
          tintColor={solid}
          colorScheme={isDark ? 'dark' : 'light'}
          style={[styles.root, style]}
        >
          {children}
        </GlassView>
      );
    }

    return (
      <View
        style={[
          styles.root,
          styles.frost,
          {
            backgroundColor: frostFill(solid, isDark),
            borderColor: isDark
              ? 'rgba(255, 255, 255, 0.14)'
              : 'rgba(255, 255, 255, 0.55)',
          },
          style,
        ]}
      >
        {children}
      </View>
    );
  })();

  if (!onPress) return content;

  return (
    <Pressable
      accessibilityRole={accessibilityRole ?? 'button'}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={accessibilityState}
      disabled={disabled}
      hitSlop={hitSlop}
      onPress={onPress}
      style={({ pressed }) => [pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  frost: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  pressed: {
    opacity: 0.88,
  },
  root: {
    overflow: 'hidden',
  },
});

export type { GlassSurfaceProps };
