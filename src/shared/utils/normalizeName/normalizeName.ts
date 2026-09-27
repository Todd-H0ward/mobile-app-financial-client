/** Trim, collapse inner spaces, cap length — shared by every name field. */
export const normalizeName = (raw: string, maxLength: number): string =>
  raw.trim().replace(/\s+/g, ' ').slice(0, maxLength);
