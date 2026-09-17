import { Redirect } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { PetView } from '@/entities/pet/ui';

import { type RoutePath, SPACING, STATIC_ROUTES } from '@/shared/constants';
import { useTranslation } from '@/shared/i18n';
import { Button, Card, Screen, Text } from '@/shared/ui';

import { usePetGrew } from '../model/use-pet-grew';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface PetGrewScreenProps {
  /** Where to send the child once the scene is dismissed. */
  destination: RoutePath;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/** Big enough to be the whole point of the screen. */
const PET_SIZE = 220;

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

/**
 * The growth scene — roadmap 1.6.
 *
 * `growPet` can raise a stage silently during settlement (2.5.10 asks only
 * that the pet reach a new state, not that a screen be open when it does).
 * This is the screen that makes it loud: docs/pet.md calls the moment "the
 * most visible reward in the game", and 2.5.10 requires the cause of any
 * state change to be named — here, in whole numbers a child can read aloud.
 *
 * Not reachable by its own path with nothing pending: it redirects home
 * rather than showing an empty celebration for a stage nobody reached.
 */
export const PetGrewScreen = ({ destination }: PetGrewScreenProps) => {
  const { t } = useTranslation();
  const grew = usePetGrew(destination);

  if (!grew) {
    return <Redirect href={STATIC_ROUTES.HOME} />;
  }

  const stageLabel = t(`parents.report.stages.${grew.stage}`);

  return (
    <Screen gap="three" isTabBarVisible={false}>
      <View style={styles.stage}>
        <PetView
          appearance={grew.appearance}
          emotion="excited"
          stage={grew.stage}
          size={PET_SIZE}
          accessibilityLabel={t('petGrew.a11y', {
            name: grew.petName,
            stage: stageLabel,
          })}
        />
      </View>

      <Screen.Heading>
        <Screen.Title>{t('petGrew.title')}</Screen.Title>
        <Screen.Subtitle>
          {t('petGrew.body', { name: grew.petName, stage: stageLabel })}
        </Screen.Subtitle>
      </Screen.Heading>

      <Card tone="surfaceSoft">
        <Card.Content>
          <Text variant="bodyBold">{t('petGrew.reasonIntro')}</Text>
          <Text themeColor="textSecondary">
            {`· ${t('petGrew.reasonPeriods', { count: grew.reason.periods })}`}
          </Text>
          <Text themeColor="textSecondary">
            {`· ${t('petGrew.reasonGoals', { count: grew.reason.goalsReached })}`}
          </Text>
          <Text themeColor="textSecondary">
            {`· ${t('petGrew.reasonPlans', { count: grew.reason.plansKept })}`}
          </Text>
        </Card.Content>
      </Card>

      <Button onPress={grew.confirm}>{t('petGrew.confirm')}</Button>
    </Screen>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  stage: {
    alignItems: 'center',
    paddingVertical: SPACING.four,
  },
});

export type { PetGrewScreenProps };
