import { Image } from 'react-native';

import { isSceneName, PUZZLE_SCENES, SPRITE_PALETTE } from '@/entities/sprite';

import { type InkPath, pixelPaths, pixelSize } from '@/shared/utils';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

/** What a puzzle is cut from: a bundled photo or one of the pixel scenes. */
type PuzzlePicture =
  | { kind: 'photo'; uri: string }
  | { kind: 'pixel'; paths: InkPath[]; width: number; height: number };

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/** Bundled photos for puzzle levels whose picture is not a scene. */
const PUZZLE_IMAGE_MODULES: Record<string, number> = {
  living: require('@/assets/images/rooms/living.webp'),
};

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

/** Resolves a level's `imageKey`; a scene wins over a photo of the same name. */
export const puzzlePicture = (imageKey: string): PuzzlePicture => {
  if (isSceneName(imageKey)) {
    const rows = PUZZLE_SCENES[imageKey];
    return {
      kind: 'pixel',
      paths: pixelPaths(rows, SPRITE_PALETTE),
      ...pixelSize(rows),
    };
  }
  const imageModule = PUZZLE_IMAGE_MODULES[imageKey];
  const source =
    imageModule === undefined
      ? undefined
      : Image.resolveAssetSource(imageModule);
  return { kind: 'photo', uri: source?.uri ?? '' };
};

export type { PuzzlePicture };
