import { MODULE_PRICE } from '@/entities/economy';
import type { RobotAssembly } from '@/entities/robot-dog';

import type { UserSave } from '../../model/types';
import { debitWallet } from '../wallet';
export const moduleId = (part: keyof RobotAssembly, variant: number) =>
  `module:${part}:${variant}`;
export const hasModule = (
  user: UserSave,
  part: keyof RobotAssembly,
  variant: number,
) =>
  user.robot.assembly[part] === variant ||
  user.ownedItemIds.includes(moduleId(part, variant));
export const installModule = (
  user: UserSave,
  part: keyof RobotAssembly,
  variant: number,
  at: number,
): {
  user: UserSave;
  reason: 'installed' | 'purchased' | 'funds' | 'planning' | 'invalid';
} => {
  if (
    !['head', 'body', 'legs'].includes(part) ||
    !Number.isInteger(variant) ||
    variant < 0 ||
    variant > 2
  )
    return { user, reason: 'invalid' };
  if (user.robot.assembly[part] === variant)
    return { user, reason: 'installed' };
  const owned = hasModule(user, part, variant);
  if (!owned && user.period.phase !== 'active')
    return { user, reason: 'planning' };
  const debit = owned
    ? null
    : debitWallet(user.wallet, {
        source: `purchase:${moduleId(part, variant)}`,
        amount: MODULE_PRICE,
        direction: 'wants',
        periodIndex: user.period.index,
        at,
      });
  if (debit && !debit.ok) return { user, reason: 'funds' };
  const ownedItemIds = [
    ...new Set([
      ...user.ownedItemIds,
      moduleId(part, user.robot.assembly[part]),
      moduleId(part, variant),
    ]),
  ];
  return {
    reason: owned ? 'installed' : 'purchased',
    user: {
      ...user,
      wallet: debit?.ok ? debit.wallet : user.wallet,
      robot: {
        ...user.robot,
        assembly: { ...user.robot.assembly, [part]: variant },
      },
      ownedItemIds,
      period: owned
        ? user.period
        : {
            ...user.period,
            fact: {
              ...user.period.fact,
              wants: user.period.fact.wants + MODULE_PRICE,
            },
          },
    },
  };
};
