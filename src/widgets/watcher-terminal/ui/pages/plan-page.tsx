import { useState } from 'react';

import { ScrollView, StyleSheet, View } from 'react-native';

import { HintButton } from '@/widgets/hint-button';

import { useShowFeedback } from '@/features/feedback';

import {
  allocate,
  type BudgetPlan,
  canConfirm,
  EMPTY_PLAN,
  remainder,
} from '@/entities/budget';
import { BUDGET_DIRECTIONS, type BudgetDirection } from '@/entities/economy';
import {
  startPeriod,
  useIsMotionEnabled,
  useUpdateUser,
  useUser,
} from '@/entities/user';

import { FONTS, RADII, SPACING } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import { useTranslation } from '@/shared/i18n';
import { hapticSuccess } from '@/shared/lib';
import {
  Button,
  PixelIcon,
  type PixelIconName,
  Sheet,
  Text,
} from '@/shared/ui';
import { formatMoney } from '@/shared/utils';

import {
  TerminalBubble,
  TerminalCard,
  type TerminalFrame,
  TerminalRule,
  TerminalShell,
} from '../terminal-shell';

import { ReportPage } from './report-page';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface PlanPageProps {
  frame: TerminalFrame;
  /** Called after the plan is saved and the period starts. */
  onDone: () => void;
}

