import { StyleSheet, View } from 'react-native';

import type { CatalogueItem } from '@/entities/catalogue';
import { CONSOLE_FURNITURE_ID } from '@/entities/minigame/console';
import { puzzleById } from '@/entities/minigame/puzzle';

import { RADII, SPACING } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import { useTranslation } from '@/shared/i18n';
import { ListRow, Sheet } from '@/shared/ui';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface ToyShelfSheetProps {
  toys: readonly CatalogueItem[];
  isVisible: boolean;
  onClose: () => void;
  /** Opens a playable toy (puzzle sitting or console lobby). */
  onPlayToy: (furnitureId: string) => void;
}

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

const isPlayableToy = (furnitureId: string | undefined): boolean => {
  if (furnitureId == null) return false;
  if (furnitureId === CONSOLE_FURNITURE_ID) return true;
  return puzzleById(furnitureId) != null;
};

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

/**
 * Placeholder tile until shelf photos land — keeps the row height stable.
 */
const ToyPhotoPlaceholder = () => {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.photo,
        {
          backgroundColor: theme.border,
        },
      ]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
};

/**
 * Menu of toys already on the living-room shelf. Playable rows open a sitting
 * or the console lobby; the rest stay listed with a "soon" caption.
 */
export const ToyShelfSheet = ({
  toys,
  isVisible,
  onClose,
  onPlayToy,
}: ToyShelfSheetProps) => {
  const { t } = useTranslation();

  if (!isVisible) return null;

  return (
    <Sheet.Modal isVisible onClose={onClose}>
      <Sheet.Title>{t('home.toyShelfTitle')}</Sheet.Title>
      <Sheet.Description>{t('home.toyShelfHint')}</Sheet.Description>

      <View style={styles.list}>
        {toys.map((toy) => {
          const title = t(`shop.items.${toy.id}.title`, {
            defaultValue: toy.title,
          });
          const furnitureId = toy.furnitureId;
          const canPlay = isPlayableToy(furnitureId);

          return (
            <ListRow
              key={toy.id}
              title={title}
              subtitle={canPlay ? t('home.toyPlay') : t('home.toySoon')}
              onPress={
                canPlay && furnitureId
                  ? () => onPlayToy(furnitureId)
                  : undefined
              }
              icon={
                <ListRow.Icon tone="surfaceSoft">
                  <ToyPhotoPlaceholder />
                </ListRow.Icon>
              }
            />
          );
        })}
      </View>
    </Sheet.Modal>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  list: {
    gap: SPACING.two,
    marginTop: SPACING.two,
  },
  photo: {
    borderRadius: RADII.xs,
    height: 28,
    width: 28,
  },
});

export type { ToyShelfSheetProps };
