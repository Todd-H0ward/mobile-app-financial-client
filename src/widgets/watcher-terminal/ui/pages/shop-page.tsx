import { useState } from 'react';

import { type Href, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { useShowFeedback } from '@/features/feedback';

import {
  type CatalogueItem,
  type CatalogueKind,
  listCatalogueByShop,
} from '@/entities/catalogue';
import {
  applyPurchase,
  canAfford,
  useCommitUser,
  useIsMotionEnabled,
  useUser,
} from '@/entities/user';

import { FONTS, RADII, SPACING, STATIC_ROUTES } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import { useTranslation } from '@/shared/i18n';
import { hapticSuccess, useTimeSource } from '@/shared/lib';
import {
  Button,
  PixelIcon,
  type PixelIconName,
  Segmented,
  Sheet,
  Text,
} from '@/shared/ui';
import { formatMoney } from '@/shared/utils';

import {
  TerminalCard,
  type TerminalFrame,
  TerminalMenu,
  TerminalMenuRow,
  TerminalShell,
} from '../terminal-shell';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface ShopPageProps {
  frame: TerminalFrame;
}

interface ItemCardProps {
  item: CatalogueItem;
  shortfall: number;
  isOwned: boolean;
  onPress: () => void;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

const KIND_ICON: Record<CatalogueKind, PixelIconName> = {
  need: 'battery',
  want: 'gear',
};

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

const useItemTitle = () => {
  const { t } = useTranslation();
  return (item: CatalogueItem) =>
    t(`catalogue.items.${item.id}.title`, { defaultValue: item.title });
};

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

/** UI kit 07 "товар мастерской": plain, or amber dashes when short. */
const ItemCard = ({ item, shortfall, isOwned, onPress }: ItemCardProps) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const titleOf = useItemTitle();
  const isShort = shortfall > 0 && !isOwned;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${titleOf(item)}, ${formatMoney(item.price)}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.item,
        {
          backgroundColor: pressed ? theme.surfaceSoft : theme.surface,
          borderColor: isShort ? theme.warning : theme.border,
        },
        isShort && styles.dashed,
      ]}
    >
      <View style={[styles.picture, { backgroundColor: theme.surfaceSoft }]}>
        <PixelIcon name={KIND_ICON[item.kind]} size={36} />
      </View>
      <Text variant="bodyBold" style={styles.itemTitle}>
        {titleOf(item)}
      </Text>
      <View style={styles.price}>
        <Text style={styles.priceNumber}>{formatMoney(item.price)}</Text>
        <PixelIcon name="coin" tone="coin" />
      </View>
      {isOwned ? (
        <View style={styles.price}>
          <PixelIcon name="check" size={12} />
          <Text variant="small" themeColor="textMuted">
            {t('watcher.terminal.shop.owned')}
          </Text>
        </View>
      ) : isShort ? (
        <Text variant="smallBold" themeColor="warning">
          {`! ${t('watcher.terminal.shop.short', { count: formatMoney(shortfall) })}`}
        </Text>
      ) : null}
    </Pressable>
  );
};

/**
 * The workshop (concept D1, D2, screen 16). Two tabs are the two boxes of the
 * plan; above the grid, how much of that box is already spent. An item the
 * child cannot afford stays pressable — it opens three ways out, not a wall.
 */
