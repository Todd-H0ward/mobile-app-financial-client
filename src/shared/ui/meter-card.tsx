import type { ReactNode } from 'react';

import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { RADII, type ThemeColor } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';

import { ProgressBar } from './progress-bar';
import { Text } from './text';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

type MeterTone = 'default' | 'low' | 'idle';

interface MeterCardProps {
  label: string;
  value: number;
  color?: ThemeColor;
  icon?: ReactNode;
  tone?: MeterTone;
  style?: StyleProp<ViewStyle>;
}

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

export const MeterCard = ({
  label,
  value,
  color = 'warning',
  icon,
  tone = 'default',
  style,
}: MeterCardProps) => {
  const theme = useTheme();
  const isLow = tone === 'low';
  const isIdle = tone === 'idle';

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(value * 100) }}
      style={[
        styles.root,
        {
          backgroundColor: isIdle ? theme.backgroundAlt : theme.surface,
          borderColor: isLow ? theme[color] : theme.border,
          borderWidth: isLow ? 1.5 : 1,
          opacity: isIdle ? 0.6 : 1,
        },
        style,
      ]}
    >
      {icon}

      <Text
        variant="label"
        themeColor={isLow ? 'warningStrong' : 'textSecondary'}
        numberOfLines={1}
      >
        {label}
      </Text>

      <ProgressBar
        aria-hidden
        value={isIdle ? 0 : value}
        color={color}
        height={6}
        style={styles.bar}
      />
    </View>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    borderRadius: RADII.m,
    flex: 1,
    gap: 5,
    paddingHorizontal: 6,
    paddingVertical: 8,
  },
  bar: {
    marginTop: 1,
  },
});

export type { MeterCardProps, MeterTone };
