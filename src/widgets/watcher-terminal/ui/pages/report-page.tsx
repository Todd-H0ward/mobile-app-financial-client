import { type Href, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { useUser } from '@/entities/user';

import { SPACING, STATIC_ROUTES } from '@/shared/constants';
import { useTranslation } from '@/shared/i18n';

import { TerminalMenuRow, TerminalRule, TerminalText } from '../terminal-shell';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface ReportPageProps {
  onBack: () => void;
}

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

export const ReportPage = ({ onBack }: ReportPageProps) => {
  const { t } = useTranslation();
  const router = useRouter();
  const user = useUser();
  const isSummary = user?.period.phase === 'summary';

  return (
    <View style={styles.stack}>
      <TerminalText>
        {isSummary
          ? t('watcher.terminal.report.summaryReady')
          : t('watcher.terminal.report.historyHint')}
      </TerminalText>
      <TerminalRule />
      {isSummary ? (
        <TerminalMenuRow
          label={t('action.period_summary')}
          onPress={() => router.push(STATIC_ROUTES.PERIOD_SUMMARY as Href)}
        />
      ) : null}
      <TerminalMenuRow
        label={t('action.history')}
        onPress={() => router.push(STATIC_ROUTES.HISTORY as Href)}
      />
      <TerminalMenuRow label={t('watcher.terminal.back')} onPress={onBack} />
    </View>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  stack: { gap: SPACING.two },
});
