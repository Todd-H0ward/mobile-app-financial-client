import { useUserStore } from '@/entities/user';

import { useLanguagePreference } from '@/shared/model';

// ═══════════════════════════════════════════
// SELECTORS
// ═══════════════════════════════════════════

/** Animations on, unless the grown-up turned them off. Default `true` with no profile. */
export const useIsAnimationEnabled = () =>
  useUserStore((state) => state.user?.settings.isAnimationEnabled ?? true);

/** Sound on, unless the grown-up turned it off. Default `true` with no profile. */
export const useIsSoundEnabled = () =>
  useUserStore((state) => state.user?.settings.isSoundEnabled ?? true);

/** Whether demo mode is playing. Default `false` with no profile. */
export const useIsDemoMode = () =>
  useUserStore((state) => state.user?.settings.isDemoMode ?? false);

/** Arithmetic gate in front of the parents' section. Default `true` with no profile. */
export const useIsParentGateEnabled = () =>
  useUserStore((state) => state.user?.settings.isParentGateEnabled ?? true);

// ═══════════════════════════════════════════
// MAIN HOOK
// ═══════════════════════════════════════════

/**
 * Convenience read for the settings screen and widgets that show a value
 * without being a feature themselves.
 *
 * Write-side actions come through dedicated features: `change-language` for
 * the language, `useUpdateUser` for the booleans.
 */
export const useSettings = () => ({
  languagePreference: useLanguagePreference(),
  isAnimationEnabled: useIsAnimationEnabled(),
  isSoundEnabled: useIsSoundEnabled(),
  isDemoMode: useIsDemoMode(),
  isParentGateEnabled: useIsParentGateEnabled(),
});
