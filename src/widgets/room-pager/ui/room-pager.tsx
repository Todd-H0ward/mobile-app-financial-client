import { type ReactNode, useEffect, useRef } from 'react';

import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';

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
}

interface RoomPageProps {
  room: RoomId;
  /** What stands in this room, drawn over its scene. */
  children?: ReactNode;
}

// ═══════════════════════════════════════════
// COMPOUND COMPONENTS
// ═══════════════════════════════════════════

/**
 * One page of the map: a scene with whatever stands in it on top.
 *
 * It sizes itself to the window rather than to a prop, so the pager stays a
 * plain row of full-width pages and paging needs no measurement.
 */
const RoomPage = ({ room, children }: RoomPageProps) => {
  const { width } = useWindowDimensions();

  return (
    <View style={{ width }}>
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
 * A native paging `ScrollView` carries the movement rather than a hand-rolled
 * gesture: the momentum, the rubber band at the ends and the accessibility
 * scroll actions all come for free, and none of it runs on the JS thread.
 */
const RoomPagerRoot = ({
  room,
  onRoomChange,
  children,
  isHintVisible = false,
}: RoomPagerProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const scroll = useRef<ScrollView>(null);
  /** The page the strip is actually resting on, to tell a door from a swipe. */
  const settledIndex = useRef(roomIndex(room));

  const index = roomIndex(room);
  const { left, right } = neighboursOf(room);
  const hereLabel = t('rooms.here', { room: t(`rooms.name.${room}`) });

  useEffect(() => {
    if (settledIndex.current === index) return;

    // The room changed from the outside — a door, or a screen that sent the
    // child somewhere. A swipe has already moved the strip itself.
    settledIndex.current = index;
    scroll.current?.scrollTo({ x: index * width, animated: true });
  }, [index, width]);

  const handleSettled = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(event.nativeEvent.contentOffset.x / width);
    if (next === settledIndex.current) return;

    settledIndex.current = next;

    const room = ROOM_IDS[next];
    if (room) onRoomChange(room);
  };

  const go = (direction: 'left' | 'right') => {
    onRoomChange(stepRoom(room, direction));
  };

  return (
    <View style={styles.root}>
      <ScrollView
        ref={scroll}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
        onMomentumScrollEnd={handleSettled}
        contentOffset={{ x: index * width, y: 0 }}
        style={styles.strip}
      >
        {children}
      </ScrollView>

      <View
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={[
          styles.here,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
          },
        ]}
      >
        <Text variant="smallBold" themeColor="textSecondary">
          {hereLabel}
        </Text>
      </View>

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
    flex: 1,
  },
});

export type { RoomPageProps, RoomPagerProps };
