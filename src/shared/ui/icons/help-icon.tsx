import Svg, { Path } from 'react-native-svg';

import { ICON_SIZE, ICON_STROKE, type IconProps, useIconColor } from './icon';

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

/** The hint on every screen — 2.5.1 asks for one everywhere. */
export const HelpIcon = ({ size = ICON_SIZE, color }: IconProps) => {
  const stroke = useIconColor(color);

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 9a3 3 0 1 1 3 3v2"
        stroke={stroke}
        strokeWidth={ICON_STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* A round cap turns this stub into the dot under the hook. */}
      <Path
        d="M12 17.8V18.4"
        stroke={stroke}
        strokeWidth={ICON_STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};
