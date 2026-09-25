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
// HELPERS
// ═══════════════════════════════════════════

const BIN_GLYPH: Record<BinId, string> = {
  needs: '▣',
  wants: '◇',
  savings: '◎',
};

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
        <Text style={[styles.cargoGlyph, { color: theme.overseerLcd }]}>◆</Text>
        <Text style={[styles.monoTitle, { color: theme.overseerLcd }]}>
          {round.item}
        </Text>
        <Text style={[styles.monoDim, { color: theme.overseerLcdDim }]}>
          {t('playkit.conveyor.dragHint')}
        </Text>
      </View>
      <View style={styles.row}>
        {(['needs', 'wants', 'savings'] as const).map((bin) => (
          <TrialChip
            key={bin}
            glyph={BIN_GLYPH[bin]}
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
            <Text style={[styles.monoTitle, { color: theme.overseerLcd }]}>
              {t(`playkit.bins.${side}`)}
            </Text>
            <Text style={[styles.monoDim, { color: theme.overseerLcdDim }]}>
              {`tgt ${target}`}
            </Text>
          </View>
          <View style={styles.beam}>
            <View
              style={[
                styles.weight,
                {
                  width: `${Math.min(100, value * 12)}%`,
                  backgroundColor: theme.overseerLcd,
                },
              ]}
            />
          </View>
          <View style={styles.row}>
            <TrialChip
              label="−"
              isCompact
              disabled={isLocked}
              onPress={() => bump(side, -1)}
            />
            <Text style={[styles.monoBig, { color: theme.overseerLcd }]}>
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
      <TrialReadout>
        {t('playkit.cashier.brief', {
          price: round.price,
          paid: round.paid,
        })}
      </TrialReadout>
      <Text style={[styles.monoBig, { color: theme.overseerLcd }]}>
        {t('playkit.cashier.change', { count: sum })}
      </Text>
      <View style={styles.row}>
        {coins.map((coin) => (
          <Pressable
            key={coin}
            disabled={isLocked}
            onPress={() => add(coin)}
            style={({ pressed }) => [
              styles.coin,
              {
                borderColor: theme.overseerLcd,
                backgroundColor: pressed
                  ? 'rgba(255, 107, 107, 0.25)'
                  : theme.overseerScreenGlow,
              },
            ]}
          >
            <Text style={[styles.monoTitle, { color: theme.overseerLcd }]}>
              {coin}
            </Text>
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
        <Text style={[styles.monoDim, { color: theme.overseerLcdDim }]}>
          {`> ${t('playkit.cashier.reset')}`}
        </Text>
      </Pressable>
    </TrialPanel>
  );
};

export const JarScene = ({ onReady, isLocked }: SceneProps<JarRound>) => {
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
        {[0, 1, 2, 3, 4].map((slot) => {
          const isOn = caught.includes(slot);
          return (
            <Pressable
              key={slot}
              disabled={isLocked}
              onPress={() => toggle(slot)}
              style={[
                styles.coin,
                {
                  borderColor: isOn ? theme.overseerLcd : theme.overseerLcdDim,
                  backgroundColor: isOn
                    ? 'rgba(255, 107, 107, 0.28)'
                    : theme.overseerScreen,
                },
              ]}
            >
              <Text style={[styles.monoTitle, { color: theme.overseerLcd }]}>
                {isOn ? '●' : '○'}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={[styles.monoDim, { color: theme.overseerLcdDim }]}>
        {t('playkit.jar.picked', { count: caught.length })}
      </Text>
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
      <Text style={[styles.monoDim, { color: theme.overseerLcdDim }]}>
        {t('playkit.pinball.target', { pocket: round.target + 1 })}
      </Text>
      <View
        {...pan.panHandlers}
        style={[
          styles.field,
          {
            borderColor: theme.overseerLcdDim,
            backgroundColor: theme.overseerScreen,
          },
        ]}
      >
        <Text style={[styles.monoTitle, { color: theme.overseerLcd }]}>
          {t('playkit.pinball.swipe')}
        </Text>
        <View style={styles.row}>
          {[0, 1, 2].map((pocket) => (
            <View
              key={pocket}
              style={[
                styles.pocket,
                {
                  borderColor:
                    aim === pocket ? theme.overseerLcd : theme.overseerLcdDim,
                  backgroundColor:
                    aim === pocket
                      ? 'rgba(255, 107, 107, 0.22)'
                      : 'transparent',
                },
              ]}
            >
              <Text style={[styles.monoTitle, { color: theme.overseerLcd }]}>
                {pocket + 1}
              </Text>
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
              onPress={() => flip(index)}
              style={[
                styles.memoryCard,
                {
                  borderColor: isMatch
                    ? theme.overseerLcd
                    : isFace
                      ? theme.overseerLcdDim
                      : theme.overseerScreenGlow,
                  backgroundColor: isFace
                    ? 'rgba(255, 107, 107, 0.16)'
                    : theme.overseerScreen,
                },
              ]}
            >
              <Text style={[styles.monoTitle, { color: theme.overseerLcd }]}>
                {isFace ? label : '??'}
              </Text>
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
        {round.safe.map((isSafe, index) => (
          <Pressable
            key={index}
            disabled={!isSafe || isLocked}
            onPress={() => tap(index)}
            style={[
              styles.cell,
              {
                borderColor: path.includes(index)
                  ? theme.overseerLcd
                  : theme.overseerLcdDim,
                backgroundColor: !isSafe
                  ? theme.overseerScreen
                  : path.includes(index)
                    ? 'rgba(255, 107, 107, 0.28)'
                    : theme.overseerScreenGlow,
                opacity: isSafe ? 1 : 0.35,
              },
            ]}
          >
            <Text style={[styles.monoTitle, { color: theme.overseerLcd }]}>
              {path.includes(index) ? '↑' : isSafe ? '·' : '×'}
            </Text>
          </Pressable>
        ))}
      </View>
      <Pressable
        onPress={() => {
          setPath([]);
          onReady([]);
        }}
        style={styles.linkHit}
      >
        <Text style={[styles.monoDim, { color: theme.overseerLcdDim }]}>
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
            style={[
              styles.part,
              {
                borderColor:
                  held === index ? theme.overseerLcd : theme.overseerLcdDim,
                backgroundColor:
                  held === index
                    ? 'rgba(255, 107, 107, 0.22)'
                    : theme.overseerScreen,
              },
            ]}
          >
            <Text style={[styles.monoTitle, { color: theme.overseerLcd }]}>
              {part}
            </Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.stackGap}>
        {round.slots.map((slot, slotIndex) => {
          const partIndex = assignment.indexOf(slotIndex);
          return (
            <Pressable
              key={slot}
              disabled={isLocked}
              onPress={() => place(slotIndex)}
              style={[
                styles.slot,
                {
                  borderColor: theme.overseerLcdDim,
                  borderStyle: 'dashed',
                },
              ]}
            >
              <Text style={[styles.mono, { color: theme.overseerLcd }]}>
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
            disabled={isLocked}
            onPress={() => toggle(index)}
            style={[
              styles.receiptLine,
              {
                borderColor: isOn ? theme.overseerLcd : theme.overseerLcdDim,
                backgroundColor: isOn
                  ? 'rgba(255, 107, 107, 0.18)'
                  : theme.overseerScreen,
              },
            ]}
          >
            <Text style={[styles.mono, { color: theme.overseerLcd }]}>
              {`${isOn ? '▣' : '□'} ${line}`}
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
            borderColor: inWindow ? theme.overseerLcd : theme.overseerLcdDim,
            backgroundColor: theme.overseerScreen,
          },
        ]}
      >
        <Text style={[styles.monoTitle, { color: theme.overseerLcd }]}>
          {inWindow ? t('playkit.orbit.ready') : t('playkit.orbit.spin')}
        </Text>
        <View style={styles.orbitRing}>
          <View
            style={[
              styles.orbitDot,
              {
                backgroundColor: inWindow
                  ? theme.overseerLcd
                  : theme.overseerLcdDim,
                transform: [
                  { translateX: Math.cos(angle * Math.PI * 2) * 60 },
                  { translateY: Math.sin(angle * Math.PI * 2) * 40 },
                ],
              },
            ]}
          />
        </View>
        <Text style={[styles.monoDim, { color: theme.overseerLcdDim }]}>
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
  beam: {
    backgroundColor: 'rgba(255, 107, 107, 0.12)',
    borderRadius: 2,
    height: 10,
    overflow: 'hidden',
    width: '100%',
  },
  cargo: {
    alignItems: 'center',
    gap: SPACING.one,
    paddingVertical: SPACING.three,
  },
  cargoGlyph: {
    fontFamily: FONTS.mono,
    fontSize: 36,
    fontWeight: '700',
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
    borderRadius: 28,
    borderWidth: 2,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  field: {
    alignItems: 'center',
    borderRadius: RADII.m,
    borderWidth: 2,
    flex: 1,
    gap: SPACING.two,
    justifyContent: 'center',
    minHeight: 180,
    padding: SPACING.three,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.two,
  },
  grid3: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.two,
    justifyContent: 'space-between',
  },
  linkHit: { minHeight: 44, justifyContent: 'center' },
  memoryCard: {
    alignItems: 'center',
    borderRadius: RADII.s,
    borderWidth: 2,
    height: 68,
    justifyContent: 'center',
    width: '30%',
  },
  mono: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    lineHeight: 18,
  },
  monoBig: {
    fontFamily: FONTS.mono,
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
  monoDim: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    letterSpacing: 0.5,
  },
  monoTitle: {
    fontFamily: FONTS.mono,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  orbitDot: {
    borderRadius: 12,
    height: 24,
    width: 24,
  },
  orbitRing: {
    alignItems: 'center',
    height: 100,
    justifyContent: 'center',
    width: 140,
  },
  pan: { gap: SPACING.one },
  panHead: {
    alignItems: 'baseline',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  panelFill: { gap: SPACING.two },
  part: {
    borderRadius: RADII.s,
    borderWidth: 2,
    paddingHorizontal: SPACING.two,
    paddingVertical: SPACING.two,
  },
  pocket: {
    alignItems: 'center',
    borderRadius: RADII.s,
    borderWidth: 2,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  receiptLine: {
    borderRadius: RADII.s,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: SPACING.two,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.two,
  },
  slot: {
    borderRadius: RADII.s,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: SPACING.two,
  },
  stackGap: { gap: SPACING.two },
  weight: { borderRadius: 2, height: '100%' },
});
