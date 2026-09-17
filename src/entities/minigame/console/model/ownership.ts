// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/**
 * Catalogue `furnitureId` for the toys-shop console SKU.
 * Buying appends this id to `home.furnitureIds` — both arcade games unlock
 * from that single ownership bit.
 */
export const CONSOLE_FURNITURE_ID = 'game-console';

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

/** Whether the living-room shelf may open the console lobby. */
export const isConsoleOwned = (furnitureIds: readonly string[]): boolean =>
  furnitureIds.includes(CONSOLE_FURNITURE_ID);
