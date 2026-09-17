import type { RoomId } from '../rooms';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

/**
 * How the prop is drawn. Floor props are foreshortened to the ground plane;
 * wall/shelf stay upright against the painted scene.
 */
type FurniturePropKind =
  | 'rug'
  | 'lamp'
  | 'stickers'
  | 'sweater'
  | 'scarf'
  | 'toy-car'
  | 'ball'
  | 'puzzle'
  | 'console';

/** Which surface of the room art the prop sits on — drives the transform. */
type FurniturePlane = 'floor' | 'wall' | 'shelf';

/**
 * One place a bought furniture id occupies in a room.
 *
 * Percents of the room page. Tuned to `living.webp` empty floor / wall / shelf
 * so props do not cover painted furniture.
 */
interface FurnitureSlot {
  /** Matches `CatalogueItem.furnitureId` / `home.furnitureIds` entry. */
  furnitureId: string;
  roomId: RoomId;
  /** Left edge, 0…100 of room width. */
  left: number;
  /** Top edge, 0…100 of room height. */
  top: number;
  /** Bounding box width as % of room width. */
  width: number;
  /** Bounding box height as % of room height. */
  height: number;
  prop: FurniturePropKind;
  plane: FurniturePlane;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/**
 * Living-room showcase — docs/house.md «витрина прогресса».
 *
 * Coordinates follow the photo’s one-point perspective: open floor in front,
 * left wallpaper for stickers, bookshelf for toys that also open the shelf.
 */
const FURNITURE_SLOTS: readonly FurnitureSlot[] = [
  {
    furnitureId: 'rug',
    roomId: 'living',
    left: 22,
    top: 70,
    width: 56,
    height: 16,
    prop: 'rug',
    plane: 'floor',
  },
  {
    furnitureId: 'lamp',
    roomId: 'living',
    left: 70,
    top: 48,
    width: 10,
    height: 14,
    prop: 'lamp',
    plane: 'shelf',
  },
  {
    furnitureId: 'stickers',
    roomId: 'living',
    left: 4,
    top: 18,
    width: 14,
    height: 16,
    prop: 'stickers',
    plane: 'wall',
  },
  {
    furnitureId: 'sweater',
    roomId: 'living',
    left: 14,
    top: 36,
    width: 10,
    height: 12,
    prop: 'sweater',
    plane: 'shelf',
  },
  {
    furnitureId: 'scarf',
    roomId: 'living',
    left: 16,
    top: 42,
    width: 9,
    height: 8,
    prop: 'scarf',
    plane: 'shelf',
  },
  {
    furnitureId: 'toy-car',
    roomId: 'living',
    left: 30,
    top: 74,
    width: 16,
    height: 10,
    prop: 'toy-car',
    plane: 'floor',
  },
  {
    furnitureId: 'ball',
    roomId: 'living',
    left: 48,
    top: 76,
    width: 12,
    height: 8,
    prop: 'ball',
    plane: 'floor',
  },
  {
    furnitureId: 'rooms-living',
    roomId: 'living',
    left: 10,
    top: 44,
    width: 11,
    height: 8,
    prop: 'puzzle',
    plane: 'shelf',
  },
  {
    furnitureId: 'game-console',
    roomId: 'living',
    left: 11,
    top: 52,
    width: 12,
    height: 7,
    prop: 'console',
    plane: 'shelf',
  },
];

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

/** Slots that belong in this room and are already owned. */
export const ownedSlotsInRoom = (
  roomId: RoomId,
  furnitureIds: readonly string[],
): readonly FurnitureSlot[] => {
  if (furnitureIds.length === 0) return [];
  const owned = new Set(furnitureIds);
  return FURNITURE_SLOTS.filter(
    (slot) => slot.roomId === roomId && owned.has(slot.furnitureId),
  );
};

/** Every slot definition — for tests and content audits. */
export const listFurnitureSlots = (): readonly FurnitureSlot[] =>
  FURNITURE_SLOTS;

export type { FurniturePlane, FurniturePropKind, FurnitureSlot };
