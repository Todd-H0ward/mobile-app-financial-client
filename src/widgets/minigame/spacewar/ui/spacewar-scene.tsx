import { useEffect, useRef, useState } from 'react';

import { Image, StyleSheet, useWindowDimensions, View } from 'react-native';

import { ConsoleDevice, ConsoleVolumeButton } from '@/widgets/minigame/console';

import {
  createSpacewarSession,
  FRAME_MS,
  fireBullet,
  SHIP_Y,
  type SpacewarSession,
  steerShip,
  tickSpacewar,
  WIN_HITS,
} from '@/entities/minigame/spacewar';

import { RADII, SPACING } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import { useTranslation } from '@/shared/i18n';
import { Text } from '@/shared/ui';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface SpacewarSceneProps {
  /** Called once on win with elapsed clear time in ms. */
  onComplete: (elapsedMs: number) => void;
}

type SteerAxis = -1 | 0 | 1;

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

const SHIP_SOURCE = require('@/assets/images/games/spacewar-ship.png');
const TARGET_SOURCE = require('@/assets/images/games/spacewar-target.png');

const SHIP_W = 44;
const SHIP_H = 44;
const TARGET_SIZE = 36;
const SHELL_INSET = SPACING.five * 2 + SPACING.three * 2;

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

/**
 * Spacewar on the handheld LCD — textured ship / targets, raised face buttons.
 */
export const SpacewarScene = ({ onComplete }: SpacewarSceneProps) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const [session, setSession] = useState<SpacewarSession>(() =>
    createSpacewarSession(),
  );
  const steerRef = useRef<SteerAxis>(0);
  const didComplete = useRef(false);
  const startedAt = useRef(Date.now());

  const fieldWidth = Math.min(width - SHELL_INSET, 320);
  const fieldHeight = fieldWidth * 1.1;

  useEffect(() => {
    if (session.isWon) return;
    const id = setInterval(() => {
      const dt = FRAME_MS / 1000;
      setSession((current) => {
        const steered = steerShip(current, steerRef.current, dt);
        return tickSpacewar(steered, dt);
      });
    }, FRAME_MS);
    return () => clearInterval(id);
  }, [session.isWon]);

  useEffect(() => {
    if (!session.isWon || didComplete.current) return;
    didComplete.current = true;
    onComplete(Date.now() - startedAt.current);
  }, [onComplete, session.isWon]);

  const setSteer = (axis: SteerAxis) => {
    steerRef.current = axis;
  };

  return (
    <View style={styles.root}>
      <ConsoleDevice
        controls={
          <View style={styles.controls}>
            <ConsoleVolumeButton
              accessibilityLabel={t('games.spacewar.left')}
              onPressIn={() => setSteer(-1)}
              onPressOut={() => setSteer(0)}
              face={theme.arcadeDpadFace}
              depth={theme.arcadeDpad}
              size={56}
            >
              <Text variant="title">←</Text>
            </ConsoleVolumeButton>

            <ConsoleVolumeButton
              accessibilityLabel={t('games.spacewar.fire')}
              onPress={() => setSession((current) => fireBullet(current))}
              face={theme.arcadeButtonA}
              depth={theme.arcadeShellDeep}
              size={72}
              isRound
              minWidth={96}
            >
              <Text variant="smallBold" themeColor="inverseText">
                {t('games.spacewar.fire')}
              </Text>
            </ConsoleVolumeButton>

            <ConsoleVolumeButton
              accessibilityLabel={t('games.spacewar.right')}
              onPressIn={() => setSteer(1)}
              onPressOut={() => setSteer(0)}
              face={theme.arcadeDpadFace}
              depth={theme.arcadeDpad}
              size={56}
            >
              <Text variant="title">→</Text>
            </ConsoleVolumeButton>
          </View>
        }
      >
        <Text
          variant="smallBold"
          style={{ color: theme.arcadeLcd, marginBottom: SPACING.two }}
        >
          {t('games.spacewar.progress', {
            hits: session.hits,
            goal: WIN_HITS,
          })}
        </Text>

        <View style={styles.fieldHost}>
          <View
            style={[
              styles.field,
              {
                backgroundColor: theme.arcadeScreenGlow,
                borderColor: theme.arcadeLcdDim,
                height: fieldHeight,
                width: fieldWidth,
              },
            ]}
            accessibilityLabel={t('games.spacewar.fieldA11y')}
          >
            {session.targets.map((target) => (
              <Image
                key={target.id}
                source={TARGET_SOURCE}
                style={[
                  styles.target,
                  {
                    left: target.position.x * fieldWidth - TARGET_SIZE / 2,
                    top: target.position.y * fieldHeight - TARGET_SIZE / 2,
                  },
                ]}
                resizeMode="contain"
              />
            ))}
            {session.bullets.map((bullet) => (
              <View
                key={bullet.id}
                style={[
                  styles.bullet,
                  {
                    backgroundColor: theme.arcadeLcd,
                    left: bullet.position.x * fieldWidth - 4,
                    top: bullet.position.y * fieldHeight - 8,
                  },
                ]}
              />
            ))}
            <Image
              source={SHIP_SOURCE}
              style={[
                styles.ship,
                {
                  left: session.shipX * fieldWidth - SHIP_W / 2,
                  top: SHIP_Y * fieldHeight - SHIP_H / 2,
                },
              ]}
              resizeMode="contain"
            />
          </View>
        </View>
      </ConsoleDevice>
    </View>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  bullet: {
    borderRadius: RADII.pill,
    height: 16,
    position: 'absolute',
    width: 8,
  },
  controls: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: SPACING.two,
    justifyContent: 'space-between',
  },
  field: {
    borderRadius: RADII.m,
    borderWidth: 1,
    overflow: 'hidden',
  },
  fieldHost: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minHeight: 0,
  },
  root: {
    flex: 1,
    minHeight: 0,
    paddingHorizontal: SPACING.two,
  },
  ship: {
    height: SHIP_H,
    position: 'absolute',
    width: SHIP_W,
  },
  target: {
    height: TARGET_SIZE,
    position: 'absolute',
    width: TARGET_SIZE,
  },
});

export type { SpacewarSceneProps };
