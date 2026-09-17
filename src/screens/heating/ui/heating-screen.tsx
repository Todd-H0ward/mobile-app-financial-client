import { Redirect } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { HintButton } from '@/widgets/hint-button';

import { HEATING } from '@/entities/economy';
import { useUser } from '@/entities/user';

import { SPACING, STATIC_ROUTES } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import { useTranslation } from '@/shared/i18n';
import { Button, Card, Screen, Sheet, Slider, Text } from '@/shared/ui';
import { formatMoney } from '@/shared/utils';

import { TEMP_STEP, useHeating } from '../model';

import { HeatingBillCard } from './heating-bill-card';
import { HeatingInsulationRowView } from './heating-insulation-row';

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

/** Spoken comfort band — never a percentage (house.md). */
const comfortKey = (temperature: number): 'chilly' | 'cozy' | 'warm' => {
  if (temperature <= HEATING.freeTemperature) return 'chilly';
  if (temperature >= 0.7) return 'warm';
  return 'cozy';
};
// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

/**
 * Thermostat, printable bill and insulation upgrades — docs/house.md.
 *
 * Two consequences at once (comfort label + coins), never a bare percentage.
 * Insulation lists payback at the *current* heat so a free thermostat says
 * the purchase will not earn itself back.
 */
export const HeatingScreen = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const user = useUser();
  const heating = useHeating();

  if (!user || !heating) {
    return <Redirect href={STATIC_ROUTES.HOME} />;
  }

  const pendingTitle = heating.pending
    ? t(`shop.items.${heating.pending.id}.title`, {
        defaultValue: heating.pending.title,
      })
    : '';

  return (
    <Screen gap="three" isTabBarVisible={false}>
      <Screen.Header>
        <Screen.Back />
        <Screen.Heading>
          <Screen.Title>{t('heating.title')}</Screen.Title>
          <Screen.Subtitle>{t('heating.subtitle')}</Screen.Subtitle>
        </Screen.Heading>
        <HintButton screen="heating" />
      </Screen.Header>

      <Card tone="surfaceSoft">
        <Card.Content>
          <Text variant="bodyBold">{t('heating.thermostatTitle')}</Text>
          <View style={styles.ends}>
            <View style={styles.end}>
              <Text variant="small" themeColor="textSecondary">
                {t('heating.chilly')}
              </Text>
              <Text variant="smallBold">
                {t('heating.coinsPerPeriod', { count: formatMoney(0) })}
              </Text>
            </View>
            <View style={[styles.end, styles.endRight]}>
              <Text variant="small" themeColor="textSecondary">
                {t('heating.warm')}
              </Text>
              <Text variant="smallBold">
                {t('heating.coinsPerPeriod', {
                  count: formatMoney(heating.maxBillTotal),
                })}
              </Text>
            </View>
          </View>
          <Slider
            value={heating.temperature}
            min={0}
            max={1}
            step={TEMP_STEP}
            color="primary"
            isThumbFilled
            track={[theme.surface, theme.surfaceDeep, theme.primary]}
            onChange={heating.setThermostat}
            onChangeEnd={heating.commitThermostat}
            style={styles.slider}
          />
          <Text themeColor="textSecondary">
            {t('heating.nowCost', {
              comfort: t(`heating.${comfortKey(heating.temperature)}`),
              count: formatMoney(heating.bill.total),
            })}
          </Text>
        </Card.Content>
      </Card>

      <HeatingBillCard bill={heating.bill} periodIndex={user.period.index} />

      <View style={styles.section}>
        <Text variant="bodyBold">{t('heating.insulationTitle')}</Text>
        <Text themeColor="textSecondary">{t('heating.insulationLead')}</Text>
        <View style={styles.list}>
          {heating.insulation.map((row) => (
            <HeatingInsulationRowView
              key={row.item.id}
              row={row}
              canBuy={heating.canBuy}
              onBuy={heating.buyInsulation}
            />
          ))}
        </View>
      </View>

      <Sheet.Modal
        isVisible={heating.pending != null}
        onClose={heating.dismissPending}
      >
        <Sheet.Title>
          {t('heating.confirmTitle', { title: pendingTitle })}
        </Sheet.Title>
        <Sheet.Description>
          {heating.pending
            ? t('heating.confirmBody', {
                price: formatMoney(heating.pending.price),
              })
            : ''}
        </Sheet.Description>
        <View style={styles.sheetActions}>
          <Button variant="ghost" size="l" onPress={heating.dismissPending}>
            {t('common.cancel')}
          </Button>
          <Button variant="primary" size="l" onPress={heating.confirmBuy}>
            {t('heating.confirmBuy')}
          </Button>
        </View>
      </Sheet.Modal>
    </Screen>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  ends: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.two,
  },
  end: {
    gap: 2,
  },
  endRight: {
    alignItems: 'flex-end',
  },
  list: {
    gap: SPACING.two,
    marginTop: SPACING.two,
  },
  section: {
    gap: SPACING.half,
  },
  sheetActions: {
    flexDirection: 'row',
    gap: SPACING.two,
    justifyContent: 'flex-end',
    marginTop: SPACING.three,
  },
  slider: {
    marginVertical: SPACING.two,
  },
});
