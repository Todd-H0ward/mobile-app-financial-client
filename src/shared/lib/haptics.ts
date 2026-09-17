import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// ═══════════════════════════════════════════
// HAPTICS
// ═══════════════════════════════════════════

/**
 * Light success buzz for kid-facing wins — purchase, chore done, plan
 * confirmed, pet met. Failures stay silent: no buzz for a soft warning.
 *
 * Rejections are swallowed on purpose: `notificationAsync` is async, so a
 * bare `try/catch` around `void …` never sees `UnavailabilityError` and the
 * red screen lands on the purchase / plan confirm instead.
 */
export const hapticSuccess = (): void => {
  if (Platform.OS === 'web') return;

  void Haptics.notificationAsync(
    Haptics.NotificationFeedbackType.Success,
  ).catch(() => {
    // Native module missing (simulator edge, mismatched SDK) — ignore.
  });
};

/** Softer tap for selects / steppers — optional, never required. */
export const hapticLight = (): void => {
  if (Platform.OS === 'web') return;

  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {
    // Same as success: feedback is optional.
  });
};
