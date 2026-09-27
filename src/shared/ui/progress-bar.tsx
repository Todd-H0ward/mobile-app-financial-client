import { StyleSheet, View, type ViewProps } from 'react-native';

import type { ThemeColor } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import { clamp } from '@/shared/utils';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface ProgressBarProps extends ViewProps {
  /** Filled part, 0…1. Values outside the range are clamped. */
  value: number;
  color?: ThemeColor;
  trackColor?: ThemeColor;
  /** Segment height in design points. */
  height?: number;
  /** Countable units: five for charge, one per ten coins for a goal. */
  segmentCount?: number;
}

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

export const ProgressBar = ({
  value,
  color = 'primary',
  trackColor = 'surfaceDeep',
  height = 14,
  segmentCount = 10,
  style,
  ...props
}: ProgressBarProps) => {
  const theme = useTheme();
  const ratio = Number.isFinite(value) ? clamp(value, 0, 1) : 0;
  const count = Number.isFinite(segmentCount)
    ? clamp(Math.round(segmentCount), 1, 100)
    : 10;
  const filledCount = Math.floor(ratio * count + Number.EPSILON);

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ now: Math.round(ratio * 100), min: 0, max: 100 }}
      style={[styles.root, { height }, style]}
      {...props}
    >
      {Array.from({ length: count }, (_, index) => (
        <View
          key={index}
          style={[
            styles.segment,
            {
              backgroundColor: theme[index < filledCount ? color : trackColor],
            },
          ]}
        />
      ))}
    </View>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  root: { flexDirection: 'row', gap: 3, width: '100%' },
  segment: { borderRadius: 2, flex: 1, height: '100%', minWidth: 0 },
});

export type { ProgressBarProps };
