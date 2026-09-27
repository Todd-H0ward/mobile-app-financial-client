import { PLATFORM_GOAL_ID } from '@/entities/economy';

export const isLiquid = (goalId: string): boolean =>
  goalId !== PLATFORM_GOAL_ID;
