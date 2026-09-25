import { describe, expect, it } from 'vitest';

import { SCENE_PALETTE } from './palette';

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

const SLICE = join(__dirname, '..', '..');

const HEX = /#[0-9a-fA-F]{3,8}\b/g;

/** Every source file of the slice except the palette itself. */
const sliceFiles = (folder: string): string[] =>
  readdirSync(folder).flatMap((entry) => {
    const path = join(folder, entry);
    if (statSync(path).isDirectory()) return sliceFiles(path);
    return path.endsWith('.ts') && !path.endsWith('palette.ts') ? [path] : [];
  });

// ═══════════════════════════════════════════
// 1. The palette is the only source of color
// ═══════════════════════════════════════════

describe('the scene palette', () => {
  it('is the only file in the slice that writes a colour', () => {
    for (const file of sliceFiles(SLICE)) {
      expect({ file, hex: readFileSync(file, 'utf8').match(HEX) }).toEqual({
        file,
        hex: null,
      });
    }
  });

  it('paints one wedge per room, plus a muted twin for each', () => {
    expect(SCENE_PALETTE.segments).toHaveLength(
      SCENE_PALETTE.segmentsMuted.length,
    );
  });

  it('writes every colour as a hex the renderer can parse', () => {
    const colors = [
      ...SCENE_PALETTE.segments,
      ...SCENE_PALETTE.segmentsMuted,
      SCENE_PALETTE.shared,
      SCENE_PALETTE.cellFrame,
      SCENE_PALETTE.cellFrameMuted,
      SCENE_PALETTE.cellFrameActive,
      SCENE_PALETTE.hudPanel,
      SCENE_PALETTE.hudPanelSide,
      SCENE_PALETTE.hudPanelEdge,
      SCENE_PALETTE.hudInk,
      SCENE_PALETTE.hudBattery,
      SCENE_PALETTE.hudBatteryLow,
      SCENE_PALETTE.dust,
      SCENE_PALETTE.spark,
      SCENE_PALETTE.keyLight,
      SCENE_PALETTE.fillLight,
      SCENE_PALETTE.ambientLight,
      SCENE_PALETTE.hemisphereSky,
      SCENE_PALETTE.hemisphereGround,
      SCENE_PALETTE.centreLight,
      SCENE_PALETTE.specular,
      SCENE_PALETTE.skyTop,
      SCENE_PALETTE.skyMid,
      SCENE_PALETTE.skyHorizon,
      SCENE_PALETTE.skyBottom,
      SCENE_PALETTE.haze,
      SCENE_PALETTE.background,
    ];

    for (const color of colors) {
      expect(color).toMatch(/^#[0-9A-F]{6}$/);
    }
  });
});
