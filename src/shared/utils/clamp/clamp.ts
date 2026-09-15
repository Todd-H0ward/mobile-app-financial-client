/**
 * Confines a value to a range.
 *
 * Marked as a worklet so gesture and animation callbacks can call it straight
 * on the UI thread; on the JS thread it behaves like any other function.
 *
 * @example
 * clamp(120, 0, 100); // 100
 */
export const clamp = (value: number, min: number, max: number) => {
  'worklet';

  return Math.min(Math.max(value, min), max);
};
