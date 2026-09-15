import type { ReactNode } from 'react';
import { useMemo, useRef } from 'react';

import { QueryClientProvider } from '@tanstack/react-query';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useUser } from '@/entities/user';

import { queryClient } from '@/shared/api';
import { useAppLanguage } from '@/shared/hooks';
import {
  makeDemoTimeSource,
  realTimeSource,
  TimeSourceContext,
} from '@/shared/lib';
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

export const Providers = ({ children }: ProvidersProps) => {
  useAppLanguage();

  const user = useUser();
  const isDemoMode = user?.settings.isDemoMode ?? false;

  const demoSourceRef = useRef(makeDemoTimeSource());

  const timeSource = useMemo(
    () => (isDemoMode ? demoSourceRef.current : realTimeSource),
    [isDemoMode],
  );

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <TimeSourceContext.Provider value={timeSource}>
            {children}

            <Toaster />
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
