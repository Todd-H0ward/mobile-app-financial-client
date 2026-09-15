/**
 * Whether a value is a positive integer (1, 2, 3, …).
 *
 * Rejects floats, zero, negative numbers, `NaN`, `Infinity`, and anything
 * that is not a number. The typical caller is a parser of external data
 * (a file, a response, storage) that needs a count or an ordinal proven
 * to be valid before it is used in arithmetic or as an index.
 *
 * @example
 * isPositiveInt(3);    // true
 * isPositiveInt(0);    // false
 * isPositiveInt(1.5);  // false
 * isPositiveInt('2');  // false
 */
export const isPositiveInt = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value > 0;
