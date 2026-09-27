import { type Href, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import type { BudgetDirection } from '@/entities/economy';
import {
  buildPeriodReport,
  labelWalletSource,
  listWalletHistory,
  useUser,
} from '@/entities/user';

import { FONTS, SPACING, STATIC_ROUTES } from '@/shared/constants';
import { useTranslation } from '@/shared/i18n';
import {
  Button,
  PixelIcon,
  type PixelIconName,
  ProgressBar,
  Text,
} from '@/shared/ui';
import { formatMoney } from '@/shared/utils';

import {
  TerminalCard,
  type TerminalFrame,
  TerminalMenu,
  TerminalMenuRow,
  TerminalShell,
  TerminalText,
} from '../terminal-shell';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface ReportPageProps {
  frame: TerminalFrame;
}

interface BoxCardProps {
  direction: BudgetDirection;
  plan: number;
  fact: number;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/** One cell of the bar is ten coins — countable with a finger. */
const COINS_PER_CELL = 10;
const MAX_CELLS = 15;
const RECENT_COUNT = 3;

const BOX_META: Record<BudgetDirection, { icon: PixelIconName; key: string }> =
  {
    needs: { icon: 'battery', key: 'watcher.terminal.plan.needs' },
    wants: { icon: 'gear', key: 'watcher.terminal.plan.wants' },
    savings: { icon: 'piggy', key: 'watcher.terminal.plan.savings' },
  };

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

/** A box of the plan: how much of it is used, in cells of ten. */
const BoxCard = ({ direction, plan, fact }: BoxCardProps) => {
  const { t } = useTranslation();
  const meta = BOX_META[direction];
  const cells = Math.min(
    MAX_CELLS,
    Math.max(1, Math.ceil(Math.max(plan, fact) / COINS_PER_CELL)),
  );
  const isEmptied = direction === 'wants' && fact >= plan && fact > 0;

  return (
    <TerminalCard>
      <View style={styles.boxHeader}>
        <PixelIcon name={meta.icon} />
        <Text variant="bodyBold" style={styles.boxName}>
          {t(meta.key)}
        </Text>
        <Text variant="small" themeColor="textMuted">
          {`${t(
            direction === 'savings'
              ? 'watcher.terminal.report.saved'
              : 'watcher.terminal.report.spent',
          )} `}
          <Text variant="small" style={styles.boxFact}>
            {formatMoney(fact)}
          </Text>
          {` ${t('watcher.terminal.report.of')} ${formatMoney(plan)}`}
        </Text>
      </View>
      <ProgressBar
        value={fact / (cells * COINS_PER_CELL)}
        segmentCount={cells}
        height={10}
        trackColor="surfaceSoft"
      />
      {isEmptied ? (
        <Text variant="small" themeColor="textSecondary">
          {t('watcher.terminal.report.overPlan')}
        </Text>
      ) : null}
    </TerminalCard>
  );
};

/**
 * The live period report (screen 12): plan and fact while the period runs,
 * the latest coin movements, and a quiet way to finish the period.
 */
export const ReportPage = ({ frame }: ReportPageProps) => {
  const { t } = useTranslation();
  const router = useRouter();
  const user = useUser();

  if (!user) return null;

  const report = buildPeriodReport(user);
  const isSummary = user.period.phase === 'summary';
  const recent = listWalletHistory(user).slice(0, RECENT_COUNT);
  const isSlipping =
    user.period.phase === 'active' &&
    (report.fact.needs < report.plan.needs * 0.5 ||
      report.fact.wants > report.plan.wants);

  return (
    <TerminalShell
      {...frame}
      label={t('watcher.terminal.pages.report.label', {
        index: report.periodIndex,
      })}
      title={t('watcher.terminal.pages.report.title')}
      footer={
        isSummary ? (
          <Button
            isFullWidth
            onPress={() => router.push(STATIC_ROUTES.PERIOD_SUMMARY as Href)}
          >
            {t('watcher.terminal.report.summary')}
          </Button>
        ) : user.period.phase === 'active' ? (
          <Button
            variant="secondary"
            isFullWidth
            onPress={() => router.push(STATIC_ROUTES.END_PERIOD as Href)}
          >
            {t('watcher.terminal.report.endPeriod')}
          </Button>
        ) : null
      }
    >
      <ScrollView contentContainerStyle={styles.stack}>
        <BoxCard
          direction="needs"
          plan={report.plan.needs}
          fact={report.spentOnCharge}
        />
        <BoxCard
          direction="wants"
          plan={report.plan.wants}
          fact={report.spentOnModules}
        />
        <BoxCard
          direction="savings"
          plan={report.plan.savings}
          fact={report.savedAmount}
        />

        {isSlipping ? (
          <TerminalCard variant="warning">
            <TerminalText>
              {t('watcher.terminal.report.supportBody')}
            </TerminalText>
          </TerminalCard>
        ) : null}

        {recent.length > 0 ? (
          <>
            <Text variant="smallBold">
              {t('watcher.terminal.report.recent')}
            </Text>
            <TerminalCard style={styles.recent}>
              {recent.map((row) => (
                <View key={row.entry.id} style={styles.recentRow}>
                  <Text style={styles.recentLabel} numberOfLines={1}>
                    {labelWalletSource(row.source, t)}
                  </Text>
                  <Text
                    variant={row.entry.kind === 'earn' ? 'machine' : 'code'}
                    themeColor={
                      row.entry.kind === 'earn' ? 'phosphor' : 'textSecondary'
                    }
                    style={styles.recentAmount}
                  >
                    {`${row.entry.kind === 'earn' ? '+' : '−'}${formatMoney(row.entry.amount)}`}
                  </Text>
                </View>
              ))}
            </TerminalCard>
          </>
        ) : null}

        <TerminalMenu>
          <TerminalMenuRow
            icon="clock"
            label={t('watcher.terminal.report.history')}
            onPress={() => router.push(STATIC_ROUTES.HISTORY as Href)}
          />
          {isSlipping ? (
            <TerminalMenuRow
              icon="plan"
              label={t('watcher.terminal.report.openPlan')}
              onPress={() => router.push(STATIC_ROUTES.BUDGET_PLAN as Href)}
            />
          ) : null}
        </TerminalMenu>
      </ScrollView>
    </TerminalShell>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  boxFact: { fontFamily: FONTS.monoStrong },
  boxHeader: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  boxName: { flex: 1 },
  recent: { gap: 0, paddingVertical: SPACING.one },
  recentAmount: { fontSize: 16 },
  recentLabel: { flex: 1 },
  recentRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    paddingVertical: SPACING.two,
  },
  stack: { gap: SPACING.two, paddingBottom: SPACING.two },
});

export type { ReportPageProps };
