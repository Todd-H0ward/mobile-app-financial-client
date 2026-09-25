import { useCallback, useRef, useState } from 'react';

import { Redirect, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import {
  ArcadeRecordsBoard,
  ConsoleDevice,
  ConsoleVolumeButton,
} from '@/widgets/minigame/console';
import { SpacewarScene } from '@/widgets/minigame/spacewar';

import { useArcadeSession } from '@/features/arcade-session';

import {
  isConsoleOwned,
  useArcadeScoresStore,
} from '@/entities/minigame/console';
import { useUser } from '@/entities/user';

import { SPACING, STATIC_ROUTES } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import { useTranslation } from '@/shared/i18n';
import { Button, Screen, Sheet, Text } from '@/shared/ui';
import { formatMoney } from '@/shared/utils';

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

export const SpacewarScreen = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const user = useUser();
  const session = useArcadeSession('spacewar');
  const [rewardReason, setRewardReason] = useState('paid');
  const submitSpacewar = useArcadeScoresStore((state) => state.submitSpacewar);
  const spacewarMs = useArcadeScoresStore((state) => state.spacewarMs);

  const ownedItemIds = user?.ownedItemIds ?? [];
  const isOwned = isConsoleOwned(ownedItemIds);
  const [isPlaying, setIsPlaying] = useState(false);
  const [reward, setReward] = useState<number | null>(null);
  const [runId, setRunId] = useState(0);
  const didPay = useRef(false);

  const onComplete = useCallback(
    (elapsedMs: number) => {
      if (didPay.current || !user) return;
      didPay.current = true;

      const result = session.complete();
      if (!result) {
        didPay.current = false;
        return;
      }
      submitSpacewar(elapsedMs);
      setRewardReason(result.reason);
      setReward(result.coins);
    },
    [submitSpacewar, session.complete, user],
  );

  if (!isOwned) {
    return <Redirect href={STATIC_ROUTES.HOME} />;
  }

  return (
    <Screen isTabBarVisible={false} isScrollable={false}>
      <Screen.Header>
        <Screen.Back />
        <Screen.Heading>
          <Screen.Title>{t('games.spacewar.title')}</Screen.Title>
        </Screen.Heading>
      </Screen.Header>
      <Text themeColor="textSecondary">
        {t(
          session.paidRemaining > 0
            ? 'games.paidRemaining'
            : 'games.practiceAvailable',
          { count: session.paidRemaining },
        )}
      </Text>

      {isPlaying ? (
        <SpacewarScene key={runId} onComplete={onComplete} />
      ) : (
        <View style={styles.menu}>
          <ConsoleDevice
            style={styles.device}
            controls={
              <ConsoleVolumeButton
                accessibilityLabel={t('games.spacewar.start')}
                onPress={() => {
                  if (!session.start()) return;
                  didPay.current = false;
                  setRunId((id) => id + 1);
                  setIsPlaying(true);
                }}
                face={theme.arcadeButtonA}
                depth={theme.arcadeShellDeep}
                size={72}
                isRound
                minWidth={140}
              >
                <Text variant="smallBold" themeColor="inverseText">
                  {t('games.spacewar.start')}
                </Text>
              </ConsoleVolumeButton>
            }
          >
            <View style={styles.menuBody}>
              <Text
                variant="subtitle"
                style={{ color: theme.arcadeLcd, marginBottom: SPACING.two }}
              >
                {t('games.spacewar.title')}
              </Text>
              <Text
                variant="small"
                style={{
                  color: theme.arcadeLcdDim,
                  marginBottom: SPACING.three,
                }}
              >
                {t('games.spacewar.blurb')}
              </Text>
              <ArcadeRecordsBoard kind="spacewar" scores={spacewarMs} />
            </View>
          </ConsoleDevice>
        </View>
      )}

      <Sheet.Modal
        isVisible={reward != null}
        onClose={() => {
          setReward(null);
          setIsPlaying(false);
        }}
      >
        <Sheet.Title>{t('games.spacewar.completeTitle')}</Sheet.Title>
        <Text themeColor="textSecondary">
          {t(
            rewardReason === 'paid'
              ? 'games.spacewar.completeBody'
              : `games.practice.${rewardReason}`,
            {
              reward: formatMoney(reward ?? 0),
            },
          )}
        </Text>
        <Button
          isFullWidth
          onPress={() => {
            setReward(null);
            setIsPlaying(false);
          }}
        >
          {t('games.spacewar.completeClose')}
        </Button>
        <Button
          variant="ghost"
          isFullWidth
          onPress={() => router.replace(STATIC_ROUTES.GAMES_CONSOLE)}
        >
          {t('games.console.title')}
        </Button>
      </Sheet.Modal>
    </Screen>
  );
};

export const SpacewarRouteScreen = SpacewarScreen;

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  device: {
    flex: 1,
    minHeight: 0,
  },
  menu: {
    flex: 1,
    minHeight: 0,
    paddingHorizontal: SPACING.two,
  },
  menuBody: {
    flex: 1,
    justifyContent: 'center',
    minHeight: 0,
  },
});
