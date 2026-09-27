import type { ReactNode } from 'react';

import {
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MAX_CONTENT_WIDTH, SPACING } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import { RingsBackdrop, TerminalPanel } from '@/shared/ui';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface RobotTerminalProps {
  children: ReactNode;
  hero?: ReactNode;
  variant?: 'welcome' | 'diagnosis' | 'finale' | 'equipment';
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

const HERO_HEIGHT = {
  welcome: 220,
  diagnosis: 150,
  finale: 280,
  equipment: 260,
};

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

/** Keeps the terminal usable in landscape and with enlarged text. */
export const RobotTerminal = ({
  children,
  hero,
  variant = 'diagnosis',
}: RobotTerminalProps) => {
  const theme = useTheme();
  const { height } = useWindowDimensions();
  const heroHeight = Math.min(HERO_HEIGHT[variant], Math.max(0, height - 460));
  return (
    <View style={[styles.root, { backgroundColor: theme.sceneBase }]}>
      <RingsBackdrop
        centerY={0.3}
        variant={variant === 'finale' ? 'surface' : 'pit'}
      />
      <SafeAreaView style={styles.safe}>
        <View style={[styles.hero, { height: heroHeight }]}>{hero}</View>
        <TerminalPanel frameStyle={styles.frame} style={styles.panel}>
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
        </TerminalPanel>
      </SafeAreaView>
    </View>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  content: { flexGrow: 1, gap: SPACING.COMPACT, padding: SPACING.THREE },
  frame: {
    flex: 1,
    maxWidth: MAX_CONTENT_WIDTH + SPACING.THREE,
    width: '100%',
  },
  hero: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    width: '100%',
  },
  panel: { flex: 1 },
  root: { flex: 1 },
  safe: { alignItems: 'center', flex: 1, padding: SPACING.TWO },
});

export type { RobotTerminalProps };
