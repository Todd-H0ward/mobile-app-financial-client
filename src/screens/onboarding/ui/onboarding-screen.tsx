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
      <Screen.Header
        title={title}
        trailing={
          <HintButton screen="onboarding" isPulsing={stepId === 'greeting'} />
        }
      />

      <PawTrail current={stepNumber} total={stepCount} />

      <PetSpeech line={line} stepId={stepId} />

      {stepId === 'greeting' && <GreetingStep />}
      {stepId === 'sorting' && <SortingStep onboarding={onboarding} />}
      {stepId === 'coins' && <CoinsStep />}
      {stepId === 'plan' && <PlanStep onboarding={onboarding} />}
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
