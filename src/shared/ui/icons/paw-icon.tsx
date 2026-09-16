import Svg, { Circle, Ellipse } from 'react-native-svg';

import { ICON_SIZE, ICON_STROKE, type IconProps, useIconColor } from './icon';

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/** The four toes, left to right. The outer two sit lower, as a paw does. */
const TOES: [number, number][] = [
  [7, 10.2],
  [10.4, 7.6],
  [14.6, 7.6],
  [18, 10.2],
];

const TOE_RADIUS = 2.1;

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

/** The pet tab. */
export const PawIcon = ({ size = ICON_SIZE, color }: IconProps) => {
  const stroke = useIconColor(color);

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {TOES.map(([cx, cy]) => (
        <Circle
          key={`${cx}:${cy}`}
          cx={cx}
          cy={cy}
          r={TOE_RADIUS}
          stroke={stroke}
          strokeWidth={ICON_STROKE}
        />
      ))}
      <Ellipse
        cx={12.5}
        cy={16.8}
        rx={5}
        ry={4}
        stroke={stroke}
        strokeWidth={ICON_STROKE}
      />
    </Svg>
  );
};
