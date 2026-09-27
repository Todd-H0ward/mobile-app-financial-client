import { useState } from 'react';

import * as SplashScreen from 'expo-splash-screen';
import { StyleSheet, View } from 'react-native';

import { SPACING } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import { useTranslation } from '@/shared/i18n';

import { RingsBackdrop } from './rings-backdrop';
import { TerminalPanel } from './terminal-panel';
import { Text } from './text';

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/** Five cells, three lit: a boot scale with no percentages (screen 01). */
const BOOT_CELLS = [true, true, true, false, false];

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

/** The terminal switching on over the pit — the first look at the style. */
export const SplashOverlay = () => {
  const [isVisible, setIsVisible] = useState(true);
  const theme = useTheme();
  const { t } = useTranslation();
  if (!isVisible) return null;
  return (
    <View
      onLayout={() => {
        void SplashScreen.hideAsync()
          .catch(() => {})
          .finally(() => setIsVisible(false));
      }}
      style={styles.root}
    >
      <RingsBackdrop centerY={0.5} />
      <TerminalPanel frameStyle={styles.frame} style={styles.screen}>
        <Text variant="display" style={styles.title}>
          {t('app.name')}
        </Text>
        <Text variant="machine">{`> ${t('app.booting')}`}</Text>
        <View style={styles.cells}>
          {BOOT_CELLS.map((isLit, index) => (
            <View
              key={index}
              style={[
                styles.cell,
                {
                  backgroundColor: isLit ? theme.phosphor : theme.surfaceSoft,
                },
              ]}
            />
          ))}
        </View>
      </TerminalPanel>
      <Text variant="code" themeColor="textDisabled" style={styles.offline}>
        {t('app.offline')}
      </Text>
    </View>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  cell: { height: 10, width: 18 },
  cells: { flexDirection: 'row', gap: 3 },
  frame: { width: 300 },
  offline: { bottom: SPACING.SIX, fontSize: 12, position: 'absolute' },
  root: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  screen: {
    alignItems: 'center',
    gap: SPACING.COMPACT,
    paddingVertical: SPACING.SIX,
  },
  title: { fontSize: 38, lineHeight: 44 },
});
