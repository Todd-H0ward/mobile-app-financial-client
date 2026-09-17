import { useCallback, useRef, useState } from 'react';

import { Redirect, useRouter } from 'expo-router';

import { PuzzleScene } from '@/widgets/minigame/puzzle';

import { WALLET_SOURCES } from '@/entities/economy';
import { payoutFor } from '@/entities/minigame';
import { isPuzzleOwned, puzzleById } from '@/entities/minigame/puzzle';
import { creditWallet, useUser, useUserStore } from '@/entities/user';

import { STATIC_ROUTES } from '@/shared/constants';
import { useTranslation } from '@/shared/i18n';
import { useTimeSource } from '@/shared/lib';
import { Button, Screen, Sheet, Text } from '@/shared/ui';
import { formatMoney } from '@/shared/utils';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface PuzzleScreenProps {
  puzzleId: string;
}

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

/**
 * One puzzle sitting. Completing the board credits the arcade payout once and
 * opens a short debrief — no ads, no double-coins.
 */
export const PuzzleScreen = ({ puzzleId }: PuzzleScreenProps) => {
  const { t } = useTranslation();
  const router = useRouter();
  const time = useTimeSource();
  const user = useUser();
  const updateUser = useUserStore((state) => state.updateUser);

  const puzzle = puzzleById(puzzleId);
  const furnitureIds = user?.home.furnitureIds ?? [];
  const isOwned = puzzle != null && isPuzzleOwned(furnitureIds, puzzle.id);
  const [reward, setReward] = useState<number | null>(null);
  const didPay = useRef(false);

  const title = puzzle
    ? t(`games.puzzle.levels.${puzzle.id}`, { defaultValue: puzzle.id })
    : '';

  const onComplete = useCallback(() => {
    if (didPay.current || !user) return;
    didPay.current = true;

    const coins = payoutFor({ gameId: 'puzzle', isCorrect: true });
    updateUser((current) => ({
      ...current,
      wallet: creditWallet(current.wallet, {
        source: WALLET_SOURCES.gamePuzzle,
        amount: coins,
        direction: null,
        periodIndex: current.period.index,
        at: time.now(),
      }),
    }));
    setReward(coins);
  }, [time, updateUser, user]);

  if (!puzzle || !isOwned) {
    return <Redirect href={STATIC_ROUTES.HOME} />;
  }

  return (
    <Screen isTabBarVisible={false} isScrollable={false}>
      <Screen.Header>
        <Screen.Back />
        <Screen.Heading>
          <Screen.Title>{title}</Screen.Title>
        </Screen.Heading>
      </Screen.Header>

      <PuzzleScene puzzle={puzzle} onComplete={onComplete} />

      <Sheet.Modal
        isVisible={reward != null}
        onClose={() => router.replace(STATIC_ROUTES.HOME)}
      >
        <Sheet.Title>{t('games.puzzle.completeTitle')}</Sheet.Title>
        <Text themeColor="textSecondary">
          {t('games.puzzle.completeBody', {
            reward: formatMoney(reward ?? 0),
          })}
        </Text>
        <Button isFullWidth onPress={() => router.replace(STATIC_ROUTES.HOME)}>
          {t('games.puzzle.completeClose')}
        </Button>
      </Sheet.Modal>
    </Screen>
  );
};

export const PuzzleRouteScreen = PuzzleScreen;

export type { PuzzleScreenProps };
