import type { ReactNode } from 'react';

import {
  Pressable,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';

import { HIT_SLOP_SIZE, RADII, type ThemeColor } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';

import { Text } from './text';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

type ToastVariant = 'dark' | 'warning';

interface ToastProps {
  children: ReactNode;
  variant?: ToastVariant;
  icon?: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

const VARIANT_COLORS: Record<
  ToastVariant,
  { background: ThemeColor; label: ThemeColor; marker: ThemeColor }
> = {
  dark: {
    background: 'inverseSurface',
    label: 'inverseText',
    marker: 'success',
  },
  warning: {
    background: 'warningSoft',
    label: 'warningStrong',
    marker: 'warning',
  },
};

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

export const Toast = ({
  children,
  variant = 'dark',
  icon,
  onPress,
  style,
}: ToastProps) => {
  const theme = useTheme();
  const colors = VARIANT_COLORS[variant];

  const Container = onPress ? Pressable : View;

  return (
    <Container
      accessibilityRole={onPress ? 'button' : 'alert'}
      accessibilityLiveRegion="polite"
      onPress={onPress}
      style={[
        styles.root,
        { backgroundColor: theme[colors.background] },
        style,
      ]}
    >
      <View style={[styles.marker, { backgroundColor: theme[colors.marker] }]}>
        {icon}
      </View>

      <Text variant="bodyBold" themeColor={colors.label} style={styles.label}>
        {children}
      </Text>
    </Container>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    borderRadius: RADII.m,
    flexDirection: 'row',
    gap: 10,
    minHeight: HIT_SLOP_SIZE,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  marker: {
    alignItems: 'center',
    borderRadius: RADII.pill,
    height: 22,
    justifyContent: 'center',
    width: 22,
  },
  label: {
    flex: 1,
  },
});

export type { ToastProps, ToastVariant };
