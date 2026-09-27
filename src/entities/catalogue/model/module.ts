import type { CatalogueItem } from './types';

/** Bonus properties provided by a module. */
interface ModuleBonus {
  /** Multiplier for task rewards. 1.0 = no bonus. */
  rewardMultiplier: number;
}

const MODULE_BONUSES: Record<string, ModuleBonus> = {
  'module-sensor': { rewardMultiplier: 1.1 },
  'module-antenna': { rewardMultiplier: 1.05 },
  'module-core': { rewardMultiplier: 1.15 },
};

const MODULE_IDS = Object.keys(MODULE_BONUSES);

function getModuleBonus(moduleId: string): ModuleBonus | null {
  return MODULE_BONUSES[moduleId] ?? null;
}

/** Combines only the installed modules. Ownership alone never activates a bonus. */
function computeEffectiveBonus(installedModuleIds: string[]): ModuleBonus {
  return installedModuleIds.reduce(
    (acc, id) => {
      const bonus = getModuleBonus(id);
      if (bonus) {
        acc.rewardMultiplier *= bonus.rewardMultiplier;
      }
      return acc;
    },
    { rewardMultiplier: 1.0 },
  );
}

function isModuleItem(item: CatalogueItem): boolean {
  return item.category === 'module' || item.moduleTier !== undefined;
}

export type { ModuleBonus, ModuleSlot };
export {
  computeEffectiveBonus,
  getModuleBonus,
  isModuleItem,
  MODULE_BONUSES,
  MODULE_IDS,
};

/** Each optional electronic module has one physical mounting point. */
export const MODULE_SLOTS = {
  head: 'module-antenna',
  body: 'module-core',
  legs: 'module-sensor',
} as const;
type ModuleSlot = keyof typeof MODULE_SLOTS;