export const ShopPage = ({ frame }: ShopPageProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const user = useUser();
  const commitUser = useCommitUser();
  const time = useTimeSource();
  const showFeedback = useShowFeedback();
  const isMotionEnabled = useIsMotionEnabled();
  const titleOf = useItemTitle();
  const [kind, setKind] = useState<CatalogueKind>('need');
  const [pending, setPending] = useState<CatalogueItem | null>(null);
  const [shortOf, setShortOf] = useState<CatalogueItem | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const balance = user?.wallet.balance ?? 0;
  const isPlanning = user?.period.phase === 'planning';
  const items = listCatalogueByShop('workshop').filter(
    (item) => item.kind === kind,
  );
  const owned = user?.ownedItemIds ?? [];
  const box = kind === 'need' ? 'needs' : 'wants';
  const planned = user?.period.plan[box] ?? 0;
  const spent = user?.period.fact[box] ?? 0;
  const boxName = t(
    kind === 'need'
      ? 'watcher.terminal.shop.boxNeeds'
      : 'watcher.terminal.shop.boxWants',
  );

  const open = (item: CatalogueItem) => {
    if (user?.period.phase !== 'active') return;
    setMessage(null);
    if (!canAfford(user.wallet, item.price)) {
      setShortOf(item);
      return;
    }
    setPending(item);
  };

  const confirm = () => {
    if (!user || !pending) return;
    const result = applyPurchase(user, pending.id, time);
    if (!result.ok) {
      setPending(null);
      setMessage(t('watcher.terminal.shop.failed'));
      return;
    }
    if (!commitUser(user, result.user)) return;
    setPending(null);
    hapticSuccess();
    setTimeout(() => {
      showFeedback({
        before: user,
        after: result.user,
        action: 'purchase',
        overPlanBy: result.overPlanBy,
        params: { item: result.item.title },
      });
    }, 0);
  };

  const pendingBox = pending?.kind === 'need' ? 'needs' : 'wants';
  const overPlanBy = pending
    ? Math.max(
        0,
        (user?.period.fact[pendingBox] ?? 0) +
          pending.price -
          (user?.period.plan[pendingBox] ?? 0),
      )
    : 0;

  return (
    <TerminalShell
      {...frame}
      label={t('watcher.terminal.pages.shop.label')}
      title={t('watcher.terminal.pages.shop.title')}
      trailing={
        <View
          accessible
          accessibilityLabel={t('home.hud.balance', { count: balance })}
          style={styles.wallet}
        >
          <Text variant="machine" style={styles.walletNumber}>
            {formatMoney(balance)}
          </Text>
          <PixelIcon name="coin" tone="coin" />
        </View>
      }
    >
      <ScrollView contentContainerStyle={styles.stack}>
        {isPlanning ? (
          <TerminalCard>
            <View style={styles.price}>
              <PixelIcon name="lock" size={12} tone="textDisabled" />
              <Text variant="code" themeColor="textMuted">
                {t('home.hud.planFirst')}
              </Text>
            </View>
            <Text variant="subtitle">
              {t('watcher.terminal.shop.planFirstTitle')}
            </Text>
            <Text themeColor="textSecondary">
              {t('watcher.terminal.shop.planFirstBody')}
            </Text>
          </TerminalCard>
        ) : null}

        <Segmented
          options={[
            {
              value: 'need',
              label: t('watcher.terminal.shop.tabNeeds'),
              icon: KIND_ICON.need,
            },
            {
              value: 'want',
              label: t('watcher.terminal.shop.tabWants'),
              icon: KIND_ICON.want,
            },
          ]}
          value={kind}
          onChange={setKind}
        />

        {!isPlanning ? (
          <View style={styles.planned}>
            <Text variant="small" themeColor="textSecondary">
              {t('watcher.terminal.shop.planned', { box: boxName })}
            </Text>
            <Text variant="code" themeColor="phosphor">
              {t('watcher.terminal.shop.spentOf', {
                fact: formatMoney(spent),
                plan: formatMoney(planned),
              })}
            </Text>
          </View>
        ) : null}

        {message ? <Text themeColor="warning">{message}</Text> : null}

        <View style={styles.grid}>
          {items.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              shortfall={item.price - balance}
              isOwned={Boolean(item.ownedId && owned.includes(item.ownedId))}
              onPress={() => open(item)}
            />
          ))}
          {items.length % 2 === 1 ? <View style={styles.filler} /> : null}
        </View>
      </ScrollView>

      <Sheet.Modal
        isVisible={pending !== null}
        onClose={() => setPending(null)}
        isAnimated={isMotionEnabled}
      >
        {pending ? (
          <>
            <View style={styles.sheetHead}>
              <View
                style={[
                  styles.sheetPicture,
                  { backgroundColor: theme.surfaceSoft },
                ]}
              >
                <PixelIcon name={KIND_ICON[pending.kind]} size={36} />
              </View>
              <View style={styles.sheetHeadCopy}>
                <View style={styles.price}>
                  <PixelIcon name={KIND_ICON[pending.kind]} size={12} />
                  <Text variant="small" themeColor="textSecondary">
                    {`${t(
                      `watcher.terminal.shop.category.${pending.category}`,
                      {
                        defaultValue: pending.category,
                      },
                    )} · ${t(`watcher.terminal.shop.kind.${pending.kind}`)}`}
                  </Text>
                </View>
                <Sheet.Title>{titleOf(pending)}</Sheet.Title>
                <View style={styles.price}>
                  <Text variant="machine" style={styles.sheetPrice}>
                    {formatMoney(pending.price)}
                  </Text>
                  <PixelIcon name="coin" tone="coin" />
                </View>
              </View>
            </View>
            <View style={[styles.table, { borderColor: theme.border }]}>
              {pending.note ? (
                <View style={styles.tableRow}>
                  <Text variant="small" themeColor="textSecondary">
                    {t('watcher.terminal.shop.gives')}
                  </Text>
                  <Text variant="small" style={styles.tableValueText}>
                    {pending.note}
                  </Text>
                </View>
              ) : null}
              <View
                style={[
                  styles.tableRow,
                  pending.note
                    ? [styles.tableDivider, { borderColor: theme.border }]
                    : null,
                ]}
              >
                <Text variant="small" themeColor="textSecondary">
                  {t('watcher.terminal.shop.wallet')}
                </Text>
                <Text variant="code" style={styles.tableNumber}>
                  {`${formatMoney(balance)} → ${formatMoney(balance - pending.price)}`}
                </Text>
              </View>
              <View
                style={[
                  styles.tableRow,
                  styles.tableDivider,
                  { borderColor: theme.border },
                ]}
              >
                <Text variant="small" themeColor="textSecondary">
                  {t('watcher.terminal.shop.box', {
                    box: t(
                      pending.kind === 'need'
                        ? 'watcher.terminal.shop.boxNeeds'
                        : 'watcher.terminal.shop.boxWants',
                    ),
                  })}
                </Text>
                <Text
                  variant="code"
                  themeColor={overPlanBy > 0 ? 'warning' : 'phosphor'}
                  style={styles.tableNumber}
                >
                  {overPlanBy > 0
                    ? `! ${t('watcher.terminal.shop.overPlan', { count: formatMoney(overPlanBy) })}`
                    : t('watcher.terminal.shop.inPlan')}
                </Text>
              </View>
            </View>
            <View style={styles.sheetActions}>
              <Button
                variant="secondary"
                size="m"
                onPress={() => setPending(null)}
                style={styles.sheetAction}
                isFullWidth
              >
                {t('watcher.terminal.shop.notNow')}
              </Button>
              <Button
                size="m"
                onPress={confirm}
                style={styles.sheetAction}
                isFullWidth
              >
                {t('watcher.terminal.shop.buyAction')}
              </Button>
            </View>
          </>
        ) : null}
      </Sheet.Modal>

      <Sheet.Modal
        variant="warning"
        isVisible={shortOf !== null}
        onClose={() => setShortOf(null)}
        isAnimated={isMotionEnabled}
      >
        {shortOf ? (
          <>
            <Sheet.Label variant="warning">
              {t('watcher.terminal.shop.short', {
                count: formatMoney(shortOf.price - balance),
              })}
            </Sheet.Label>
            <Sheet.Title>
              {t('watcher.terminal.shop.shortTitle', {
                item: titleOf(shortOf),
                price: formatMoney(shortOf.price),
                balance: formatMoney(balance),
              })}
            </Sheet.Title>
            <Text variant="small" themeColor="textSecondary">
              {t('watcher.terminal.shop.shortOptions')}
            </Text>
            <TerminalMenu>
              <TerminalMenuRow
                icon="face"
                label={t('watcher.terminal.shop.optionTrial')}
                description={t('watcher.terminal.shop.optionTrialHint')}
                onPress={() => {
                  setShortOf(null);
                  router.setParams({ watcher: 'overseer', page: 'trials' });
                }}
              />
              <TerminalMenuRow
                icon="piggy"
                label={t('watcher.terminal.shop.optionJar')}
                description={t('watcher.terminal.shop.optionJarHint')}
                onPress={() => {
                  setShortOf(null);
                  router.push(STATIC_ROUTES.SAVINGS as Href);
                }}
              />
              <TerminalMenuRow
                icon="clock"
                label={t('watcher.terminal.shop.optionWait')}
                description={t('watcher.terminal.shop.optionWaitHint')}
                onPress={() => setShortOf(null)}
              />
            </TerminalMenu>
            <Button
              variant="ghost"
              size="s"
              isFullWidth
              onPress={() => setShortOf(null)}
            >
              {t('watcher.terminal.shop.close')}
            </Button>
          </>
        ) : null}
      </Sheet.Modal>
    </TerminalShell>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  dashed: { borderStyle: 'dashed' },
  // Keeps an odd last card in its column instead of stretching it.
  filler: { flexBasis: '46%', flexGrow: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.two },
  item: {
    borderRadius: RADII.m,
    borderWidth: 2,
    flexBasis: '46%',
    flexGrow: 1,
    gap: SPACING.two,
    padding: SPACING.compact,
  },
  itemTitle: { lineHeight: 20 },
  picture: {
    alignItems: 'center',
    borderRadius: RADII.s,
    height: 64,
    justifyContent: 'center',
  },
  planned: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: SPACING.compact,
    justifyContent: 'space-between',
  },
  price: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  priceNumber: { fontFamily: FONTS.monoStrong, fontSize: 16, lineHeight: 22 },
  sheetAction: { flex: 1 },
  sheetActions: { flexDirection: 'row', gap: SPACING.two },
  sheetHead: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: SPACING.compact,
  },
  sheetHeadCopy: { flex: 1, gap: 2 },
  sheetPicture: {
    alignItems: 'center',
    borderRadius: RADII.s,
    height: 88,
    justifyContent: 'center',
    width: 88,
  },
  sheetPrice: { fontSize: 20, lineHeight: 26 },
  stack: { gap: SPACING.compact, paddingBottom: SPACING.two },
  table: { borderRadius: RADII.s, borderWidth: 2 },
  tableDivider: { borderTopWidth: 1 },
  tableNumber: { fontFamily: FONTS.monoStrong, fontSize: 15 },
  tableRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: SPACING.compact,
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.compact,
    paddingVertical: 10,
  },
  tableValueText: { flex: 1, textAlign: 'right' },
  wallet: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  walletNumber: { fontSize: 20, lineHeight: 26 },
});

export type { ShopPageProps };
