/**
 * Whether a value is a number that can be counted with.
 *
 * `typeof value === 'number'` passes `NaN` and `Infinity`, and both survive
 * arithmetic silently — a balance of `NaN` renders as "NaN coins" instead of
 * crashing anywhere near the code that produced it. JSON is the usual source:
 * `Infinity` serialises to `null`, and a hand-edited file can hold anything.
 *
 * @example
 * isFiniteNumber(Number.NaN); // false
 */
export const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);
