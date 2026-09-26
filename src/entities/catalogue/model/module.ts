import type { CatalogueItem } from './types';

/** Bonus properties provided by a module. */
interface ModuleBonus {
  /** Multiplier for task rewards. 1.0 = no bonus. */
  rewardMultiplier: number;
  /** Extra hints in minigames. */
  extraHints: number;
}

const MODULE_BONUSES: Record<string, ModuleBonus> = {
  'module-sensor': { rewardMultiplier: 1.1, extraHints: 0 },
  'module-antenna': { rewardMultiplier: 1.0, extraHints: 1 },
  'module-core': { rewardMultiplier: 1.15, extraHints: 2 },
};

const MODULE_IDS = Object.keys(MODULE_BONUSES);

/**
 * Returns the bonus for a given module ID, or null if not found.
 */
function getModuleBonus(moduleId: string): ModuleBonus | null {
  return MODULE_BONUSES[moduleId] ?? null;
}

/**
 * Combines bonuses from all owned modules.
 * Multipliers are multiplied together, extra hints are added.
 */
function computeEffectiveBonus(ownedModuleIds: string[]): ModuleBonus {
  return ownedModuleIds.reduce(
    (acc, id) => {
      const bonus = getModuleBonus(id);
      if (bonus) {
        acc.rewardMultiplier *= bonus.rewardMultiplier;
        acc.extraHints += bonus.extraHints;
      }
      return acc;
    },
    { rewardMultiplier: 1.0, extraHints: 0 },
  );
}

/**
 * Checks if a catalogue item is a module.
 */
function isModuleItem(item: CatalogueItem): boolean {
  return item.category === 'module' || item.moduleTier !== undefined;
}

export type { ModuleBonus };
export {
  computeEffectiveBonus,
  getModuleBonus,
  isModuleItem,
  MODULE_BONUSES,
  MODULE_IDS,
};
