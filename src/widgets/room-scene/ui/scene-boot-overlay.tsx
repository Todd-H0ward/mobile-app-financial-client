import { useEffect, useState } from 'react';

import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { SCENE_PALETTE } from '@/entities/scene';

import { SPACING } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import { useTranslation } from '@/shared/i18n';
import { RingsBackdrop, TerminalPanel, Text } from '@/shared/ui';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface SceneBootOverlayProps {
  /** False while GLBs are still settling; true reveals the pit underneath. */
  isReady: boolean;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/** Same boot meter as the app splash — three of five cells lit. */
const BOOT_CELLS = [true, true, true, false, false];

const FADE_MS = 360;

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

/** Covers the empty pit until the dog and watchers finish loading. */
export const SceneBootOverlay = ({ isReady }: SceneBootOverlayProps) => {
  const [isMounted, setIsMounted] = useState(true);
  const opacity = useSharedValue(1);
  const theme = useTheme();
  const { t } = useTranslation();

  useEffect(() => {
    if (!isReady) {
      opacity.value = 1;
      setIsMounted(true);
      return;
    }
    opacity.value = withTiming(
      0,
      { duration: FADE_MS, easing: Easing.out(Easing.cubic) },
      (finished) => {
        if (finished) runOnJS(setIsMounted)(false);
      },
    );
  }, [isReady, opacity]);

  const fadeStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  if (!isMounted) return null;

  return (
    <Animated.View
      pointerEvents={isReady ? 'none' : 'auto'}
      style={[
        styles.root,
        { backgroundColor: SCENE_PALETTE.background },
        fadeStyle,
      ]}
    >
      <RingsBackdrop centerY={0.5} />
      <TerminalPanel frameStyle={styles.frame} style={styles.screen}>
        <Text variant="display" style={styles.title}>
          {t('app.name')}
        </Text>
        <Text variant="machine">{`> ${t('app.loadingScene')}`}</Text>
        <View style={styles.cells}>
          {BOOT_CELLS.map((isLit, index) => (
            <View
              key={index}
              style={[
                styles.cell,
                {
                  backgroundColor: isLit ? theme.phosphor : theme.surfaceSoft,
                },
              ]}
            />
          ))}
        </View>
      </TerminalPanel>
    </Animated.View>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  cell: { height: 10, width: 18 },
  cells: { flexDirection: 'row', gap: 3 },
  frame: { width: 300 },
  root: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  screen: {
    alignItems: 'center',
    gap: SPACING.COMPACT,
    paddingVertical: SPACING.SIX,
  },
  title: { fontSize: 38, lineHeight: 44 },
});

export type { SceneBootOverlayProps };
