import {
  isRobotDogSkin,
  isRobotNameValid,
  normalizeRobotName,
  type RobotDogSkin,
} from '@/entities/robot-dog';

import type { UserSave } from '../../model/types';
import { isPlayerNameValid, normalizePlayerName } from '../player-name';

interface IdentityInput {
  /** A local game nickname, never a real identity requirement. */
  playerName: string;
  /** The child's name for the robot, normalized before saving. */
  robotName: string;
  /** Free coat selection; no currency is consumed. */
  skin: RobotDogSkin;
}

/** Updating an identity never recreates the save or resets earned progress. */
export const applyIdentity = (
  user: UserSave,
  input: IdentityInput,
): UserSave => {
  if (
    !isPlayerNameValid(input.playerName) ||
    !isRobotNameValid(input.robotName) ||
    !isRobotDogSkin(input.skin)
  )
    return user;
  return {
    ...user,
    playerName: normalizePlayerName(input.playerName),
    robot: { ...user.robot, name: normalizeRobotName(input.robotName) },
    settings: { ...user.settings, robotSkin: input.skin },
  };
};

export type { IdentityInput };
