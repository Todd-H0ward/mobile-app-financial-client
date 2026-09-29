import { useEffect, useState } from 'react';

import * as SplashScreen from 'expo-splash-screen';
import { StyleSheet, View } from 'react-native';

import { useTranslation } from '@/shared/i18n';

import { LoadingArtwork } from './loading-artwork';

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════
export const SplashOverlay = () => {
  const [isVisible, setVisible] = useState(true);
  const { t } = useTranslation();
  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 1400);
    return () => clearTimeout(timer);
  }, []);
  if (!isVisible) return null;
  return (
    <View
      style={styles.root}
      onLayout={() => {
        void SplashScreen.hideAsync().catch(() => {});
      }}
    >
      <LoadingArtwork status={t('app.booting')} />
    </View>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════
const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFill, zIndex: 1000 },
});
