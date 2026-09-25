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
  /** Robot charge, `0…1`. */
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

/**
 * Mid-azimuth of the bay the top shot looks into.
 *
 * Gears stand at the bay's edges; the boards sit between them on the
 * top terrace so the composed map always finds them under the outer deck.
 */
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

/**
 * Just under the top terrace's deck.
 *
 * Authored height of ring `n` is `n * SCENE_TERRACE_RISE`; hanging the
 * panel centre half a board below that puts the top edge flush with the rim.
 */
const HUD_Y = TOP_TERRACE * SCENE_TERRACE_RISE - PANEL_HEIGHT / 2;

/**
 * Angular step between neighbouring board centres, in degrees.
 *
 * Derived from width + gap on the rim so the three stay packed along the
 * contour without overlapping or floating off into the bay.
 */
const PANEL_STEP_DEG =
  ((PANEL_WIDTH + PANEL_GAP) / HUD_RADIUS) * (180 / Math.PI);

/** Digit height on a board. */
const DIGIT_HEIGHT = 28;

/** Ink floats just in front of the slab face. */
const INK_Z = PANEL_DEPTH / 2 + 0.4;

/**
 * Serif digit strokes in a 6×8 box.
 *
 * Terminal ticks on the stems — the same GL path as the cell numbers, but
 * with a classical read so the boards feel like engraved plates, not a HUD.
 */
const DIGIT_STROKES: Record<
  string,
  ReadonlyArray<readonly [number, number, number, number]>
> = {
  '0': [
    [1, 0.8, 5, 0.8],
    [5, 0.8, 5, 7.2],
    [5, 7.2, 1, 7.2],
    [1, 7.2, 1, 0.8],
    [0.2, 0.8, 1.8, 0.8],
    [4.2, 0.8, 5.8, 0.8],
    [0.2, 7.2, 1.8, 7.2],
    [4.2, 7.2, 5.8, 7.2],
  ],
  '1': [
    [3, 0.5, 3, 7.5],
    [1.4, 6.2, 3, 7.5],
    [1.4, 0.5, 4.6, 0.5],
    [2.4, 7.5, 3.6, 7.5],
  ],
  '2': [
    [1, 7.2, 5, 7.2],
    [5, 7.2, 5, 4.2],
    [5, 4.2, 1, 4.2],
    [1, 4.2, 1, 0.8],
    [1, 0.8, 5, 0.8],
    [0.2, 7.2, 1, 7.2],
    [5, 7.2, 5.8, 7.2],
    [0.2, 0.8, 1, 0.8],
    [5, 0.8, 5.8, 0.8],
    [0.2, 4.2, 1, 4.2],
    [5, 4.2, 5.8, 4.2],
  ],
  '3': [
    [1, 7.2, 5, 7.2],
    [5, 7.2, 5, 0.8],
    [5, 0.8, 1, 0.8],
    [1.2, 4, 5, 4],
    [0.2, 7.2, 1, 7.2],
    [5, 7.2, 5.8, 7.2],
    [0.2, 0.8, 1, 0.8],
    [5, 0.8, 5.8, 0.8],
    [5, 4, 5.8, 4],
  ],
  '4': [
    [1.2, 7.5, 1.2, 3.6],
    [1.2, 3.6, 5, 3.6],
    [4.2, 7.5, 4.2, 0.5],
    [0.4, 3.6, 1.2, 3.6],
    [5, 3.6, 5.8, 3.6],
    [3.4, 0.5, 5, 0.5],
  ],
  '5': [
    [5, 7.2, 1, 7.2],
    [1, 7.2, 1, 4.2],
    [1, 4.2, 5, 4.2],
    [5, 4.2, 5, 0.8],
    [5, 0.8, 1, 0.8],
    [0.2, 7.2, 1, 7.2],
    [5, 7.2, 5.8, 7.2],
    [0.2, 4.2, 1, 4.2],
    [5, 4.2, 5.8, 4.2],
    [0.2, 0.8, 1, 0.8],
    [5, 0.8, 5.8, 0.8],
  ],
  '6': [
    [5, 7.2, 1, 7.2],
    [1, 7.2, 1, 0.8],
    [1, 0.8, 5, 0.8],
    [5, 0.8, 5, 4],
    [5, 4, 1, 4],
    [0.2, 7.2, 1, 7.2],
    [5, 7.2, 5.8, 7.2],
    [0.2, 0.8, 1, 0.8],
    [5, 0.8, 5.8, 0.8],
    [0.2, 4, 1, 4],
    [5, 4, 5.8, 4],
  ],
  '7': [
    [1, 7.2, 5, 7.2],
    [5, 7.2, 2.2, 0.5],
    [0.2, 7.2, 1, 7.2],
    [5, 7.2, 5.8, 7.2],
    [1.4, 0.5, 3, 0.5],
  ],
  '8': [
    [1, 0.8, 5, 0.8],
    [5, 0.8, 5, 7.2],
    [5, 7.2, 1, 7.2],
    [1, 7.2, 1, 0.8],
    [1, 4, 5, 4],
    [0.2, 0.8, 1, 0.8],
    [5, 0.8, 5.8, 0.8],
    [0.2, 7.2, 1, 7.2],
    [5, 7.2, 5.8, 7.2],
    [0.2, 4, 1, 4],
    [5, 4, 5.8, 4],
  ],
  '9': [
    [1, 0.8, 5, 0.8],
    [5, 0.8, 5, 7.2],
    [5, 7.2, 1, 7.2],
    [1, 7.2, 1, 4],
    [1, 4, 5, 4],
    [0.2, 0.8, 1, 0.8],
    [5, 0.8, 5.8, 0.8],
    [0.2, 7.2, 1, 7.2],
    [5, 7.2, 5.8, 7.2],
    [0.2, 4, 1, 4],
    [5, 4, 5.8, 4],
  ],
  '/': [
    [4.4, 0.4, 1.6, 7.6],
    [3.6, 0.4, 5.2, 0.4],
    [0.8, 7.6, 2.4, 7.6],
  ],
};

