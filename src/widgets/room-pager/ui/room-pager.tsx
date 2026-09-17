import { type ReactNode, useEffect, useRef } from 'react';

import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import {
  neighboursOf,
  ROOM_IDS,
  type RoomId,
  roomIndex,
  stepRoom,
} from '@/entities/room';

import { RADII, SPACING } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import { useTranslation } from '@/shared/i18n';
import { Text } from '@/shared/ui';

import { RoomBackground } from './room-background';
import { RoomDoor } from './room-door';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface RoomPagerProps {
  /** The room the child is standing in. Controlled by the screen. */
  room: RoomId;
  /** Raised by a swipe and by a door alike. */
  onRoomChange: (room: RoomId) => void;
  /**
   * One `<RoomPager.Room>` per entry of `ROOM_IDS`, **in that order** — the
   * pager lays its children out side by side and never inspects them.
   */
  children?: ReactNode;
  /** Invites the first visit with a pulse on the doors. */
  isHintVisible?: boolean;
  /**
   * Softens the slide with a dim veil and a fading "here" chip. Off when the
   * grown-up disables animations — the strip still pages.
   */
  isAnimated?: boolean;
}

interface RoomPageProps {
  room: RoomId;
  /** What stands in this room, drawn over its scene. */
  children?: ReactNode;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/** Peak opacity of the dim veil at the midpoint of a page slide. */
const VEIL_MAX_OPACITY = 0.22;

/** "You are here" chip fades in after the strip settles on a new room. */
const HERE_FADE_MS = 280;

// ═══════════════════════════════════════════
// COMPOUND COMPONENTS
// ═══════════════════════════════════════════

/**
 * One page of the map: a scene with whatever stands in it on top.
 *
 * It sizes itself to the window rather than to a prop, so the pager stays a
 * plain row of full-width pages and paging needs no measurement. Pages stay
 * opaque and full-size — scaling or fading them showed cream/white gaps
 * behind the strip.
 */
const RoomPage = ({ room, children }: RoomPageProps) => {
  const { width } = useWindowDimensions();

  return (
    <View style={{ width, height: '100%' }}>
      <RoomBackground room={room} />
      {children}
    </View>
  );
};

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

/**
 * The three rooms, side by side, with the doors between them.
 *
 * Two ways to move on purpose: a swipe, and a door with the name of the room
 * behind it. The gesture alone would be invisible — a child cannot discover a
 * swipe by looking — and 3.6 forbids leaving a gesture as the only way
 * through. The doors are the visible half; the swipe is the fast half.
 *
 * Softening is a dim veil over the strip mid-slide — not page scale/opacity,
 * which punched holes of the screen background through the art.
 */
const RoomPagerRoot = ({
  room,
  onRoomChange,
  children,
  isHintVisible = false,
  isAnimated = true,
}: RoomPagerProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const scroll = useRef<Animated.ScrollView>(null);
  /** The page the strip is actually resting on, to tell a door from a swipe. */
  const settledIndex = useRef(roomIndex(room));
  const lastWidth = useRef(width);
  /** First layout must land on `room` without animating from street. */
  const didPlace = useRef(false);
  // Frozen: updating `contentOffset` on every room change fought `scrollTo`
  // and made door taps feel like a hard cut.
  const initialOffset = useRef({ x: roomIndex(room) * width, y: 0 }).current;

  const index = roomIndex(room);
  const { left, right } = neighboursOf(room);
  const hereLabel = t('rooms.here', { room: t(`rooms.name.${room}`) });

  const scrollX = useSharedValue(index * width);
  const hereOpacity = useSharedValue(1);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  useEffect(() => {
    scrollX.value = index * width;

    if (!didPlace.current) {
      didPlace.current = true;
      settledIndex.current = index;
      lastWidth.current = width;
      scroll.current?.scrollTo({ x: index * width, animated: false });
      return;
    }

    const roomChanged = settledIndex.current !== index;
    const widthChanged = lastWidth.current !== width;
    lastWidth.current = width;

    if (roomChanged) {
      settledIndex.current = index;
      scroll.current?.scrollTo({ x: index * width, animated: isAnimated });
      if (isAnimated) {
        hereOpacity.value = 0;
        hereOpacity.value = withTiming(1, { duration: HERE_FADE_MS });
      }
      return;
    }

    if (widthChanged) {
      scroll.current?.scrollTo({ x: index * width, animated: false });
    }
  }, [hereOpacity, index, isAnimated, scrollX, width]);

  const handleSettled = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(event.nativeEvent.contentOffset.x / width);
    if (next === settledIndex.current) return;

    settledIndex.current = next;

    const nextRoom = ROOM_IDS[next];
    if (nextRoom) onRoomChange(nextRoom);

    if (isAnimated) {
      hereOpacity.value = 0;
      hereOpacity.value = withTiming(1, { duration: HERE_FADE_MS });
    }
  };

  const go = (direction: 'left' | 'right') => {
    onRoomChange(stepRoom(room, direction));
  };

  const hereStyle = useAnimatedStyle(() => ({
    opacity: hereOpacity.value,
  }));

  const veilStyle = useAnimatedStyle(() => {
    if (!isAnimated || width <= 0) return { opacity: 0 };

    const page = scrollX.value / width;
    const dist = Math.abs(page - Math.round(page));
    return {
      opacity: interpolate(
        dist,
        [0, 0.5],
        [0, VEIL_MAX_OPACITY],
        Extrapolation.CLAMP,
      ),
    };
  });

  return (
    <View style={styles.root}>
      <Animated.ScrollView
        ref={scroll}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
        decelerationRate="fast"
        scrollEventThrottle={16}
        onScroll={onScroll}
        onMomentumScrollEnd={handleSettled}
        contentOffset={initialOffset}
        style={styles.strip}
      >
        {children}
      </Animated.ScrollView>

      {/* Dim only — never scales the art, so no cream/white gutters. */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.veil,
          { backgroundColor: theme.inverseSurface },
          veilStyle,
        ]}
      />

      <Animated.View
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={[
          styles.here,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
          },
          hereStyle,
        ]}
      >
        <Text variant="smallBold" themeColor="textSecondary">
          {hereLabel}
        </Text>
      </Animated.View>

      {left && (
        <RoomDoor
          direction="left"
          label={t(`rooms.name.${left}`)}
          accessibilityLabel={t('rooms.goA11y', {
            room: t(`rooms.name.${left}`),
          })}
          isPulsing={isHintVisible}
          onPress={() => go('left')}
        />
      )}

      {right && (
        <RoomDoor
          direction="right"
          label={t(`rooms.name.${right}`)}
          accessibilityLabel={t('rooms.goA11y', {
            room: t(`rooms.name.${right}`),
          })}
          isPulsing={isHintVisible}
          onPress={() => go('right')}
        />
      )}
    </View>
  );
};

// ═══════════════════════════════════════════
// COMPOUND EXPORT
// ═══════════════════════════════════════════

export const RoomPager = Object.assign(RoomPagerRoot, {
  Room: RoomPage,
});

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  root: {
    backgroundColor: 'transparent',
    flex: 1,
  },
  here: {
    alignSelf: 'center',
    borderRadius: RADII.pill,
    borderWidth: 1,
    paddingHorizontal: SPACING.three,
    paddingVertical: SPACING.one,
    position: 'absolute',
    top: '48%',
  },
  strip: {
    backgroundColor: 'transparent',
    flex: 1,
  },
  veil: {
    ...StyleSheet.absoluteFill,
  },
});

export type { RoomPageProps, RoomPagerProps };
