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

/** Saved liquid-glass switch — settings UI and GlassEnabledProvider. */
export const useIsGlassEnabled = () =>
  useUserStore((state) => state.user?.settings.isGlassEnabled ?? true);

export const useIsDemoMode = () =>
  useUserStore((state) => state.user?.settings.isDemoMode ?? false);

export const useIsParentGateEnabled = () =>
  useUserStore((state) => state.user?.settings.isParentGateEnabled ?? true);

/** Camera-rig overlay on the arena — off unless the grown-up turns it on. */
export const useIsCameraRigEnabled = () =>
  useUserStore((state) => state.user?.settings.isCameraRigEnabled ?? false);

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
  isGlassEnabled: useIsGlassEnabled(),
  isDemoMode: useIsDemoMode(),
  isParentGateEnabled: useIsParentGateEnabled(),
  isCameraRigEnabled: useIsCameraRigEnabled(),
  robotSkin: useRobotSkin(),
  robotAction: useRobotAction(),
});
