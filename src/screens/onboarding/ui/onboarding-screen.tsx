import { StyleSheet } from 'react-native';

import { HintButton } from '@/widgets/hint-button';

import { useTranslation } from '@/shared/i18n';
import { Button, Screen } from '@/shared/ui';

import { useOnboarding } from '../model';

import { PawTrail } from './paw-trail';
import { PetSpeech } from './pet-speech';
import {
  CoinsStep,
  GreetingStep,
  NameStep,
  PlanStep,
  SortingStep,
} from './steps';

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

export const OnboardingScreen = () => {
  const { t } = useTranslation();
  const onboarding = useOnboarding();
  const { stepId, title, line, stepNumber, stepCount } = onboarding;

  const isHintPulsing =
    stepId === 'greeting' || stepId === 'sorting' || stepId === 'plan';

  return (
    <Screen gap="three" isTabBarVisible={false}>
      <Screen.Header>
        {onboarding.canGoBack ? (
          <Button size="s" variant="ghost" onPress={onboarding.goBack}>
            {t('common.back')}
          </Button>
        ) : null}
        <Screen.Heading>
          <Screen.Title>{title}</Screen.Title>
        </Screen.Heading>
        <HintButton screen="onboarding" isPulsing={isHintPulsing} />
      </Screen.Header>

      <PawTrail current={stepNumber} total={stepCount} />

      {stepId !== 'greeting' && <PetSpeech line={line} stepId={stepId} />}

      {stepId === 'greeting' && (
        <>
          <PetSpeech line={line} stepId={stepId} isCompact />
          <GreetingStep
            hasMetPet={onboarding.hasMetPet}
            onBoop={onboarding.markPetMet}
          />
        </>
      )}
      {stepId === 'sorting' && <SortingStep onboarding={onboarding} />}
      {stepId === 'coins' && (
        <CoinsStep onReveal={onboarding.markCoinsRevealed} />
      )}
      {stepId === 'plan' && <PlanStep onboarding={onboarding} />}
      {stepId === 'name' && <NameStep onboarding={onboarding} />}

      <Button
        size="l"
        isFullWidth
        disabled={!onboarding.canContinue}
        onPress={onboarding.goNext}
        style={[
          styles.button,
          // Stay under the sorting card while it is dragged across the screen.
          stepId === 'sorting' && styles.buttonUnderDrag,
        ]}
      >
        {onboarding.actionLabel}
      </Button>
    </Screen>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  button: {
    marginTop: 'auto',
    zIndex: 1,
  },
  buttonUnderDrag: {
    zIndex: 0,
  },
});
