import { useUserStore } from '@/entities/user';

import { useReducedMotion } from '@/shared/hooks';
import { useLanguagePreference } from '@/shared/model';

// ═══════════════════════════════════════════
// SELECTORS
// ═══════════════════════════════════════════

/** Saved animation switch — settings UI only. */
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

// ═══════════════════════════════════════════
// MAIN HOOK
// ═══════════════════════════════════════════

export const useSettings = () => ({
  languagePreference: useLanguagePreference(),
  isAnimationEnabled: useIsAnimationEnabled(),
  isMotionEnabled: useIsMotionEnabled(),
  isSoundEnabled: useIsSoundEnabled(),
  isDemoMode: useIsDemoMode(),
  isParentGateEnabled: useIsParentGateEnabled(),
});
