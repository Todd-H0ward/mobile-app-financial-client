export type {
  BondBurst,
  BondKind,
  BondReaction,
  GrowthFacts,
  GrowthProgress,
  GrowthRule,
  RobotNameStatus,
} from './lib';
export {
  actionForMood,
  bondReaction,
  easeRobotDogAxes,
  easeTowards,
  GROWTH_RULES,
  growRobotDog,
  isRobotNameValid,
  moodFor,
  normalizeRobotName,
  progressToNextStage,
  ROBOT_DOG_EASE_RATE,
  ROBOT_DOG_MOOD_HIGH,
  ROBOT_DOG_MOOD_LOW,
  ROBOT_NAME_MAX_LENGTH,
  ROBOT_NAME_MIN_LENGTH,
  stageFor,
  stageTransition,
  validateRobotName,
} from './lib';
export type {
  RobotDogAction,
  RobotDogAxes,
  RobotDogMood,
  RobotDogMoodAxis,
  RobotDogMoodCauses,
  RobotDogMoodName,
  RobotDogReason,
  RobotDogSkin,
  RobotDogStage,
} from './model';
export {
  DEFAULT_ROBOT_DOG_ACTION,
  DEFAULT_ROBOT_DOG_SKIN,
  isRobotDogAction,
  isRobotDogSkin,
  ROBOT_DOG_ACTIONS,
  ROBOT_DOG_CLIPS,
  ROBOT_DOG_FADE_SEC,
  ROBOT_DOG_MOOD_NAMES,
  ROBOT_DOG_REACTION_SEC,
  ROBOT_DOG_REASONS,
  ROBOT_DOG_SKINS,
  ROBOT_DOG_STAGES,
} from './model';
export type {
  RobotAssembly,
  RobotEars,
  RobotFace,
} from './model/assembly';
export {
  DEFAULT_ROBOT_ASSEMBLY,
  isRobotAssembly,
  ROBOT_EARS,
  ROBOT_FACES,
} from './model/assembly';
export { ROBOT_PALETTE } from './model/palette';
