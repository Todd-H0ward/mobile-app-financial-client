import { useCallback, useRef, useState } from 'react';

import { Redirect, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import {
  ArcadeRecordsBoard,
  ConsoleDevice,
  ConsoleVolumeButton,
} from '@/widgets/minigame/console';
import { SnakeScene } from '@/widgets/minigame/snake';

import { useArcadeSession } from '@/features/arcade-session';

import { isConsoleOwned } from '@/entities/minigame/console';
import { useUser } from '@/entities/user';

import { SPACING, STATIC_ROUTES } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import { useTranslation } from '@/shared/i18n';
import { Button, Screen, Sheet, Text } from '@/shared/ui';
import { formatMoney } from '@/shared/utils';

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

export const SnakeScreen = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const user = useUser();
  const session = useArcadeSession('snake');
  const [rewardReason, setRewardReason] = useState('paid');
  const snakeScores = user?.arcade.scores.snake ?? [];

  const ownedItemIds = user?.ownedItemIds ?? [];
  const isOwned = isConsoleOwned(ownedItemIds);
  const [isPlaying, setIsPlaying] = useState(false);
  const [reward, setReward] = useState<number | null>(null);
  const [runId, setRunId] = useState(0);
  const didPay = useRef(false);

  const onComplete = useCallback(
    (apples: number) => {
      if (didPay.current || !user) return;
      didPay.current = true;

      const result = session.complete(apples);
      if (!result) {
        didPay.current = false;
        return;
      }
      setRewardReason(result.reason);
      setReward(result.coins);
    },
    [session.complete, user],
  );

  if (!isOwned) {
    return <Redirect href={STATIC_ROUTES.HOME} />;
  }

  return (
    <Screen isTabBarVisible={false} isScrollable={false}>
      <Screen.Header>
        <Screen.Back />
        <Screen.Heading>
          <Screen.Title>{t('games.snake.title')}</Screen.Title>
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
        <SnakeScene key={runId} onComplete={onComplete} />
      ) : (
        <View style={styles.menu}>
          <ConsoleDevice
            style={styles.device}
            controls={
              <ConsoleVolumeButton
                accessibilityLabel={t('games.snake.start')}
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
                  {t('games.snake.start')}
                </Text>
              </ConsoleVolumeButton>
            }
          >
            <View style={styles.menuBody}>
              <Text
                variant="subtitle"
                style={{ color: theme.arcadeLcd, marginBottom: SPACING.two }}
              >
                {t('games.snake.title')}
              </Text>
              <Text
                variant="small"
                style={{
                  color: theme.arcadeLcdDim,
                  marginBottom: SPACING.three,
                }}
              >
                {t('games.snake.blurb')}
              </Text>
              <ArcadeRecordsBoard kind="snake" scores={snakeScores} />
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
        <Sheet.Title>{t('games.snake.completeTitle')}</Sheet.Title>
        <Text themeColor="textSecondary">
          {t(
            rewardReason === 'paid'
              ? 'games.snake.completeBody'
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
          {t('games.snake.completeClose')}
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

export const SnakeRouteScreen = SnakeScreen;

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
