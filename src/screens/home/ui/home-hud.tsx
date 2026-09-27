import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { HintButton } from '@/widgets/hint-button';

import { PLATFORM_LEVEL_COUNT } from '@/entities/economy';
import type { WatcherId, WatcherPageId } from '@/entities/watcher';

import { FONTS, MAX_CONTENT_WIDTH, SPACING } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import { useTranslation } from '@/shared/i18n';
import {
  Button,
  PixelIcon,
  type PixelIconName,
  TerminalPanel,
  Text,
} from '@/shared/ui';
import { formatMoney } from '@/shared/utils';

import type { HomeHud } from '../model';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface HomeHudBoardProps {
  hud: HomeHud;
  level: number;
  /** Robot charge, 0…1 — lit as five countable cells. */
  charge: number;
  top: number;
  onSettings: () => void;
  onRobot: () => void;
}

interface HomeDockProps {
  hud: HomeHud;
  bottom: number;
  onOpen: (watcher: WatcherId, page: WatcherPageId) => void;
  onTrial: (taskId: string) => void;
  onRobot: () => void;
}

interface HudCableProps {
  side: 'left' | 'right';
  offset: number;
  /** From the top edge of the screen to the hanging part. */
  length: number;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

const ACTIONS: {
  page: WatcherPageId;
  watcher: WatcherId;
  icon: PixelIconName;
  key: string;
}[] = [
  { page: 'plan', watcher: 'keeper', icon: 'plan', key: 'home.hud.plan' },
  { page: 'trials', watcher: 'overseer', icon: 'face', key: 'home.hud.trials' },
  { page: 'shop', watcher: 'keeper', icon: 'wrench', key: 'home.hud.shop' },
  { page: 'jar', watcher: 'keeper', icon: 'piggy', key: 'home.hud.jar' },
];

/** The board and its two buttons hang this far below the top edge. */
const CABLE_LENGTH = 18;
const CONTROL_SIZE = 44;
const SIDE_INSET = 14;
/** The board sits between the two hanging buttons. */
const BOARD_INSET = 70;
const CHARGE_CELLS = 5;

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

const HudCable = ({ side, offset, length }: HudCableProps) => {
  const theme = useTheme();
  return (
    <View
      pointerEvents="none"
      style={[
        styles.cable,
        { [side]: offset, height: length, backgroundColor: theme.bezel },
      ]}
    />
  );
};

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

/**
 * The board on cables (UI kit 10, concept B1): wallet, jar and charge on the
 * first line, the tier and what is left to the lift in words on the second.
 * Settings hang on the left, "?" on the right.
 */
export const HomeHudBoard = ({
  hud,
  level,
  charge,
  top,
  onSettings,
  onRobot,
}: HomeHudBoardProps) => {
  const theme = useTheme();
  const { t } = useTranslation();
  // The cables start at the very top edge, through the status bar.
  const hang = top + CABLE_LENGTH;
  const litCells = Math.floor(
    Math.min(Math.max(charge, 0), 1) * CHARGE_CELLS + Number.EPSILON,
  );

  return (
    <View
      pointerEvents="box-none"
      style={[styles.boardPosition, { height: hang + 64 }]}
    >
      <HudCable
        side="left"
        offset={SIDE_INSET + CONTROL_SIZE / 2 - 1}
        length={hang + SPACING.one}
      />
      <HudCable
        side="right"
        offset={SIDE_INSET + CONTROL_SIZE / 2 - 1}
        length={hang + SPACING.one}
      />
      <HudCable
        side="left"
        offset={BOARD_INSET + 26}
        length={hang + SPACING.one}
      />
      <HudCable
        side="right"
        offset={BOARD_INSET + 26}
        length={hang + SPACING.one}
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('home.settingsA11y')}
        onPress={onSettings}
        style={[
          styles.control,
          styles.controlLeft,
          { backgroundColor: theme.bezel, top: hang },
        ]}
      >
        {({ pressed }) => (
          <View
            style={[
              styles.controlScreen,
              {
                backgroundColor: pressed
                  ? theme.surfaceSoft
                  : theme.terminalScreen,
              },
            ]}
          >
            <PixelIcon name="settings" />
          </View>
        )}
      </Pressable>

      <TerminalPanel
        size="s"
        frameStyle={[styles.board, { top: hang }]}
        style={styles.readout}
      >
        <View style={styles.numbers}>
          <View
            accessible
            accessibilityLabel={t('home.hud.balance', { count: hud.balance })}
            style={styles.amount}
          >
            <PixelIcon name="coin" tone="coin" />
            <Text style={styles.hudNumber}>{formatMoney(hud.balance)}</Text>
          </View>
          <View
            accessible
            accessibilityLabel={t('home.hud.saved', {
              count: hud.savingsTotal,
            })}
            style={styles.amount}
          >
            <PixelIcon name="piggy" />
            <Text variant="machine" style={styles.hudNumber}>
              {formatMoney(hud.savingsTotal)}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={onRobot}
            accessibilityHint={t('diagnosis.open')}
            accessibilityLabel={`${t('home.hud.charge')}: ${litCells} / ${CHARGE_CELLS}`}
            accessibilityValue={{ min: 0, max: CHARGE_CELLS, now: litCells }}
            style={styles.amount}
          >
            <PixelIcon name="battery" />
            <View style={styles.cells}>
              {Array.from({ length: CHARGE_CELLS }, (_, index) => (
                <View
                  key={index}
                  style={[
                    styles.cell,
                    {
                      backgroundColor:
                        index < litCells ? theme.phosphor : theme.surfaceSoft,
                    },
                  ]}
                />
              ))}
            </View>
          </Pressable>
        </View>
        <View style={styles.numbers}>
          <Text variant="code" themeColor="textMuted" style={styles.caption}>
            {t('home.hud.tier', { level, total: PLATFORM_LEVEL_COUNT })}
          </Text>
          <Text variant="code" themeColor="textMuted" style={styles.caption}>
            {level >= PLATFORM_LEVEL_COUNT
              ? t('home.hud.finished')
              : t('home.hud.remaining', {
                  count: formatMoney(hud.liftRemaining),
                })}
          </Text>
        </View>
      </TerminalPanel>

      <View style={[styles.control, styles.controlRight, { top: hang }]}>
        <HintButton screen="home" variant="hud" />
      </View>
    </View>
  );
};

