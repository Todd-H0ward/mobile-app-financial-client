import {
  DEFAULT_ROBOT_DOG_ACTION,
  DEFAULT_ROBOT_DOG_SKIN,
  type RobotDogAction,
  type RobotDogSkin,
} from '@/entities/robot-dog';

import { useReducedMotion } from '@/shared/hooks';
import { useLanguagePreference } from '@/shared/model';

import { useUserStore } from './store';

// ═══════════════════════════════════════════
// SELECTORS
// ═══════════════════════════════════════════

/** Saved animation switch — settings UI and motion gates. */
export const useIsAnimationEnabled = () =>
  useUserStore((state) => state.user?.settings.isAnimationEnabled ?? true);

/** Runtime motion: user switch on and system Reduce Motion off. */
export const useIsMotionEnabled = (): boolean => {
  const isPreferred = useIsAnimationEnabled();
  const isReduced = useReducedMotion();
  return isPreferred && !isReduced;
};

export const useIsSoundEnabled = () =>
  useUserStore((state) => state.user?.settings.isSoundEnabled ?? true);

export const useIsDemoMode = () =>
  useUserStore((state) => state.user?.settings.isDemoMode ?? false);

export const useIsParentGateEnabled = () =>
  useUserStore((state) => state.user?.settings.isParentGateEnabled ?? true);

/** The coat the robot dog wears on the home screen. */
export const useRobotSkin = (): RobotDogSkin =>
  useUserStore(
    (state) => state.user?.settings.robotSkin ?? DEFAULT_ROBOT_DOG_SKIN,
  );

/** What the dog does when nothing interrupts it. */
export const useRobotAction = (): RobotDogAction =>
  useUserStore(
    (state) => state.user?.settings.robotAction ?? DEFAULT_ROBOT_DOG_ACTION,
  );

// ═══════════════════════════════════════════
// MAIN HOOK
// ═══════════════════════════════════════════

/** Convenience bundle for screens that need several switches at once. */
export const useSettings = () => ({
  languagePreference: useLanguagePreference(),
  isAnimationEnabled: useIsAnimationEnabled(),
  isMotionEnabled: useIsMotionEnabled(),
  isSoundEnabled: useIsSoundEnabled(),
  isDemoMode: useIsDemoMode(),
  isParentGateEnabled: useIsParentGateEnabled(),
  robotSkin: useRobotSkin(),
  robotAction: useRobotAction(),
});
