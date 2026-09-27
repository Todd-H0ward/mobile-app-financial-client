/** Narrows an external string to an allowed union (save / content / response). */
export const isOneOf = <T extends string>(
  value: unknown,
  allowed: readonly T[],
): value is T =>
  typeof value === 'string' && (allowed as readonly string[]).includes(value);
