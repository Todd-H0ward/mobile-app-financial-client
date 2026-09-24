// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/**
 * Catalogue `ownedId` for the toys-shop console SKU.
 * Buying appends this id to `ownedItemIds` — both arcade games unlock
 * from that single ownership bit.
 */
export const CONSOLE_OWNED_ID = 'game-console';

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

export const isConsoleOwned = (ownedItemIds: readonly string[]): boolean =>
  ownedItemIds.includes(CONSOLE_OWNED_ID);
