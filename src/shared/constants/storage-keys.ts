export const STORAGE_KEYS = {
  /** The whole profile: pet, wallet, savings, period, history, home. */
  USER: '@app:user',
  /** Device preferences: theme and language. Neither profile nor game state. */
  PREFERENCES: '@app:preferences',
  /** Cells whose lesson has been passed. Outlives a profile reset on purpose. */
  LESSONS: '@app:lessons',
  /** Console high scores — snake apples and Spacewar clear times. */
  ARCADE_SCORES: '@app:arcade-scores',
};
