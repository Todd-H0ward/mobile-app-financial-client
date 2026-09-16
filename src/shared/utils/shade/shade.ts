// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/** `#RGB` or `#RRGGBB`, the only spellings this project writes colors in. */
const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

/** The three channels of a hex color, 0…255 each. */
const channels = (hex: string): [number, number, number] | null => {
  if (!HEX.test(hex)) return null;

  const body = hex.slice(1);
  const full =
    body.length === 3
      ? body
          .split('')
          .map((digit) => digit + digit)
          .join('')
      : body;

  return [
    Number.parseInt(full.slice(0, 2), 16),
    Number.parseInt(full.slice(2, 4), 16),
    Number.parseInt(full.slice(4, 6), 16),
  ];
};

const toHex = (value: number) =>
  Math.round(value).toString(16).padStart(2, '0');

// ═══════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════

/**
 * A darker or lighter version of a color.
 *
 * Mixes towards black for a negative amount and towards white for a positive
 * one, so one base color yields the tones a drawing needs — the darker one
 * carves an underside, the lighter one lifts a top. A new coat then costs no
 * new artwork.
 *
 * A color it cannot read comes back unchanged: a wrong shade is a cosmetic
 * defect, and throwing here would take a screen down over one.
 *
 * @param color raw color string
 * @param amount -1…1 (clamped); 0 leaves the color alone
 *
 * @example
 * shade('#E8C48A', -0.22); // a shaded flank
 * shade('#E8C48A', 0.16);  // a lit back
 */
export const shade = (color: string, amount: number): string => {
  const rgb = channels(color);
  if (!rgb) return color;

  const mix = Math.min(Math.max(amount, -1), 1);
  const target = mix < 0 ? 0 : 255;
  const weight = Math.abs(mix);

  return `#${rgb
    .map((channel) => toHex(channel + (target - channel) * weight))
    .join('')}`;
};
