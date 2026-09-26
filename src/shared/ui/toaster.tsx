import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Toaster as SonnerToaster, toast as sonnerToast } from 'sonner-native';

import { SPACING } from '@/shared/constants';

import { Toast, type ToastVariant } from './toast';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface ToastOptions {
  variant?: ToastVariant;
  duration?: number;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

const DEFAULT_DURATION = 2500;
const MAX_VISIBLE = 3;

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

export const toast = (message: string, options: ToastOptions = {}) => {
  const { variant = 'dark', duration = DEFAULT_DURATION } = options;
  const handle: { id?: string | number } = {};

  handle.id = sonnerToast.custom(
    <Toast
      variant={variant}
      onPress={() => {
        if (handle.id != null) sonnerToast.dismiss(handle.id);
      }}
    >
      {message}
    </Toast>,
    {
      duration: duration === 0 ? Number.POSITIVE_INFINITY : duration,
    },
  );

  return handle.id;
};

export const dismissToast = (id: string | number) => sonnerToast.dismiss(id);
export const clearToasts = () => sonnerToast.dismiss();

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

export const Toaster = () => {
  const insets = useSafeAreaInsets();
  return (
    <SonnerToaster
      position="bottom-center"
      offset={insets.bottom + SPACING.three}
      duration={DEFAULT_DURATION}
      visibleToasts={MAX_VISIBLE}
      gap={8}
      swipeToDismissDirection="up"
      unstyled
      style={styles.toast}
      positionerStyle={styles.positioner}
    />
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  positioner: {
    paddingHorizontal: SPACING.three,
  },
  toast: {
    width: '100%',
  },
});

export type { ToastOptions };
