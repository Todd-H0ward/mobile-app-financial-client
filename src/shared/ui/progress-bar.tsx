import { StyleSheet, View, type ViewProps } from 'react-native';

import { RADII, type ThemeColor } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';

import { clamp } from '../utils';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface ProgressBarProps extends ViewProps {
  /** Filled part, 0…1. Values outside the range are clamped. */
  value: number;
  /** Theme color of the fill. Defaults to `success`. */
  color?: ThemeColor;
  /** Theme color of the track. Defaults to `surfaceDeep`. */
  trackColor?: ThemeColor;
  /** Track height in design points. */
  height?: number;
}

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

export const ProgressBar = ({
  value,
  color = 'success',
  trackColor = 'surfaceDeep',
  height = 12,
  style,
  ...props
}: ProgressBarProps) => {
  const theme = useTheme();
  const ratio = clamp(value, 0, 1);

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ now: Math.round(ratio * 100), min: 0, max: 100 }}
      style={[
        styles.track,
        { backgroundColor: theme[trackColor], height: height },
        style,
      ]}
      {...props}
    >
      <View
        style={[
          styles.fill,
          { backgroundColor: theme[color], width: `${ratio * 100}%` },
        ]}
      />
    </View>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  track: {
    borderRadius: RADII.pill,
    overflow: 'hidden',
    width: '100%',
  },
  fill: {
    borderRadius: RADII.pill,
    height: '100%',
  },
});

export type { ProgressBarProps };
