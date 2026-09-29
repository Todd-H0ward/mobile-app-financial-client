import { useLocalSearchParams, useRouter } from 'expo-router';

import {
  ROBOT_DOG_STAGES,
  type RobotDogStage,
  stageTransition,
} from '@/entities/robot-dog';
import { useUser } from '@/entities/user';

import { DYNAMIC_ROUTES, STATIC_ROUTES } from '@/shared/constants';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

type StageUpNext = 'home' | 'plan';

interface StageUpController {
  /** Stage just earned — never `basic`. */
  stage: Exclude<RobotDogStage, 'basic'>;
  robotName: string;
  continueNext: () => void;
}

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

const isStage = (value: unknown): value is RobotDogStage =>
  typeof value === 'string' &&
  (ROBOT_DOG_STAGES as readonly string[]).includes(value);

const isNext = (value: unknown): value is StageUpNext =>
  value === 'home' || value === 'plan';

// ═══════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════

/** Celebration after `endPeriod` raised the build stage (2.5.10). */
export const useStageUp = (): StageUpController | null => {
  const router = useRouter();
  const user = useUser();
  const params = useLocalSearchParams<{ stage?: string; next?: string }>();

  if (!user) return null;

  const stage = isStage(params.stage)
    ? stageTransition('basic', params.stage)
    : stageTransition('basic', user.robot.stage);

  if (!stage || user.robot.stage !== stage) return null;

  const destination: StageUpNext = isNext(params.next) ? params.next : 'home';

  return {
    stage,
    robotName: user.robot.name,
    continueNext: () => {
      router.dismissTo(
        destination === 'plan'
          ? DYNAMIC_ROUTES.watcher('keeper', 'plan')
          : STATIC_ROUTES.HOME,
      );
    },
  };
};

export type { StageUpController, StageUpNext };
