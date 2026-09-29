import { useEffect, useState } from 'react';

import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { SCENE_PALETTE } from '@/entities/scene';

import { useTranslation } from '@/shared/i18n';
import { LoadingArtwork } from '@/shared/ui';

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

const FADE_MS = 360;

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

/** Covers the empty pit until the dog and watchers finish loading. */
export const SceneBootOverlay = ({ isReady }: SceneBootOverlayProps) => {
  const [isMounted, setIsMounted] = useState(true);
  const opacity = useSharedValue(1);
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
      <LoadingArtwork status={t('app.loadingScene')} />
    </Animated.View>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFill, zIndex: 20 },
});

export type { SceneBootOverlayProps };
