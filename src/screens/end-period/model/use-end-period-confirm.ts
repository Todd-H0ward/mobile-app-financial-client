import { useRouter } from 'expo-router';

import {
  areNeedsMet,
  canFinishPeriod,
  finishPeriod,
  useCommitUser,
  useUser,
} from '@/entities/user';

import { STATIC_ROUTES } from '@/shared/constants';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface EndPeriodConfirmController {
  periodIndex: number;
  /** Soft warn when planned needs are not covered — never a block. */
  isNeedsShort: boolean;
  /** How many need-coins are still missing from the plan (0 when covered). */
  needsGap: number;
  /** Freeze the period and open plan-vs-fact. */
  confirm: () => void;
}

// ═══════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════

/**
 * Confirm screen before `finishPeriod` — soft warning only (0.3-R / 2.5.5).
 *
 * Settlement (`endPeriod`) still runs later from recovery after the child
 * reads the summary.
 */
export const useEndPeriodConfirm = (): EndPeriodConfirmController | null => {
  const router = useRouter();
  const user = useUser();
  const commitUser = useCommitUser();

  if (!user || !canFinishPeriod(user)) return null;

  const needsGap = Math.max(0, user.period.plan.needs - user.period.fact.needs);

  return {
    periodIndex: user.period.index,
    isNeedsShort: !areNeedsMet(user),
    needsGap,
    confirm: () => {
      if (!commitUser(user, finishPeriod(user))) return;
      router.replace(STATIC_ROUTES.PERIOD_SUMMARY);
    },
  };
};

export type { EndPeriodConfirmController };
