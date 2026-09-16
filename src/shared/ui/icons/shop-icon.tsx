import Svg, { Path } from 'react-native-svg';

import { ICON_SIZE, ICON_STROKE, type IconProps, useIconColor } from './icon';

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

/** The shop — a bag, because a trolley reads as a grown-up's supermarket. */
export const ShopIcon = ({ size = ICON_SIZE, color }: IconProps) => {
  const stroke = useIconColor(color);

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5.5 8H18.5L19.6 20.5H4.4L5.5 8Z"
        stroke={stroke}
        strokeWidth={ICON_STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M9 8V6.2a3 3 0 0 1 6 0V8"
        stroke={stroke}
        strokeWidth={ICON_STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};
