import { useCallback, useRef, useState } from 'react';

import { Redirect, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import {
  ArcadeRecordsBoard,
  ConsoleDevice,
  ConsoleVolumeButton,
} from '@/widgets/minigame/console';
import { SnakeScene } from '@/widgets/minigame/snake';

import { WALLET_SOURCES } from '@/entities/economy';
import { payoutFor } from '@/entities/minigame';
import {
  isConsoleOwned,
  useArcadeScoresStore,
} from '@/entities/minigame/console';
import { creditWallet, useUser, useUserStore } from '@/entities/user';

import { SPACING, STATIC_ROUTES } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import { useTranslation } from '@/shared/i18n';
import { useTimeSource } from '@/shared/lib';
import { Button, Screen, Sheet, Text } from '@/shared/ui';
import { formatMoney } from '@/shared/utils';

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

/**
 * Snake sitting: records + Start on the LCD, then endless play.
 */
export const SnakeScreen = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const time = useTimeSource();
  const user = useUser();
  const updateUser = useUserStore((state) => state.updateUser);
  const submitSnake = useArcadeScoresStore((state) => state.submitSnake);
  const snakeScores = useArcadeScoresStore((state) => state.snake);

  const furnitureIds = user?.home.furnitureIds ?? [];
  const isOwned = isConsoleOwned(furnitureIds);
  const [isPlaying, setIsPlaying] = useState(false);
  const [reward, setReward] = useState<number | null>(null);
  const [runId, setRunId] = useState(0);
  const didPay = useRef(false);

  const onComplete = useCallback(
    (apples: number) => {
      if (didPay.current || !user) return;
      didPay.current = true;

      submitSnake(apples);
      const coins = payoutFor({ gameId: 'snake', isCorrect: true });
      updateUser((current) => ({
        ...current,
        wallet: creditWallet(current.wallet, {
          source: WALLET_SOURCES.gameSnake,
          amount: coins,
          direction: null,
          periodIndex: current.period.index,
          at: time.now(),
        }),
      }));
      setReward(coins);
    },
    [submitSnake, time, updateUser, user],
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
          {t('games.snake.completeBody', {
            reward: formatMoney(reward ?? 0),
          })}
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
