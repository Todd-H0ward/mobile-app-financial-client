import { useState } from 'react';

import { useRouter } from 'expo-router';

import { BUDGET_DIRECTIONS, type BudgetDirection } from '@/entities/economy';
import {
  createSortingState,
  currentSortItem,
  getOnboardingStep,
  isSortingDone,
  ONBOARDING_STEPS,
  type OnboardingStepId,
  placeSortItem,
  type SortItemContent,
  type SortingState,
  type SortOutcome,
  sortingProgress,
} from '@/entities/onboarding';
import {
  isPlayerNameValid,
  normalizePlayerName,
  useCreateUser,
} from '@/entities/user';

import { ROUTES } from '@/shared/constants';
import { useTranslation } from '@/shared/i18n';
import { hapticSuccess, useTimeSource } from '@/shared/lib';

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/**
 * Coins of the rehearsal plan. Ten, not the real starting balance: the step
 * teaches the motion of splitting a sum, and ten is a number a seven-year-old
 * holds in their head. The real plan runs on the wallet — 2.5.5.
 */
const MINI_PLAN_COINS = 10;

/** An empty plan: nothing laid out yet. */
const EMPTY_PLAN: Record<BudgetDirection, number> = {
  needs: 0,
  wants: 0,
  savings: 0,
};

const ACTION_LABEL: Record<OnboardingStepId, string> = {
  greeting: 'Пойдём!',
  sorting: 'Дальше',
  coins: 'Дальше',
  plan: 'Готово',
  name: 'Играть',
};

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

/** Everything the onboarding screen and its steps read and call. */
interface OnboardingController {
  /** Step being shown. */
  stepId: OnboardingStepId;
  /** Heading of the step, from the content file. */
  title: string;
  /** The pet's line for this step. */
  line: string;
  /** Position in the walk, from 1. For the paw trail and the screen reader. */
  stepNumber: number;
  /** How many steps there are in total. */
  stepCount: number;
  /** Card in hand on the sorting step, `null` once the deck is out. */
  sortItem: SortItemContent | null;
  /** How the last card was placed — the pet explains it. `null` before the first. */
  lastOutcome: SortOutcome | null;
  /** Cards placed and cards in total: "3 из 6", never a countdown. */
  sortProgress: { done: number; total: number };
  /** The rehearsal plan, coins per direction. */
  plan: Record<BudgetDirection, number>;
  /** Coins not laid out yet. Leaving some is allowed — docs/budget.md. */
  planLeft: number;
  /** Coins the rehearsal plan hands out. */
  planTotal: number;
  /** What the child typed, unnormalized — the field shows it back verbatim. */
  playerName: string;
  /** Whether the greeting boop happened. */
  hasMetPet: boolean;
  /** Whether the scratch ticket is open. */
  isCoinsRevealed: boolean;
  /** Whether the bottom button is live on this step. */
  canContinue: boolean;
  /** Label of the bottom button on this step. */
  actionLabel: string;
  /** Puts the card in hand into a basket. A miss costs nothing. */
  placeItem: (direction: BudgetDirection) => void;
  /** Lays one coin into a direction. Ignored when nothing is left. */
  addCoin: (direction: BudgetDirection) => void;
  /** Takes one coin back. Ignored when that direction is empty. */
  removeCoin: (direction: BudgetDirection) => void;
  /** Types into the name field. */
  setPlayerName: (value: string) => void;
  /** Marks the greeting boop as done. */
  markPetMet: () => void;
  /** Marks the scratch ticket as revealed. */
  markCoinsRevealed: () => void;
  /** Moves on; on the last step it creates the profile and leaves onboarding. */
  goNext: () => void;
  /**
   * Soft back to the previous step. Hidden on greeting — there is nowhere to
   * go without abandoning the walk.
   */
  canGoBack: boolean;
  goBack: () => void;
}

// ═══════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════

/**
 * The walk itself: which step is open, what the child has sorted, laid out and
 * typed.
 *
 * Nothing is written to the save until the last step: the profile is created
 * once with the player name. The pet's look is chosen later, from the closed
 * box on home (2.5.2) — picking it twice felt like a bug.
 */
export const useOnboarding = (): OnboardingController => {
  const router = useRouter();
  const time = useTimeSource();
  const { t } = useTranslation();
  const createUser = useCreateUser();

  const [stepIndex, setStepIndex] = useState(0);
  const [sorting, setSorting] = useState<SortingState>(createSortingState);
  const [lastOutcome, setLastOutcome] = useState<SortOutcome | null>(null);
  const [plan, setPlan] = useState(EMPTY_PLAN);
  const [playerName, setPlayerName] = useState('');
  const [hasMetPet, setHasMetPet] = useState(false);
  const [isCoinsRevealed, setIsCoinsRevealed] = useState(false);

  const stepId = ONBOARDING_STEPS[stepIndex] ?? ONBOARDING_STEPS[0];
  const step = getOnboardingStep(stepId);

  const planLaidOut = BUDGET_DIRECTIONS.reduce(
    (total, direction) => total + plan[direction],
    0,
  );
  const planLeft = MINI_PLAN_COINS - planLaidOut;

  const canContinue =
    (stepId !== 'greeting' || hasMetPet) &&
    (stepId !== 'sorting' || isSortingDone(sorting)) &&
    (stepId !== 'coins' || isCoinsRevealed) &&
    (stepId !== 'name' || isPlayerNameValid(playerName));

  const finish = () => {
    createUser({
      playerName: normalizePlayerName(playerName),
      createdAt: time.now(),
    });

    hapticSuccess();
    router.replace(ROUTES.HOME);
  };

  return {
    stepId,
    title: t(`onboarding.steps.${stepId}.title`, {
      defaultValue: step?.title ?? '',
    }),
    line: t(`onboarding.steps.${stepId}.line`, {
      defaultValue: step?.line ?? '',
    }),
    stepNumber: stepIndex + 1,
    stepCount: ONBOARDING_STEPS.length,
    sortItem: currentSortItem(sorting),
    lastOutcome,
    sortProgress: sortingProgress(sorting),
    plan,
    planLeft,
    planTotal: MINI_PLAN_COINS,
    playerName,
    hasMetPet,
    isCoinsRevealed,
    canContinue,
    actionLabel: t(`onboarding.actions.${stepId}`, {
      defaultValue: ACTION_LABEL[stepId],
    }),

    placeItem: (direction) => {
      const outcome = placeSortItem(sorting, direction);
      if (!outcome) return;

      setSorting(outcome.state);
      setLastOutcome(outcome);
    },

    addCoin: (direction) => {
      if (planLeft <= 0) return;

      setPlan((current) => ({
        ...current,
        [direction]: current[direction] + 1,
      }));
    },

    removeCoin: (direction) => {
      setPlan((current) =>
        current[direction] === 0
          ? current
          : { ...current, [direction]: current[direction] - 1 },
      );
    },

    setPlayerName,
    markPetMet: () => setHasMetPet(true),
    markCoinsRevealed: () => setIsCoinsRevealed(true),

    goNext: () => {
      if (stepIndex === ONBOARDING_STEPS.length - 1) {
        finish();
        return;
      }

      setStepIndex(stepIndex + 1);
    },

    canGoBack: stepIndex > 0,
    goBack: () => {
      if (stepIndex === 0) return;
      setStepIndex(stepIndex - 1);
    },
  };
};

export type { OnboardingController };
export { MINI_PLAN_COINS };
