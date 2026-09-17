import { useRouter } from 'expo-router';

import {
  compare,
  pickRecoveryOptions,
  type RecoveryDestination,
  type RecoveryOption,
} from '@/entities/budget';
import {
  endPeriod,
  hasPendingGrowth,
  useUpdateUser,
  useUser,
} from '@/entities/user';

import { DYNAMIC_ROUTES, STATIC_ROUTES } from '@/shared/constants';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface RecoveryController {
    periodIndex: number;
    options: RecoveryOption[];
    choose: (option: RecoveryOption) => void;
  /** Soft exit — settle and go home without picking a tip. */
  skip: () => void;
}

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

const routeFor = (destination: RecoveryDestination) => {
  if (destination === 'budgetPlan') return STATIC_ROUTES.BUDGET_PLAN;
  return STATIC_ROUTES.HOME;
};

// ═══════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════

/**
 * Recovery path after the period summary — pick a next step, never wipe
 * progress (2.5.9 / roadmap 1.19).
 */
export const useRecovery = (): RecoveryController | null => {
  const router = useRouter();
  const user = useUser();
  const updateUser = useUpdateUser();

  if (user?.period.phase !== 'summary') return null;

  const rows = compare(user.period.plan, user.period.fact);
  const options = pickRecoveryOptions(rows);

  const settleAndGo = (destination: RecoveryDestination) => {
    // Computed once, outside `updateUser`: the route decision needs the
    // settled save, and `updateUser`'s producer has no return value to read.
    const settled = endPeriod(user);
    updateUser(() => settled);

    const next = hasPendingGrowth(settled)
      ? DYNAMIC_ROUTES.petGrew(routeFor(destination))
      : routeFor(destination);

    // Pop summary/recovery off the stack first. `replace` alone left those
    // screens underneath budget-plan, so Back reopened a stale summary that
    // Redirects to home — looks like the back button is broken.
    if (router.canDismiss()) {
      router.dismissTo(STATIC_ROUTES.HOME);
    }
    if (next === STATIC_ROUTES.HOME) return;
    router.push(next);
  };

  return {
    periodIndex: user.period.index,
    options,
    choose: (option) => settleAndGo(option.destination),
    skip: () => settleAndGo('home'),
  };
};

export type { RecoveryController };
