import { useState } from 'react';

import { StyleSheet, View } from 'react-native';

import { MODULE_PRICE } from '@/entities/economy';
import type { RobotAssembly } from '@/entities/robot-dog';
import {
  hasModule,
  installModule,
  useUser,
  useUserStore,
} from '@/entities/user';

import { SPACING } from '@/shared/constants';
import { useTranslation } from '@/shared/i18n';
import { useTimeSource } from '@/shared/lib';
import { Button, Screen, Sheet, Text } from '@/shared/ui';

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

export const WorkshopScreen = () => {
  const { t } = useTranslation();
  const user = useUser();
  const time = useTimeSource();
  const [selection, setSelection] = useState<{
    part: keyof RobotAssembly;
    variant: number;
  } | null>(null);
  const [message, setMessage] = useState('');
  const confirm = () => {
    const { user: current, commitUser } = useUserStore.getState();
    if (!current || !selection) return;
    const result = installModule(
      current,
      selection.part,
      selection.variant,
      time.now(),
    );
    if (result.user !== current && !commitUser(current, result.user)) return;
    setMessage(t(`workshop.${result.reason}`));
    setSelection(null);
  };
  if (!user) return null;
  return (
    <Screen gap="three" isTabBarVisible={false}>
      <Screen.Header>
        <Screen.Back />
        <Screen.Title>{t('workshop.title')}</Screen.Title>
      </Screen.Header>
      <Text>{t('workshop.balance', { amount: user.wallet.balance })}</Text>
      <Text>{t('workshop.rule', { amount: MODULE_PRICE })}</Text>
      {message ? <Text accessibilityLiveRegion="polite">{message}</Text> : null}
      {(['head', 'body', 'legs'] as const).map((part) => (
        <View key={part} style={styles.root}>
          <Text variant="subtitle">{t(`setup.modules.${part}.title`)}</Text>
          {[0, 1, 2].map((variant) => (
            <Button
              key={variant}
              variant="secondary"
              disabled={user.robot.assembly[part] === variant}
              onPress={() => setSelection({ part, variant })}
            >
              {t(`setup.modules.${part}.${variant}`)} ·{' '}
              {user.robot.assembly[part] === variant
                ? t('workshop.equipped')
                : hasModule(user, part, variant)
                  ? t('workshop.install')
                  : t('workshop.price', { amount: MODULE_PRICE })}
            </Button>
          ))}
        </View>
      ))}
      <Sheet.Modal
        isVisible={selection !== null}
        onClose={() => setSelection(null)}
      >
        <Sheet.Title>{t('workshop.confirm')}</Sheet.Title>
        <Text>{t('workshop.effect')}</Text>
        {selection ? (
          <Text>
            {hasModule(user, selection.part, selection.variant)
              ? t('workshop.free')
              : t('workshop.cost', {
                  before: user.wallet.balance,
                  after: Math.max(0, user.wallet.balance - MODULE_PRICE),
                  amount: MODULE_PRICE,
                })}
          </Text>
        ) : null}
        <Button onPress={confirm}>{t('common.confirm')}</Button>
        <Button variant="secondary" onPress={() => setSelection(null)}>
          {t('common.back')}
        </Button>
      </Sheet.Modal>
    </Screen>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════
const styles = StyleSheet.create({ root: { gap: SPACING.two } });
