import { useRouter } from 'expo-router';

import {
  compare,
  pickRecoveryOptions,
  type RecoveryDestination,
  type RecoveryOption,
} from '@/entities/budget';
import { stageTransition } from '@/entities/robot-dog';
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

/** Recovery path after the period summary — pick a next step, never wipe progress (2.5.9 / roadmap 1.19) */
export const useRecovery = (): RecoveryController | null => {
  const router = useRouter();
  const user = useUser();
  const commitUser = useCommitUser();

  if (user?.period.phase !== 'summary') return null;

  const rows = compare(user.period.plan, user.period.fact);
  const options = pickRecoveryOptions(rows);

  const settleAndGo = (destination: RecoveryDestination) => {
    const settled = endPeriod(user);
    if (!commitUser(user, settled)) return;

    const gained = stageTransition(user.robot.stage, settled.robot.stage);
    if (gained) {
      // replace — recovery is done; the ritual sits where the tip was.
      router.replace(
        DYNAMIC_ROUTES.stageUp(
          gained,
          destination === 'budgetPlan' ? 'plan' : 'home',
        ),
      );
      return;
    }

    // dismissTo, not push — a second home would mount another 3D scene.
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
