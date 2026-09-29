import { useMemo, useState } from 'react';

import { PanResponder, Pressable, StyleSheet, View } from 'react-native';

import type {
  AssembleRound,
  BinId,
  CashierRound,
  ConveyorRound,
  JarRound,
  LaserRound,
  MemoryRound,
  OrbitRound,
  PathRound,
  PinballRound,
  PlaykitRound,
  ScalesRound,
} from '@/entities/minigame/playkit';
import type { SpriteName } from '@/entities/sprite';
import { Sprite } from '@/entities/sprite/ui';

import { FONTS, RADII, SPACING } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import { useTranslation } from '@/shared/i18n';
import { Text } from '@/shared/ui';

import { TrialChip, TrialPanel, TrialReadout } from './trial-chrome';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface SceneProps<T extends PlaykitRound> {
  round: T;
  /** Called when the child locks an answer for the shell's check button. */
  onReady: (payload: unknown) => void;
  /** Whether input is locked (debrief / gate). */
  isLocked: boolean;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

const BIN_SPRITE: Record<BinId, SpriteName> = {
  needs: 'crate',
  wants: 'gift',
  savings: 'piggy',
};

/** What a weight on each pan looks like: charge on needs, modules on wants. */
const SCALE_SPRITE: Record<'needs' | 'wants', SpriteName> = {
  needs: 'bolt',
  wants: 'chip',
};

/** More weights than this would wrap the pan onto a second line. */
const MAX_WEIGHTS = 10;

const PATH_SIDE = 3;

const ORBIT_WIDTH = 140;
const ORBIT_HEIGHT = 100;
const ORBIT_COIN = 32;
const ORBIT_RADIUS_X = 60;
const ORBIT_RADIUS_Y = 40;

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

/** Grid indices with row 0 at the bottom, so the climb reads upwards. */
const PATH_ORDER = Array.from({ length: PATH_SIDE }, (_, row) =>
  Array.from(
    { length: PATH_SIDE },
    (__, col) => (PATH_SIDE - 1 - row) * PATH_SIDE + col,
  ),
).flat();

// ═══════════════════════════════════════════
// SCENES
// ═══════════════════════════════════════════

export const ConveyorScene = ({
  round,
  onReady,
  isLocked,
}: SceneProps<ConveyorRound>) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [picked, setPicked] = useState<BinId | null>(null);
  const pick = (bin: BinId) => {
    if (isLocked) return;
    setPicked(bin);
    onReady(bin);
  };
  return (
    <TrialPanel isWell style={styles.panelFill}>
      <View style={styles.cargo}>
        <Sprite name={round.itemSprite} size={96} />
        <Text style={[styles.monoTitle, { color: theme.primary }]}>
          {round.item}
        </Text>
        <Text style={[styles.monoDim, { color: theme.textSecondary }]}>
          {t('playkit.conveyor.dragHint')}
        </Text>
      </View>
      <View style={styles.row}>
        {(['needs', 'wants', 'savings'] as const).map((bin) => (
          <TrialChip
            key={bin}
            icon={<Sprite name={BIN_SPRITE[bin]} size={40} />}
            label={t(`playkit.bins.${bin}`)}
            isSelected={picked === bin}
            disabled={isLocked}
            onPress={() => pick(bin)}
          />
        ))}
      </View>
    </TrialPanel>
  );
};

