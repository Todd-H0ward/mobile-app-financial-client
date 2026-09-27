import type { ReactNode } from 'react';

import {
  Pressable,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';

import { FONTS, RADII, SPACING } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import { Text } from '@/shared/ui';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface TrialPanelProps {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Dimmer inset well for the playfield. */
  isWell?: boolean;
}

interface TrialChipProps {
  label: string;
  isSelected?: boolean;
  onPress?: () => void;
  disabled?: boolean;
  glyph?: string;
  /** Compact dial / ± without flex grow. */
  isCompact?: boolean;
}

interface RoundLampsProps {
  round: number;
}

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

/** A still machine cursor: no flashing on reading surfaces. */
export const TrialCursor = () => {
  const theme = useTheme();
  return (
    <View
      importantForAccessibility="no"
      style={[styles.cursor, { backgroundColor: theme.primary }]}
    />
  );
};

/** Three industrial lamps — round progress without a countdown. */
export const RoundLamps = ({ round }: RoundLampsProps) => {
  const theme = useTheme();
  return (
    <View
      style={styles.lamps}
      accessibilityRole="progressbar"
      accessibilityValue={{ now: Math.min(3, round + 1), min: 1, max: 3 }}
    >
      {[0, 1, 2].map((n) => {
        const isDone = n < round;
        const isLive = n === round;
        return (
          <View
            key={n}
            style={[
              styles.lamp,
              {
                backgroundColor: isDone
                  ? theme.primary
                  : isLive
                    ? theme.textSecondary
                    : theme.surfaceDeep,
                borderColor: isLive ? theme.primary : theme.surfaceDeep,
              },
            ]}
          />
        );
      })}
    </View>
  );
};

/** Framed playfield plate inside the Overseer bay. */
export const TrialPanel = ({
  children,
  style,
  isWell = false,
}: TrialPanelProps) => {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.panel,
        {
          backgroundColor: isWell ? theme.surface : theme.surfaceDeep,
          borderColor: theme.textSecondary,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

/** Selectable chute / pocket / card — large touch target, phosphor edge. */
export const TrialChip = ({
  label,
  isSelected = false,
  onPress,
  disabled,
  glyph,
  isCompact = false,
}: TrialChipProps) => {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        isCompact ? styles.chipCompact : styles.chipGrow,
        {
          borderColor: isSelected ? theme.primary : theme.textSecondary,
          backgroundColor: isSelected ? theme.primarySoft : theme.surface,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      {glyph ? (
        <Text style={[styles.glyph, { color: theme.primary }]}>{glyph}</Text>
      ) : null}
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
        style={[styles.chipLabel, { color: theme.primary }]}
      >
        {label}
      </Text>
    </Pressable>
  );
};

/** Mono readout line with optional prompt. */
export const TrialReadout = ({
  children,
  isPrompt = false,
  isDim = false,
}: {
  children: string;
  isPrompt?: boolean;
  isDim?: boolean;
}) => {
  const theme = useTheme();
  return (
    <View style={styles.readoutRow}>
      <Text
        style={[
          styles.readout,
          {
            color: isDim ? theme.textSecondary : theme.primary,
          },
        ]}
      >
        {isPrompt ? `> ${children}` : children}
      </Text>
      {isPrompt ? <TrialCursor /> : null}
    </View>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  chip: {
    alignItems: 'center',
    borderRadius: RADII.m,
    borderWidth: 2,
    gap: SPACING.HALF,
    justifyContent: 'center',
    padding: SPACING.TWO,
  },
  chipCompact: {
    minHeight: 52,
    minWidth: 52,
  },
  chipGrow: {
    flex: 1,
    minHeight: 72,
    minWidth: 0,
  },
  chipLabel: {
    fontFamily: FONTS.sansStrong,
    fontSize: 16,
    textAlign: 'center',
    width: '100%',
  },
  cursor: {
    height: 14,
    marginLeft: 4,
    width: 8,
  },
  glyph: {
    fontFamily: FONTS.monoStrong,
    fontSize: 22,
  },
  lamp: {
    borderRadius: 8,
    borderWidth: 2,
    height: 14,
    width: 14,
  },
  lamps: {
    flexDirection: 'row',
    gap: SPACING.TWO,
  },
  panel: {
    borderRadius: RADII.m,
    borderWidth: 2,
    flex: 1,
    overflow: 'hidden',
    padding: SPACING.THREE,
  },
  readout: {
    fontFamily: FONTS.mono,
    fontSize: 14,
    lineHeight: 20,
  },
  readoutRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
});

export type { RoundLampsProps, TrialChipProps, TrialPanelProps };
