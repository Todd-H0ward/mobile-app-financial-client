import { Redirect } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { HintButton } from '@/widgets/hint-button';
import { ComparisonRow } from '@/widgets/plan-fact-bars';

import { FONTS, SPACING, STATIC_ROUTES } from '@/shared/constants';
import { useTranslation } from '@/shared/i18n';
import { Button, Card, ListGroup, Screen, Text } from '@/shared/ui';
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

  const directionName = (id: string) => t(`boxes.${id}`).toLocaleLowerCase();

  const overList = summary.explain.overspent.map(directionName).join(', ');
  const underList = summary.explain.underspent.map(directionName).join(', ');
  const { report, keeperLine, goal } = summary;

  const value = (text: string, tone?: 'phosphor' | 'warning') => (
    <Text
      variant={tone === 'phosphor' ? 'machine' : 'code'}
      themeColor={tone ?? 'text'}
      style={styles.value}
    >
      {text}
    </Text>
  );

  return (
    <Screen gap="compact" terminalVariant="keeper">
      <Screen.Header>
        <Screen.Heading>
          <Screen.Label>
            {t('periodSummary.label', { period: summary.periodIndex })}
          </Screen.Label>
          <Screen.Title>{t('periodSummary.heading')}</Screen.Title>
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

      <Card>
        <Text>
          {t(`periodSummary.story.${summary.explain.storyKey}`, {
            over: overList,
            under: underList,
          })}
        </Text>
        <Text variant="machine">{`> ${t('periodSummary.keeperLabel')}`}</Text>
        <Text themeColor="textSecondary">{t(keeperLine.textKey)}</Text>
      </Card>

      <ListGroup>
        <ListGroup.Item
          title={t('periodSummary.table.earned')}
          trailing={value(`+${formatMoney(report.earned)}`, 'phosphor')}
        />
        <ListGroup.Item
          title={t('periodSummary.table.charge')}
          trailing={value(formatMoney(report.spentOnCharge))}
        />
        <ListGroup.Item
          title={t('periodSummary.table.modules')}
          trailing={value(formatMoney(report.spentOnModules))}
        />
        <ListGroup.Item
          title={t('periodSummary.table.saved')}
          trailing={value(formatMoney(report.savedAmount))}
        />
        <ListGroup.Item
          title={
            report.adjustment >= 0
              ? t('periodSummary.table.bonus')
              : t('periodSummary.table.penalty')
          }
          trailing={
            report.adjustment >= 0
              ? value(`+${formatMoney(report.adjustment)}`, 'phosphor')
              : value(`−${formatMoney(Math.abs(report.adjustment))}`, 'warning')
          }
        />
      </ListGroup>

      <ListGroup>
        <ListGroup.Item
          icon="piggy"
          title={
            goal
              ? t(`savings.goals.${goal.goalId}.title`, {
                  defaultValue: goal.title,
                })
              : t('periodSummary.table.goal')
          }
          subtitle={
            goal
              ? t(
                  goal.isReached
                    ? 'periodSummary.goalReached'
                    : 'periodSummary.goalOpen',
                )
              : t('periodSummary.goalNone')
          }
          trailing={
            goal
              ? value(
                  `${formatMoney(goal.saved)} / ${formatMoney(goal.price)}`,
                  'phosphor',
                )
              : undefined
          }
        />
        <ListGroup.Item
          icon="battery"
          title={t('periodSummary.table.charge2')}
          subtitle={t(`periodSummary.mood.${report.robotMood}`)}
          trailing={value(`${Math.round(report.robotCharge * 100)}%`)}
        />
        <ListGroup.Item
          icon="up"
          title={t('periodSummary.table.tier')}
          trailing={value(String(report.level))}
        />
      </ListGroup>

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
    marginTop: SPACING.two,
  },
  value: { fontFamily: FONTS.monoStrong, fontSize: 16, lineHeight: 22 },
  rows: {
    gap: SPACING.two,
  },
});
