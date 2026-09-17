import { useRouter } from 'expo-router';

import {
  compare,
  pickRecoveryOptions,
  type RecoveryDestination,
  type RecoveryOption,
} from '@/entities/budget';
import { acknowledgeSummary, useUpdateUser, useUser } from '@/entities/user';

import { ROUTES } from '@/shared/constants';
import { useTimeSource } from '@/shared/lib';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface RecoveryController {
  /** Period that just ended — for the title. */
  periodIndex: number;
  /** One or two choosable next steps. */
  options: RecoveryOption[];
  /** Settle and open the chosen destination. */
  choose: (option: RecoveryOption) => void;
  /** Soft exit — settle and go home without picking a tip. */
  skip: () => void;
}

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

const routeFor = (destination: RecoveryDestination) => {
  if (destination === 'budgetPlan') return ROUTES.BUDGET_PLAN;
  return ROUTES.HOME;
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
  const time = useTimeSource();
  const user = useUser();
  const updateUser = useUpdateUser();

  if (user?.period.phase !== 'summary') return null;

  const rows = compare(user.period.plan, user.period.fact);
  const options = pickRecoveryOptions(rows);

  const settleAndGo = (destination: RecoveryDestination) => {
    updateUser((current) => acknowledgeSummary(current, time));
    router.replace(routeFor(destination));
  };

  return {
    periodIndex: user.period.index,
    options,
    choose: (option) => settleAndGo(option.destination),
    skip: () => settleAndGo('home'),
  };
};

export type { RecoveryController };
