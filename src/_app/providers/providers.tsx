import type { ReactNode } from 'react';

import { QueryClientProvider } from '@tanstack/react-query';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { FeedbackHost } from '@/features/feedback';

import { useIsMotionEnabled } from '@/entities/settings';
import { useUserStore } from '@/entities/user';

import { queryClient } from '@/shared/api';
import { useAppLanguage } from '@/shared/hooks';
import {
  bindHapticsSoundGate,
  realTimeSource,
  TimeSourceContext,
} from '@/shared/lib';
import { MotionEnabledProvider } from '@/shared/model';
import { Toaster } from '@/shared/ui';

import '@/shared/i18n';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface ProvidersProps {
  children?: ReactNode;
}

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

const AccessibilityBridge = ({ children }: { children: ReactNode }) => {
  const isMotionEnabled = useIsMotionEnabled();

  // Shared haptics must not import the user store — FSD; gate is bound here.
  bindHapticsSoundGate(
    () => useUserStore.getState().user?.settings.isSoundEnabled ?? true,
  );

  return (
    <MotionEnabledProvider isEnabled={isMotionEnabled}>
      {children}
    </MotionEnabledProvider>
  );
};

/**
 * App shell. TimeSource is only for wallet / content stamps — the period
 * engine never reads it (0.3-R).
 */
export const Providers = ({ children }: ProvidersProps) => {
  useAppLanguage();

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <TimeSourceContext.Provider value={realTimeSource}>
            <AccessibilityBridge>
              {children}

              <FeedbackHost />
              <Toaster />
            </AccessibilityBridge>
          </TimeSourceContext.Provider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});

export type { ProvidersProps };
