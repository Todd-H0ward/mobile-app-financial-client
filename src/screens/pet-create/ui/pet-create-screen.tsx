import { StyleSheet, View } from 'react-native';

import {
  appearanceFor,
  PET_COLORS,
  PET_NAME_MAX_LENGTH,
  PET_PATTERNS,
  PET_SPECIES,
} from '@/entities/pet';
import { PetView } from '@/entities/pet/ui';

import { SPACING } from '@/shared/constants';
import { useTranslation } from '@/shared/i18n';
import { Button, Chip, Input, Screen, Text } from '@/shared/ui';

import { usePetCreate } from '../model/use-pet-create';

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/** Side of the pet on this screen: big enough to judge a coat by. */
const PREVIEW_SIZE = 200;

/** The pet is meeting the child, so it is shown at its best. */
const PREVIEW_EMOTION = 'happy';

/** The words a child reads instead of the axis ids. */
const SPECIES_LABEL: Record<(typeof PET_SPECIES)[number], string> = {
  cat: 'Кот',
  dog: 'Пёс',
  capybara: 'Капибара',
};

const COLOR_LABEL: Record<(typeof PET_COLORS)[number], string> = {
  sand: 'Песочный',
  graphite: 'Графит',
  mint: 'Мятный',
};

const PATTERN_LABEL: Record<(typeof PET_PATTERNS)[number], string> = {
  solid: 'Однотонный',
  spots: 'Пятна',
  stripes: 'Полоски',
};

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

/**
 * Meeting the pet: three axes and a name.
 *
 * The three rows make twenty-seven looks and nine silhouettes without the
 * pattern — requirement 2.5.2 — and every one of them is on screen before it
 * is chosen: the child picks a pet they can see, not a word from a list.
 */
export const PetCreateScreen = () => {
  const { t } = useTranslation();
  const petCreate = usePetCreate();

  return (
    <Screen gap="three" isTabBarVisible={false}>
      <Screen.Header>
        <Screen.Back />
        <Screen.Heading>
          <Screen.Title>{t('petCreate.title')}</Screen.Title>
          <Screen.Subtitle>{t('petCreate.subtitle')}</Screen.Subtitle>
        </Screen.Heading>
      </Screen.Header>

      <View style={styles.stage}>
        <PetView
          appearance={appearanceFor(
            petCreate.species,
            petCreate.color,
            petCreate.pattern,
          )}
          emotion={PREVIEW_EMOTION}
          stage="baby"
          size={PREVIEW_SIZE}
        />
      </View>

      <View style={styles.row}>
        <Text variant="label" themeColor="textMuted">
          {t('petCreate.whoIsThis')}
        </Text>
        <View style={styles.chips}>
          {PET_SPECIES.map((species) => (
            <Chip
              key={species}
              variant={petCreate.species === species ? 'selected' : 'neutral'}
              onPress={() => petCreate.setSpecies(species)}
            >
              {t(`pet.species.${species}`, {
                defaultValue: SPECIES_LABEL[species],
              })}
            </Chip>
          ))}
        </View>
      </View>

      <View style={styles.row}>
        <Text variant="label" themeColor="textMuted">
          {t('petCreate.color')}
        </Text>
        <View style={styles.chips}>
          {PET_COLORS.map((color) => (
            <Chip
              key={color}
              variant={petCreate.color === color ? 'selected' : 'neutral'}
              onPress={() => petCreate.setColor(color)}
            >
              {t(`pet.color.${color}`, {
                defaultValue: COLOR_LABEL[color],
              })}
            </Chip>
          ))}
        </View>
      </View>

      <View style={styles.row}>
        <Text variant="label" themeColor="textMuted">
          {t('petCreate.pattern')}
        </Text>
        <View style={styles.chips}>
          {PET_PATTERNS.map((pattern) => (
            <Chip
              key={pattern}
              variant={petCreate.pattern === pattern ? 'selected' : 'neutral'}
              onPress={() => petCreate.setPattern(pattern)}
            >
              {t(`pet.pattern.${pattern}`, {
                defaultValue: PATTERN_LABEL[pattern],
              })}
            </Chip>
          ))}
        </View>
      </View>

      <Input
        value={petCreate.name}
        onChangeText={petCreate.setName}
        maxLength={PET_NAME_MAX_LENGTH}
        isCounterVisible
        placeholder={t('petCreate.namePlaceholder')}
        hint={t('petCreate.nameHint')}
      />

      <Button
        isFullWidth
        disabled={!petCreate.canFinish}
        onPress={petCreate.finish}
      >
        {t('petCreate.takeHome')}
      </Button>
    </Screen>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  chips: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.two,
  },
  row: {
    gap: SPACING.one,
  },
  stage: {
    alignItems: 'center',
    alignSelf: 'stretch',
  },
});
