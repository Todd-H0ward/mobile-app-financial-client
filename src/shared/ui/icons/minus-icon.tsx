import Svg, { Path } from 'react-native-svg';

import { ICON_SIZE, ICON_STROKE, type IconProps, useIconColor } from './icon';

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

/** One fewer. Taking a coin back is always allowed — docs/budget.md. */
export const MinusIcon = ({ size = ICON_SIZE, color }: IconProps) => {
  const stroke = useIconColor(color);

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 12H19"
        stroke={stroke}
        strokeWidth={ICON_STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};