interface DirectionRowProps {
  direction: BudgetDirection;
  value: number;
  isDecreaseDisabled: boolean;
  isIncreaseDisabled: boolean;
  onStep: (delta: number) => void;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

const STEP = 10;

const DIRECTION_META: Record<
  BudgetDirection,
  { icon: PixelIconName; titleKey: string; hintKey: string }
> = {
  needs: {
    icon: 'battery',
    titleKey: 'watcher.terminal.plan.needs',
    hintKey: 'watcher.terminal.plan.needsHint',
  },
  wants: {
    icon: 'gear',
    titleKey: 'watcher.terminal.plan.wants',
    hintKey: 'watcher.terminal.plan.wantsHint',
  },
  savings: {
    icon: 'piggy',
    titleKey: 'watcher.terminal.plan.savings',
    hintKey: 'watcher.terminal.plan.savingsHint',
  },
};

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

/** UI kit 07 "строка-степпер": sign, name, amount, − and +. */
const DirectionRow = ({
  direction,
  value,
  isDecreaseDisabled,
  isIncreaseDisabled,
  onStep,
}: DirectionRowProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const meta = DIRECTION_META[direction];

  return (
    <TerminalCard style={styles.row}>
      <View style={styles.rowLabel}>
        <View style={[styles.iconBox, { backgroundColor: theme.surfaceSoft }]}>
          <PixelIcon name={meta.icon} />
        </View>
        <View style={styles.rowCopy}>
          <Text variant="bodyBold" style={styles.rowTitle}>
            {t(meta.titleKey)}
          </Text>
          <Text variant="small" themeColor="textMuted">
            {t(meta.hintKey)}
          </Text>
        </View>
      </View>
      {/* − amount + as one control: the number sits between the keys that
          change it, and the three drop under the label together when the
          row is too narrow rather than squeezing the title into "Модул-и". */}
      <View style={styles.stepper}>
        <Button
          variant="stepper"
          style={styles.stepperKey}
          accessibilityLabel={`${t(meta.titleKey)}: ${t('watcher.terminal.plan.minus')}`}
          disabled={isDecreaseDisabled}
          onPress={() => onStep(-STEP)}
        >
          <PixelIcon
            name="minus"
            size={16}
            tone={isDecreaseDisabled ? 'borderStrong' : 'phosphor'}
          />
        </Button>
        <Text
          variant="machine"
          style={styles.value}
          accessibilityLiveRegion="polite"
        >
          {formatMoney(value)}
        </Text>
        <Button
          variant="stepper"
          style={styles.stepperKey}
          accessibilityLabel={`${t(meta.titleKey)}: ${t('watcher.terminal.plan.plus')}`}
          disabled={isIncreaseDisabled}
          onPress={() => onStep(STEP)}
        >
          <PixelIcon
            name="plus"
            size={16}
            tone={isIncreaseDisabled ? 'borderStrong' : 'phosphor'}
          />
        </Button>
      </View>
    </TerminalCard>
  );
};

/**
 * Period plan in the Keeper terminal — concept B2 (±10 steps). A plan with
 * nothing on charge is allowed, but a warning sheet asks first (screen 11).
 */
export const PlanPage = ({ frame, onDone }: PlanPageProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const user = useUser();
  const updateUser = useUpdateUser();
  const showFeedback = useShowFeedback();
  const isMotionEnabled = useIsMotionEnabled();
  const isPlanning = user?.period.phase === 'planning';
  const available = user?.wallet.balance ?? 0;
  const [plan, setPlan] = useState<BudgetPlan>(user?.period.plan ?? EMPTY_PLAN);
  const [isNeedsWarningVisible, setNeedsWarningVisible] = useState(false);
  const planLeft = remainder(available, plan);
  const canSave = Boolean(isPlanning && canConfirm(plan, available));

  const commit = (next: BudgetPlan) => {
    if (!user || !isPlanning) return;

    let transition: { before: typeof user; after: typeof user } | undefined;
    updateUser((current) => {
      if (
        current.period.phase !== 'planning' ||
        current.period.index !== user.period.index ||
        !canConfirm(next, current.wallet.balance)
      ) {
        return current;
      }
      const after = startPeriod({
        ...current,
        period: { ...current.period, plan: next },
      });
      transition = { before: current, after };
      return after;
    });
    if (!transition) return;

    hapticSuccess();
    showFeedback({
      before: transition.before,
      after: transition.after,
      action: 'plan',
      params: {
        needs: next.needs,
        wants: next.wants,
        savings: next.savings,
      },
    });
    setNeedsWarningVisible(false);
    onDone();
  };

  const requestSave = () => {
    if (!canSave) return;
    if (available > 0 && plan.needs === 0) {
      setNeedsWarningVisible(true);
      return;
    }
    commit(plan);
  };

  if (!isPlanning) return <ReportPage frame={frame} />;

  return (
    <TerminalShell
      {...frame}
      label={t('watcher.terminal.pages.plan.label')}
      title={t('watcher.terminal.pages.plan.title')}
      trailing={<HintButton screen="budget-plan" />}
      footer={
        <Button isFullWidth disabled={!canSave} onPress={requestSave}>
          {t('watcher.terminal.plan.save')}
        </Button>
      }
    >
      <ScrollView contentContainerStyle={styles.stack}>
        <TerminalBubble>
          {t('watcher.terminal.pages.plan.intro')}
        </TerminalBubble>

        <TerminalCard variant="raised" style={styles.balance}>
          <Text variant="bodyBold">{t('watcher.terminal.plan.youHave')}</Text>
          <View style={styles.balanceAmount}>
            <Text variant="machine" style={styles.balanceNumber}>
              {formatMoney(available)}
            </Text>
            <PixelIcon name="coin" tone="coin" />
          </View>
        </TerminalCard>

        <View style={styles.rows}>
          {BUDGET_DIRECTIONS.map((direction) => (
            <DirectionRow
              key={direction}
              direction={direction}
              value={plan[direction]}
              isDecreaseDisabled={plan[direction] === 0}
              isIncreaseDisabled={planLeft <= 0}
              onStep={(delta) => {
                setPlan((current) =>
                  allocate(
                    current,
                    direction,
                    current[direction] + delta,
                    available,
                  ),
                );
              }}
            />
          ))}
        </View>

        <TerminalRule isDashed />
        <View style={styles.remainder}>
          <Text themeColor="textSecondary">
            {t('watcher.terminal.plan.remainderLabel')}
          </Text>
          <Text variant="code" themeColor="coin" style={styles.remainderValue}>
            {formatMoney(planLeft)}
          </Text>
        </View>
      </ScrollView>

      <Sheet.Modal
        variant="warning"
        isVisible={isNeedsWarningVisible}
        onClose={() => setNeedsWarningVisible(false)}
        isAnimated={isMotionEnabled}
      >
        <Sheet.Label variant="warning">
          {t('watcher.terminal.plan.checkLabel')}
        </Sheet.Label>
        <Sheet.Title>{t('watcher.terminal.plan.needsZeroTitle')}</Sheet.Title>
        <View style={[styles.table, { borderColor: theme.border }]}>
          {BUDGET_DIRECTIONS.map((direction, index) => (
            <View
              key={direction}
              style={[
                styles.tableRow,
                index > 0 && [
                  styles.tableDivider,
                  { borderColor: theme.border },
                ],
              ]}
            >
              <PixelIcon
                name={DIRECTION_META[direction].icon}
                tone={plan[direction] === 0 ? 'coin' : 'phosphor'}
              />
              <Text style={styles.tableLabel}>
                {t(DIRECTION_META[direction].titleKey)}
              </Text>
              <Text
                variant="code"
                themeColor={plan[direction] === 0 ? 'coin' : 'text'}
                style={styles.tableValue}
              >
                {formatMoney(plan[direction])}
              </Text>
            </View>
          ))}
        </View>
        <Sheet.Description>
          {t('watcher.terminal.plan.needsZeroBody')}
        </Sheet.Description>
        <Sheet.Actions>
          <Button isFullWidth onPress={() => setNeedsWarningVisible(false)}>
            {t('watcher.terminal.plan.needsZeroKeep')}
          </Button>
          <Button
            variant="secondary"
            size="m"
            isFullWidth
            onPress={() => commit(plan)}
          >
            {t('watcher.terminal.plan.needsZeroConfirm')}
          </Button>
        </Sheet.Actions>
      </Sheet.Modal>
    </TerminalShell>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  balance: {
    alignItems: 'center',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  balanceAmount: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  balanceNumber: { fontSize: 25, lineHeight: 32 },
  iconBox: {
    alignItems: 'center',
    borderRadius: RADII.s,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  remainder: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  remainderValue: { fontFamily: FONTS.monoStrong },
  row: {
    alignItems: 'center',
    columnGap: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingLeft: SPACING.compact,
    paddingRight: 10,
    paddingVertical: 10,
    rowGap: SPACING.two,
  },
  rowCopy: { flex: 1, minWidth: 0 },
  // Icon plus "Копилка" on one line; below that the stepper wraps under it.
  rowLabel: {
    alignItems: 'center',
    flexBasis: 128,
    flexDirection: 'row',
    flexGrow: 1,
    gap: 10,
  },
  rowTitle: { fontSize: 17, lineHeight: 21 },
  rows: { gap: SPACING.two },
  stack: { gap: SPACING.compact, paddingBottom: SPACING.two },
  stepper: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: SPACING.one,
    marginLeft: 'auto',
  },
  // Button's root sits at flex-start for column layouts; in a row that
  // lifts the keys above the amount between them.
  stepperKey: { alignSelf: 'center' },
  table: { borderRadius: RADII.s, borderWidth: 2 },
  tableDivider: { borderTopWidth: 1 },
  tableLabel: { flex: 1 },
  tableRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: SPACING.compact,
    paddingVertical: 10,
  },
  tableValue: { fontFamily: FONTS.monoStrong, fontSize: 16 },
  value: { fontSize: 22, lineHeight: 28, minWidth: 48, textAlign: 'center' },
});

export type { PlanPageProps };
