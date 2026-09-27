import {
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  Group,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
} from 'three';

import {
  SCENE_GEAR_ANGLES,
  SCENE_PALETTE,
  SCENE_SEGMENT_COUNT,
  SCENE_TERRACE_COUNT,
  SCENE_TERRACE_RADII,
  SCENE_TERRACE_RISE,
  TOP_AZIMUTH,
} from '@/entities/scene';

import { clamp } from '@/shared/utils';

import {
  coinGeometryLocal,
  textGeometryLocal,
  upGeometryLocal,
} from '../scene-glyphs';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface MapHudStats {
  /** Coins in the wallet. */
  balance: number;
  /** Platform tier, `0…tierTotal`. */
  tier: number;
  /** Upper bound of the climb. */
  tierTotal: number;
  /** Robot charge, `0…1` — lit as the same five cells the HUD shows. */
  charge: number;
}

interface MapHud {
  /** The strip of three boards — shown only on the overhead map. */
  root: Group;
  setVisible: (isVisible: boolean) => void;
  setStats: (stats: MapHudStats) => void;
  dispose: () => void;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/** Board size in world units. */
const PANEL_WIDTH = 150;
const PANEL_HEIGHT = 88;
const PANEL_GAP = 24;
/** How thick a board is — enough to catch the isometric light as a slab. */
const PANEL_DEPTH = 14;

/** Outermost ring — the boards hang off its rim and ride with it as it sinks. */
const TOP_TERRACE = SCENE_TERRACE_COUNT - 1;

/** Mid-azimuth of the bay the top shot looks into. */
const mapBayAzimuth = (): number => {
  const arc = 360 / SCENE_SEGMENT_COUNT;
  for (const from of SCENE_GEAR_ANGLES) {
    const offset = (((TOP_AZIMUTH - from) % 360) + 360) % 360;
    if (offset < arc) return (from + arc / 2) % 360;
  }
  return TOP_AZIMUTH;
};

const HUD_AZIMUTH = mapBayAzimuth();

/** Outer radius of the top terrace — boards hug that contour. */
const HUD_RADIUS = SCENE_TERRACE_RADII[TOP_TERRACE] ?? SCENE_TERRACE_RADII[0];

/** Panel centre half a board below ring height — top edge flush with the rim. */
const HUD_Y = TOP_TERRACE * SCENE_TERRACE_RISE - PANEL_HEIGHT / 2;

/** Angular step between neighbouring board centres, in degrees. */
const PANEL_STEP_DEG =
  ((PANEL_WIDTH + PANEL_GAP) / HUD_RADIUS) * (180 / Math.PI);

const DIGIT_HEIGHT = 28;

/** Slightly in front of the slab face — avoids z-fighting. */
const INK_Z = PANEL_DEPTH / 2 + 0.4;

/**
 * Cells in the charge readout — the HUD's five, so a child comparing the board with the
 * bar over the scene counts the same thing on both.
 */
const CHARGE_CELLS = 5;

/** One charge cell on the board, in world units. */
const CHARGE_CELL_WIDTH = 16;
const CHARGE_CELL_HEIGHT = 30;
const CHARGE_CELL_GAP = 6;

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

const setLineGeometry = (mesh: LineSegments, floats: number[]) => {
  const previous = mesh.geometry;
  const geometry = new BufferGeometry();
  geometry.setAttribute(
    'position',
    new BufferAttribute(new Float32Array(floats), 3),
  );
  mesh.geometry = geometry;
  previous.dispose();
};

const setMeshGeometry = (mesh: Mesh, geometry: BufferGeometry) => {
  const previous = mesh.geometry;
  mesh.geometry = geometry;
  previous.dispose();
};

/** Twelve edges of the panel slab — the rim that sells the thickness. */
const panelBoxEdges = (
  width: number,
  height: number,
  depth: number,
): number[] => {
  const x = width / 2;
  const y = height / 2;
  const z = depth / 2;
  const corners: Array<readonly [number, number, number]> = [
    [-x, -y, -z],
    [x, -y, -z],
    [x, y, -z],
    [-x, y, -z],
    [-x, -y, z],
    [x, -y, z],
    [x, y, z],
    [-x, y, z],
  ];
  const pairs: Array<readonly [number, number]> = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 0],
    [4, 5],
    [5, 6],
    [6, 7],
    [7, 4],
    [0, 4],
    [1, 5],
    [2, 6],
    [3, 7],
  ];
  const values: number[] = [];
  for (const [a, b] of pairs) {
    const [x1, y1, z1] = corners[a] ?? [0, 0, 0];
    const [x2, y2, z2] = corners[b] ?? [0, 0, 0];
    values.push(x1, y1, z1, x2, y2, z2);
  }
  return values;
};

