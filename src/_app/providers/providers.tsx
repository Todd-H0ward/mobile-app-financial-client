import type { ReactNode } from 'react';

import { QueryClientProvider } from '@tanstack/react-query';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { queryClient } from '@/shared/api';
import { useAppLanguage } from '@/shared/hooks';
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

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          {children}

          <Toaster />
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
