import { Redirect, useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { HintButton } from '@/widgets/hint-button';

import { FONTS, RADII, SPACING, STATIC_ROUTES } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import { useTranslation } from '@/shared/i18n';
import {
  Button,
  Card,
  PixelIcon,
  ProgressBar,
  Screen,
  Sheet,
  Text,
} from '@/shared/ui';
import { formatMoney, hitSlopFor } from '@/shared/utils';

import { useGoal } from '../model';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface GoalScreenProps {
  goalId: string;
}

interface AmountStepperProps {
  value: number;
  max: number;
  onAdd: () => void;
  onRemove: () => void;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

const KEY_SIZE = 56;
const QUICK_STEPS = [10, 50] as const;
/** One cell is ten coins, capped so a long goal still fits one line. */
const MAX_CELLS = 15;

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

/** UI kit 08 "сколько положить": a big number between − and +. */
const AmountStepper = ({ value, max, onAdd, onRemove }: AmountStepperProps) => {
  const { t } = useTranslation();
  const theme = useTheme();

  const key = (
    sign: string,
    onPress: () => void,
    disabled: boolean,
    accessibilityLabel: string,
  ) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={hitSlopFor(KEY_SIZE)}
      onPress={onPress}
      style={({ pressed }) => [
        styles.key,
        {
          backgroundColor: pressed ? theme.surfaceSoft : undefined,
          borderColor: disabled ? theme.border : theme.borderStrong,
        },
      ]}
    >
      <Text
        style={styles.keySign}
        themeColor={disabled ? 'borderStrong' : 'phosphor'}
      >
        {sign}
      </Text>
    </Pressable>
  );

  return (
    <View style={styles.stepper}>
      {key('−', onRemove, value <= 0, t('savings.amountRemove'))}
      <Text
        variant="numberLarge"
        style={[styles.amount, { borderColor: theme.borderStrong }]}
        accessibilityLiveRegion="polite"
      >
        {formatMoney(value)}
      </Text>
      {key('+', onAdd, value >= max, t('savings.amountAdd'))}
    </View>
  );
};

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

/**
 * One goal's jar (concept E1, E2). The chosen goal is framed and labelled
 * "✓ ЦЕЛЬ"; putting coins in is the main action, taking them out a quiet link
 * whose cost is spelled out on the next screen.
 */
export const GoalScreen = ({ goalId }: GoalScreenProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const goal = useGoal(goalId);

  if (!goal) {
    return <Redirect href={STATIC_ROUTES.SAVINGS} />;
  }

  const title = t(`savings.goals.${goal.goalId}.title`, {
    defaultValue: goal.title,
  });
  const cells = Math.min(MAX_CELLS, Math.max(1, Math.ceil(goal.price / 10)));
  const canDeposit =
    goal.canTransfer && goal.amount > 0 && goal.amount <= goal.maxDeposit;

  return (
    <Screen presentation="sheet" gap="compact" terminalVariant="keeper">
      <Screen.Header>
        <Screen.Back />
        <Screen.Heading>
          <Screen.Label>{t('savings.jar.label')}</Screen.Label>
          <Screen.Title>{t('savings.jar.title')}</Screen.Title>
        </Screen.Heading>
        <HintButton screen="savings" />
      </Screen.Header>

      <Card isSelected={goal.isActive}>
        <View style={styles.head}>
          <View
            style={[styles.iconBox, { backgroundColor: theme.surfaceSoft }]}
          >
            <PixelIcon name="piggy" />
          </View>
          <View style={styles.headCopy}>
            <Text variant="bodyBold" style={styles.goalTitle}>
              {title}
            </Text>
            <Text variant="small" themeColor="textMuted">
              {goal.isActive
                ? t('savings.jar.mainGoal')
                : t('savings.jar.otherGoal')}
            </Text>
          </View>
          {goal.isActive ? (
            <View style={[styles.badge, { backgroundColor: theme.primary }]}>
              <PixelIcon name="check" size={12} tone="onAccent" />
              <Text
                variant="code"
                themeColor="onAccent"
                style={styles.badgeText}
              >
                {t('savings.jar.goalBadge').toLocaleUpperCase()}
              </Text>
            </View>
          ) : null}
        </View>
        <ProgressBar
          value={goal.progress}
          segmentCount={cells}
          height={10}
          trackColor="surfaceSoft"
          accessibilityLabel={t('home.goal.progressA11y', {
            percent: Math.round(goal.progress * 100),
          })}
        />
        <View style={styles.row}>
          <Text variant="small" themeColor="textSecondary">
            {goal.isReached
              ? t('savings.reached')
              : t('savings.jar.left', { count: formatMoney(goal.remaining) })}
          </Text>
          <Text variant="machine">{goal.progressLabel}</Text>
        </View>
      </Card>

      {!goal.isActive && (
        <Button
          variant="secondary"
          size="m"
          isFullWidth
          onPress={goal.makeActive}
        >
          {t('savings.makeActive')}
        </Button>
      )}

      {goal.canLift && goal.nextTier !== null ? (
        <Button isFullWidth onPress={goal.requestLift}>
          <PixelIcon name="up" tone="onAccent" />
          <Button.Label>{t('savings.jar.liftAction')}</Button.Label>
        </Button>
      ) : null}

      {!goal.canTransfer ? (
        <Card>
          <View style={styles.lockLine}>
            <PixelIcon name="lock" size={12} tone="textDisabled" />
            <Text variant="code" themeColor="textMuted">
              {t('home.hud.planFirst')}
            </Text>
          </View>
          <Text themeColor="textSecondary">{t('savings.planFirstBody')}</Text>
          <Button
            size="m"
            isFullWidth
            onPress={() => router.push(STATIC_ROUTES.BUDGET_PLAN)}
          >
            {t('savings.goPlan')}
          </Button>
        </Card>
      ) : (
        <Card>
          <Text variant="small" themeColor="textSecondary">
            {t('savings.jar.putLabel')}
          </Text>
          <AmountStepper
            value={goal.amount}
            max={Math.max(goal.maxDeposit, goal.maxWithdraw)}
            onAdd={goal.addCoin}
            onRemove={goal.removeCoin}
          />
          <View style={styles.quick}>
            {QUICK_STEPS.map((step) => (
              <Pressable
                key={step}
                accessibilityRole="button"
                disabled={goal.maxDeposit <= 0}
                onPress={() =>
                  goal.setAmount(Math.min(goal.amount + step, goal.maxDeposit))
                }
                style={({ pressed }) => [
                  styles.quickChip,
                  {
                    backgroundColor: pressed ? theme.surfaceSoft : undefined,
                    borderColor: theme.border,
                  },
                ]}
              >
                <Text variant="code" themeColor="phosphor">
                  {`+${step}`}
                </Text>
              </Pressable>
            ))}
            <Pressable
              accessibilityRole="button"
              disabled={goal.maxDeposit <= 0}
              onPress={goal.setMaxDeposit}
              style={({ pressed }) => [
                styles.quickChip,
                styles.quickAll,
                {
                  backgroundColor: pressed ? theme.surfaceSoft : undefined,
                  borderColor: theme.border,
                },
              ]}
            >
              <Text themeColor="phosphor">
                {t('savings.jar.all', {
                  count: formatMoney(goal.maxDeposit),
                })}
              </Text>
            </Pressable>
          </View>
          <Text variant="small" themeColor="textMuted" style={styles.center}>
            {t('savings.jar.putHint', { count: formatMoney(goal.balance) })}
          </Text>
        </Card>
      )}

      <View style={styles.actions}>
        <Button isFullWidth disabled={!canDeposit} onPress={goal.deposit}>
          {t('savings.jar.putAction', { count: formatMoney(goal.amount) })}
        </Button>
        <Button
          variant="ghost"
          size="s"
          isFullWidth
          disabled={
            !goal.canTransfer ||
            goal.amount <= 0 ||
            goal.amount > goal.maxWithdraw
          }
          onPress={goal.requestWithdraw}
        >
          {t('savings.jar.withdrawLink')}
        </Button>
      </View>

      <Sheet.Modal
        isVisible={goal.sheet === 'planning'}
        onClose={goal.dismissSheet}
      >
        <Sheet.Label>{t('home.hud.planFirst').toLocaleLowerCase()}</Sheet.Label>
        <Sheet.Title>{t('savings.planFirstTitle')}</Sheet.Title>
        <Sheet.Description>{t('savings.planFirstBody')}</Sheet.Description>
        <Sheet.Actions>
          <Button
            isFullWidth
            onPress={() => {
              goal.dismissSheet();
              router.push(STATIC_ROUTES.BUDGET_PLAN);
            }}
          >
            {t('savings.goPlan')}
          </Button>
          <Button
            variant="secondary"
            size="m"
            isFullWidth
            onPress={goal.dismissSheet}
          >
            {t('savings.cancel')}
          </Button>
        </Sheet.Actions>
      </Sheet.Modal>

      <Sheet.Modal
        isVisible={goal.sheet === 'lift' && goal.nextTier !== null}
        onClose={goal.dismissSheet}
      >
        <Sheet.Label>
          {t('savings.jar.liftLabel', {
            saved: formatMoney(goal.saved),
            price: formatMoney(goal.price),
          })}
        </Sheet.Label>
        <Sheet.Title>{t('savings.jar.liftTitle')}</Sheet.Title>
        <View style={[styles.table, { borderColor: theme.border }]}>
          <View style={styles.tableRow}>
            <Text>{t('savings.jar.liftFrom')}</Text>
            <Text variant="code" style={styles.tableValue}>
              {`−${formatMoney(goal.price)}`}
            </Text>
          </View>
          <View
            style={[
              styles.tableRow,
              styles.tableDivider,
              { borderColor: theme.border },
            ]}
          >
            <Text>{t('savings.jar.liftLeft')}</Text>
            <Text variant="code" style={styles.tableValue}>
              {formatMoney(Math.max(0, goal.saved - goal.price))}
            </Text>
          </View>
          <View
            style={[
              styles.tableRow,
              styles.tableDivider,
              { borderColor: theme.border },
            ]}
          >
            <Text>{t('savings.jar.liftRise')}</Text>
            <Text variant="machine" style={styles.tableValue}>
              {t('savings.jar.liftTier', {
                from: (goal.nextTier ?? 1) - 1,
                to: goal.nextTier ?? 1,
              })}
            </Text>
          </View>
        </View>
        <Text variant="small" themeColor="textSecondary">
          {t('savings.jar.liftNote')}
        </Text>
        <Sheet.Actions>
          <Button size="xl" isFullWidth onPress={goal.confirmLift}>
            <PixelIcon name="up" tone="onAccent" />
            <Button.Label>{t('savings.jar.liftAction')}</Button.Label>
          </Button>
          <Button
            variant="ghost"
            size="s"
            isFullWidth
            onPress={goal.dismissSheet}
          >
            {t('savings.jar.liftLater')}
          </Button>
        </Sheet.Actions>
      </Sheet.Modal>
    </Screen>
  );
};

/**
 * Resolves `/savings/[goalId]`. Unknown ids fall back to the showcase.
 */
export const GoalRouteScreen = ({ goalId }: { goalId: string }) => {
  if (!goalId) {
    return <Redirect href={STATIC_ROUTES.SAVINGS} />;
  }

  return <GoalScreen goalId={goalId} />;
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  actions: {
    gap: SPACING.one,
    marginTop: SPACING.one,
  },
  amount: {
    borderBottomWidth: 2,
    fontSize: 43,
    lineHeight: 52,
    minWidth: 100,
    textAlign: 'center',
  },
  badge: {
    alignItems: 'center',
    borderRadius: 6,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: SPACING.two,
    paddingVertical: 3,
  },
  badgeText: { fontSize: 12, lineHeight: 16 },
  center: { textAlign: 'center' },
  goalTitle: { fontSize: 17, lineHeight: 21 },
  head: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  headCopy: { flex: 1, minWidth: 0 },
  iconBox: {
    alignItems: 'center',
    borderRadius: RADII.s,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  key: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 2,
    height: KEY_SIZE,
    justifyContent: 'center',
    width: KEY_SIZE,
  },
  keySign: { fontFamily: FONTS.sans, fontSize: 26, lineHeight: 32 },
  lockLine: { alignItems: 'center', flexDirection: 'row', gap: SPACING.one },
  quick: { flexDirection: 'row', gap: SPACING.two },
  quickAll: { flex: 1.6 },
  quickChip: {
    alignItems: 'center',
    borderRadius: RADII.s,
    borderWidth: 2,
    flex: 1,
    height: 44,
    justifyContent: 'center',
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stepper: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: SPACING.three,
    justifyContent: 'center',
    paddingVertical: SPACING.two,
  },
  table: { borderRadius: RADII.s, borderWidth: 2 },
  tableDivider: { borderTopWidth: 1 },
  tableRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.compact,
    paddingVertical: 10,
  },
  tableValue: { fontFamily: FONTS.monoStrong, fontSize: 16 },
});

export type { GoalScreenProps };
