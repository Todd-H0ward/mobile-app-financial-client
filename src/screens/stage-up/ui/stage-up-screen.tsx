import { Redirect } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { RobotTerminal } from '@/widgets/robot-profile';

import { RobotDuo } from '@/entities/robot-dog/ui';
import { useUser } from '@/entities/user';

import { SPACING, STATIC_ROUTES } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import { useTranslation } from '@/shared/i18n';
import { Button, PixelIcon, Screen, Text } from '@/shared/ui';

import { useStageUp } from '../model';

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

/** Marks the build stage rising after a settled period — visible ritual for 2.5.10. */
export const StageUpScreen = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const user = useUser();
  const stageUp = useStageUp();

  if (!user) return <Redirect href={STATIC_ROUTES.ENTRY} />;
  if (!stageUp) return <Redirect href={STATIC_ROUTES.HOME} />;

  const gearIcon = stageUp.stage === 'complete' ? 'up' : 'battery';

  return (
    <RobotTerminal
      variant="finale"
      hero={
        <View style={styles.hero}>
          <View style={[styles.badge, { backgroundColor: theme.phosphor }]}>
            <Text variant="smallBold" themeColor="onAccent">
              {t(`diagnosis.stage.${stageUp.stage}`)}
            </Text>
          </View>
          <View style={styles.scene}>
            <RobotDuo
              skin={user.settings.robotSkin}
              assembly={user.robot.assembly}
            />
          </View>
        </View>
      }
    >
      <Screen.Heading style={styles.heading}>
        <Screen.Label>{t('stageUp.label')}</Screen.Label>
        <Screen.Title style={styles.title}>
          {t('stageUp.title', { name: stageUp.robotName })}
        </Screen.Title>
      </Screen.Heading>

      <View
        style={[
          styles.gear,
          {
            backgroundColor: theme.surfaceSoft,
            borderColor: theme.phosphor,
          },
        ]}
      >
        <PixelIcon name={gearIcon} size={20} />
        <View style={styles.copy}>
          <Text variant="bodyBold">
            {t(`stageUp.gear.${stageUp.stage}.title`)}
          </Text>
          <Text variant="small" themeColor="textSecondary">
            {t(`stageUp.gear.${stageUp.stage}.body`)}
          </Text>
        </View>
      </View>

      <Text themeColor="textSecondary">{t('stageUp.body')}</Text>

      <Button
        size="l"
        isFullWidth
        onPress={stageUp.continueNext}
        style={styles.button}
      >
        {t('stageUp.continue')}
      </Button>
    </RobotTerminal>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  badge: {
    borderRadius: 8,
    paddingHorizontal: SPACING.COMPACT,
    paddingVertical: SPACING.TWO,
  },
  button: { marginTop: 'auto', paddingTop: SPACING.COMPACT },
  copy: { flex: 1, gap: SPACING.HALF },
  gear: {
    alignItems: 'flex-start',
    borderRadius: 12,
    borderWidth: 2,
    flexDirection: 'row',
    gap: SPACING.COMPACT,
    padding: SPACING.COMPACT,
  },
  heading: { flex: 0 },
  hero: { alignItems: 'center', flex: 1, gap: SPACING.THREE, width: '100%' },
  scene: { flex: 1, width: '100%' },
  title: { fontSize: 28, lineHeight: 32 },
});
