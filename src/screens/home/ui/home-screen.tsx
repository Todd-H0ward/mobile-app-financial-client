import { useState } from 'react';

import { Redirect, useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RoomScene, type SceneView } from '@/widgets/room-scene';

import { SCENE_LEVEL_COUNT } from '@/entities/scene';
import { usePetAction, usePetSkin } from '@/entities/user';
import type { WatcherId } from '@/entities/watcher';

import {
  CONTENT_PADDING,
  DYNAMIC_ROUTES,
  RADII,
  SPACING,
  STATIC_ROUTES,
} from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import { useTranslation } from '@/shared/i18n';
import { Button, SettingsIcon, Text, ThemedView } from '@/shared/ui';
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
const _STEP_SLIDER_HEIGHT = 168;

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

/**
 * What a screen is saying while the child stands in front of it.
 *
 * Bottom of the frame rather than beside the face: the camera has flown in
 * close, and the head fills the middle of the window. A tap anywhere on the
 * world also walks away — the button is the visible way out, not the only
 * one, which is 3.6.
 */
const WatcherCard = ({
  watcher,
  onLeave,
}: {
  watcher: WatcherId;
  onLeave: () => void;
}) => {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <View
      style={[
        styles.watcherCard,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
    >
      <Text variant="label" themeColor="textMuted">
        {t(`scene.watchers.${watcher}.name`)}
      </Text>
      <Text variant="body">{t(`scene.watchers.${watcher}.line`)}</Text>
      <Button size="s" variant="secondary" onPress={onLeave}>
        {t('scene.watcherLeave')}
      </Button>
    </View>
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

  /** Opens over the first segment, not on the map: a place, not a menu. */
  const [view, setView] = useState<SceneView>(0);
  /**
   * How far out of the pit the game has climbed, `0 … SCENE_LEVEL_COUNT`.
   *
   * Starts at the bottom: the child opens the game standing on the floor of
   * the pit with the walls above them, and every level lifts the platform a
   * ring higher until it clears the rim. Local state for now — the real game
   * will read this off the period the player has finished.
   */
  const [level, setLevel] = useState(0);
  /** At the top the button turns into a way back down, not a dead end. */
  const isOutOfPit = level >= SCENE_LEVEL_COUNT;
  /**
   * The screen overhead the child has tapped, if any.
   *
   * Owned here rather than inside the widget: the camera flight is the
   * widget's, but what the machine says is the game's, and the level card has
   * to stand down while somebody is talking.
   */
  const [talkingTo, setTalkingTo] = useState<WatcherId | null>(null);

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
        level={level}
        petSkin={petSkin}
        petAction={petActionFor(hud.pet?.moodName ?? null, chosenAction)}
        focusedWatcher={talkingTo}
        onWatcherFocus={(w) => {
          console.warn('[screen] onWatcherFocus', w, 'was', talkingTo);
          setTalkingTo(w);
        }}
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

      {talkingTo ? (
        <View
          pointerEvents="box-none"
          style={[
            styles.watcherDock,
            {
              paddingBottom:
                insets.bottom + ROOM_CONTROLS_CLEARANCE + SPACING.three,
            },
          ]}
        >
          <WatcherCard watcher={talkingTo} onLeave={() => setTalkingTo(null)} />
        </View>
      ) : null}

      {/* The level knob stands down mid-conversation: it belongs to the
          arena, and the camera is not on the arena. */}
      <View
        pointerEvents="box-none"
        style={[
          styles.stepsRail,
          talkingTo ? styles.hidden : null,
          {
            paddingBottom:
              insets.bottom + ROOM_CONTROLS_CLEARANCE + SPACING.three,
            paddingTop: insets.top + GEAR_SIZE + SPACING.four,
          },
        ]}
      >
        <View
          style={[
            styles.levelCard,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          <Text variant="label" themeColor="textMuted">
            {t('scene.level', { level, total: SCENE_LEVEL_COUNT })}
          </Text>
          <Button
            size="s"
            variant={isOutOfPit ? 'secondary' : 'primary'}
            onPress={() =>
              setLevel((current) =>
                current >= SCENE_LEVEL_COUNT ? 0 : current + 1,
              )
            }
          >
            {t(isOutOfPit ? 'scene.levelReset' : 'scene.levelUp')}
          </Button>
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
  watcherCard: {
    alignItems: 'flex-start',
    borderRadius: RADII.l,
    borderWidth: 1,
    gap: SPACING.two,
    padding: SPACING.three,
  },
  watcherDock: {
    bottom: 0,
    justifyContent: 'flex-end',
    left: 0,
    paddingHorizontal: CONTENT_PADDING,
    pointerEvents: 'box-none',
    position: 'absolute',
    right: 0,
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
  hidden: {
    display: 'none',
  },
  levelCard: {
    alignItems: 'center',
    alignSelf: 'flex-end',
    borderRadius: RADII.l,
    borderWidth: 1,
    gap: SPACING.one,
    paddingHorizontal: SPACING.two,
    paddingVertical: SPACING.two,
  },
});
