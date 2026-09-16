import Svg, { Path } from 'react-native-svg';

import { ICON_SIZE, ICON_STROKE, type IconProps, useIconColor } from './icon';

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

/**
 * The savings jar: a box with a slot and a coin going in.
 *
 * A box rather than a pig — the jar is the child's, and the arrow says the
 * money goes in, never that it comes out.
 */
export const PiggyIcon = ({ size = ICON_SIZE, color }: IconProps) => {
  const stroke = useIconColor(color);

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 9.5H20V18.5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9.5Z"
        stroke={stroke}
        strokeWidth={ICON_STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M9.5 13.5H14.5"
        stroke={stroke}
        strokeWidth={ICON_STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 3V7M9.8 4.9L12 7.1L14.2 4.9"
        stroke={stroke}
        strokeWidth={ICON_STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};
