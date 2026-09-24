export { actionForMood } from './action';
export type { GrowthFacts, GrowthProgress, GrowthRule } from './growth';
export {
  GROWTH_RULES,
  growRobotDog,
  progressToNextStage,
  stageFor,
} from './growth';
export {
  easeRobotDogAxes,
  easeTowards,
  moodFor,
  ROBOT_DOG_EASE_RATE,
  ROBOT_DOG_MOOD_HIGH,
  ROBOT_DOG_MOOD_LOW,
} from './mood';
export type { RobotNameStatus } from './robot-name';
export {
  isRobotNameValid,
  normalizeRobotName,
  ROBOT_NAME_MAX_LENGTH,
  ROBOT_NAME_MIN_LENGTH,
  validateRobotName,
} from './robot-name';
