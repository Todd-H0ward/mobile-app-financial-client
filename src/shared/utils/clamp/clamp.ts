/** Worklet so gesture / animation callbacks can call it on the UI thread. */
export const clamp = (value: number, min: number, max: number) => {
  'worklet';

  return Math.min(Math.max(value, min), max);
};
