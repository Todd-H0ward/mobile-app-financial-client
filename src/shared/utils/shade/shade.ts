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

/** Mix toward black/white by `amount` (−1…1). Unreadable input returns unchanged. */
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
