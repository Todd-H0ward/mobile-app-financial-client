import { useRouter } from 'expo-router';

import {
  appearanceFor,
  GROWTH_RULES,
  type PetAppearance,
  type PetStage,
} from '@/entities/pet';
import { celebrateStage, useUpdateUser, useUser } from '@/entities/user';

import type { RoutePath } from '@/shared/constants';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

/** What the scene needs to draw the pet and name the cause — `null` when
 * there is nothing to celebrate, so the screen knows to step aside. */
interface PetGrewController {
  petName: string;
  appearance: PetAppearance;
  stage: PetStage;
  /**
   * What the current stage required, in whole numbers — the reason 2.5.10
   * asks a stage change to name. The thresholds, not the child's exact
   * count: the count may run well ahead of them, and the rule is what the
   * child actually cleared.
   */
  reason: { periods: number; goalsReached: number; plansKept: number };
  confirm: () => void;
}

// ═══════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════

/**
 * The growth ceremony's state — roadmap 1.6.
 *
 * Reads the pending growth straight off the save rather than taking it as a
 * prop: however the child got here (recovery's redirect, home's fallback,
 * a cold start mid-ceremony), the scene shows exactly what the save says is
 * still uncelebrated.
 */
export const usePetGrew = (
  destination: RoutePath,
): PetGrewController | null => {
  const router = useRouter();
  const user = useUser();
  const updateUser = useUpdateUser();

  if (!user || user.pet.stage === user.pet.celebratedStage) return null;

  const { stage } = user.pet;
  const rule = GROWTH_RULES[stage];

  return {
    petName: user.pet.name,
    appearance: appearanceFor(
      user.pet.species,
      user.pet.color,
      user.pet.pattern,
    ),
    stage,
    reason: {
      periods: rule.periods,
      goalsReached: rule.goalsReached,
      plansKept: rule.plansKept,
    },
    confirm: () => {
      updateUser((current) => celebrateStage(current));
      router.replace(destination);
    },
  };
};

export type { PetGrewController };