const DIGIT_GAP = 3.5;
const CHAR_WIDTH = 6;

/** Charge below this reads on the warm battery colour. */
const CHARGE_LOW = 0.35;

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

/** Line endpoints for a string of serif digits in a local XY plane. */
const textLines = (
  text: string,
  originX: number,
  originY: number,
  height: number,
): number[] => {
  const scale = height / 8;
  const digitWidth = CHAR_WIDTH * scale;
  const gap = DIGIT_GAP;
  const totalWidth =
    text.length * digitWidth + Math.max(0, text.length - 1) * gap;
  const values: number[] = [];
  let cursor = originX - totalWidth / 2;

  const write = (x1: number, y1: number, x2: number, y2: number) => {
    values.push(x1, y1, INK_Z, x2, y2, INK_Z);
  };

  for (const char of text) {
    const strokes = DIGIT_STROKES[char] ?? DIGIT_STROKES['0'];
    for (const [x1, y1, x2, y2] of strokes) {
      write(
        cursor + x1 * scale,
        originY + y1 * scale,
        cursor + x2 * scale,
        originY + y2 * scale,
      );
    }
    cursor += digitWidth + gap;
  }

  return values;
};

/**
 * Local currency mark — a gear, the machine that climbs the pit.
 *
 * Tooth outline + hub; drawn as line segments like the digits.
 */
const gearCurrencyLines = (cx: number, cy: number, outer: number): number[] => {
  const teeth = 8;
  const valley = outer * 0.72;
  const hub = outer * 0.28;
  const values: number[] = [];
  const write = (x1: number, y1: number, x2: number, y2: number) => {
    values.push(x1, y1, INK_Z, x2, y2, INK_Z);
  };

  const points: Array<readonly [number, number]> = [];
  for (let i = 0; i < teeth * 2; i += 1) {
    const angle = (i / (teeth * 2)) * Math.PI * 2 - Math.PI / 2;
    const radius = i % 2 === 0 ? outer : valley;
    points.push([cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius]);
  }
  for (let i = 0; i < points.length; i += 1) {
    const [x1, y1] = points[i] ?? [0, 0];
    const [x2, y2] = points[(i + 1) % points.length] ?? [0, 0];
    write(x1, y1, x2, y2);
  }

  const hubSteps = 14;
  for (let i = 0; i < hubSteps; i += 1) {
    const a0 = (i / hubSteps) * Math.PI * 2;
    const a1 = ((i + 1) / hubSteps) * Math.PI * 2;
    write(
      cx + Math.cos(a0) * hub,
      cy + Math.sin(a0) * hub,
      cx + Math.cos(a1) * hub,
      cy + Math.sin(a1) * hub,
    );
  }

  return values;
};

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

/**
 * Battery outline in local XY: body + terminal nub.
 *
 * Drawn as line segments so the same GL path that shows cell numbers works.
 */
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