export const ScalesScene = ({
  round,
  onReady,
  isLocked,
}: SceneProps<ScalesRound>) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [needs, setNeeds] = useState(0);
  const [wants, setWants] = useState(0);
  const bump = (side: 'needs' | 'wants', delta: number) => {
    if (isLocked) return;
    const nextNeeds = side === 'needs' ? Math.max(0, needs + delta) : needs;
    const nextWants = side === 'wants' ? Math.max(0, wants + delta) : wants;
    setNeeds(nextNeeds);
    setWants(nextWants);
    onReady({ needs: nextNeeds, wants: nextWants });
  };
  return (
    <TrialPanel isWell style={styles.panelFill}>
      <TrialReadout isDim>{t('playkit.scales.hint')}</TrialReadout>
      {(
        [
          ['needs', needs, round.targetNeeds],
          ['wants', wants, round.targetWants],
        ] as const
      ).map(([side, value, target]) => (
        <View key={side} style={styles.pan}>
          <View style={styles.panHead}>
            <Text style={[styles.monoTitle, { color: theme.primary }]}>
              {t(`playkit.bins.${side}`)}
            </Text>
            <Text style={[styles.monoDim, { color: theme.textSecondary }]}>
              {`tgt ${target}`}
            </Text>
          </View>
          <View style={styles.weights}>
            {Array.from(
              { length: Math.min(MAX_WEIGHTS, Math.max(value, target)) },
              (_, unit) => (
                <Sprite
                  key={unit}
                  name={SCALE_SPRITE[side]}
                  size={28}
                  style={unit < value ? undefined : styles.ghost}
                />
              ),
            )}
          </View>
          <View style={styles.row}>
            <TrialChip
              label="−"
              isCompact
              disabled={isLocked}
              onPress={() => bump(side, -1)}
            />
            <Text style={[styles.monoBig, { color: theme.primary }]}>
              {value}
            </Text>
            <TrialChip
              label="+"
              isCompact
              disabled={isLocked}
              onPress={() => bump(side, 1)}
            />
          </View>
        </View>
      ))}
    </TrialPanel>
  );
};

