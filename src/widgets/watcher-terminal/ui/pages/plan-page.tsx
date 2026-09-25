import { useState } from 'react';

import { Pressable, StyleSheet, View } from 'react-native';

import { useShowFeedback } from '@/features/feedback';

import {
  allocate,
  type BudgetPlan,
  canConfirm,
  EMPTY_PLAN,
  remainder,
} from '@/entities/budget';
import { BUDGET_DIRECTIONS, type BudgetDirection } from '@/entities/economy';
import { startPeriod, useUpdateUser, useUser } from '@/entities/user';

import { FONTS, SPACING } from '@/shared/constants';
import { useTranslation } from '@/shared/i18n';
import { hapticSuccess } from '@/shared/lib';
import { Text } from '@/shared/ui';
import { formatMoney } from '@/shared/utils';

import {
  TerminalPrompt,
  TerminalRule,
  TerminalText,
  useTerminalTones,
} from '../terminal-shell';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface PlanPageProps {
  /** Called after the plan is saved and the period starts. */
  onDone: () => void;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

const STEP = 10;

const DIRECTION_META: Record<
  BudgetDirection,
  { index: string; titleKey: string; hintKey: string }
> = {
  needs: {
    index: '01',
    titleKey: 'watcher.terminal.plan.needs',
    hintKey: 'watcher.terminal.plan.needsHint',
  },
  wants: {
    index: '02',
    titleKey: 'watcher.terminal.plan.wants',
    hintKey: 'watcher.terminal.plan.wantsHint',
  },
  savings: {
    index: '03',
    titleKey: 'watcher.terminal.plan.savings',
    hintKey: 'watcher.terminal.plan.savingsHint',
  },
};

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

const DirectionBlock = ({
  direction,
  value,
  onStep,
}: {
  direction: BudgetDirection;
  value: number;
  onStep: (delta: number) => void;
}) => {
  const { t } = useTranslation();
  const { lcd, lcdDim } = useTerminalTones();
  const meta = DIRECTION_META[direction];

  return (
    <View style={styles.block}>
      <Text style={[styles.mono, { color: lcd }]}>
        {`${meta.index} ${t(meta.titleKey)}`}
      </Text>
      <Text style={[styles.monoSmall, { color: lcdDim }]}>
        {t(meta.hintKey)}
      </Text>
      <Text style={[styles.value, { color: lcd, borderBottomColor: lcd }]}>
        {formatMoney(value)}
      </Text>
      <View style={styles.stepRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('watcher.terminal.plan.minus')}
          onPress={() => onStep(-STEP)}
          style={({ pressed }) => [styles.step, pressed && styles.pressed]}
        >
          <Text style={[styles.mono, { color: lcd }]}>{`[-${STEP}]`}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('watcher.terminal.plan.plus')}
          onPress={() => onStep(STEP)}
          style={({ pressed }) => [styles.step, pressed && styles.pressed]}
        >
          <Text style={[styles.mono, { color: lcd }]}>{`[+${STEP}]`}</Text>
        </Pressable>
      </View>
    </View>
  );
};

/**
 * Period plan in the Keeper terminal — matches the CRT mockup (±10 steps).
 */
export const PlanPage = ({ onDone }: PlanPageProps) => {
  const { t } = useTranslation();
  const user = useUser();
  const updateUser = useUpdateUser();
  const showFeedback = useShowFeedback();
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
    if (available === 0) {
      commit(plan);
      return;
    }
    if (plan.needs === 0) {
      setNeedsWarningVisible(true);
      return;
    }
    commit(plan);
  };

  if (!isPlanning) {
    return (
      <View style={styles.stack}>
        <TerminalText isDim>
          {t('watcher.terminal.plan.notPlanning')}
        </TerminalText>
      </View>
    );
  }

  return (
    <View style={styles.stack}>
      <View style={styles.balanceRow}>
        <TerminalText>{t('watcher.terminal.plan.youHave')}</TerminalText>
        <TerminalText>{formatMoney(available)}</TerminalText>
      </View>
      <TerminalText isDim>
        {t('watcher.terminal.plan.coinsForPlan')}
      </TerminalText>
      <TerminalRule />

      {BUDGET_DIRECTIONS.map((direction) => (
        <DirectionBlock
          key={direction}
          direction={direction}
          value={plan[direction]}
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

      <TerminalRule />
      <TerminalText>
        {t('watcher.terminal.plan.remainder', {
          count: formatMoney(planLeft),
        })}
      </TerminalText>
      <TerminalRule />

      {isNeedsWarningVisible ? (
        <View style={styles.stack}>
          <TerminalText>{t('budgetPlan.needsZeroBody')}</TerminalText>
          <TerminalPrompt
            onPress={() => {
              commit(plan);
            }}
          >
            {t('budgetPlan.needsZeroConfirm')}
          </TerminalPrompt>
          <TerminalPrompt onPress={() => setNeedsWarningVisible(false)}>
            {t('budgetPlan.needsZeroKeep')}
          </TerminalPrompt>
        </View>
      ) : (
        <TerminalPrompt
          isCursorVisible
          disabled={!canSave}
          onPress={requestSave}
        >
          {t('watcher.terminal.plan.save')}
        </TerminalPrompt>
      )}
    </View>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  balanceRow: {
    alignItems: 'baseline',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  block: { gap: SPACING.half },
  mono: {
    fontFamily: FONTS.mono,
    fontSize: 14,
    lineHeight: 20,
  },
  monoSmall: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    lineHeight: 16,
  },
  pressed: { opacity: 0.7 },
  stack: { gap: SPACING.two },
  step: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: SPACING.one,
  },
  stepRow: {
    flexDirection: 'row',
    gap: SPACING.two,
  },
  value: {
    alignSelf: 'flex-start',
    borderBottomWidth: 2,
    fontFamily: FONTS.mono,
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
    marginVertical: SPACING.one,
    minWidth: 64,
  },
});
