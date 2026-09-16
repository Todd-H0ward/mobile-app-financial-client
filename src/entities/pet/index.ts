/**
 * The slice's logic and vocabulary. The rig has an entry point of its own,
 * `@/entities/pet/ui`, because pulling a React component through here would
 * drag react-native into the node test runner, which is how `entities/user`
 * reads the appearance tuples.
 */
export type { PetRig } from './lib';
export {
  anchorPoint,
  anchorsFor,
  easePetAxes,
  easeTowards,
  lerpPose,
  moodFor,
  PET_EASE_RATE,
  PET_MOOD_HIGH,
  PET_MOOD_LOW,
  POSE_NEUTRAL,
  poseFor,
  rigFor,
  silhouetteFor,
  skinFor,
} from './lib';
export type {
  PetAnchor,
  PetAnchors,
  PetAxes,
  PetColor,
  PetEarShape,
  PetMood,
  PetMoodAxis,
  PetMoodCauses,
  PetMoodName,
  PetPattern,
  PetPatternKind,
  PetPatternMarks,
  PetPose,
  PetReason,
  PetSilhouette,
  PetSkin,
  PetSpecies,
  PetStage,
  PetTailShape,
} from './model';
export {
  PET_COLORS,
  PET_MOOD_NAMES,
  PET_PATTERNS,
  PET_REASONS,
  PET_SPECIES,
  PET_STAGES,
} from './model';
