import { StyleSheet, View } from 'react-native';

import { ComparisonRow } from '@/widgets/plan-fact-bars';

import { DemoModeCard } from '@/features/demo-mode';
import { RestartProfileButton } from '@/features/profile-restart';

import { RADII, SPACING } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import { useTranslation } from '@/shared/i18n';
import { Card, PixelIcon, Screen, Segmented, Text } from '@/shared/ui';

import { useParents } from '../model';

import { EarningsChart } from './earnings-chart';
import { ParentGate } from './parent-gate';
import { ParentsReadout } from './parents-readout';
import { ThemeTallyRows } from './theme-tally-rows';

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

export const ParentsScreen = () => {
  const { t } = useTranslation();
  const theme = useTheme();
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
    <Screen gap={SPACING.COMPACT} terminalVariant="adult">
      <Screen.Header>
        <Screen.Back />
        <Screen.Heading>
          <Screen.Label voice="adult">{t('parents.service')}</Screen.Label>
          <Screen.Title>{t('parents.title')}</Screen.Title>
        </Screen.Heading>
      </Screen.Header>

      <Segmented
        options={(['overview', 'topics', 'manage'] as const).map((section) => ({
          value: section,
          label: t(`parents.sections.${section}`),
        }))}
        value={parents.section}
        onChange={parents.setSection}
      />

      {parents.section === 'overview' && (
        <ParentsReadout status={parents.status} />
      )}

      {report && parents.section === 'overview' && (
        <>
          <Card>
            <Card.Title>{t('parents.report.earningsTitle')}</Card.Title>
            <Card.Content style={styles.section}>
              <EarningsChart rows={report.earnings} />
              <Text variant="small" themeColor="textSecondary">
                {t('parents.report.earningsNote')}
              </Text>
            </Card.Content>
          </Card>

          <Card>
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
                            .map((d) => t(`boxes.${d}`).toLocaleLowerCase())
                            .join(', '),
                          under: parents.lastExplain.underspent
                            .map((d) => t(`boxes.${d}`).toLocaleLowerCase())
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

          <Card>
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

      {parents.section === 'topics' && report && (
        <>
          <Card>
            <Card.Title>{t('parents.report.tasksTitle')}</Card.Title>
            <Card.Content style={styles.section}>
              <ThemeTallyRows rows={report.tasksByTheme} />
              <Text variant="small" themeColor="textSecondary">
                {t('parents.report.tasksNote', { count: report.tasksDone })}
              </Text>
            </Card.Content>
          </Card>

          <View style={[styles.dashed, { borderColor: theme.borderStrong }]}>
            <Text themeColor="textSecondary">{t('parents.discuss')}</Text>
          </View>
        </>
      )}

      {parents.section === 'manage' && (
        <>
          <DemoModeCard />

          <View style={[styles.dashed, { borderColor: theme.warning }]}>
            <Text variant="machine" themeColor="warning">
              {`! ${t('parents.profileLabel').toLocaleUpperCase()}`}
            </Text>
            <Text variant="small" themeColor="textSecondary">
              {t('settings.profileDescription')}
            </Text>
            <RestartProfileButton />
          </View>
        </>
      )}
      <View style={styles.privacy}>
        <PixelIcon name="lock" size={12} tone="textMuted" />
        <Text variant="small" themeColor="textMuted" style={styles.privacyText}>
          {t('parents.privacy')}
        </Text>
      </View>
    </Screen>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  dashed: {
    borderRadius: RADII.m,
    borderStyle: 'dashed',
    borderWidth: 2,
    gap: SPACING.TWO,
    padding: SPACING.COMPACT,
  },
  privacy: { alignItems: 'flex-start', flexDirection: 'row', gap: SPACING.TWO },
  privacyText: { flex: 1 },
  section: {
    gap: SPACING.TWO,
  },
});
