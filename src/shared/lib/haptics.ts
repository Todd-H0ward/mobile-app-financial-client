import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// ═══════════════════════════════════════════
// SOUND GATE
// ═══════════════════════════════════════════

/** Bound from Providers — shared must not import the user store. */
let isSoundAllowed = (): boolean => true;

export const bindHapticsSoundGate = (gate: () => boolean): void => {
  isSoundAllowed = gate;
};

// ═══════════════════════════════════════════
// HAPTICS
// ═══════════════════════════════════════════

/** Success buzz; silent when sound is off (haptics share that switch for now). */
export const hapticSuccess = (): void => {
  if (Platform.OS === 'web' || !isSoundAllowed()) return;

  void Haptics.notificationAsync(
    Haptics.NotificationFeedbackType.Success,
  ).catch(() => {
    // Native module missing — ignore.
  });
};

export const hapticLight = (): void => {
  if (Platform.OS === 'web' || !isSoundAllowed()) return;

  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {
    // Native module missing — ignore.
  });
};
