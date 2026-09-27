import { useRouter } from 'expo-router';

import {
  compare,
  pickRecoveryOptions,
  type RecoveryDestination,
  type RecoveryOption,
} from '@/entities/budget';
import { endPeriod, useCommitUser, useUser } from '@/entities/user';

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

const routeFor = (destination: RecoveryDestination) =>
  destination === 'budgetPlan'
    ? DYNAMIC_ROUTES.watcher('keeper', 'plan')
    : STATIC_ROUTES.HOME;

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
  const commitUser = useCommitUser();

  if (user?.period.phase !== 'summary') return null;

  const rows = compare(user.period.plan, user.period.fact);
  const options = pickRecoveryOptions(rows);

  const settleAndGo = (destination: RecoveryDestination) => {
    if (!commitUser(user, endPeriod(user))) return;

    // Pop summary/recovery off the stack onto the one arena, never a second
    // copy of it: a pushed home would build another 3D scene on top, and
    // Back would reopen a stale summary that redirects home.
    router.dismissTo(routeFor(destination));
  };

  return {
    periodIndex: user.period.index,
    options,
    choose: (option) => settleAndGo(option.destination),
    skip: () => settleAndGo('home'),
  };
};

export type { RecoveryController };
