// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/** Catalogue `ownedId` for the toys-shop console SKU. */
export const CONSOLE_OWNED_ID = 'game-console';

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

export const isConsoleOwned = (ownedItemIds: readonly string[]): boolean =>
  ownedItemIds.includes(CONSOLE_OWNED_ID);
