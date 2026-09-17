import { useId } from 'react';

import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';
import Svg, {
  ClipPath,
  Defs,
  G,
  Image,
  Path,
  Pattern,
  Rect,
} from 'react-native-svg';

import {
  PIECE_TAB_OVERHANG,
  type PieceSides,
  type PieceTabs,
  piecePath,
  pieceSeamPath,
} from '@/entities/minigame/puzzle';

import { useTheme } from '@/shared/hooks';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

type PuzzlePieceVariant =
  | 'filled'
  | 'slot'
  | 'slotDark'
  | 'slotActive'
  | 'loose';

interface PuzzlePhotoProps {
  /**
   * Full puzzle photo URI — when set, the piece shows its fragment instead of
   * the decorative fill pattern.
   */
  image: string;
  row: number;
  col: number;
  boardCols: number;
  boardRows: number;
}

interface PuzzlePieceProps {
  tabs: PieceTabs;
  variant?: PuzzlePieceVariant;
  photo?: PuzzlePhotoProps;
  /**
   * Board-grid cell: the SVG is drawn at 164% / −32% so the body (0…100 in
   * viewBox) tiles flush with neighbours and the tabs overlap the cell edge.
   */
  isFitCell?: boolean;
  /**
   * Which sides to stroke. Default is the full outline; the board passes only
   * "its" sides so a shared seam is not drawn twice — see {@link pieceSeamPath}.
   */
  seams?: PieceSides;
  style?: StyleProp<ViewStyle>;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

const VIEW_MIN = -PIECE_TAB_OVERHANG * 100;
const VIEW_SIZE = (1 + PIECE_TAB_OVERHANG * 2) * 100;

const OVERHANG_PERCENT = `${-PIECE_TAB_OVERHANG * 100}%` as const;
const BOX_PERCENT = `${(1 + PIECE_TAB_OVERHANG * 2) * 100}%` as const;

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

const withAlpha = (hex: string, alpha: number): string => {
  if (!hex.startsWith('#') || (hex.length !== 7 && hex.length !== 4)) {
    return hex;
  }

  const full =
    hex.length === 4
      ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
      : hex;
  const r = Number.parseInt(full.slice(1, 3), 16);
  const g = Number.parseInt(full.slice(3, 5), 16);
  const b = Number.parseInt(full.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

/**
 * One jigsaw piece. Shape comes from `tabs` via {@link piecePath}.
 *
 * Without `photo` — decorative `variant` fill (striped pattern lives in this
 * SVG's own `<Defs>`; RN cannot share `url(#id)` across separate Svg trees the
 * way the web `JigsawDefs` did). With `photo` — the piece clips its fragment of
 * the full image via `ClipPath` + `<Image>`, shifted by `-col/-row` cells.
 */
export const PuzzlePiece = ({
  tabs,
  variant = 'filled',
  photo,
  isFitCell = false,
  seams,
  style,
}: PuzzlePieceProps) => {
  const theme = useTheme();
  const reactId = useId().replace(/:/g, '');
  const d = piecePath(tabs, 100);
  const patternId = `${reactId}-jigfill`;
  const clipId = `${reactId}-piece-clip`;

  const isSlot = variant === 'slot' || variant === 'slotDark';
  const isSlotActive = variant === 'slotActive';
  const isLoose = variant === 'loose';
  const usesPattern = variant === 'filled' || isLoose;

  const fill = (() => {
    if (photo) return 'none';
    if (usesPattern) return `url(#${patternId})`;
    if (variant === 'slot') return theme.surfaceDeep;
    // Soft primary wash — idle silhouettes, accent reserved for the snap target.
    if (variant === 'slotDark') return withAlpha(theme.primary, 0.14);
    if (isSlotActive) return withAlpha(theme.accent, 0.28);
    return theme.surfaceSoft;
  })();

  const stroke = (() => {
    if (photo) return isFitCell ? withAlpha('#000000', 0.25) : theme.surface;
    if (isSlotActive) return theme.accent;
    if (variant === 'slotDark') return theme.primaryStrong;
    if (isSlot) return theme.borderStrong;
    return theme.surface;
  })();

  const strokeWidth = photo
    ? isFitCell
      ? 1.5
      : 3
    : isSlotActive
      ? 3.5
      : isLoose
        ? 4
        : isSlot
          ? 3.25
          : 3;

  // Empty slots show the full jigsaw silhouette (tabs included). Shared-seam
  // culling is only for filled neighbours — a dashed outline of half a piece
  // does not read as "put it here".
  const strokeDasharray = isSlot && !isSlotActive ? '6 5' : undefined;
  const showFullOutline = !seams || isSlot || isSlotActive || Boolean(photo);
  const showSeams = Boolean(seams) && !isSlot && !isSlotActive && !photo;

  return (
    <View
      pointerEvents="none"
      style={[
        styles.root,
        isFitCell && styles.fitCell,
        isLoose && styles.looseShadow,
        isSlotActive && styles.activeGlow,
        { shadowColor: isSlotActive ? theme.accent : theme.inverseSurface },
        style,
      ]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Svg
        width="100%"
        height="100%"
        viewBox={`${VIEW_MIN} ${VIEW_MIN} ${VIEW_SIZE} ${VIEW_SIZE}`}
        style={styles.svg}
      >
        <Defs>
          {usesPattern && (
            <Pattern
              id={patternId}
              width={18}
              height={18}
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <Rect width={18} height={18} fill={theme.surfaceSoft} />
              <Rect width={9} height={18} fill={theme.borderStrong} />
            </Pattern>
          )}
          {photo && (
            <ClipPath id={clipId}>
              <Path d={d} />
            </ClipPath>
          )}
        </Defs>

        {photo ? (
          <G clipPath={`url(#${clipId})`}>
            <Image
              href={photo.image}
              x={-photo.col * 100}
              y={-photo.row * 100}
              width={photo.boardCols * 100}
              height={photo.boardRows * 100}
              preserveAspectRatio="xMidYMid slice"
            />
          </G>
        ) : (
          <Path d={d} fill={fill} stroke="none" />
        )}

        {showFullOutline && (
          <Path
            d={d}
            fill="none"
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
            pointerEvents="none"
          />
        )}

        {showSeams && seams && (
          <Path
            d={pieceSeamPath(tabs, seams)}
            fill="none"
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
          />
        )}
      </Svg>
    </View>
  );
};

/**
 * Web mounted a shared `<pattern id="jigfill">` once. On RN each piece carries
 * its own pattern in `<Defs>` — `url(#id)` does not cross Svg roots — so this
 * stays as a no-op for call-site parity.
 */
export const JigsawDefs = () => null;

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  activeGlow: {
    elevation: 6,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 6,
  },
  fitCell: {
    height: BOX_PERCENT,
    left: OVERHANG_PERCENT,
    position: 'absolute',
    top: OVERHANG_PERCENT,
    width: BOX_PERCENT,
  },
  looseShadow: {
    elevation: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 0,
  },
  root: {
    height: '100%',
    overflow: 'visible',
    width: '100%',
  },
  svg: {
    overflow: 'visible',
  },
});

export type { PuzzlePhotoProps, PuzzlePieceProps, PuzzlePieceVariant };
