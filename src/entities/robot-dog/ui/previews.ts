import type { RobotDogSkin } from '../model';

/**
 * Render previews that ship with the model, one per coat.
 *
 * A literal map because Metro cannot follow a `require` built from a variable,
 * and relative because the `@/*` alias points at `src/`, not `assets/`.
 */
export const ROBOT_SKIN_PREVIEWS: Record<RobotDogSkin, number> = {
  factory: require('../../../../assets/robot-dog/previews/factory.jpg'),
  arctic: require('../../../../assets/robot-dog/previews/arctic.jpg'),
  carbon: require('../../../../assets/robot-dog/previews/carbon.jpg'),
  desert: require('../../../../assets/robot-dog/previews/desert.jpg'),
  forest: require('../../../../assets/robot-dog/previews/forest.jpg'),
  rescue: require('../../../../assets/robot-dog/previews/rescue.jpg'),
  rust: require('../../../../assets/robot-dog/previews/rust.jpg'),
};