/**
 * Three boards hugging the top terrace rim between the two gears of the bay
 * the top shot looks into — coins, tier, battery.
 *
 * Parent is the outermost terrace group, so they sink with that ring. Each
 * board sits on its own azimuth and faces outward, following the disc's
 * contour instead of a flat chord under it.
 */
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
    depthTest: false,
  });
  const inkMaterial = new LineBasicMaterial({
    color: new Color(SCENE_PALETTE.hudInk),
    depthTest: false,
  });
  const batteryFillMaterial = new MeshBasicMaterial({
    color: new Color(SCENE_PALETTE.hudBattery),
    side: DoubleSide,
    depthTest: true,
  });

  const geometries: BufferGeometry[] = [];
  const materials = [
    panelMaterial,
    sideMaterial,
    edgeMaterial,
    inkMaterial,
    batteryFillMaterial,
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

    // Slab body: face material on the front/back, cooler tint on the sides
    // so the isometric shot reads thickness instead of a flat card.
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

  const coinsInk = new LineSegments(new BufferGeometry(), inkMaterial);
  coinsInk.renderOrder = 3;
  coinsPanel.add(coinsInk);

  const tierInk = new LineSegments(new BufferGeometry(), inkMaterial);
  tierInk.renderOrder = 3;
  tierPanel.add(tierInk);

  const batteryOutline = new LineSegments(new BufferGeometry(), inkMaterial);
  batteryOutline.renderOrder = 3;
  chargePanel.add(batteryOutline);

  const batteryBodyWidth = 78;
  const batteryBodyHeight = 34;
  const batteryNub = 10;
  const batteryPad = 4;
  /** Battery sits a touch above centre so the percent can sit under it. */
  const batteryY = 8;
  setLineGeometry(
    batteryOutline,
    batteryOutlineLines(batteryBodyWidth, batteryBodyHeight, batteryNub),
  );
  batteryOutline.position.y = batteryY;
  geometries.push(batteryOutline.geometry);

  const fillMaxWidth = batteryBodyWidth - batteryPad * 2;
  const fillHeight = batteryBodyHeight - batteryPad * 2;
  const fillGeometry = new PlaneGeometry(1, fillHeight);
  geometries.push(fillGeometry);
  const batteryFill = new Mesh(fillGeometry, batteryFillMaterial);
  batteryFill.position.z = PANEL_DEPTH / 2 + 0.2;
  batteryFill.position.y = batteryY;
  chargePanel.add(batteryFill);

  const chargeLabel = new LineSegments(new BufferGeometry(), inkMaterial);
  chargeLabel.renderOrder = 3;
  chargeLabel.position.set(0, -28, 0);
  chargePanel.add(chargeLabel);

  let lastKey = '';

  const setStats = (stats: MapHudStats) => {
    const balance = Math.max(0, Math.round(stats.balance));
    const tier = Math.max(0, Math.round(stats.tier));
    const tierTotal = Math.max(1, Math.round(stats.tierTotal));
    const charge = clamp(stats.charge, 0, 1);
    const key = `${balance}:${tier}:${tierTotal}:${charge.toFixed(2)}`;
    if (key === lastKey) return;
    lastKey = key;

    const gear = gearCurrencyLines(-48, 0, 15);
    const amount = textLines(
      String(balance),
      20,
      -DIGIT_HEIGHT / 2,
      DIGIT_HEIGHT,
    );
    setLineGeometry(coinsInk, [...gear, ...amount]);

    setLineGeometry(
      tierInk,
      textLines(`${tier}/${tierTotal}`, 0, -DIGIT_HEIGHT / 2, DIGIT_HEIGHT),
    );

    const fillWidth = Math.max(0.01, fillMaxWidth * charge);
    batteryFill.scale.x = fillWidth;
    // PlaneGeometry is centred — grow from the left inside of the body.
    batteryFill.position.x = -batteryBodyWidth / 2 + batteryPad + fillWidth / 2;
    batteryFillMaterial.color.set(
      charge < CHARGE_LOW
        ? SCENE_PALETTE.hudBatteryLow
        : SCENE_PALETTE.hudBattery,
    );

    setLineGeometry(
      chargeLabel,
      textLines(
        `${Math.round(charge * 100)}`,
        0,
        -DIGIT_HEIGHT / 2,
        DIGIT_HEIGHT * 0.55,
      ),
    );
  };

  // Seed so the first show is never empty geometry.
  setStats({ balance: 0, tier: 0, tierTotal: 5, charge: 1 });

  const setVisible = (isVisible: boolean) => {
    root.visible = isVisible;
  };

  const dispose = () => {
    coinsInk.geometry.dispose();
    tierInk.geometry.dispose();
    batteryOutline.geometry.dispose();
    chargeLabel.geometry.dispose();
    for (const geometry of geometries) geometry.dispose();
    for (const material of materials) material.dispose();
  };

  return { root, setVisible, setStats, dispose };
};

export type { MapHud, MapHudStats };
export { createMapHud };
