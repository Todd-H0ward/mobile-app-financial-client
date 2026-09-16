import { StyleSheet } from 'react-native';

import { HintButton } from '@/widgets/hint-button';

import { Button, Screen } from '@/shared/ui';

import { useOnboarding } from '../model';

import { PawTrail } from './paw-trail';
import { PetSpeech } from './pet-speech';
import {
  CoinsStep,
  GreetingStep,
  NameStep,
  PetStep,
  PlanStep,
  SortingStep,
} from './steps';

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

export const OnboardingScreen = () => {
  const onboarding = useOnboarding();
  const { stepId, title, line, stepNumber, stepCount } = onboarding;

  return (
    <Screen gap="three" isTabBarVisible={false}>
      <Screen.Header>
        <Screen.Heading>
          <Screen.Title>{title}</Screen.Title>
        </Screen.Heading>
        <HintButton screen="onboarding" isPulsing={stepId === 'greeting'} />
      </Screen.Header>

      <PawTrail current={stepNumber} total={stepCount} />

      {stepId !== 'greeting' && stepId !== 'pet' && (
        <PetSpeech
          line={line}
          stepId={stepId}
          species={onboarding.petSpecies}
          color={onboarding.petColor}
          pattern={onboarding.petPattern}
        />
      )}

      {stepId === 'greeting' && (
        <>
          <PetSpeech
            line={line}
            stepId={stepId}
            species="cat"
            color="sand"
            pattern="solid"
            isCompact
          />
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
      {stepId === 'pet' && (
        <>
          <PetSpeech
            line={line}
            stepId={stepId}
            species={onboarding.petSpecies}
            color={onboarding.petColor}
            pattern={onboarding.petPattern}
            isCompact
          />
          <PetStep onboarding={onboarding} />
        </>
      )}
      {stepId === 'name' && <NameStep onboarding={onboarding} />}

      <Button
        size="l"
        isFullWidth
        disabled={!onboarding.canContinue}
        onPress={onboarding.goNext}
        style={styles.button}
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
  },
});
