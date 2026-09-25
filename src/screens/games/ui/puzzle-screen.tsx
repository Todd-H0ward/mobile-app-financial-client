import { useCallback, useEffect, useRef, useState } from 'react';

import { Redirect, useRouter } from 'expo-router';

import { PuzzleScene } from '@/widgets/minigame/puzzle';

import { useArcadeSession } from '@/features/arcade-session';

import { isPuzzleOwned, puzzleById } from '@/entities/minigame/puzzle';
import { useUser } from '@/entities/user';

import { STATIC_ROUTES } from '@/shared/constants';
import { useTranslation } from '@/shared/i18n';
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
  const user = useUser();
  const session = useArcadeSession('puzzle');
  const [rewardReason, setRewardReason] = useState('paid');

  const puzzle = puzzleById(puzzleId);
  const ownedItemIds = user?.ownedItemIds ?? [];
  const isOwned = puzzle != null && isPuzzleOwned(ownedItemIds, puzzle.id);
  const [reward, setReward] = useState<number | null>(null);
  const didPay = useRef(false);

  useEffect(() => {
    if (isOwned) session.start();
  }, [isOwned, session.start]);

  const title = puzzle
    ? t(`games.puzzle.levels.${puzzle.id}`, { defaultValue: puzzle.id })
    : '';

  const onComplete = useCallback(() => {
    if (didPay.current || !user) return;
    didPay.current = true;

    const result = session.complete();
    if (!result) {
      didPay.current = false;
      return;
    }
    setRewardReason(result.reason);
    setReward(result.coins);
  }, [session.complete, user]);

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
      <Text themeColor="textSecondary">
        {t(
          session.paidRemaining > 0
            ? 'games.paidRemaining'
            : 'games.practiceAvailable',
          { count: session.paidRemaining },
        )}
      </Text>

      <PuzzleScene puzzle={puzzle} onComplete={onComplete} />

      <Sheet.Modal
        isVisible={reward != null}
        onClose={() => router.replace(STATIC_ROUTES.HOME)}
      >
        <Sheet.Title>{t('games.puzzle.completeTitle')}</Sheet.Title>
        <Text themeColor="textSecondary">
          {t(
            rewardReason === 'paid'
              ? 'games.puzzle.completeBody'
              : `games.practice.${rewardReason}`,
            {
              reward: formatMoney(reward ?? 0),
            },
          )}
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
