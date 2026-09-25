import { useCallback, useRef, useState } from 'react';

import { type Href, Redirect, useFocusEffect, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HintButton } from '@/widgets/hint-button';
import { RobotSetup } from '@/widgets/robot-setup';
import { RoomScene, type SceneView } from '@/widgets/room-scene';

import { PLATFORM_GOAL_ID } from '@/entities/economy';
import { getGoalById } from '@/entities/goal';
import { lessonAccess, lessonOrdinalForKey } from '@/entities/lesson';
import { actionForMood } from '@/entities/robot-dog';
import { cellKey, SCENE_LEVEL_COUNT } from '@/entities/scene';
import {
  applyPlatformUpgrade,
  useDoneCells,
  useRobotAction,
  useRobotSkin,
  useUpdateUser,
  useUser,
} from '@/entities/user';
import type { WatcherId } from '@/entities/watcher';

import {
  CONTENT_PADDING,
  DYNAMIC_ROUTES,
  MAX_CONTENT_WIDTH,
  RADII,
  SPACING,
  STATIC_ROUTES,
} from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import { useTranslation } from '@/shared/i18n';
import { useTimeSource } from '@/shared/lib';
import { Button, SettingsIcon, Sheet, Text, ThemedView } from '@/shared/ui';
import { formatMoney } from '@/shared/utils';

import { useHomeHud } from '../model';

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

