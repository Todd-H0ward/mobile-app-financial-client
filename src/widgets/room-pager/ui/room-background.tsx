import { Image } from 'expo-image';
import { StyleSheet } from 'react-native';

import type { RoomId } from '@/entities/room';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface RoomBackgroundProps {
  room: RoomId;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/**
 * The art behind each room — the only place an image file is named.
 *
 * WebP on purpose: the three scenes together weigh less than a third of what
 * the same PNGs would, and docs/performance.md counts the cold start (3.7)
 * against the whole bundle.
 */
const ROOM_ART: Record<RoomId, number> = {
  street: require('@/assets/images/rooms/street.webp'),
  living: require('@/assets/images/rooms/living.webp'),
  kitchen: require('@/assets/images/rooms/kitchen.webp'),
};

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

/**
 * One room's scene, edge to edge and under the status bar.
 *
 * `cover` rather than `contain`: a letterboxed room would read as a picture of
 * a room, and the child is supposed to be standing in it. The art is drawn
 * with its furniture off the extreme edges so the crop on a tall phone takes
 * wall, not a cupboard.
 */
export const RoomBackground = ({ room }: RoomBackgroundProps) => (
  <Image
    source={ROOM_ART[room]}
    contentFit="cover"
    // The scenes never change, so the memory cache alone is the right one:
    // nothing to revalidate, nothing to write to disk.
    cachePolicy="memory"
    accessible={false}
    style={StyleSheet.absoluteFill}
  />
);

export type { RoomBackgroundProps };
