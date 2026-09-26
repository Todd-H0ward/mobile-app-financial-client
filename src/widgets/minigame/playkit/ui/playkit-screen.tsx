import { useCallback, useEffect, useRef, useState } from 'react';

import { useRouter } from 'expo-router';

import { useArcadeSession } from '@/features/arcade-session';

import type { PlaykitGameId } from '@/entities/minigame';
import {
  isPlaykitAnswerCorrect,
  playkitAnswerLabel,
  playkitCorrectLabel,
  playkitRound,
} from '@/entities/minigame/playkit';

import { FONTS, SPACING, STATIC_ROUTES } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import { useTranslation } from '@/shared/i18n';
import { useTimeSource } from '@/shared/lib';
import { Text } from '@/shared/ui';

import { PlayDebrief, PlayShell } from './play-shell';
import {
  AssembleScene,
  CashierScene,
  ConveyorScene,
  JarScene,
  LaserScene,
  MemoryScene,
  OrbitScene,
  PathScene,
  PinballScene,
  ScalesScene,
} from './scenes';
import { TrialReadout } from './trial-chrome';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface PlaykitScreenProps {
  gameId: PlaykitGameId;
}

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

/**
 * Three gesture rounds for one Overseer playkit game.
 *
 * Same arcade contract as finance: start on mount, complete after round 3,
 * miss still pays a share.
 */
export const PlaykitScreen = ({ gameId }: PlaykitScreenProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const time = useTimeSource();
  const [at] = useState(() => time.now());
  const session = useArcadeSession(gameId);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<unknown>(null);
  const [isDebrief, setDebrief] = useState(false);
  const [result, setResult] = useState('');
  const [isReady, setReady] = useState(false);
  const gate = useRef(false);
  const correctCount = useRef(0);
  const round = playkitRound(gameId, at, Math.min(index, 2));

  useEffect(() => {
    session.start();
  }, [session.start]);

  const onReady = useCallback((payload: unknown) => {
    if (gate.current) return;
    setAnswer(payload);
    setReady(true);
  }, []);

  const check = () => {
    if (!isReady || gate.current || index >= 3) return;
    gate.current = true;
    if (isPlaykitAnswerCorrect(round, answer)) correctCount.current += 1;
    setDebrief(true);
  };

  const continueRound = () => {
    if (!gate.current) return;
    if (index === 2) {
      const paid = session.complete(undefined, correctCount.current === 3);
      if (!paid) return;
      setResult(t(`financeGame.result.${paid.reason}`, { coins: paid.coins }));
    }
    setDebrief(false);
    setIndex((n) => n + 1);
    setAnswer(null);
    setReady(false);
    gate.current = false;
  };

  const scene =
    round.kind === 'conveyor' ? (
      <ConveyorScene round={round} onReady={onReady} isLocked={gate.current} />
    ) : round.kind === 'scales' ? (
      <ScalesScene round={round} onReady={onReady} isLocked={gate.current} />
    ) : round.kind === 'cashier' ? (
      <CashierScene round={round} onReady={onReady} isLocked={gate.current} />
    ) : round.kind === 'jar' ? (
      <JarScene round={round} onReady={onReady} isLocked={gate.current} />
    ) : round.kind === 'pinball' ? (
      <PinballScene round={round} onReady={onReady} isLocked={gate.current} />
    ) : round.kind === 'memory' ? (
      <MemoryScene round={round} onReady={onReady} isLocked={gate.current} />
    ) : round.kind === 'path' ? (
      <PathScene round={round} onReady={onReady} isLocked={gate.current} />
    ) : round.kind === 'assemble' ? (
      <AssembleScene round={round} onReady={onReady} isLocked={gate.current} />
    ) : round.kind === 'laser' ? (
      <LaserScene round={round} onReady={onReady} isLocked={gate.current} />
    ) : (
      <OrbitScene round={round} onReady={onReady} isLocked={gate.current} />
    );

  return (
    <PlayShell
      title={t(`playkit.games.${gameId}.title`)}
      round={index}
      hint={t(`playkit.games.${gameId}.blurb`)}
      action={index === 3 ? t('common.back') : t('financeGame.check')}
      onAction={index === 3 ? () => router.replace(STATIC_ROUTES.HOME) : check}
      isDisabled={index < 3 && !isReady}
    >
      {index === 3 ? <TrialReadout isPrompt>{result}</TrialReadout> : scene}
      <Text
        style={{
          color: theme.overseerLcdDim,
          fontFamily: FONTS.mono,
          fontSize: 11,
          letterSpacing: 1,
          marginTop: SPACING.one,
        }}
      >
        {t('playkit.ui.noPenalty')}
      </Text>
      <PlayDebrief
        isVisible={isDebrief}
        summary={t('financeGame.comparison', {
          chosen: playkitAnswerLabel(round, answer, t),
          correct: playkitCorrectLabel(round, t),
        })}
        explanation={round.explanation}
        onClose={continueRound}
      />
    </PlayShell>
  );
};

export type { PlaykitScreenProps };