/** HUD occupies its own space so essential controls never cover the robot. */
export const HomeScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { t } = useTranslation();
  const hud = useHomeHud();
  const robotSkin = useRobotSkin();
  const chosenAction = useRobotAction();
  const user = useUser();
  const updateUser = useUpdateUser();
  const time = useTimeSource();
  const [view, setView] = useState<SceneView>(0);
  const [targetLevel, setTargetLevel] = useState<number | null>(null);
  const [talkingTo, setTalkingTo] = useState<WatcherId | null>(null);
  const [isMenuVisible, setMenuVisible] = useState(false);
  const isNavigating = useRef(false);
  const doneCells = useDoneCells();

  useFocusEffect(
    useCallback(() => {
      isNavigating.current = false;
    }, []),
  );

  // A ref closes the double-tap window before React can render the next frame.
  const navigate = (href: Href) => {
    if (isNavigating.current) return;
    isNavigating.current = true;
    setMenuVisible(false);
    router.push(href);
  };

  const level = user?.platform.level ?? 0;
  const isOutOfPit = level >= SCENE_LEVEL_COUNT;
  const price = getGoalById(PLATFORM_GOAL_ID)?.price ?? 0;
  const saved =
    user?.savings.goals.find((row) => row.goalId === PLATFORM_GOAL_ID)?.saved ??
    0;
  const canUpgrade = hud.isActive && saved >= price && price > 0;
  const confirmUpgrade = () => {
    if (targetLevel === null) return;
    updateUser((current) => {
      const result = applyPlatformUpgrade(current, targetLevel, time);
      return result.ok ? result.user : current;
    });
    setTargetLevel(null);
  };

  if (!user) return <Redirect href={STATIC_ROUTES.ENTRY} />;
  if (hud.isSummary) return <Redirect href={STATIC_ROUTES.PERIOD_SUMMARY} />;

  return (
    <ThemedView
      variant="background"
      style={[
        styles.root,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text variant="body" themeColor="textSecondary">
              {t('home.balance')}
            </Text>
            <Text variant="bodyBold">{formatMoney(hud.balance)}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('home.savings')}
            onPress={() => navigate(STATIC_ROUTES.SAVINGS)}
            style={styles.stat}
          >
            <Text variant="body" themeColor="textSecondary">
              {t('home.savings')}
            </Text>
            <Text variant="bodyBold">{formatMoney(hud.savingsTotal)}</Text>
          </Pressable>
          <HintButton screen="home" />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('home.settingsA11y')}
            onPress={() => navigate(STATIC_ROUTES.SETTINGS)}
            style={styles.iconButton}
          >
            <SettingsIcon color={theme.textSecondary} />
          </Pressable>
        </View>
        <Text variant="bodyBold">
          {user.robot.name || t('robot.unnamed')} ·{' '}
          {t('home.charge', { value: Math.round(user.robot.charge * 100) })}
        </Text>
        <Text
          variant="body"
          themeColor="textSecondary"
          accessibilityLabel={hud.robot?.accessibilityLabel}
        >
          {hud.robot?.moodLabel}: {hud.robot?.moodReasonLabel}
        </Text>
      </View>

      <View
        style={{
          flexDirection: 'row',
          gap: SPACING.one,
          justifyContent: 'center',
        }}
      >
        <Button
          variant="ghost"
          onPress={() => navigate(STATIC_ROUTES.LESSON_MAP)}
        >
          {t('lessonMap.title')}
        </Button>
        <Button
          variant="ghost"
          onPress={() => navigate(STATIC_ROUTES.WORKSHOP)}
        >
          {t('workshop.title')}
        </Button>
      </View>
      <View style={styles.world}>
        <RoomScene
          view={view}
          onViewChange={setView}
          level={level}
          robotSkin={robotSkin}
          robotAssembly={user?.robot.assembly}
          robotStage={user?.robot.stage}
          robotAction={actionForMood(hud.robot?.moodName ?? null, chosenAction)}
          focusedWatcher={talkingTo}
          onWatcherFocus={setTalkingTo}
          doneCells={doneCells}
          onCellPress={(cell) => {
            const key = cellKey(cell);
            const ordinal = lessonOrdinalForKey(key);
            if (
              user &&
              ordinal !== null &&
              lessonAccess(ordinal, doneCells, user.platform.level).status !==
                'LOCKED'
            )
              navigate(DYNAMIC_ROUTES.lesson(key));
            else navigate(STATIC_ROUTES.LESSON_MAP);
          }}
          isAnimated={hud.isAnimationEnabled}
        />
        {!talkingTo && (
          <View style={styles.levelDock} pointerEvents="box-none">
            <Button
              size="s"
              variant="secondary"
              onPress={() => {
                if (isOutOfPit) navigate(STATIC_ROUTES.HISTORY);
                else if (canUpgrade) setTargetLevel(level + 1);
                else
                  navigate(
                    hud.isPlanning
                      ? STATIC_ROUTES.BUDGET_PLAN
                      : DYNAMIC_ROUTES.goal(PLATFORM_GOAL_ID),
                  );
              }}
            >
              {t('scene.level', { level, total: SCENE_LEVEL_COUNT })} ·{' '}
              {t(
                isOutOfPit
                  ? 'home.progress'
                  : canUpgrade
                    ? 'scene.levelUp'
                    : 'home.liftShort',
                { saved, price },
              )}
            </Button>
          </View>
        )}
      </View>

      <View
        style={[
          styles.footer,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        {talkingTo ? (
          <>
            <Text variant="bodyBold">
              {t(`scene.watchers.${talkingTo}.name`)}
            </Text>
            <Text>{t(`scene.watchers.${talkingTo}.line`)}</Text>
            <View style={styles.actions}>
              <Button
                style={styles.action}
                onPress={() =>
                  navigate(
                    talkingTo === 'overseer'
                      ? STATIC_ROUTES.TASKS
                      : hud.isPlanning
                        ? STATIC_ROUTES.BUDGET_PLAN
                        : STATIC_ROUTES.END_PERIOD,
                  )
                }
              >
                {t(
                  talkingTo === 'overseer'
                    ? 'home.tasksAction'
                    : hud.isPlanning
                      ? 'home.planBannerAction'
                      : 'home.endBannerTitle',
                )}
              </Button>
              <Button
                style={styles.action}
                variant="secondary"
                onPress={() => setTalkingTo(null)}
              >
                {t('scene.watcherLeave')}
              </Button>
            </View>
          </>
        ) : (
          <>
            <Pressable
              accessibilityRole="button"
              onPress={() => navigate(STATIC_ROUTES.SAVINGS)}
              style={styles.infoRow}
            >
              <Text variant="bodyBold">
                {hud.goal?.title ?? t('home.goal.none')}
              </Text>
              <Text variant="body" themeColor="textSecondary">
                {hud.goal?.progressLabel ?? t('home.goal.noneHint')}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() =>
                navigate(
                  user.tasks.activeTaskId
                    ? DYNAMIC_ROUTES.task(user.tasks.activeTaskId)
                    : STATIC_ROUTES.TASKS,
                )
              }
              style={styles.infoRow}
            >
              <Text variant="bodyBold">{hud.taskTitle}</Text>
            </Pressable>
            <View style={styles.actions}>
              <Button
                style={styles.action}
                onPress={() =>
                  navigate(
                    hud.isPlanning
                      ? STATIC_ROUTES.BUDGET_PLAN
                      : STATIC_ROUTES.END_PERIOD,
                  )
                }
              >
                {t(
                  hud.isPlanning
                    ? 'home.planBannerAction'
                    : 'home.endBannerTitle',
                )}
              </Button>
              <Button
                style={styles.action}
                variant="secondary"
                onPress={() => navigate(STATIC_ROUTES.SHOP)}
              >
                {t('home.shopAction')}
              </Button>
            </View>
            <View style={styles.actions}>
              <Button
                size="s"
                style={styles.action}
                variant="secondary"
                onPress={() => navigate(STATIC_ROUTES.TASKS)}
              >
                {t('home.tasksAction')}
              </Button>
              <Button
                size="s"
                style={styles.action}
                variant="secondary"
                onPress={() => setMenuVisible(true)}
              >
                {t('home.moreAction')}
              </Button>
            </View>
          </>
        )}
      </View>

      {(!user.playerName || !user.robot.name) && (
        <RobotSetup isIntroduction onClose={() => {}} />
      )}
      <Sheet.Modal
        isVisible={isMenuVisible}
        onClose={() => setMenuVisible(false)}
        isAnimated={hud.isAnimationEnabled}
      >
        <Sheet.Title>{t('home.moreAction')}</Sheet.Title>
        <ScrollView contentContainerStyle={styles.menu}>
          {hud.lastCredit && (
            <Text>
              {t('home.lastCredit')}: +{formatMoney(hud.lastCredit.amount)} ·{' '}
              {hud.lastCredit.reasonLabel}
            </Text>
          )}
          <Button
            variant="secondary"
            onPress={() => navigate(STATIC_ROUTES.SAVINGS)}
          >
            {t('home.savings')}
          </Button>
          {hud.isPlanning ? (
            <Button
              variant="secondary"
              onPress={() => navigate(STATIC_ROUTES.BUDGET_PLAN)}
            >
              {t('home.budgetAction')}
            </Button>
          ) : (
            <View style={styles.menu}>
              <Text variant="bodyBold">{t('home.budgetAction')}</Text>
              {(['needs', 'wants', 'savings'] as const).map((direction) => (
                <Text key={direction}>
                  {t(`budgetPlan.directions.${direction}.title`)}:{' '}
                  {t('history.planFact', {
                    plan: user.period.plan[direction],
                    fact: user.period.fact[direction],
                  })}
                </Text>
              ))}
            </View>
          )}
          <Button
            variant="secondary"
            onPress={() => navigate(STATIC_ROUTES.HISTORY)}
          >
            {t('home.progress')}
          </Button>
          <Button
            variant="secondary"
            onPress={() => navigate(STATIC_ROUTES.GAMES)}
          >
            {t('home.gamesAction')}
          </Button>
          <Button
            variant="secondary"
            onPress={() => navigate(STATIC_ROUTES.GLOSSARY)}
          >
            {t('home.glossaryAction')}
          </Button>
          <Button
            variant="secondary"
            onPress={() => navigate(STATIC_ROUTES.PARENTS)}
          >
            {t('home.parentsA11y')}
          </Button>
        </ScrollView>
      </Sheet.Modal>
      <Sheet.Modal
        isVisible={targetLevel !== null}
        onClose={() => setTargetLevel(null)}
        isAnimated={hud.isAnimationEnabled}
      >
        <Sheet.Title>
          {t('scene.confirmLiftTitle', { level: targetLevel })}
        </Sheet.Title>
        <Sheet.Description>
          {t('scene.confirmLiftBody', {
            price,
            remaining: Math.max(0, saved - price),
          })}
        </Sheet.Description>
        <Sheet.Actions>
          <Button variant="secondary" onPress={() => setTargetLevel(null)}>
            {t('scene.cancelLift')}
          </Button>
          <Button disabled={!canUpgrade} onPress={confirmUpgrade}>
            {t('scene.confirmLift')}
          </Button>
        </Sheet.Actions>
      </Sheet.Modal>
    </ThemedView>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  action: { flex: 1 },
  actions: { flexDirection: 'row', gap: SPACING.two },
  footer: {
    alignSelf: 'center',
    borderTopWidth: 1,
    borderTopLeftRadius: RADII.l,
    borderTopRightRadius: RADII.l,
    gap: SPACING.one,
    maxWidth: MAX_CONTENT_WIDTH,
    paddingHorizontal: CONTENT_PADDING,
    paddingVertical: SPACING.two,
    width: '100%',
  },
  header: {
    alignSelf: 'center',
    maxWidth: MAX_CONTENT_WIDTH,
    paddingHorizontal: CONTENT_PADDING,
    paddingBottom: SPACING.one,
    width: '100%',
  },
  iconButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    minWidth: 48,
  },
  infoRow: { justifyContent: 'center', minHeight: 48 },
  levelDock: {
    alignItems: 'center',
    left: CONTENT_PADDING,
    position: 'absolute',
    right: CONTENT_PADDING,
    top: SPACING.one,
  },
  menu: { gap: SPACING.two },
  root: { flex: 1 },
  stat: { flex: 1, justifyContent: 'center', minHeight: 48 },
  stats: { alignItems: 'center', flexDirection: 'row', gap: SPACING.two },
  world: { flex: 1, minHeight: 120 },
});
