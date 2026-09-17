import { Redirect, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { HintButton } from '@/widgets/hint-button';

import { directionForKind, isShopId, type ShopId } from '@/entities/catalogue';

import { ROUTES, SPACING } from '@/shared/constants';
import { useTranslation } from '@/shared/i18n';
import { Button, Card, CoinBadge, Screen, Sheet, Text } from '@/shared/ui';
import { formatMoney } from '@/shared/utils';

import { useShop } from '../model';

import { ProductRow } from './product-row';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface ShopScreenProps {
  shopId: ShopId;
}

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

/**
 * One street shopfront — grocery, clothes, furniture or toys (2.5.6).
 *
 * Toys hint that mini-games will land later; for now they are still just
 * purchases that update the period fact.
 */
export const ShopScreen = ({ shopId }: ShopScreenProps) => {
  const { t } = useTranslation();
  const router = useRouter();
  const shop = useShop(shopId);

  const needs = shop.items.filter((item) => item.kind === 'need');
  const wants = shop.items.filter((item) => item.kind === 'want');

  const selectedTitle = shop.selected
    ? t(`shop.items.${shop.selected.id}.title`, {
        defaultValue: shop.selected.title,
      })
    : '';

  const directionLabel = shop.selected
    ? t(`budgetPlan.directions.${directionForKind(shop.selected.kind)}.title`)
    : '';

  return (
    <Screen gap="three" isTabBarVisible={false}>
      <Screen.Header>
        <Screen.Back />
        <Screen.Heading>
          <Screen.Title>{t(`shop.stores.${shopId}.title`)}</Screen.Title>
          <Screen.Subtitle>
            {t(`shop.stores.${shopId}.subtitle`)}
          </Screen.Subtitle>
        </Screen.Heading>
        <HintButton screen="shop" />
      </Screen.Header>

      <CoinBadge
        amount={shop.balance}
        label={t('shop.balance')}
        coinSize={18}
      />

      {!shop.canShop && (
        <Button
          variant="secondary"
          isFullWidth
          onPress={() => router.push(ROUTES.BUDGET_PLAN)}
        >
          {t('shop.goPlan')}
        </Button>
      )}
      {!shop.canShop && (
        <Text themeColor="textSecondary">{t('shop.planFirstBanner')}</Text>
      )}

      {shopId === 'toys' && (
        <Card tone="surfaceSoft">
          <Card.Content>
            <Text variant="bodyBold">{t('shop.toys.gamesTitle')}</Text>
            <Text themeColor="textSecondary">{t('shop.toys.gamesBody')}</Text>
          </Card.Content>
        </Card>
      )}

      {needs.length > 0 && (
        <View style={styles.section}>
          <Text variant="bodyBold">{t('shop.sectionNeeds')}</Text>
          {needs.map((item) => (
            <ProductRow
              key={item.id}
              item={item}
              canAfford={shop.balance >= item.price}
              onPress={() => shop.selectItem(item)}
            />
          ))}
        </View>
      )}

      {wants.length > 0 && (
        <View style={styles.section}>
          <Text variant="bodyBold">{t('shop.sectionWants')}</Text>
          {wants.map((item) => (
            <ProductRow
              key={item.id}
              item={item}
              canAfford={shop.balance >= item.price}
              onPress={() => shop.selectItem(item)}
            />
          ))}
        </View>
      )}

      <Sheet.Modal
        isVisible={shop.sheet === 'confirm' && shop.selected != null}
        onClose={shop.dismissSheet}
      >
        <Sheet.Title>{t('shop.confirmTitle')}</Sheet.Title>
        <Sheet.Description>
          {t('shop.confirmBody', {
            title: selectedTitle,
            price: formatMoney(shop.selected?.price ?? 0),
            direction: directionLabel,
          })}
          {shop.overPlanBy > 0
            ? `\n\n${t('shop.overPlan', { count: formatMoney(shop.overPlanBy) })}`
            : ''}
        </Sheet.Description>
        <Sheet.Actions>
          <Button variant="ghost" isFullWidth onPress={shop.dismissSheet}>
            {t('shop.cancel')}
          </Button>
          <Button variant="primary" isFullWidth onPress={shop.confirmPurchase}>
            {t('shop.buy')}
          </Button>
        </Sheet.Actions>
      </Sheet.Modal>

      <Sheet.Modal
        isVisible={
          shop.sheet === 'shortage' &&
          shop.shortage != null &&
          shop.shortageExplain != null
        }
        onClose={shop.dismissSheet}
      >
        <Sheet.Title>
          {t('shop.shortageTitle', {
            count: formatMoney(shop.shortage?.shortfall ?? 0),
          })}
        </Sheet.Title>
        <Sheet.Description>
          {t('shop.shortageBody', {
            title: selectedTitle,
            price: formatMoney(shop.shortage?.price ?? 0),
            balance: formatMoney(shop.shortage?.balance ?? 0),
          })}
          {`\n\n${t('shop.shortageOptionsIntro')}`}
          {shop.shortageExplain?.task
            ? `\n· ${t(
                shop.shortageExplain.task.coversShortfall
                  ? 'shop.shortageOptionTask'
                  : 'shop.shortageOptionTaskPartial',
                {
                  title: shop.shortageExplain.task.taskTitle,
                  reward: formatMoney(shop.shortageExplain.task.reward),
                },
              )}`
            : ''}
          {shop.shortageExplain
            ? `\n· ${
                shop.shortageExplain.jar.isAvailable &&
                shop.shortageExplain.jar.goalTitle != null &&
                shop.shortageExplain.jar.remainingBefore != null &&
                shop.shortageExplain.jar.remainingAfter != null
                  ? t('shop.shortageOptionJar', {
                      count: formatMoney(shop.shortageExplain.shortfall),
                      goal: shop.shortageExplain.jar.goalTitle,
                      before: formatMoney(
                        shop.shortageExplain.jar.remainingBefore,
                      ),
                      after: formatMoney(
                        shop.shortageExplain.jar.remainingAfter,
                      ),
                    })
                  : shop.shortageExplain.jar.goalTitle != null
                    ? t('shop.shortageOptionJarShort', {
                        goal: shop.shortageExplain.jar.goalTitle,
                        saved: formatMoney(shop.shortageExplain.jar.saved),
                        count: formatMoney(shop.shortageExplain.shortfall),
                      })
                    : t('shop.shortageOptionJarNoGoal')
              }`
            : ''}
          {`\n· ${t('shop.shortageOptionWait')}`}
        </Sheet.Description>
        <Sheet.Actions>
          <Button variant="ghost" isFullWidth onPress={shop.dismissSheet}>
            {t('shop.shortageWait')}
          </Button>
          <Button
            variant="secondary"
            isFullWidth
            disabled={!shop.shortageExplain?.jar.isAvailable}
            onPress={() => {
              shop.dismissSheet();
              router.push(ROUTES.SAVINGS);
            }}
          >
            {t('shop.shortageJar')}
          </Button>
          <Button
            variant="primary"
            isFullWidth
            onPress={() => {
              shop.dismissSheet();
              router.push(ROUTES.TASKS);
            }}
          >
            {t('shop.shortageTask')}
          </Button>
        </Sheet.Actions>
      </Sheet.Modal>

      <Sheet.Modal
        isVisible={shop.sheet === 'planning'}
        onClose={shop.dismissSheet}
      >
        <Sheet.Title>{t('shop.planFirstTitle')}</Sheet.Title>
        <Sheet.Description>{t('shop.planFirstBody')}</Sheet.Description>
        <Sheet.Actions>
          <Button variant="ghost" isFullWidth onPress={shop.dismissSheet}>
            {t('shop.cancel')}
          </Button>
          <Button
            variant="primary"
            isFullWidth
            onPress={() => {
              shop.dismissSheet();
              router.push(ROUTES.BUDGET_PLAN);
            }}
          >
            {t('shop.goPlan')}
          </Button>
        </Sheet.Actions>
      </Sheet.Modal>
    </Screen>
  );
};

/**
 * Resolves the dynamic shop route. Unknown ids fall back home rather than
 * crashing on a typo.
 */
export const ShopRouteScreen = ({ shopId }: { shopId: string }) => {
  if (!isShopId(shopId)) {
    return <Redirect href={ROUTES.HOME} />;
  }

  return <ShopScreen shopId={shopId} />;
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  section: {
    gap: SPACING.two,
  },
});

export type { ShopScreenProps };
