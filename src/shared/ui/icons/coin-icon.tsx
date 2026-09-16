import Svg, { Circle } from 'react-native-svg';

import { ICON_SIZE, ICON_STROKE, type IconProps, useIconColor } from './icon';

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

/** One coin. The game's money is always shown as coins, never as roubles. */
export const CoinIcon = ({ size = ICON_SIZE, color }: IconProps) => {
  const stroke = useIconColor(color);

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle
        cx={12}
        cy={12}
        r={8.4}
        stroke={stroke}
        strokeWidth={ICON_STROKE}
      />
      <Circle
        cx={12}
        cy={12}
        r={3.8}
        stroke={stroke}
        strokeWidth={ICON_STROKE}
      />
    </Svg>
  );
};
