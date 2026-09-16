import { Redirect } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { HintButton } from '@/widgets/hint-button';

import { ROUTES, SPACING } from '@/shared/constants';
import { useTranslation } from '@/shared/i18n';
import { Button, Card, Screen, Text } from '@/shared/ui';

import { usePeriodSummary } from '../model';

import { ComparisonRow } from './comparison-row';

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

/**
 * Plan vs fact for the period that just ended — 2.5.5 / roadmap 1.11.
 *
 * Three parts from docs/budget.md: the comparison, a story that ties the
 * deltas together, and a recovery path (2.5.9) with no shame and no wipe.
 */
export const PeriodSummaryScreen = () => {
  const { t } = useTranslation();
  const summary = usePeriodSummary();

  if (!summary) {
    return <Redirect href={ROUTES.HOME} />;
  }

  const directionName = (id: string) => t(`budgetPlan.directions.${id}.title`);

  const overList = summary.explain.overspent.map(directionName).join(', ');
  const underList = summary.explain.underspent.map(directionName).join(', ');

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

      <Card>
        <Card.Content>
          <Text variant="bodyBold">{t('periodSummary.nextPeriod')}</Text>
          {summary.explain.tipKeys.map((tip) => (
            <Text key={tip} themeColor="textSecondary">
              · {t(`periodSummary.tips.${tip}`)}
            </Text>
          ))}
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
  rows: {
    gap: SPACING.two,
  },
});
