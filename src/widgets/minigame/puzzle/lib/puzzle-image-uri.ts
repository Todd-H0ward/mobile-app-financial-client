import { Image } from 'react-native';

/** Bundled photos for puzzle levels. */
const PUZZLE_IMAGE_MODULES: Record<string, number> = {
  living: require('@/assets/images/rooms/living.webp'),
};

export const puzzleImageUri = (imageKey: string): string => {
  const imageModule = PUZZLE_IMAGE_MODULES[imageKey];
  if (imageModule === undefined) return '';
  const source = Image.resolveAssetSource(imageModule);
  return source?.uri ?? '';
};
