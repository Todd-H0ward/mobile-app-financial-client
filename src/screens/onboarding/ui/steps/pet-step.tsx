import { Pressable, StyleSheet, View } from 'react-native';

import {
  appearanceFor,
  PET_COLORS,
  PET_PATTERNS,
  PET_SPECIES,
  type PetColor,
  type PetPattern,
  type PetSpecies,
} from '@/entities/pet';
import { PetView } from '@/entities/pet/ui';

import { RADII, SPACING } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import { useTranslation } from '@/shared/i18n';
import { Text } from '@/shared/ui';

import type { OnboardingController } from '../../model';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface PetStepProps {
  onboarding: OnboardingController;
}

interface ChoiceChipProps {
  label: string;
  isSelected: boolean;
  onPress: () => void;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

const PREVIEW_SIZE = 160;

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

const ChoiceChip = ({ label, isSelected, onPress }: ChoiceChipProps) => {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: isSelected ? theme.primarySoft : theme.surface,
          borderColor: isSelected ? theme.primary : theme.borderStrong,
        },
      ]}
    >
      <Text
        variant="smallBold"
        themeColor={isSelected ? 'primaryStrong' : 'text'}
      >
        {label}
      </Text>
    </Pressable>
  );
};

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

/**
 * Pick a look: species × coat × pattern — the nine (and more) of 2.5.2.
 *
 * One live pet on screen (docs/performance.md); choices are big chips so a
 * seven-year-old can tap without fighting miniature silhouettes.
 */
export const PetStep = ({ onboarding }: PetStepProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const {
    petSpecies,
    petColor,
    petPattern,
    setPetSpecies,
    setPetColor,
    setPetPattern,
  } = onboarding;

  const appearance = appearanceFor(petSpecies, petColor, petPattern);

  return (
    <View style={styles.root}>
      <View style={[styles.preview, { backgroundColor: theme.primarySoft }]}>
        <PetView
          appearance={appearance}
          emotion="happy"
          stage="baby"
          size={PREVIEW_SIZE}
          isAnimated
          accessibilityLabel={t('onboarding.petPreviewA11y')}
        />
      </View>

      <Text variant="bodyBold">{t('onboarding.pickSpecies')}</Text>
      <View style={styles.row}>
        {PET_SPECIES.map((species) => (
          <ChoiceChip
            key={species}
            label={t(`onboarding.species.${species}`)}
            isSelected={petSpecies === species}
            onPress={() => setPetSpecies(species as PetSpecies)}
          />
        ))}
      </View>

      <Text variant="bodyBold">{t('onboarding.pickColor')}</Text>
      <View style={styles.row}>
        {PET_COLORS.map((color) => (
          <ChoiceChip
            key={color}
            label={t(`onboarding.colors.${color}`)}
            isSelected={petColor === color}
            onPress={() => setPetColor(color as PetColor)}
          />
        ))}
      </View>

      <Text variant="bodyBold">{t('onboarding.pickPattern')}</Text>
      <View style={styles.row}>
        {PET_PATTERNS.map((pattern) => (
          <ChoiceChip
            key={pattern}
            label={t(`onboarding.patterns.${pattern}`)}
            isSelected={petPattern === pattern}
            onPress={() => setPetPattern(pattern as PetPattern)}
          />
        ))}
      </View>
    </View>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  chip: {
    borderRadius: RADII.pill,
    borderWidth: 2,
    paddingHorizontal: SPACING.three,
    paddingVertical: SPACING.two,
  },
  preview: {
    alignItems: 'center',
    borderRadius: RADII.xl,
    paddingVertical: SPACING.three,
  },
  root: {
    gap: SPACING.two,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.two,
  },
});

export type { PetStepProps };
