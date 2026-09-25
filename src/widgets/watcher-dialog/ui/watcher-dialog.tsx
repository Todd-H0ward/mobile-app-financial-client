import type { ReactNode } from 'react';

import { type Href, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import type { WatcherId, WatcherLine } from '@/entities/watcher';

import { FONTS, RADII, SPACING } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import { useTranslation } from '@/shared/i18n';
import { Button, Text } from '@/shared/ui';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface WatcherDialogProps {
  /** Which AI is speaking. */
  watcher: WatcherId;
  /** Line already picked for the current game state. */
  line: WatcherLine;
  /** Closes the dialogue and returns to the map. */
  onLeave: () => void;
  /** Optional footer slot under the action row. */
  children?: ReactNode;
}

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

/**
 * Terminal-styled dialogue panel for the Overseer and the Keeper.
 *
 * Owns navigation for the line's action buttons; the screen decides which
 * line to show and when to dismiss.
 */
export const WatcherDialog = ({
  watcher,
  line,
  onLeave,
  children,
}: WatcherDialogProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: theme.arcadeScreen,
          borderColor: theme.arcadeScreenGlow,
        },
      ]}
      accessibilityRole="summary"
    >
      <Text style={styles.label} themeColor="arcadeLcdDim">
        {t('watcher.terminal.label', {
          name: t(`scene.watchers.${watcher}.name`),
        })}
      </Text>
      <Text variant="bodyBold" themeColor="arcadeLcd">
        {t(`scene.watchers.${watcher}.name`)}
      </Text>
      <Text themeColor="arcadeLcd" style={styles.line}>
        {`> ${t(line.textKey)}`}
      </Text>
      <View style={styles.actions}>
        {line.actions.map((action) => (
          <Button
            key={action.route}
            style={styles.action}
            onPress={() => router.push(action.route as Href)}
          >
            {t(action.labelKey)}
          </Button>
        ))}
        <Button style={styles.action} variant="secondary" onPress={onLeave}>
          {t('scene.watcherLeave')}
        </Button>
      </View>
      {children}
    </View>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  action: { flex: 1 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.two },
  label: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  line: {
    fontFamily: FONTS.mono,
    fontSize: 14,
    lineHeight: 20,
  },
  root: {
    borderRadius: RADII.m,
    borderWidth: 1,
    gap: SPACING.one,
    padding: SPACING.two,
  },
});
