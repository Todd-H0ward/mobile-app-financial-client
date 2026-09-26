import { useState } from 'react';

import { ScrollView, StyleSheet, View } from 'react-native';

import { useShowFeedback } from '@/features/feedback';

import { type CatalogueItem, listCatalogueByShop } from '@/entities/catalogue';
import {
  applyPurchase,
  canAfford,
  useCommitUser,
  useUser,
} from '@/entities/user';

import { SPACING } from '@/shared/constants';
import { useTranslation } from '@/shared/i18n';
import { hapticSuccess, useTimeSource } from '@/shared/lib';
import { formatMoney } from '@/shared/utils';

import {
  TerminalMenuRow,
  TerminalPrompt,
  TerminalRule,
  TerminalText,
} from '../terminal-shell';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface ShopPageProps {
  onBack: () => void;
}

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

/**
 * Full workshop catalogue inside the Keeper terminal (charge, modules, cosmetics).
 */
export const ShopPage = ({ onBack }: ShopPageProps) => {
  const { t } = useTranslation();
  const user = useUser();
  const commitUser = useCommitUser();
  const time = useTimeSource();
  const showFeedback = useShowFeedback();
  const items = listCatalogueByShop('workshop');
  const canShop = user?.period.phase === 'active';
  const balance = user?.wallet.balance ?? 0;
  const [pending, setPending] = useState<CatalogueItem | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const buy = (item: CatalogueItem) => {
    if (!user) return;
    if (user.period.phase === 'planning') {
      setMessage(t('watcher.terminal.shop.planFirst'));
      return;
    }
    if (user.period.phase !== 'active') return;

    if (!canAfford(user.wallet, item.price)) {
      setPending(null);
      setMessage(
        t('watcher.terminal.shop.shortage', {
          shortfall: formatMoney(item.price - user.wallet.balance),
        }),
      );
      return;
    }
    setPending(item);
    setMessage(null);
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
    const bought = pending;
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
    setMessage(
      t('watcher.terminal.shop.bought', {
        item: t(`catalogue.items.${bought.id}.title`, {
          defaultValue: bought.title,
        }),
      }),
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.stack}>
      <TerminalText>
        {t('watcher.terminal.shop.balance', {
          count: formatMoney(balance),
        })}
      </TerminalText>
      {!canShop ? (
        <TerminalText isDim>
          {t('watcher.terminal.shop.planFirst')}
        </TerminalText>
      ) : null}
      <TerminalRule />

      {message ? <TerminalText>{message}</TerminalText> : null}

      {pending ? (
        <View style={styles.stack}>
          <TerminalText>
            {t('watcher.terminal.shop.confirm', {
              item: t(`catalogue.items.${pending.id}.title`, {
                defaultValue: pending.title,
              }),
              price: formatMoney(pending.price),
            })}
          </TerminalText>
          <TerminalPrompt isCursorVisible onPress={confirm}>
            {t('watcher.terminal.shop.buy')}
          </TerminalPrompt>
          <TerminalPrompt
            onPress={() => {
              setPending(null);
            }}
          >
            {t('common.cancel')}
          </TerminalPrompt>
        </View>
      ) : (
        items.map((item) => (
          <TerminalMenuRow
            key={item.id}
            label={`${t(`catalogue.items.${item.id}.title`, {
              defaultValue: item.title,
            })} · ${formatMoney(item.price)}`}
            onPress={() => buy(item)}
          />
        ))
      )}

      <TerminalRule />
      <TerminalMenuRow label={t('watcher.terminal.back')} onPress={onBack} />
    </ScrollView>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  stack: { gap: SPACING.two },
});