export const CashierScene = ({
  round,
  onReady,
  isLocked,
}: SceneProps<CashierRound>) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [sum, setSum] = useState(0);
  const coins = [1, 2, 5, 10];
  const add = (coin: number) => {
    if (isLocked) return;
    const next = sum + coin;
    setSum(next);
    onReady(next);
  };
  return (
    <TrialPanel isWell style={styles.panelFill}>
      <View style={styles.brief}>
        <Sprite name="register" size={48} />
        <View style={styles.briefText}>
          <TrialReadout>
            {t('playkit.cashier.brief', {
              price: round.price,
              paid: round.paid,
            })}
          </TrialReadout>
        </View>
      </View>
      <Text style={[styles.monoBig, { color: theme.primary }]}>
        {t('playkit.cashier.change', { count: sum })}
      </Text>
      <View style={styles.row}>
        {coins.map((coin) => (
          <Pressable
            key={coin}
            accessibilityRole="button"
            accessibilityLabel={String(coin)}
            disabled={isLocked}
            onPress={() => add(coin)}
            style={({ pressed }) => [styles.coin, pressed && styles.pressed]}
          >
            <Sprite name="coin" size={56} />
            <View style={styles.coinFace}>
              <Text style={[styles.monoTitle, { color: theme.onAccent }]}>
                {coin}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>
      <Pressable
        disabled={isLocked}
        onPress={() => {
          if (isLocked) return;
          setSum(0);
          onReady(0);
        }}
        style={styles.linkHit}
      >
        <Text style={[styles.monoDim, { color: theme.textSecondary }]}>
          {`> ${t('playkit.cashier.reset')}`}
        </Text>
      </Pressable>
    </TrialPanel>
  );
};

export const JarScene = ({
  round,
  onReady,
  isLocked,
}: SceneProps<JarRound>) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [caught, setCaught] = useState<number[]>([]);
  const toggle = (slot: number) => {
    if (isLocked) return;
    const next = caught.includes(slot)
      ? caught.filter((s) => s !== slot)
      : [...caught, slot];
    setCaught(next);
    onReady(next.slice().sort((a, b) => a - b));
  };
  return (
    <TrialPanel isWell style={styles.panelFill}>
      <TrialReadout isDim>{t('playkit.jar.hint')}</TrialReadout>
      <View style={styles.row}>
        {round.slotSprites.map((sprite, slot) => {
          const isOn = caught.includes(slot);
          return (
            <Pressable
              key={slot}
              accessibilityRole="button"
              accessibilityState={{ selected: isOn, disabled: isLocked }}
              accessibilityLabel={t(
                sprite === 'coin' ? 'playkit.jar.coin' : 'playkit.jar.fake',
              )}
              disabled={isLocked}
              onPress={() => toggle(slot)}
              style={[
                styles.tile,
                {
                  borderColor: isOn ? theme.primary : theme.textSecondary,
                  backgroundColor: isOn ? theme.primarySoft : theme.surface,
                },
              ]}
            >
              <Sprite name={sprite} size={40} />
            </Pressable>
          );
        })}
      </View>
      <View style={styles.jarFooter}>
        <Sprite name="jar" size={48} />
        <Text style={[styles.monoDim, { color: theme.textSecondary }]}>
          {t('playkit.jar.picked', { count: caught.length })}
        </Text>
      </View>
    </TrialPanel>
  );
};

export const PinballScene = ({
  round,
  onReady,
  isLocked,
}: SceneProps<PinballRound>) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [aim, setAim] = useState<number | null>(null);
  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !isLocked,
        onPanResponderRelease: (_, gesture) => {
          if (isLocked) return;
          const pocket = gesture.dx < -40 ? 0 : gesture.dx > 40 ? 2 : 1;
          setAim(pocket);
          onReady(pocket);
        },
      }),
    [isLocked, onReady],
  );
  return (
    <TrialPanel isWell style={styles.panelFill}>
      <TrialReadout isDim>{t('playkit.pinball.hint')}</TrialReadout>
      <Text style={[styles.monoDim, { color: theme.textSecondary }]}>
        {t('playkit.pinball.target', { pocket: round.target + 1 })}
      </Text>
      <View
        {...pan.panHandlers}
        style={[
          styles.field,
          {
            borderColor: theme.textSecondary,
            backgroundColor: theme.surface,
          },
        ]}
      >
        <Sprite name="gear" size={48} />
        <Text style={[styles.monoTitle, { color: theme.primary }]}>
          {t('playkit.pinball.swipe')}
        </Text>
        <View style={styles.row}>
          {[0, 1, 2].map((pocket) => (
            <View key={pocket} style={styles.pocketColumn}>
              <View style={styles.pocketMark}>
                {pocket === round.target ? (
                  <Sprite name="coin" size={24} />
                ) : null}
              </View>
              <View
                style={[
                  styles.pocket,
                  {
                    borderColor:
                      aim === pocket ? theme.primary : theme.textSecondary,
                    backgroundColor:
                      aim === pocket ? theme.primarySoft : 'transparent',
                  },
                ]}
              >
                <Sprite name="pocket" size={48} />
                <Text style={[styles.monoTitle, { color: theme.primary }]}>
                  {pocket + 1}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </TrialPanel>
  );
};

export const MemoryScene = ({
  round,
  onReady,
  isLocked,
}: SceneProps<MemoryRound>) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [open, setOpen] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [pending, setPending] = useState<number | null>(null);

  const flip = (index: number) => {
    if (isLocked || matched.includes(index) || open.includes(index)) return;
    if (pending === null) {
      setPending(index);
      setOpen([index]);
      return;
    }
    const mate = round.mates[pending];
    if (mate === index) {
      const next = [...matched, pending, index];
      setMatched(next);
      setOpen([]);
      setPending(null);
      onReady(next.length === 6);
    } else {
      setOpen([pending, index]);
      setTimeout(() => {
        setOpen([]);
        setPending(null);
      }, 450);
      onReady(false);
    }
  };

  return (
    <TrialPanel isWell style={styles.panelFill}>
      <TrialReadout isDim>{t('playkit.memory.hint')}</TrialReadout>
      <View style={styles.grid}>
        {round.cards.map((label, index) => {
          const isFace = open.includes(index) || matched.includes(index);
          const isMatch = matched.includes(index);
          return (
            <Pressable
              key={`${label}-${index}`}
              accessibilityRole="button"
              accessibilityLabel={isFace ? label : t('playkit.memory.back')}
              onPress={() => flip(index)}
              style={[
                styles.memoryCard,
                {
                  borderColor: isMatch
                    ? theme.primary
                    : isFace
                      ? theme.textSecondary
                      : theme.surfaceDeep,
                  backgroundColor: isFace ? theme.primarySoft : theme.surface,
                },
              ]}
            >
              {isFace ? (
                <>
                  <Sprite name={round.cardSprites[index] ?? 'coin'} size={28} />
                  <Text
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.7}
                    style={[styles.monoTitle, { color: theme.primary }]}
                  >
                    {label}
                  </Text>
                </>
              ) : (
                <Sprite name="cardBack" size={44} />
              )}
            </Pressable>
          );
        })}
      </View>
    </TrialPanel>
  );
};

