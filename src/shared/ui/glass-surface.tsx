import type { ReactNode } from 'react';

import {
  type Insets,
  Pressable,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';

import type { ThemeColor } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';

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
// COMPONENTS
// ═══════════════════════════════════════════

/** Compatibility surface: Terminal 2b always uses solid, legible panels. */
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
  if (!onPress)
    return (
      <View style={[styles.root, { backgroundColor: theme[tone] }, style]}>
        {children}
      </View>
    );
  return (
    <Pressable
      accessibilityRole={accessibilityRole ?? 'button'}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ ...accessibilityState, disabled }}
      disabled={disabled}
      hitSlop={hitSlop}
      onPress={onPress}
      style={({ pressed }) => [
        styles.root,
        { backgroundColor: pressed ? theme.surfaceSoft : theme[tone] },
        style,
      ]}
    >
      {children}
    </Pressable>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({ root: { overflow: 'hidden' } });

export type { GlassSurfaceProps };
