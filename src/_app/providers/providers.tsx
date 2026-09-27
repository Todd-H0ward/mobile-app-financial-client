import type { ReactNode } from 'react';

import { useFonts } from 'expo-font';
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
  bindSfxSoundGate,
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

  // Shared haptics / sfx must not import the user store — FSD; gate is bound here.
  const soundGate = () =>
    useUserStore.getState().user?.settings.isSoundEnabled ?? true;
  bindHapticsSoundGate(soundGate);
  bindSfxSoundGate(soundGate);

  return (
    <MotionEnabledProvider isEnabled={isMotionEnabled}>
      <GlassEnabledProvider isEnabled={isGlassEnabled}>
        {children}
      </GlassEnabledProvider>
    </MotionEnabledProvider>
  );
};

/** TimeSource for wallet/content stamps only (0.3-R); offline — no QueryClient. */
export const Providers = ({ children }: ProvidersProps) => {
  useAppLanguage();
  const [areFontsLoaded, fontError] = useFonts({
    GolosText: require('@/assets/fonts/GolosText-400.ttf'),
    'GolosText-Semibold': require('@/assets/fonts/GolosText-600.ttf'),
    'GolosText-Bold': require('@/assets/fonts/GolosText-700.ttf'),
    MartianMono: require('@/assets/fonts/MartianMono-400.ttf'),
    'MartianMono-Semibold': require('@/assets/fonts/MartianMono-600.ttf'),
  });

  // Keep the native splash until local fonts are ready; a load error must not trap startup.
  if (!areFontsLoaded && !fontError) return null;

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