export const PathScene = ({
  round,
  onReady,
  isLocked,
}: SceneProps<PathRound>) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [path, setPath] = useState<number[]>([]);
  const tap = (index: number) => {
    if (isLocked || !round.safe[index]) return;
    const next = [...path, index];
    setPath(next);
    onReady(next);
  };
  return (
    <TrialPanel isWell style={styles.panelFill}>
      <TrialReadout isDim>{t('playkit.path.hint')}</TrialReadout>
      <View style={styles.grid3}>
        {PATH_ORDER.map((index) => {
          const isSafe = round.safe[index] ?? false;
          const isStepped = path.includes(index);
          return (
            <Pressable
              key={index}
              accessibilityRole="button"
              accessibilityState={{
                selected: isStepped,
                disabled: !isSafe || isLocked,
              }}
              disabled={!isSafe || isLocked}
              onPress={() => tap(index)}
              style={[
                styles.cell,
                !isSafe && styles.trapCell,
                {
                  borderColor: isStepped ? theme.primary : theme.textSecondary,
                  backgroundColor: !isSafe
                    ? theme.surface
                    : isStepped
                      ? theme.primarySoft
                      : theme.surfaceDeep,
                },
              ]}
            >
              <Sprite
                name={isStepped ? 'paw' : isSafe ? 'block' : 'trap'}
                size={48}
              />
            </Pressable>
          );
        })}
      </View>
      <Pressable
        onPress={() => {
          setPath([]);
          onReady([]);
        }}
        style={styles.linkHit}
      >
        <Text style={[styles.monoDim, { color: theme.textSecondary }]}>
          {`> ${t('playkit.path.reset')}`}
        </Text>
      </Pressable>
    </TrialPanel>
  );
};

