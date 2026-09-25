import { ScrollView, StyleSheet, View } from 'react-native';

import type { WatcherDialogAction, WatcherLine } from '@/entities/watcher';

import { useTranslation } from '@/shared/i18n';

import { TerminalMenuRow, TerminalRule, TerminalText } from '../terminal-shell';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface GreetingPageProps {
  line: WatcherLine;
  onAction: (action: WatcherDialogAction) => void;
}

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

export const GreetingPage = ({ line, onAction }: GreetingPageProps) => {
  const { t } = useTranslation();

  return (
    <ScrollView contentContainerStyle={styles.stack}>
      <TerminalText>{t(line.textKey)}</TerminalText>
      <TerminalRule />
      <View style={styles.stack}>
        {line.actions.map((action) => (
          <TerminalMenuRow
            key={
              action.kind === 'page'
                ? `page-${action.page}`
                : `route-${action.route}`
            }
            label={t(action.labelKey)}
            onPress={() => onAction(action)}
          />
        ))}
      </View>
    </ScrollView>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  stack: { gap: 8 },
});
