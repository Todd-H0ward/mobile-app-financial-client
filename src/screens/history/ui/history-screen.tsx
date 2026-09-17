import { StyleSheet, View } from 'react-native';

import { HintButton } from '@/widgets/hint-button';

import { SPACING } from '@/shared/constants';
import { useTranslation } from '@/shared/i18n';
import { Card, ListRow, Screen, Text } from '@/shared/ui';
import { formatMoney } from '@/shared/utils';

import { useHistory } from '../model';

import { WalletHistoryRowView } from './wallet-history-row';

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

/**
 * Period report + named wallet lines — 2.5.11 / roadmap 1.20.
 *
 * Last finished period gets plan/fact totals; every credit and spend shows
 * its source. Empty history is honest, not a blank screen.
 */
export const HistoryScreen = () => {
  const { t } = useTranslation();
  const history = useHistory();

  return (
    <Screen gap="three" isTabBarVisible={false}>
      <Screen.Header>
        <Screen.Back />
        <Screen.Heading>
          <Screen.Title>{t('history.title')}</Screen.Title>
          <Screen.Subtitle>{t('history.subtitle')}</Screen.Subtitle>
        </Screen.Heading>
        <HintButton screen="history" />
      </Screen.Header>

      <Card tone="surfaceSoft">
        <Card.Content>
          <Text variant="bodyBold">{t('history.lastPeriod')}</Text>
          {history.lastPeriod == null ? (
            <Text themeColor="textSecondary">{t('history.emptyPeriods')}</Text>
          ) : (
            <View style={styles.lastPeriod}>
              <Text themeColor="textSecondary">
                {t('history.periodLabel', {
                  period: history.lastPeriod.index,
                })}
              </Text>
              {history.lastRows.map((row) => (
                <Text key={row.direction} themeColor="textSecondary">
                  {t(`budgetPlan.directions.${row.direction}.title`)}
                  {': '}
                  {t('history.planFact', {
                    plan: formatMoney(row.planned),
                    fact: formatMoney(row.actual),
                  })}
                </Text>
              ))}
              {history.lastExplain ? (
                <Text themeColor="textSecondary">
                  {t(`periodSummary.story.${history.lastExplain.storyKey}`, {
                    over: history.lastExplain.overspent
                      .map((id) => t(`budgetPlan.directions.${id}.title`))
                      .join(', '),
                    under: history.lastExplain.underspent
                      .map((id) => t(`budgetPlan.directions.${id}.title`))
                      .join(', '),
                  })}
                </Text>
              ) : null}
            </View>
          )}
        </Card.Content>
      </Card>

      {history.periods.length > 0 ? (
        <View style={styles.section}>
          <Text variant="bodyBold">{t('history.allPeriods')}</Text>
          {history.periods.map((period) => (
            <ListRow
              key={period.index}
              title={t('history.periodLabel', { period: period.index })}
              subtitle={
                period.isPlanKept
                  ? t('history.planKept')
                  : t('history.planMissed')
              }
              trailing={
                period.reachedGoalIds.length > 0 ? (
                  <Text variant="small" themeColor="textMuted">
                    {t('history.goalsReached', {
                      count: period.reachedGoalIds.length,
                    })}
                  </Text>
                ) : null
              }
            />
          ))}
        </View>
      ) : null}

      <View style={styles.section}>
        <Text variant="bodyBold">{t('history.wallet')}</Text>
        {history.walletRows.length === 0 ? (
          <Text themeColor="textSecondary">{t('history.emptyWallet')}</Text>
        ) : (
          history.walletRows.map((row) => (
            <WalletHistoryRowView key={row.entry.id} row={row} />
          ))
        )}
      </View>
    </Screen>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  lastPeriod: {
    gap: SPACING.one,
  },
  section: {
    gap: SPACING.two,
  },
});