/**
 * The bottom dock: one card saying what to do next, and the action bar.
 * Before the plan only "План" is open; the others wear a pixel lock.
 */
export const HomeDock = ({
  hud,
  bottom,
  onOpen,
  onTrial,
  onRobot,
}: HomeDockProps) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const isPlanning = hud.isPlanning;
  const trial = hud.activeTrial;
  const { width } = useWindowDimensions();

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.dock,
        {
          bottom,
          width: Math.min(width - 2 * SPACING.compact, MAX_CONTENT_WIDTH),
        },
      ]}
    >
      {hud.robot ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={hud.robot.accessibilityLabel}
          accessibilityHint={t('diagnosis.open')}
          onPress={onRobot}
          style={({ pressed }) => [
            styles.robotStatus,
            {
              backgroundColor: pressed
                ? theme.surfaceSoft
                : theme.terminalScreen,
              borderColor: theme.borderStrong,
            },
          ]}
        >
          <PixelIcon name="face" size={20} />
          <Text variant="small" style={styles.statusText}>
            {t('diagnosis.status', {
              name: hud.robot.name,
              mood: hud.robot.moodLabel,
            })}
          </Text>
          <PixelIcon name="arrow" size={12} />
        </Pressable>
      ) : null}
      {isPlanning ? (
        <TerminalPanel size="m" isLampVisible={false} style={styles.card}>
          <View style={styles.cardCopy}>
            <Text variant="machine">
              {`> ${t('home.hud.planCardLabel', { index: hud.periodIndex })}`}
            </Text>
            <Text variant="subtitle" style={styles.cardTitle}>
              {t('home.hud.planCardTitle')}
            </Text>
            <Text variant="small" themeColor="textSecondary">
              {t('home.hud.planCardBody')}
            </Text>
          </View>
          <Button size="s" isFullWidth onPress={() => onOpen('keeper', 'plan')}>
            {t('home.hud.planCardAction')}
          </Button>
        </TerminalPanel>
      ) : trial ? (
        <TerminalPanel
          size="m"
          variant="overseer"
          style={[styles.card, styles.trialCard]}
        >
          <View style={styles.cardCopy}>
            <Text
              variant="machine"
              themeColor="overseerLcd"
              style={styles.overseerLabel}
            >
              {`// ${t('home.hud.activeTrial').toLocaleUpperCase()}`}
            </Text>
            <Text variant="subtitle" style={styles.cardTitle}>
              {trial.title}
            </Text>
            <View style={styles.trialMeta}>
              <Text variant="small" themeColor="textSecondary">
                {trial.meta}
              </Text>
              <PixelIcon name="coin" size={12} tone="coin" />
            </View>
          </View>
          <Button
            variant="primary"
            accessibilityLabel={t('home.hud.trialOpenA11y', {
              title: trial.title,
            })}
            onPress={() => onTrial(trial.id)}
          >
            <PixelIcon name="arrow" tone="onAccent" />
          </Button>
        </TerminalPanel>
      ) : null}

      <TerminalPanel size="m" isLampVisible={false} style={styles.bar}>
        {ACTIONS.map(({ page, watcher, icon, key }) => {
          const isLocked = isPlanning && page !== 'plan';
          const isSelected = isPlanning && page === 'plan';
          const iconTone = isLocked
            ? 'textDisabled'
            : page === 'trials'
              ? 'overseerLcd'
              : isSelected
                ? 'phosphor'
                : 'textSecondary';
          return (
            <Pressable
              key={page}
              accessibilityRole="button"
              accessibilityLabel={t(key)}
              accessibilityHint={isLocked ? t('home.hud.planFirst') : undefined}
              accessibilityState={{ disabled: isLocked, selected: isSelected }}
              disabled={isLocked}
              onPress={() => onOpen(watcher, page)}
              style={({ pressed }) => [
                styles.tab,
                (isSelected || pressed) && {
                  backgroundColor: theme.surfaceSoft,
                },
              ]}
            >
              <View style={[styles.tabIcon, isLocked && styles.tabIconLocked]}>
                <PixelIcon name={icon} tone={iconTone} />
              </View>
              {isLocked ? (
                <View
                  style={[
                    styles.lockBadge,
                    { backgroundColor: theme.terminalScreen },
                  ]}
                >
                  <PixelIcon name="lock" size={12} tone="textSecondary" />
                </View>
              ) : null}
              <Text
                variant={isSelected ? 'smallBold' : 'small'}
                themeColor={
                  isLocked
                    ? 'textDisabled'
                    : isSelected
                      ? 'text'
                      : 'textSecondary'
                }
                numberOfLines={1}
                adjustsFontSizeToFit
                style={styles.tabLabel}
              >
                {t(key)}
              </Text>
              {isSelected ? (
                <View
                  style={[
                    styles.led,
                    {
                      backgroundColor: theme.phosphor,
                      shadowColor: theme.phosphor,
                    },
                  ]}
                />
              ) : null}
            </Pressable>
          );
        })}
      </TerminalPanel>
    </View>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  amount: { alignItems: 'center', flexDirection: 'row', gap: 5 },
  bar: {
    flexDirection: 'row',
    gap: SPACING.one,
    padding: SPACING.one,
  },
  board: {
    left: BOARD_INSET,
    position: 'absolute',
    right: BOARD_INSET,
  },
  boardPosition: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH + 2 * BOARD_INSET,
    position: 'absolute',
    zIndex: 2,
  },
  cable: {
    position: 'absolute',
    top: 0,
    width: 2,
  },
  caption: { fontSize: 11, lineHeight: 15, flexShrink: 1 },
  card: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    padding: SPACING.compact,
  },
  cardCopy: { flexBasis: 180, flexGrow: 1, flexShrink: 1, minWidth: 0, gap: 2 },
  cardTitle: { fontSize: 17, lineHeight: 22 },
  cell: { height: 12, width: 5 },
  cells: { flexDirection: 'row', gap: 2 },
  control: {
    height: CONTROL_SIZE,
    position: 'absolute',
    width: CONTROL_SIZE,
  },
  controlLeft: {
    borderRadius: 12,
    left: SIDE_INSET,
    padding: SPACING.one,
  },
  controlRight: { right: SIDE_INSET },
  controlScreen: {
    alignItems: 'center',
    borderRadius: SPACING.two,
    flex: 1,
    justifyContent: 'center',
  },
  dock: {
    alignSelf: 'center',
    gap: SPACING.two,
    maxWidth: MAX_CONTENT_WIDTH,
    position: 'absolute',
  },
  hudNumber: {
    fontFamily: FONTS.monoStrong,
    fontSize: 15,
    fontVariant: ['tabular-nums'],
    lineHeight: 20,
  },
  led: {
    borderRadius: 2,
    bottom: 3,
    height: 3,
    position: 'absolute',
    shadowOffset: { height: 0, width: 0 },
    shadowOpacity: 1,
    shadowRadius: 3,
    width: 20,
  },
  lockBadge: {
    alignItems: 'center',
    borderRadius: SPACING.one,
    height: 16,
    justifyContent: 'center',
    left: '50%',
    marginLeft: 6,
    position: 'absolute',
    top: 2,
    width: 16,
  },
  numbers: {
    alignItems: 'center',
    flexWrap: 'wrap',
    flexDirection: 'row',
    gap: SPACING.two,
    justifyContent: 'space-between',
  },
  overseerLabel: { letterSpacing: 1 },
  readout: {
    gap: SPACING.one,
    paddingHorizontal: 10,
    paddingVertical: SPACING.two,
  },
  robotStatus: {
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: SPACING.two,
    maxWidth: '100%',
    minHeight: 44,
    paddingHorizontal: SPACING.compact,
    paddingVertical: SPACING.two,
  },
  statusText: { flexShrink: 1 },
  tab: {
    alignItems: 'center',
    borderRadius: 10,
    flex: 1,
    gap: 5,
    height: 62,
    justifyContent: 'center',
    minWidth: 0,
  },
  tabIcon: { height: 24, width: 24 },
  tabIconLocked: { opacity: 0.55 },
  tabLabel: { fontSize: 13, lineHeight: 17, paddingHorizontal: 2 },
  trialCard: { flexWrap: 'nowrap' },
  trialMeta: { alignItems: 'center', flexDirection: 'row', gap: SPACING.one },
});

export type { HomeDockProps, HomeHudBoardProps };
