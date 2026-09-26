import type { ReactNode } from 'react';

import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { FeedbackHost } from '@/features/feedback';

import {
  useIsGlassEnabled,
  useIsMotionEnabled,
  useUserStore,
} from '@/entities/user';

import { useAppLanguage, useReducedTransparency } from '@/shared/hooks';
import {
  bindHapticsSoundGate,
  realTimeSource,
  TimeSourceContext,
} from '@/shared/lib';
import { GlassEnabledProvider, MotionEnabledProvider } from '@/shared/model';
import { Toaster } from '@/shared/ui';

import '@/shared/i18n';
import { GameAudio } from './game-audio';
import { StorageRecovery } from './storage-recovery';

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
  const isGlassPreferred = useIsGlassEnabled();
  const isTransparencyReduced = useReducedTransparency();
  const isGlassEnabled = isGlassPreferred && !isTransparencyReduced;

  // Shared haptics must not import the user store — FSD; gate is bound here.
  bindHapticsSoundGate(
    () => useUserStore.getState().user?.settings.isSoundEnabled ?? true,
  );

  return (
    <MotionEnabledProvider isEnabled={isMotionEnabled}>
      <GlassEnabledProvider isEnabled={isGlassEnabled}>
        {children}
      </GlassEnabledProvider>
    </MotionEnabledProvider>
  );
};

/**
 * App shell. TimeSource is only for wallet / content stamps — the period
 * engine never reads it (0.3-R). Offline by design: no QueryClient / axios.
 */
export const Providers = ({ children }: ProvidersProps) => {
  useAppLanguage();

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <TimeSourceContext.Provider value={realTimeSource}>
          <AccessibilityBridge>
            <StorageRecovery>
              {children}

              <GameAudio />
              <FeedbackHost />
              <Toaster />
            </StorageRecovery>
          </AccessibilityBridge>
        </TimeSourceContext.Provider>
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
