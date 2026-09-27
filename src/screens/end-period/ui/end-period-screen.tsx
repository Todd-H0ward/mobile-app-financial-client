import { Redirect, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { HintButton } from '@/widgets/hint-button';

import { RADII, SPACING, STATIC_ROUTES } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import { useTranslation } from '@/shared/i18n';
import { Button, Screen, Text } from '@/shared/ui';
import { formatMoney } from '@/shared/utils';

import { useEndPeriodConfirm } from '../model';

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

/** Soft confirm before ending the day — never blocks the action (0.3-R) */
export const EndPeriodScreen = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const confirm = useEndPeriodConfirm();

  if (!confirm) {
    return <Redirect href={STATIC_ROUTES.HOME} />;
  }

  return (
    <Screen presentation="sheet" gap={SPACING.COMPACT}>
      <Screen.Header>
        <Screen.Back />
        <Screen.Heading>
          <Screen.Label>
            {t('endPeriod.label', { period: confirm.periodIndex })}
          </Screen.Label>
          <Screen.Title>{t('endPeriod.title')}</Screen.Title>
        </Screen.Heading>
        <HintButton screen="end-period" />
      </Screen.Header>

      <Text themeColor="textSecondary">{t('endPeriod.lead')}</Text>

      {confirm.isNeedsShort && (
        <View style={[styles.warn, { borderColor: theme.warning }]}>
          <Text variant="machine" themeColor="warning">
            !
          </Text>
          <Text style={styles.warnText}>
            {t('endPeriod.warnBody', {
              count: formatMoney(confirm.needsGap),
            })}
          </Text>
        </View>
      )}

      <View style={styles.actions}>
        <Button
          variant="primary"
          size="l"
          isFullWidth
          onPress={confirm.confirm}
        >
          {t('endPeriod.confirm')}
        </Button>
        <Button
          variant="secondary"
          size="m"
          isFullWidth
          onPress={() => router.back()}
        >
          {t('endPeriod.cancel')}
        </Button>
      </View>
    </Screen>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  actions: {
    gap: SPACING.TWO,
    marginTop: SPACING.TWO,
  },
  warn: {
    borderRadius: RADII.m,
    borderStyle: 'dashed',
    borderWidth: 2,
    flexDirection: 'row',
    gap: SPACING.COMPACT,
    padding: SPACING.COMPACT,
  },
  warnText: { flex: 1 },
});
