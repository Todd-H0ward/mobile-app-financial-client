import { useState } from 'react';

import { Redirect, useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RoomScene, type SceneView } from '@/widgets/room-scene';

import { DEFAULT_ROOM } from '@/entities/room';
import { SCENE_STEP_COUNT } from '@/entities/scene';
import { usePetAction, usePetSkin } from '@/entities/user';

import {
  CONTENT_PADDING,
  DYNAMIC_ROUTES,
  HIT_SLOP_SIZE,
  RADII,
  SPACING,
  STATIC_ROUTES,
} from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import { useTranslation } from '@/shared/i18n';
import { SettingsIcon, Slider, Text, ThemedView } from '@/shared/ui';
import { hitSlopFor } from '@/shared/utils';

import { petActionFor } from '../lib/pet-action';
import { useHomeHud } from '../model';

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/** Visual size of the settings button; hitSlop expands it to 48dp. */
const GEAR_SIZE = 40;

/**
 * Vertical travel for the five tiers. Kept short so the rail fits between the
 * gear and the room buttons without spilling past the safe area.
 */
const STEP_SLIDER_HEIGHT = 168;

/** Room-button strip under the scene — keep the rail clear of it. */
const ROOM_CONTROLS_CLEARANCE = 56;

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

/**
 * Settings: the child's own switches — sound, animations, language.
 *
 * Reachable without the barrier on purpose. Turning the sound off on a bus is
 * an accessibility need (3.6), and an accessibility switch a child cannot
 * reach without solving 7 × 8 is not an accessible switch. The grown-up's
 * section sits behind its own quiet door inside.
 */
const SettingsButton = ({ onPress }: { onPress: () => void }) => {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('home.settingsA11y')}
      hitSlop={hitSlopFor(GEAR_SIZE)}
      onPress={onPress}
      style={({ pressed }) => [
        styles.gear,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <SettingsIcon color={theme.textSecondary} />
    </Pressable>
  );
};

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

/**
 * The world: one model with three rooms on it, turning under the camera.
 *
 * Not a `Screen`: the scene is edge to edge and runs under the status bar,
 * while `Screen` is a padded scrolling column. What `Screen` gave — the safe
 * area — is taken directly here, so the model keeps the whole window and only
 * the controls step inside the inset.
 *
 * The pet and the HUD are off while the scene is being built: the coins, the
 * goal and the companion have to be placed against the 3D world rather than
 * over the old flat rooms, and half-placed they would only get in the way.
 */
export const HomeScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { t } = useTranslation();
  const hud = useHomeHud();
  const petSkin = usePetSkin();
  const chosenAction = usePetAction();

  /** Opens looking into a room on the horizon — not overhead at an angle. */
  const [view, setView] = useState<SceneView>(DEFAULT_ROOM);
  /**
   * How many disc tiers stand up in every room, `0` (flat) … `SCENE_STEP_COUNT`.
   * Starts fully raised — that is the model as the artist left it.
   */
  const [raisedStepCount, setRaisedStepCount] = useState(SCENE_STEP_COUNT);

  if (hud.isSummary) {
    return <Redirect href={STATIC_ROUTES.PERIOD_SUMMARY} />;
  }

  // Usually caught right after settlement, in `useRecovery`. This is the
  // fallback for whatever reaches home without going through it — a demo run
  // that advanced several periods unattended chief among them; 1.6 requires
  // the scene to be seen, not merely computable.
  if (hud.isGrowthPending) {
    return <Redirect href={DYNAMIC_ROUTES.petGrew(STATIC_ROUTES.HOME)} />;
  }

  return (
    <ThemedView variant="background" style={styles.root}>
      <RoomScene
        view={view}
        onViewChange={setView}
        raisedStepCount={raisedStepCount}
        petSkin={petSkin}
        petAction={petActionFor(hud.pet?.moodName ?? null, chosenAction)}
        isAnimated={hud.isAnimationEnabled}
      />

      {/* box-none: the scene keeps every touch the controls do not want, so a
          swipe started next to the gear still turns the world. */}
      <View
        pointerEvents="box-none"
        style={[styles.top, { paddingTop: insets.top + SPACING.two }]}
      >
        <SettingsButton onPress={() => router.push(STATIC_ROUTES.SETTINGS)} />
      </View>

      <View
        pointerEvents="box-none"
        style={[
          styles.stepsRail,
          {
            paddingBottom:
              insets.bottom + ROOM_CONTROLS_CLEARANCE + SPACING.three,
            paddingTop: insets.top + GEAR_SIZE + SPACING.four,
          },
        ]}
      >
        <View
          style={[
            styles.stepsCard,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          <Text variant="label" themeColor="textMuted">
            {raisedStepCount}
          </Text>
          <Slider
            accessibilityLabel={t('scene.stepsA11y')}
            orientation="vertical"
            value={raisedStepCount}
            min={0}
            max={SCENE_STEP_COUNT}
            step={1}
            color="primary"
            isThumbFilled
            onChange={setRaisedStepCount}
            style={styles.stepsSlider}
          />
        </View>
      </View>
    </ThemedView>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  gear: {
    alignItems: 'center',
    borderRadius: RADII.m,
    borderWidth: 1,
    height: GEAR_SIZE,
    justifyContent: 'center',
    width: GEAR_SIZE,
  },
  top: {
    alignItems: 'flex-end',
    left: 0,
    paddingHorizontal: CONTENT_PADDING,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  stepsRail: {
    bottom: 0,
    justifyContent: 'center',
    paddingRight: CONTENT_PADDING,
    pointerEvents: 'box-none',
    position: 'absolute',
    right: 0,
    top: 0,
  },
  stepsCard: {
    alignItems: 'center',
    alignSelf: 'flex-end',
    borderRadius: RADII.l,
    borderWidth: 1,
    gap: SPACING.one,
    height: STEP_SLIDER_HEIGHT,
    justifyContent: 'center',
    overflow: 'hidden',
    paddingHorizontal: SPACING.one,
    paddingVertical: SPACING.two,
    // Track hit area is HIT_SLOP_SIZE; padding keeps the thumb inside the card.
    width: HIT_SLOP_SIZE + SPACING.two,
  },
  stepsSlider: {
    // Explicit height — `%` / flex on the vertical slider overgrows the card.
    height:
      STEP_SLIDER_HEIGHT - SPACING.two * 2 - SPACING.one - 12 /* label line */,
    width: HIT_SLOP_SIZE,
  },
});
