import { useState } from 'react';

import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HintButton } from '@/widgets/hint-button';
import { RoomPager } from '@/widgets/room-pager';

import { DEFAULT_ROOM, type RoomId } from '@/entities/room';

import { CONTENT_PADDING, RADII, ROUTES, SPACING } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import { useTranslation } from '@/shared/i18n';
import { SettingsIcon, ThemedView } from '@/shared/ui';
import { hitSlopFor } from '@/shared/utils';

import { useHomeHud } from '../model';

import { HomeHudBoard, HomeHudLastCredit, HomeHudStats } from './home-hud';
import { KitchenRoom } from './rooms/kitchen-room';
import { LivingRoom } from './rooms/living-room';
import { StreetRoom } from './rooms/street-room';

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/** Visual size of the settings button; hitSlop expands it to 48dp. */
const GEAR_SIZE = 40;

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

const GearButton = ({ onPress }: { onPress: () => void }) => {
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
 * The world: three rooms the child walks between, with the HUD over them.
 *
 * Not a `Screen`: a room is edge to edge and runs under the status bar, while
 * `Screen` is a padded scrolling column. What `Screen` gave — the safe area —
 * is taken directly here, so the art keeps the whole window and only the
 * controls step inside the inset.
 *
 * Everything requirement 2.5.3 asks to see at once stays on screen while the
 * child walks: the coins and the jar along the top, the goal and the task
 * along the bottom, and the pet with its state in the room it lives in.
 */
export const HomeScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const hud = useHomeHud();

  const [room, setRoom] = useState<RoomId>(DEFAULT_ROOM);
  /**
   * The doors invite the very first visit and then stop.
   *
   * Once the child has walked anywhere, they know the rooms are there — a
   * button that keeps pulsing forever is a banner, not a hint.
   */
  const [hasWalked, setHasWalked] = useState(false);

  const handleRoomChange = (next: RoomId) => {
    setHasWalked(true);
    setRoom(next);
  };

  return (
    <ThemedView variant="background" style={styles.root}>
      <RoomPager
        room={room}
        onRoomChange={handleRoomChange}
        isHintVisible={!hasWalked && hud.isAnimationEnabled}
      >
        <RoomPager.Room room="street">
          <StreetRoom />
        </RoomPager.Room>

        <RoomPager.Room room="living">
          <LivingRoom
            pet={hud.pet}
            isAnimated={hud.isAnimationEnabled}
            onOpenBox={() => router.push(ROUTES.PET_CREATE)}
          />
        </RoomPager.Room>

        <RoomPager.Room room="kitchen">
          <KitchenRoom />
        </RoomPager.Room>
      </RoomPager>

      {/* box-none: the scene keeps every touch the controls do not want, so a
          swipe started next to a badge still walks to the next room. */}
      <View
        pointerEvents="box-none"
        style={[styles.top, { paddingTop: insets.top + SPACING.two }]}
      >
        <View pointerEvents="box-none" style={styles.topRow}>
          {/* Read-only, so it must not swallow a swipe that starts on it. */}
          <View pointerEvents="none">
            <HomeHudStats
              balance={hud.balance}
              savingsTotal={hud.savingsTotal}
            />
          </View>

          <View style={styles.actions}>
            <GearButton onPress={() => router.push(ROUTES.SETTINGS)} />
            <HintButton screen="home" />
          </View>
        </View>

        <View pointerEvents="none">
          <HomeHudLastCredit credit={hud.lastCredit} />
        </View>
      </View>

      {/* Reading matter, not a control: `none` keeps the lower third of the
          room swipeable. It becomes pressable when the goal screen exists. */}
      <View
        pointerEvents="none"
        style={[styles.bottom, { paddingBottom: insets.bottom + SPACING.two }]}
      >
        <HomeHudBoard goal={hud.goal} taskHint={hud.taskHint} />
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
  actions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: SPACING.two,
  },
  bottom: {
    bottom: 0,
    left: 0,
    paddingHorizontal: CONTENT_PADDING,
    position: 'absolute',
    right: 0,
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
    gap: SPACING.one,
    left: 0,
    paddingHorizontal: CONTENT_PADDING,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  topRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: SPACING.two,
    justifyContent: 'space-between',
  },
});
