import { ROOM_IDS, type RoomDirection, type RoomId } from '../../model';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

/** What lies either side of a room. `null` is the end of the map. */
interface RoomNeighbours {
  left: RoomId | null;
  right: RoomId | null;
}

// ═══════════════════════════════════════════
// NEIGHBOURS
// ═══════════════════════════════════════════

/** Where a room stands on the map, counting from the left. */
export const roomIndex = (room: RoomId): number => ROOM_IDS.indexOf(room);

/**
 * The rooms either side of this one.
 *
 * `null` rather than a wrap-around: the map has two ends, and a door that
 * teleports a child from the kitchen to the street would make the three rooms
 * unlearnable. The screen draws no door where there is no room.
 */
export const neighboursOf = (room: RoomId): RoomNeighbours => {
  const index = roomIndex(room);

  return {
    left: ROOM_IDS[index - 1] ?? null,
    right: ROOM_IDS[index + 1] ?? null,
  };
};

/**
 * One step in a direction, or the same room when that way is the end.
 *
 * Staying put is the honest answer at the edge: it keeps every caller free of
 * a null check and makes "the door is not drawn" and "the step does nothing"
 * the same rule rather than two.
 */
export const stepRoom = (room: RoomId, direction: RoomDirection): RoomId =>
  neighboursOf(room)[direction] ?? room;

export type { RoomNeighbours };
