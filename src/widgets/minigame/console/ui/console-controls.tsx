import type { ReactNode } from 'react';

import { Pressable, StyleSheet, View } from 'react-native';

import type { Direction } from '@/entities/minigame/snake';

import { RADII, SPACING } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import { Text } from '@/shared/ui';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface ConsoleDpadProps {
  onPress: (direction: Direction) => void;
  upLabel: string;
  downLabel: string;
  leftLabel: string;
  rightLabel: string;
}

interface ConsoleFaceButtonsProps {
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  isPrimaryDisabled?: boolean;
}

interface VolumeButtonProps {
  children: ReactNode;
  accessibilityLabel: string;
  onPress?: () => void;
  onPressIn?: () => void;
  onPressOut?: () => void;
  disabled?: boolean;
  face: string;
  depth: string;
  size: number;
  isRound?: boolean;
  /** Wider than tall — fire button on Spacewar. */
  minWidth?: number;
}

type ConsoleVolumeButtonProps = VolumeButtonProps;

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

/**
 * Plastic face with a thicker bottom lip — reads as a raised button.
 * Press animates with translateY inside a fixed slot so the D-pad layout
 * never shifts (margin/border changes would shove neighbours).
 */
export const ConsoleVolumeButton = ({
  children,
  accessibilityLabel,
  onPress,
  onPressIn,
  onPressOut,
  disabled = false,
  face,
  depth,
  size,
  isRound = false,
  minWidth,
}: VolumeButtonProps) => {
  const slotWidth = minWidth ?? size;

  return (
    <View style={{ height: size + LIP, width: slotWidth }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        disabled={disabled}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={({ pressed }) => [
          styles.volume,
          {
            backgroundColor: face,
            borderBottomColor: depth,
            borderBottomWidth: LIP,
            borderRadius: isRound ? RADII.pill : RADII.s,
            height: size,
            minWidth: slotWidth,
            opacity: disabled ? 0.55 : 1,
            paddingHorizontal: minWidth != null ? SPACING.two : 0,
            transform: [
              {
                translateY: pressed && !disabled ? LIP - PRESSED_LIFT : 0,
              },
            ],
            width: minWidth != null ? undefined : size,
          },
        ]}
      >
        {children}
      </Pressable>
    </View>
  );
};

const VolumeButton = ConsoleVolumeButton;

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

export const ConsoleDpad = ({
  onPress,
  upLabel,
  downLabel,
  leftLabel,
  rightLabel,
}: ConsoleDpadProps) => {
  const theme = useTheme();

  return (
    <View style={styles.dpad}>
      <VolumeButton
        accessibilityLabel={upLabel}
        onPress={() => onPress('up')}
        face={theme.arcadeDpadFace}
        depth={theme.arcadeDpad}
        size={KEY}
      >
        <Text variant="title">↑</Text>
      </VolumeButton>
      <View style={styles.dpadMid}>
        <VolumeButton
          accessibilityLabel={leftLabel}
          onPress={() => onPress('left')}
          face={theme.arcadeDpadFace}
          depth={theme.arcadeDpad}
          size={KEY}
        >
          <Text variant="title">←</Text>
        </VolumeButton>
        <View style={[styles.dpadHub, { backgroundColor: theme.arcadeDpad }]} />
        <VolumeButton
          accessibilityLabel={rightLabel}
          onPress={() => onPress('right')}
          face={theme.arcadeDpadFace}
          depth={theme.arcadeDpad}
          size={KEY}
        >
          <Text variant="title">→</Text>
        </VolumeButton>
      </View>
      <VolumeButton
        accessibilityLabel={downLabel}
        onPress={() => onPress('down')}
        face={theme.arcadeDpadFace}
        depth={theme.arcadeDpad}
        size={KEY}
      >
        <Text variant="title">↓</Text>
      </VolumeButton>
    </View>
  );
};

export const ConsoleFaceButtons = ({
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
  isPrimaryDisabled = false,
}: ConsoleFaceButtonsProps) => {
  const theme = useTheme();

  return (
    <View style={styles.faces}>
      {secondaryLabel != null && onSecondary != null ? (
        <VolumeButton
          accessibilityLabel={secondaryLabel}
          onPress={onSecondary}
          face={theme.arcadeButtonB}
          depth={theme.arcadeShellDeep}
          size={64}
          isRound
        >
          <Text variant="smallBold" themeColor="inverseText">
            {secondaryLabel}
          </Text>
        </VolumeButton>
      ) : (
        <View style={styles.faceSpacer} />
      )}
      <VolumeButton
        accessibilityLabel={primaryLabel}
        onPress={onPrimary}
        disabled={isPrimaryDisabled}
        face={isPrimaryDisabled ? theme.disabled : theme.arcadeButtonA}
        depth={theme.arcadeShellDeep}
        size={76}
        isRound
      >
        <Text
          variant="smallBold"
          themeColor={isPrimaryDisabled ? 'textDisabled' : 'inverseText'}
        >
          {primaryLabel}
        </Text>
      </VolumeButton>
    </View>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const KEY = 52;
/** Bottom lip height reserved in the slot so press never reflows neighbours. */
const LIP = 5;
/** How far the face drops on press (stays inside the slot). */
const PRESSED_LIFT = 3;

const styles = StyleSheet.create({
  dpad: {
    alignItems: 'center',
    gap: SPACING.one,
    width: KEY * 3 + SPACING.one * 2,
  },
  dpadHub: {
    borderRadius: RADII.xs,
    height: KEY * 0.4,
    width: KEY * 0.4,
  },
  dpadMid: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: SPACING.one,
  },
  faceSpacer: {
    height: 64 + LIP,
    width: 64,
  },
  faces: {
    alignItems: 'flex-end',
    gap: SPACING.two,
    justifyContent: 'center',
  },
  volume: {
    alignItems: 'center',
    borderLeftColor: 'rgba(255,255,255,0.35)',
    borderLeftWidth: 1,
    borderRightColor: 'rgba(0,0,0,0.12)',
    borderRightWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.45)',
    borderTopWidth: 1.5,
    elevation: 3,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
  },
});

export type {
  ConsoleDpadProps,
  ConsoleFaceButtonsProps,
  ConsoleVolumeButtonProps,
};
