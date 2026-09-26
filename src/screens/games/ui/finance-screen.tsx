import { useEffect, useRef, useState } from 'react';

import { useRouter } from 'expo-router';

import { DebriefSheet, GameShell } from '@/widgets/minigame/finance';

import { useArcadeSession } from '@/features/arcade-session';

import {
  type FinanceGame,
  financeRound,
  financeWeek,
} from '@/entities/minigame/finance';
import { useUser } from '@/entities/user';

import { STATIC_ROUTES } from '@/shared/constants';
import { useTranslation } from '@/shared/i18n';
import { useTimeSource } from '@/shared/lib';
import { Button, Text } from '@/shared/ui';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════
interface FinanceScreenProps {
  game: FinanceGame;
}

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════
export const FinanceScreen = ({ game }: FinanceScreenProps) => {
  const { t } = useTranslation();
  const router = useRouter();
  const time = useTimeSource();
  const user = useUser();
  const [at] = useState(() => time.now());
  const session = useArcadeSession(game);
  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState<number | null>(null);
  const [isDebrief, setDebrief] = useState(false);
  const [result, setResult] = useState('');
  const gate = useRef(false);
  const correct = useRef(0);
  const round = financeRound(game, at, index);
  useEffect(() => {
    session.start();
  }, [session.start]);
  const next = () => {
    if (choice === null || gate.current) return;
    gate.current = true;
    if (choice === round.correct) correct.current += 1;
    setDebrief(true);
  };
  const continueRound = () => {
    if (!gate.current) return;
    if (index === 2) {
      const paid = session.complete(undefined, correct.current === 3);
      if (!paid) return;
      setResult(t(`financeGame.result.${paid.reason}`, { coins: paid.coins }));
    }
    setDebrief(false);
    setIndex((n) => n + 1);
    setChoice(null);
    gate.current = false;
  };
  const isWeeklyPaid =
    game === 'weekly' && (user?.arcade.paidWeek ?? -1) >= financeWeek(at);
  return (
    <GameShell
      title={t(`financeGame.${game}`)}
      round={index}
      action={index === 3 ? t('common.back') : t('financeGame.check')}
      onAction={index === 3 ? () => router.replace(STATIC_ROUTES.GAMES) : next}
      isDisabled={index < 3 && choice === null}
    >
      {index === 3 ? (
        <Text>{result}</Text>
      ) : (
        <>
          <Text>
            {isWeeklyPaid
              ? t('financeGame.weeklyPractice')
              : t('financeGame.remaining', { count: session.paidRemaining })}
          </Text>
          <Text>{t('financeGame.noPenalty')}</Text>
          <Text variant="subtitle">{round.question}</Text>
          {round.options.map((option, n) => (
            <Button
              key={option}
              variant={choice === n ? 'primary' : 'secondary'}
              accessibilityState={{ selected: choice === n }}
              onPress={() => {
                if (!gate.current) setChoice(n);
              }}
            >
              {option}
            </Button>
          ))}
        </>
      )}
      <DebriefSheet
        isVisible={isDebrief}
        chosen={choice === null ? '' : round.options[choice]}
        correct={round.options[round.correct]}
        explanation={round.explanation}
        onClose={continueRound}
      />
    </GameShell>
  );
};
export const MarketScreen = () => <FinanceScreen game="market" />;
export const WeeklyScreen = () => <FinanceScreen game="weekly" />;
export type { FinanceScreenProps };
