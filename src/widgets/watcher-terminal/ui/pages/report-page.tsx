import { type Href, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { buildPeriodReport, useUser } from '@/entities/user';

import { SPACING, STATIC_ROUTES } from '@/shared/constants';
import { useTranslation } from '@/shared/i18n';
import { formatMoney } from '@/shared/utils';

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

/**
 * Live period ledger inside the Keeper terminal.
 *
 * Charge / modules / jar fill as the child plays. Settlement screen opens
 * from here when the phase is `summary`.
 */
export const ReportPage = ({ onBack }: ReportPageProps) => {
  const { t } = useTranslation();
  const router = useRouter();
  const user = useUser();

  if (!user) {
    return (
      <View style={styles.stack}>
        <TerminalMenuRow label={t('watcher.terminal.back')} onPress={onBack} />
      </View>
    );
  }

  const report = buildPeriodReport(user);
  const isSummary = user.period.phase === 'summary';
  const savingsGap = Math.max(0, report.plan.savings - report.fact.savings);
  const isSlipping =
    user.period.phase === 'active' &&
    (report.fact.needs < report.plan.needs * 0.5 ||
      report.fact.wants > report.plan.wants);

  return (
    <View style={styles.stack}>
      <TerminalText>
        {t('watcher.terminal.report.period', { index: report.periodIndex })}
      </TerminalText>
      <TerminalRule />
      <TerminalText isDim>
        {t('watcher.terminal.report.earned', {
          count: formatMoney(report.earned),
        })}
      </TerminalText>
      <TerminalText isDim>
        {t('watcher.terminal.report.charge', {
          fact: formatMoney(report.spentOnCharge),
          plan: formatMoney(report.plan.needs),
        })}
      </TerminalText>
      <TerminalText isDim>
        {t('watcher.terminal.report.modules', {
          fact: formatMoney(report.spentOnModules),
          plan: formatMoney(report.plan.wants),
        })}
      </TerminalText>
      <TerminalText isDim>
        {t('watcher.terminal.report.saved', {
          fact: formatMoney(report.savedAmount),
          plan: formatMoney(report.plan.savings),
        })}
      </TerminalText>
      <TerminalText isDim>
        {t('watcher.terminal.report.wallet', {
          count: formatMoney(user.wallet.balance),
        })}
      </TerminalText>
      {savingsGap > 0 ? (
        <TerminalText isDim>
          {t('watcher.terminal.report.jarLeft', {
            count: formatMoney(savingsGap),
          })}
        </TerminalText>
      ) : null}
      {isSlipping ? (
        <>
          <TerminalRule />
          <TerminalText>
            {t('watcher.terminal.report.supportBody')}
          </TerminalText>
        </>
      ) : null}
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
      {isSlipping ? (
        <TerminalMenuRow
          label={t('watcher.terminal.report.openPlan')}
          onPress={() => router.push(STATIC_ROUTES.BUDGET_PLAN as Href)}
        />
      ) : null}
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