export const AssembleScene = ({
  round,
  onReady,
  isLocked,
}: SceneProps<AssembleRound>) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [assignment, setAssignment] = useState<(number | null)[]>(
    round.parts.map(() => null),
  );
  const [held, setHeld] = useState<number | null>(null);

  const place = (slot: number) => {
    if (isLocked || held === null) return;
    const next = assignment.map((v) => (v === slot ? null : v));
    next[held] = slot;
    setAssignment(next);
    setHeld(null);
    onReady(next);
  };

  return (
    <TrialPanel isWell style={styles.panelFill}>
      <TrialReadout isDim>{t('playkit.assemble.hint')}</TrialReadout>
      <View style={styles.row}>
        {round.parts.map((part, index) => (
          <Pressable
            key={part}
            disabled={isLocked}
            onPress={() => {
              if (isLocked) return;
              setHeld(index);
            }}
            accessibilityRole="button"
            accessibilityState={{ selected: held === index }}
            style={[
              styles.part,
              {
                borderColor:
                  held === index ? theme.primary : theme.textSecondary,
                backgroundColor:
                  held === index ? theme.primarySoft : theme.surface,
              },
            ]}
          >
            <Sprite name={round.partSprites[index] ?? 'dogBody'} size={48} />
            <Text style={[styles.monoTitle, { color: theme.primary }]}>
              {part}
            </Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.stackGap}>
        {round.slots.map((slot, slotIndex) => {
          const partIndex = assignment.indexOf(slotIndex);
          const partSprite =
            partIndex >= 0 ? round.partSprites[partIndex] : undefined;
          return (
            <Pressable
              key={slot}
              accessibilityRole="button"
              disabled={isLocked}
              onPress={() => place(slotIndex)}
              style={[
                styles.slot,
                {
                  borderColor: theme.textSecondary,
                  borderStyle: 'dashed',
                },
              ]}
            >
              <View style={styles.slotArt}>
                {partSprite ? <Sprite name={partSprite} size={32} /> : null}
              </View>
              <Text style={[styles.mono, { color: theme.primary }]}>
                {`${slot}: ${partIndex >= 0 ? round.parts[partIndex] : '—'}`}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </TrialPanel>
  );
};

export const LaserScene = ({
  round,
  onReady,
  isLocked,
}: SceneProps<LaserRound>) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [marked, setMarked] = useState<number[]>([]);
  const toggle = (index: number) => {
    if (isLocked) return;
    const next = marked.includes(index)
      ? marked.filter((i) => i !== index)
      : [...marked, index];
    setMarked(next);
    onReady(next.slice().sort((a, b) => a - b));
  };
  return (
    <TrialPanel isWell style={styles.panelFill}>
      <TrialReadout isDim>{t('playkit.laser.hint')}</TrialReadout>
      {round.lines.map((line, index) => {
        const isOn = marked.includes(index);
        return (
          <Pressable
            key={line}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isOn, disabled: isLocked }}
            disabled={isLocked}
            onPress={() => toggle(index)}
            style={[
              styles.receiptLine,
              {
                borderColor: isOn ? theme.primary : theme.textSecondary,
                backgroundColor: isOn ? theme.primarySoft : theme.surface,
              },
            ]}
          >
            <Sprite
              name={round.lineSprites[index] ?? 'receipt'}
              size={32}
              style={isOn ? styles.ghost : undefined}
            />
            <Text
              style={[
                styles.mono,
                styles.receiptText,
                isOn && styles.struck,
                { color: theme.primary },
              ]}
            >
              {line}
            </Text>
          </Pressable>
        );
      })}
    </TrialPanel>
  );
};

export const OrbitScene = ({
  round,
  onReady,
  isLocked,
}: SceneProps<OrbitRound>) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [angle, setAngle] = useState(0);
  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !isLocked,
        onPanResponderMove: (_, gesture) => {
          if (isLocked) return;
          const next = (((gesture.dx / 240) % 1) + 1) % 1;
          setAngle(next);
        },
        onPanResponderRelease: (_, gesture) => {
          if (isLocked) return;
          const next = (((gesture.dx / 240) % 1) + 1) % 1;
          setAngle(next);
          onReady(next);
        },
      }),
    [isLocked, onReady],
  );
  const inWindow = angle >= round.windowStart && angle <= round.windowEnd;
  return (
    <TrialPanel isWell style={styles.panelFill}>
      <TrialReadout isDim>{t('playkit.orbit.hint')}</TrialReadout>
      <View
        {...pan.panHandlers}
        style={[
          styles.field,
          {
            borderColor: inWindow ? theme.primary : theme.textSecondary,
            backgroundColor: theme.surface,
          },
        ]}
      >
        <Text style={[styles.monoTitle, { color: theme.primary }]}>
          {inWindow ? t('playkit.orbit.ready') : t('playkit.orbit.spin')}
        </Text>
        <View style={styles.orbitRing}>
          <Sprite name="piggy" size={72} />
          <View
            style={[
              styles.orbitCoin,
              {
                transform: [
                  {
                    translateX: Math.cos(angle * Math.PI * 2) * ORBIT_RADIUS_X,
                  },
                  {
                    translateY: Math.sin(angle * Math.PI * 2) * ORBIT_RADIUS_Y,
                  },
                ],
              },
            ]}
          >
            <Sprite name="coin" size={ORBIT_COIN} />
          </View>
        </View>
        <Text style={[styles.monoDim, { color: theme.textSecondary }]}>
          {`${Math.round(angle * 100)}%`}
        </Text>
      </View>
    </TrialPanel>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  brief: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: SPACING.TWO,
  },
  briefText: {
    flex: 1,
  },
  cargo: {
    alignItems: 'center',
    gap: SPACING.ONE,
    paddingVertical: SPACING.THREE,
  },
  cell: {
    alignItems: 'center',
    aspectRatio: 1,
    borderRadius: RADII.s,
    borderWidth: 2,
    justifyContent: 'center',
    width: '30%',
  },
  coin: {
    alignItems: 'center',
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  coinFace: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  field: {
    alignItems: 'center',
    borderRadius: RADII.m,
    borderWidth: 2,
    flex: 1,
    gap: SPACING.TWO,
    justifyContent: 'center',
    minHeight: 180,
    padding: SPACING.THREE,
  },
  ghost: {
    opacity: 0.35,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.TWO,
  },
  grid3: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.TWO,
    justifyContent: 'space-between',
  },
  jarFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: SPACING.TWO,
  },
  linkHit: { minHeight: 44, justifyContent: 'center' },
  memoryCard: {
    alignItems: 'center',
    borderRadius: RADII.s,
    borderWidth: 2,
    gap: SPACING.HALF,
    height: 68,
    justifyContent: 'center',
    paddingHorizontal: SPACING.ONE,
    width: '30%',
  },
  mono: {
    fontFamily: FONTS.mono,
    fontSize: 14,
    lineHeight: 18,
  },
  monoBig: {
    fontFamily: FONTS.monoStrong,
    fontSize: 28,
    textAlign: 'center',
  },
  monoDim: {
    fontFamily: FONTS.mono,
    fontSize: 14,
    letterSpacing: 0.5,
  },
  monoTitle: {
    fontFamily: FONTS.monoStrong,
    fontSize: 14,
    textAlign: 'center',
  },
  orbitCoin: {
    left: (ORBIT_WIDTH - ORBIT_COIN) / 2,
    position: 'absolute',
    top: (ORBIT_HEIGHT - ORBIT_COIN) / 2,
  },
  orbitRing: {
    alignItems: 'center',
    height: ORBIT_HEIGHT,
    justifyContent: 'center',
    width: ORBIT_WIDTH,
  },
  pan: { gap: SPACING.ONE },
  panHead: {
    alignItems: 'baseline',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  panelFill: { gap: SPACING.TWO },
  part: {
    alignItems: 'center',
    borderRadius: RADII.s,
    borderWidth: 2,
    gap: SPACING.ONE,
    paddingHorizontal: SPACING.TWO,
    paddingVertical: SPACING.TWO,
  },
  pocket: {
    alignItems: 'center',
    borderRadius: RADII.s,
    borderWidth: 2,
    justifyContent: 'center',
    paddingBottom: SPACING.ONE,
    width: 64,
  },
  pocketColumn: {
    alignItems: 'center',
    gap: SPACING.ONE,
  },
  pocketMark: {
    alignItems: 'center',
    height: 24,
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  receiptLine: {
    alignItems: 'center',
    borderRadius: RADII.s,
    borderWidth: 1,
    flexDirection: 'row',
    gap: SPACING.TWO,
    minHeight: 48,
    paddingHorizontal: SPACING.TWO,
  },
  receiptText: {
    flex: 1,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.TWO,
  },
  slot: {
    alignItems: 'center',
    borderRadius: RADII.s,
    borderWidth: 1,
    flexDirection: 'row',
    gap: SPACING.TWO,
    minHeight: 48,
    paddingHorizontal: SPACING.TWO,
  },
  slotArt: {
    alignItems: 'center',
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  stackGap: { gap: SPACING.TWO },
  struck: {
    opacity: 0.6,
    textDecorationLine: 'line-through',
  },
  tile: {
    alignItems: 'center',
    borderRadius: RADII.s,
    borderWidth: 2,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  trapCell: {
    opacity: 0.7,
  },
  weights: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.HALF,
    minHeight: 28,
  },
});