/** Battery outline in local XY: body + terminal nub. */
const batteryOutlineLines = (
  width: number,
  height: number,
  nub: number,
): number[] => {
  const x = width / 2;
  const y = height / 2;
  const nx = nub / 2;
  return [
    -x,
    -y,
    INK_Z,
    x,
    -y,
    INK_Z,
    x,
    -y,
    INK_Z,
    x,
    y,
    INK_Z,
    x,
    y,
    INK_Z,
    -x,
    y,
    INK_Z,
    -x,
    y,
    INK_Z,
    -x,
    -y,
    INK_Z,
    x,
    -nx,
    INK_Z,
    x + nub,
    -nx,
    INK_Z,
    x + nub,
    -nx,
    INK_Z,
    x + nub,
    nx,
    INK_Z,
    x + nub,
    nx,
    INK_Z,
    x,
    nx,
    INK_Z,
  ];
};

// ═══════════════════════════════════════════
// FACTORY
// ═══════════════════════════════════════════

/** Coins / tier / battery boards on the top-terrace rim (map view only). */
const createMapHud = (): MapHud => {
  const root = new Group();
  root.visible = false;

  const panelMaterial = new MeshBasicMaterial({
    color: new Color(SCENE_PALETTE.hudPanel),
    side: DoubleSide,
    depthTest: true,
  });
  const sideMaterial = new MeshBasicMaterial({
    color: new Color(SCENE_PALETTE.hudPanelSide),
    side: DoubleSide,
    depthTest: true,
  });
  const edgeMaterial = new LineBasicMaterial({
    color: new Color(SCENE_PALETTE.hudPanelEdge),
    depthTest: true,
  });
  const inkMaterial = new MeshBasicMaterial({
    color: new Color(SCENE_PALETTE.hudInk),
    side: DoubleSide,
    depthTest: true,
    depthWrite: true,
  });
  const coinMaterial = new MeshBasicMaterial({
    color: new Color(SCENE_PALETTE.hudCoin),
    side: DoubleSide,
    depthTest: true,
  });
  const cellOnMaterial = new MeshBasicMaterial({
    color: new Color(SCENE_PALETTE.hudBattery),
    side: DoubleSide,
    depthTest: true,
  });
  const cellOffMaterial = new MeshBasicMaterial({
    color: new Color(SCENE_PALETTE.hudBatteryOff),
    side: DoubleSide,
    depthTest: true,
  });

  const geometries: BufferGeometry[] = [];
  const materials = [
    panelMaterial,
    sideMaterial,
    edgeMaterial,
    inkMaterial,
    coinMaterial,
    cellOnMaterial,
    cellOffMaterial,
  ];

  const makePanel = (azimuthDeg: number) => {
    const group = new Group();
    const radians = (azimuthDeg * Math.PI) / 180;
    // Same atan2(x, z) convention as the camera and the gears.
    group.position.set(
      Math.sin(radians) * HUD_RADIUS,
      HUD_Y,
      Math.cos(radians) * HUD_RADIUS,
    );
    // Face out along the rim — that is what wraps the contour.
    group.rotation.y = radians;

    // Slab body: face material on the front/back, cooler tint on the sides so the isometric
    // shot reads thickness instead of a flat card.
    const box = new BoxGeometry(PANEL_WIDTH, PANEL_HEIGHT, PANEL_DEPTH);
    geometries.push(box);
    const board = new Mesh(box, [
      sideMaterial,
      sideMaterial,
      sideMaterial,
      sideMaterial,
      panelMaterial,
      panelMaterial,
    ]);
    group.add(board);

    const frame = new LineSegments(new BufferGeometry(), edgeMaterial);
    setLineGeometry(
      frame,
      panelBoxEdges(PANEL_WIDTH, PANEL_HEIGHT, PANEL_DEPTH),
    );
    geometries.push(frame.geometry);
    frame.renderOrder = 2;
    group.add(frame);

    root.add(group);
    return group;
  };

  // Left → centre → right along the bay arc (rising azimuth).
  const coinsPanel = makePanel(HUD_AZIMUTH - PANEL_STEP_DEG);
  const tierPanel = makePanel(HUD_AZIMUTH);
  const chargePanel = makePanel(HUD_AZIMUTH + PANEL_STEP_DEG);

  // Wallet: the coin, then the amount — the HUD's first reading.
  const coinMark = new Mesh(coinGeometryLocal(-44, 0, 15, INK_Z), coinMaterial);
  coinMark.renderOrder = 1;
  geometries.push(coinMark.geometry);
  coinsPanel.add(coinMark);

  const coinsInk = new Mesh(new BufferGeometry(), inkMaterial);
  coinsInk.renderOrder = 1;
  coinsPanel.add(coinsInk);

  // Tier: the climb mark over "0/5", the same tier the HUD words.
  const tierMark = new Mesh(upGeometryLocal(0, 22, 24, INK_Z), inkMaterial);
  tierMark.renderOrder = 1;
  geometries.push(tierMark.geometry);
  tierPanel.add(tierMark);

  const tierInk = new Mesh(new BufferGeometry(), inkMaterial);
  tierInk.renderOrder = 1;
  tierInk.position.y = -12;
  tierPanel.add(tierInk);

  // Charge: five cells in a battery body, lit the way the HUD lights them.
  const cellsWidth =
    CHARGE_CELLS * CHARGE_CELL_WIDTH + (CHARGE_CELLS - 1) * CHARGE_CELL_GAP;
  const batteryPad = 5;
  const batteryNub = 8;
  const batteryOutline = new LineSegments(new BufferGeometry(), edgeMaterial);
  batteryOutline.renderOrder = 1;
  setLineGeometry(
    batteryOutline,
    batteryOutlineLines(
      cellsWidth + batteryPad * 2,
      CHARGE_CELL_HEIGHT + batteryPad * 2,
      batteryNub,
    ),
  );
  // Nudged left by half the nub, so body and nub together sit centred.
  batteryOutline.position.x = -batteryNub / 2;
  geometries.push(batteryOutline.geometry);
  chargePanel.add(batteryOutline);

  const cellGeometry = new PlaneGeometry(CHARGE_CELL_WIDTH, CHARGE_CELL_HEIGHT);
  geometries.push(cellGeometry);
  const chargeCells = Array.from({ length: CHARGE_CELLS }, (_, index) => {
    const cell = new Mesh(cellGeometry, cellOffMaterial);
    cell.position.set(
      -batteryNub / 2 -
        cellsWidth / 2 +
        CHARGE_CELL_WIDTH / 2 +
        index * (CHARGE_CELL_WIDTH + CHARGE_CELL_GAP),
      0,
      INK_Z,
    );
    chargePanel.add(cell);
    return cell;
  });

  let lastKey = '';

  const setStats = (stats: MapHudStats) => {
    const balance = Math.max(0, Math.round(stats.balance));
    const tier = Math.max(0, Math.round(stats.tier));
    const tierTotal = Math.max(1, Math.round(stats.tierTotal));
    // Same rounding as the HUD's bar: a cell lights only once it is full.
    const lit = Math.floor(
      clamp(stats.charge, 0, 1) * CHARGE_CELLS + Number.EPSILON,
    );
    const key = `${balance}:${tier}:${tierTotal}:${lit}`;
    if (key === lastKey) return;
    lastKey = key;

    setMeshGeometry(
      coinsInk,
      textGeometryLocal(String(balance), 22, 0, DIGIT_HEIGHT, INK_Z),
    );

    setMeshGeometry(
      tierInk,
      textGeometryLocal(`${tier}/${tierTotal}`, 0, 0, DIGIT_HEIGHT, INK_Z),
    );

    chargeCells.forEach((cell, index) => {
      cell.material = index < lit ? cellOnMaterial : cellOffMaterial;
    });
  };

  // Seed so the first show is never empty geometry.
  setStats({ balance: 0, tier: 0, tierTotal: 5, charge: 1 });

  const setVisible = (isVisible: boolean) => {
    root.visible = isVisible;
  };

  const dispose = () => {
    coinsInk.geometry.dispose();
    tierInk.geometry.dispose();
    for (const geometry of geometries) geometry.dispose();
    for (const material of materials) material.dispose();
  };

  return { root, setVisible, setStats, dispose };
};

export type { MapHud, MapHudStats };
export { createMapHud };
