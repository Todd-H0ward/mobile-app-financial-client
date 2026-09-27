import type { ReactNode } from 'react';

import {
  Pressable,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';

import { HIT_SLOP_SIZE, SPACING } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';

import { PixelIcon } from './pixel-icon';
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
  const isWarning = variant === 'warning';
  const Container = onPress ? Pressable : View;

  return (
    <Container
      accessibilityRole={onPress ? 'button' : 'alert'}
      accessibilityLiveRegion="polite"
      onPress={onPress}
      style={[
        styles.root,
        {
          backgroundColor: isWarning ? theme.surface : theme.primary,
          borderColor: isWarning ? theme.warning : theme.primary,
        },
        style,
      ]}
    >
      <View style={styles.marker}>
        {icon ??
          (isWarning ? (
            <Text variant="code" themeColor="warning">
              !
            </Text>
          ) : (
            <PixelIcon name="check20" size={20} tone="onAccent" />
          ))}
      </View>
      <Text
        variant="bodyBold"
        themeColor={isWarning ? 'text' : 'onAccent'}
        style={styles.label}
      >
        {children}
      </Text>
    </Container>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  label: { flex: 1 },
  marker: { alignItems: 'center', justifyContent: 'center', width: 24 },
  root: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 2,
    flexDirection: 'row',
    gap: SPACING.TWO,
    minHeight: HIT_SLOP_SIZE,
    paddingHorizontal: SPACING.THREE,
    paddingVertical: SPACING.TWO,
  },
});

export type { ToastProps, ToastVariant };
