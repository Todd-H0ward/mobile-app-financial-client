import { StyleSheet } from 'react-native';

import { ComparisonRow } from '@/widgets/plan-fact-bars';

import { DemoModeCard } from '@/features/demo-mode';
import { RestartProfileButton } from '@/features/profile-restart';

import { SPACING } from '@/shared/constants';
import { useTranslation } from '@/shared/i18n';
import { Card, Screen, Text } from '@/shared/ui';

import { useParents } from '../model';

import { EarningsChart } from './earnings-chart';
import { ParentGate } from './parent-gate';
import { ParentsReadout } from './parents-readout';
import { ThemeTallyRows } from './theme-tally-rows';

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

/**
 * The grown-up's section — 2.5.12, docs/parents.md.
 *
 * The one screen with a grown-up's look and the only place with numbers about
 * the child. Everything here is read back out of what the child already sees:
 * the same wallet history and the same period totals, counted a second way.
 * Nothing extra is collected and nothing leaves the device (docs/privacy.md).
 */
export const ParentsScreen = () => {
  const { t } = useTranslation();
  const parents = useParents();

  if (parents.isLocked) {
    return (
      <ParentGate
        challenge={parents.challenge}
        onPass={parents.unlock}
        onMiss={parents.refreshChallenge}
      />
    );
  }

  const report = parents.report;

  return (
    <Screen gap="three" isTabBarVisible={false}>
      <Screen.Header>
        <Screen.Back />
        <Screen.Heading>
          <Screen.Title>{t('parents.title')}</Screen.Title>
          <Screen.Subtitle>{t('parents.subtitle')}</Screen.Subtitle>
        </Screen.Heading>
      </Screen.Header>

      <ParentsReadout status={parents.status} />

      {report && (
        <>
          <Card tone="surfaceSoft">
            <Card.Title>{t('parents.report.earningsTitle')}</Card.Title>
            <Card.Content style={styles.section}>
              <EarningsChart rows={report.earnings} />
              <Text variant="small" themeColor="textSecondary">
                {t('parents.report.earningsNote')}
              </Text>
            </Card.Content>
          </Card>

          <Card tone="surfaceSoft">
            <Card.Title>{t('parents.report.planFactTitle')}</Card.Title>
            <Card.Content style={styles.section}>
              {parents.lastRows.length > 0 ? (
                <>
                  {parents.lastRows.map((row) => (
                    <ComparisonRow
                      key={row.direction}
                      row={row}
                      barMax={parents.barMax}
                    />
                  ))}

                  {parents.lastExplain && (
                    <Text variant="small" themeColor="textSecondary">
                      {t(
                        `periodSummary.story.${parents.lastExplain.storyKey}`,
                        {
                          over: parents.lastExplain.overspent
                            .map((d) => t(`budgetPlan.directions.${d}.title`))
                            .join(', '),
                          under: parents.lastExplain.underspent
                            .map((d) => t(`budgetPlan.directions.${d}.title`))
                            .join(', '),
                        },
                      )}
                    </Text>
                  )}
                </>
              ) : (
                <Text variant="small" themeColor="textSecondary">
                  {t('parents.report.planFactEmpty')}
                </Text>
              )}
            </Card.Content>
          </Card>

          <Card tone="surfaceSoft">
            <Card.Title>{t('parents.report.tasksTitle')}</Card.Title>
            <Card.Content style={styles.section}>
              <ThemeTallyRows rows={report.tasksByTheme} />
              <Text variant="small" themeColor="textSecondary">
                {t('parents.report.tasksNote', { count: report.tasksDone })}
              </Text>
            </Card.Content>
          </Card>

          <Card tone="surfaceSoft">
            <Card.Title>{t('parents.report.growthTitle')}</Card.Title>
            <Card.Content style={styles.section}>
              <Text variant="bodyBold">
                {t(`parents.report.stages.${report.growth.stage}`)}
              </Text>
              <Text variant="small" themeColor="textSecondary">
                {report.growth.progress
                  ? t('parents.report.growthNext', {
                      stage: t(
                        `parents.report.stages.${report.growth.progress.next}`,
                      ),
                      periods: report.growth.progress.periods,
                      goals: report.growth.progress.goalsReached,
                      plans: report.growth.progress.plansKept,
                    })
                  : t('parents.report.growthDone')}
              </Text>
            </Card.Content>
          </Card>
        </>
      )}

      <DemoModeCard />

      <Card tone="surfaceSoft">
        <Card.Title>{t('settings.profile')}</Card.Title>
        <Card.Content>
          <Text variant="small" themeColor="textSecondary">
            {t('settings.profileDescription')}
          </Text>
        </Card.Content>
        <Card.Footer>
          <RestartProfileButton />
        </Card.Footer>
      </Card>
    </Screen>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  section: {
    gap: SPACING.two,
  },
});
