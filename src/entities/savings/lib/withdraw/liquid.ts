import { PLATFORM_GOAL_ID } from '@/entities/economy';

/**
 * Whether a savings goal's funds can be withdrawn back to the wallet.
 *
 * The lift (platform upgrade) goal is non-liquid: coins invested in levels
 * cannot be taken back. All other goals are liquid with confirmation.
 */
export const isLiquid = (goalId: string): boolean =>
  goalId !== PLATFORM_GOAL_ID;
