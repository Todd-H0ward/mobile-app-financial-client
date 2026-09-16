// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/**
 * The rooms of the game, **in the order they stand from left to right**.
 *
 * The order is the map: `street` is west of `living`, `kitchen` is east of it,
 * and the whole navigation — which door a room has, which way a swipe goes —
 * is read off this tuple rather than written down twice.
 *
 * Rooms replace a tab bar (see AGENTS.md): a seven-year-old reads "the kitchen
 * is that way" long before they read a row of labels.
 */
const ROOM_IDS = ['street', 'living', 'kitchen'] as const;

/**
 * Where the child lands when the app opens.
 *
 * The pet's room, always — the current room is deliberately not part of the
 * save: coming back to the same place every time is what makes a home a home,
 * and it keeps the schema out of a migration.
 */
const DEFAULT_ROOM = 'living';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

/** One room of the map. */
type RoomId = (typeof ROOM_IDS)[number];

/** Which way the child is walking. */
type RoomDirection = 'left' | 'right';

export type { RoomDirection, RoomId };
export { DEFAULT_ROOM, ROOM_IDS };
