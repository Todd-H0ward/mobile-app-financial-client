import { useCallback, useEffect, useMemo, useState } from 'react';

import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';

import {
  ConsoleDevice,
  ConsoleDpad,
  ConsoleFaceButtons,
} from '@/widgets/minigame/console';

import {
  CLAIM_APPLES,
  canClaimSnake,
  createSnakeSession,
  type Direction,
  GRID_SIZE,
  queueDirection,
  type SnakeSession,
  TICK_MS,
  tickSnake,
} from '@/entities/minigame/snake';

import { RADII, SPACING } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import { useTranslation } from '@/shared/i18n';
import { Text } from '@/shared/ui';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface SnakeSceneProps {
  /** Cash-out — apples eaten when the child claims after CLAIM_APPLES. */
  onComplete: (apples: number) => void;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

const SWIPE_THRESHOLD = 24;

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

/**
 * Endless snake on the handheld LCD — swipes and D-pad. Cash out after
 * {@link CLAIM_APPLES}; bumps restart the body and keep the score.
 */
export const SnakeScene = ({ onComplete }: SnakeSceneProps) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const [session, setSession] = useState<SnakeSession>(() =>
    createSnakeSession(),
  );
  const [isClaimed, setIsClaimed] = useState(false);

  const boardSize = Math.min(width - SHELL_INSET, 280);
  const cell = boardSize / GRID_SIZE;
  const isClaimReady = canClaimSnake(session) && !isClaimed;

  useEffect(() => {
    if (isClaimed) return;
    const id = setInterval(() => {
      setSession((current) => tickSnake(current));
    }, TICK_MS);
    return () => clearInterval(id);
  }, [isClaimed]);

  const turn = useCallback((direction: Direction) => {
    setSession((current) => queueDirection(current, direction));
  }, []);

  const claim = useCallback(() => {
    if (!canClaimSnake(session) || isClaimed) return;
    setIsClaimed(true);
    onComplete(session.applesEaten);
  }, [isClaimed, onComplete, session]);

  const gesture = useMemo(
    () =>
      Gesture.Pan().onEnd((event) => {
        'worklet';
        const { translationX, translationY } = event;
        if (
          Math.abs(translationX) < SWIPE_THRESHOLD &&
          Math.abs(translationY) < SWIPE_THRESHOLD
        ) {
          return;
        }
        if (Math.abs(translationX) > Math.abs(translationY)) {
          runOnJS(turn)(translationX > 0 ? 'right' : 'left');
        } else {
          runOnJS(turn)(translationY > 0 ? 'down' : 'up');
        }
      }),
    [turn],
  );

  return (
    <View style={styles.root}>
      <ConsoleDevice
        controls={
          <View style={styles.controlRow}>
            <ConsoleDpad
              onPress={turn}
              upLabel={t('games.snake.up')}
              downLabel={t('games.snake.down')}
              leftLabel={t('games.snake.left')}
              rightLabel={t('games.snake.right')}
            />
            <ConsoleFaceButtons
              primaryLabel={t('games.snake.claim')}
              onPrimary={claim}
              isPrimaryDisabled={!isClaimReady}
            />
          </View>
        }
      >
        <Text
          variant="smallBold"
          style={{ color: theme.arcadeLcd, marginBottom: SPACING.two }}
        >
          {t('games.snake.progress', {
            eaten: session.applesEaten,
            claim: CLAIM_APPLES,
          })}
        </Text>

        <GestureDetector gesture={gesture}>
          <View style={styles.boardHost}>
            <View
              style={[
                styles.board,
                {
                  backgroundColor: theme.arcadeScreenGlow,
                  borderColor: theme.arcadeLcdDim,
                  height: boardSize,
                  width: boardSize,
                },
              ]}
              accessibilityLabel={t('games.snake.fieldA11y')}
            >
              <View
                style={[
                  styles.apple,
                  {
                    backgroundColor: theme.snakeApple,
                    height: cell * 0.7,
                    left: session.apple.x * cell + cell * 0.15,
                    top: session.apple.y * cell + cell * 0.15,
                    width: cell * 0.7,
                  },
                ]}
              />
              {session.snake.map((segment, index) => (
                <View
                  key={`${segment.x}-${segment.y}-${index}`}
                  style={[
                    styles.segment,
                    {
                      backgroundColor:
                        index === 0 ? theme.snakeHead : theme.snakeBody,
                      height: cell * 0.85,
                      left: segment.x * cell + cell * 0.075,
                      top: segment.y * cell + cell * 0.075,
                      width: cell * 0.85,
                    },
                  ]}
                />
              ))}
            </View>
          </View>
        </GestureDetector>

        <Text
          variant="small"
          style={{ color: theme.arcadeLcdDim, marginTop: SPACING.two }}
        >
          {t('games.snake.hint')}
        </Text>
      </ConsoleDevice>
    </View>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const SHELL_INSET = SPACING.five * 2 + SPACING.three * 2;

const styles = StyleSheet.create({
  apple: {
    borderRadius: RADII.pill,
    position: 'absolute',
  },
  board: {
    borderRadius: RADII.m,
    borderWidth: 1,
    overflow: 'hidden',
  },
  boardHost: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minHeight: 0,
  },
  controlRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  root: {
    flex: 1,
    minHeight: 0,
    paddingHorizontal: SPACING.two,
  },
  segment: {
    borderRadius: RADII.xs,
    position: 'absolute',
  },
});

export type { SnakeSceneProps };
