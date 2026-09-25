import { Redirect } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { HintButton } from '@/widgets/hint-button';
import { ComparisonRow } from '@/widgets/plan-fact-bars';

import { SPACING, STATIC_ROUTES } from '@/shared/constants';
import { useTranslation } from '@/shared/i18n';
import { Button, Card, Screen, Text } from '@/shared/ui';
import { formatMoney } from '@/shared/utils';

import { usePeriodSummary } from '../model';

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

/**
 * Plan vs fact for the period that just ended — 2.5.5 / roadmap 1.11.
 *
 * Comparison + story + Keeper line + robot readout; the recovery path
 * (2.5.9) is its own screen so the child can pick a concrete next step
 * without wiping progress.
 */
export const PeriodSummaryScreen = () => {
  const { t } = useTranslation();
  const summary = usePeriodSummary();

  if (!summary) {
    return <Redirect href={STATIC_ROUTES.HOME} />;
  }

  const directionName = (id: string) => t(`budgetPlan.directions.${id}.title`);

  const overList = summary.explain.overspent.map(directionName).join(', ');
  const underList = summary.explain.underspent.map(directionName).join(', ');
  const { report, keeperLine, goal } = summary;

  return (
    <Screen gap="three" isTabBarVisible={false}>
      <Screen.Header>
        <Screen.Heading>
          <Screen.Title>
            {t('periodSummary.title', { period: summary.periodIndex })}
          </Screen.Title>
          <Screen.Subtitle>{t('periodSummary.subtitle')}</Screen.Subtitle>
        </Screen.Heading>
        <HintButton screen="period-summary" />
      </Screen.Header>

      <Card tone="surfaceSoft">
        <Card.Content>
          <Text variant="bodyBold">{t('scene.watchers.keeper.name')}</Text>
          <Text themeColor="textSecondary">{t(keeperLine.textKey)}</Text>
        </Card.Content>
      </Card>

      <View style={styles.rows}>
        {summary.rows.map((row) => (
          <ComparisonRow
            key={row.direction}
            row={row}
            barMax={summary.barMax}
          />
        ))}
      </View>

      <Card tone="surfaceSoft">
        <Card.Content>
          <Text variant="bodyBold">{t('periodSummary.whatHappened')}</Text>
          <Text themeColor="textSecondary">
            {t(`periodSummary.story.${summary.explain.storyKey}`, {
              over: overList,
              under: underList,
            })}
          </Text>
        </Card.Content>
      </Card>

      <Card tone="surfaceSoft">
        <Card.Content style={styles.detail}>
          <Text variant="bodyBold">{t('periodSummary.detailTitle')}</Text>
          <Text themeColor="textSecondary">
            {t('periodSummary.earned', { count: formatMoney(report.earned) })}
          </Text>
          <Text themeColor="textSecondary">
            {t('periodSummary.spentCharge', {
              count: formatMoney(report.spentOnCharge),
            })}
          </Text>
          <Text themeColor="textSecondary">
            {t('periodSummary.spentModules', {
              count: formatMoney(report.spentOnModules),
            })}
          </Text>
          <Text themeColor="textSecondary">
            {t('periodSummary.saved', {
              count: formatMoney(report.savedAmount),
            })}
          </Text>
          <Text themeColor="textSecondary">
            {report.adjustment >= 0
              ? t('periodSummary.bonus', {
                  count: formatMoney(report.adjustment),
                })
              : t('periodSummary.penalty', {
                  count: formatMoney(Math.abs(report.adjustment)),
                })}
          </Text>
        </Card.Content>
      </Card>

      <Card tone="surfaceSoft">
        <Card.Content style={styles.detail}>
          <Text variant="bodyBold">{t('periodSummary.goalTitle')}</Text>
          {goal ? (
            <>
              <Text themeColor="textSecondary">
                {t(`savings.goals.${goal.goalId}.title`, {
                  defaultValue: goal.title,
                })}
              </Text>
              <Text themeColor="textSecondary">
                {t('periodSummary.goalProgress', {
                  saved: formatMoney(goal.saved),
                  price: formatMoney(goal.price),
                })}
              </Text>
              <Text themeColor="textSecondary">
                {t(
                  goal.isReached
                    ? 'periodSummary.goalReached'
                    : 'periodSummary.goalOpen',
                )}
              </Text>
            </>
          ) : (
            <Text themeColor="textSecondary">
              {t('periodSummary.goalNone')}
            </Text>
          )}
        </Card.Content>
      </Card>

      <Card tone="surfaceSoft">
        <Card.Content style={styles.detail}>
          <Text variant="bodyBold">{t('periodSummary.robotTitle')}</Text>
          <Text themeColor="textSecondary">
            {t('periodSummary.robotCharge', {
              value: Math.round(report.robotCharge * 100),
            })}
          </Text>
          <Text themeColor="textSecondary">
            {t('periodSummary.robotSpirit', {
              value: Math.round(report.robotSpirit * 100),
            })}
          </Text>
          <Text themeColor="textSecondary">
            {t('periodSummary.robotLevel', { level: report.level })}
          </Text>
          <Text themeColor="textSecondary">
            {t(`periodSummary.mood.${report.robotMood}`)}
          </Text>
        </Card.Content>
      </Card>

      <Button
        variant="primary"
        size="l"
        isFullWidth
        onPress={summary.continueNext}
        style={styles.button}
      >
        {t('periodSummary.continue')}
      </Button>
    </Screen>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  button: {
    marginTop: 'auto',
  },
  detail: {
    gap: SPACING.one,
  },
  rows: {
    gap: SPACING.two,
  },
});
