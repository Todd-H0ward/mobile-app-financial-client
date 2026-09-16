import Svg, { Circle, G, Line } from 'react-native-svg';

import { ICON_SIZE, ICON_STROKE, type IconProps, useIconColor } from './icon';

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

const REED_COUNT = 12;

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

/** One coin. The game's money is always shown as coins, never as roubles. */
export const CoinIcon = ({ size = ICON_SIZE, color }: IconProps) => {
  const stroke = useIconColor(color);
  const reeds = [];
  for (let i = 0; i < REED_COUNT; i += 1) {
    const angle = (i / REED_COUNT) * Math.PI * 2;
    reeds.push({
      key: i,
      x1: 12 + Math.cos(angle) * 7.6,
      y1: 12 + Math.sin(angle) * 7.6,
      x2: 12 + Math.cos(angle) * 8.6,
      y2: 12 + Math.sin(angle) * 8.6,
    });
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle
        cx={12}
        cy={12}
        r={8.4}
        stroke={stroke}
        strokeWidth={ICON_STROKE}
      />
      <G stroke={stroke} strokeWidth={1} strokeLinecap="round">
        {reeds.map((reed) => (
          <Line
            key={reed.key}
            x1={reed.x1}
            y1={reed.y1}
            x2={reed.x2}
            y2={reed.y2}
          />
        ))}
      </G>
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
