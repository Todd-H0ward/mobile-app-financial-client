import {
  isRobotAssembly,
  isRobotDogSkin,
  isRobotNameValid,
  normalizeRobotName,
  type RobotAssembly,
  type RobotDogSkin,
} from '@/entities/robot-dog';

import type { UserSave } from '../../model/types';
import { isPlayerNameValid, normalizePlayerName } from '../player-name';
import { hasModule, moduleId } from '../workshop';

interface IdentityInput {
  /** Free starting modules; omitted by callers editing names only. */
  assembly?: RobotAssembly;
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
    !isRobotDogSkin(input.skin) ||
    (input.assembly !== undefined && !isRobotAssembly(input.assembly))
  )
    return user;
  const assembly = input.assembly ?? user.robot.assembly;
  if (
    user.playerName &&
    (['head', 'body', 'legs'] as const).some(
      (part) => !hasModule(user, part, assembly[part]),
    )
  )
    return user;
  return {
    ...user,
    ownedItemIds: [
      ...new Set([
        ...user.ownedItemIds,
        ...(['head', 'body', 'legs'] as const).map((part) =>
          moduleId(part, assembly[part]),
        ),
      ]),
    ],
    playerName: normalizePlayerName(input.playerName),
    robot: {
      ...user.robot,
      name: normalizeRobotName(input.robotName),
      assembly: input.assembly ? { ...input.assembly } : user.robot.assembly,
    },
    settings: { ...user.settings, robotSkin: input.skin },
  };
};

export type { IdentityInput };
