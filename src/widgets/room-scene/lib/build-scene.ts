import {
  AmbientLight,
  Box3,
  BufferAttribute,
  BufferGeometry,
  Color,
  DirectionalLight,
  DoubleSide,
  Group,
  HemisphereLight,
  LineBasicMaterial,
  LineSegments,
  type Material,
  Matrix3,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshPhongMaterial,
  type Object3D,
  PointLight,
  Scene,
  Vector3,
} from 'three';

import {
  ARENA_LAYOUT,
  displayNumberForCell,
  type LessonStatus,
  lessonAccess,
} from '@/entities/lesson';
import {
  type BondKind,
  bondReaction,
  DEFAULT_ROBOT_ASSEMBLY,
  type RobotAssembly,
  type RobotDogAction,
  type RobotDogMoodName,
  type RobotDogSkin,
  type RobotDogStage,
} from '@/entities/robot-dog';
import {
  cellKey,
  cellOfFace,
  damp,
  flushSteps,
  gearAngle,
  isSameCell,
  layoutOrdinal,
  orbitPosition,
  rowSize,
  SCENE_CHARACTER_FACING,
  SCENE_FIRST_CELL_STEP,
  SCENE_FLAT_STEP,
  SCENE_GEAR_ANGLES,
  SCENE_PALETTE,
  SCENE_PLATFORM_Y,
  SCENE_RADIUS,
  SCENE_SEGMENT_COUNT,
  SCENE_SEGMENT_DISTANCE,
  SCENE_SHARED_SEGMENT,
  SCENE_SOURCE,
  SCENE_TERRACE_COUNT,
  SCENE_TERRACE_RADII,
  SCENE_TILE_RINGS,
  type SceneCell,
  type SceneNode,
  TOP_AZIMUTH,
  terraceSinkY,
} from '@/entities/scene';
import type { WatcherAction, WatcherId } from '@/entities/watcher';

import { clamp } from '@/shared/utils';

import { createBondBursts } from './bond-bursts';
import {
  arcAnchor,
  arcEdges,
  arcSolid,
  cellArc,
  fullArc,
  holdSolid,
  mergeParts,
  type RingArc,
} from './cell-geometry';
import {
  cellFrontNumberGeometry,
  cellNumberGeometry,
  colorForLabelStatus,
} from './cell-number-marker';
import type { CenterCharacter } from './center-character';
import { createHazeBackdrop } from './haze-backdrop';
import { createLiftEffects, type LiftEffects } from './lift-effects';
import { createMapHud, type MapHudStats } from './map-hud';
import type { WatcherFocus, Watchers } from './watchers';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface SceneModel {
  /** Ready to render — lights included. */
  scene: Scene;
  /** Highlights one bay; the others and the gears ease out. `null` shows all. */
  highlight: (segment: number | null, isImmediate?: boolean) => void;
  /** Where the platform stands on its way out of the pit: `0` on the floor, `1` clear of the rim. */
  setLevelProgress: (progress: number) => void;
  /** Throws dust and sparks for one level-up: the ring landing and the gears. */
  burstLift: (level: number) => void;
  /** Platform height in world units, for the camera to follow. */
  platformHeight: () => number;
  /** Drifts the sky haze and advances the center character. */
  tick: (timeSec: number, deltaSec: number) => void;
  /** Current module assembly and earned visual growth stage. */
  setCharacterAssembly: (assembly: RobotAssembly, stage: RobotDogStage) => void;
  /** Swaps the dog's coat. */
  setCharacterSkin: (skin: RobotDogSkin) => void;
  /** What the dog settles into whenever nothing interrupts it. */
  playCharacterAction: (action: RobotDogAction) => void;
  /** One-shot reaction to a tap; the dog returns to its state afterwards. */
  reactCharacter: (action: RobotDogAction, fallback: RobotDogAction) => void;
  /** Bond-mode reaction: clip + particle burst above the head. */
  reactBond: (
    kind: BondKind,
    mood: RobotDogMoodName | null,
    fallback: RobotDogAction,
  ) => void;
  /** What a tap ray is tested against — `null` until the model has loaded. */
  characterRoot: () => Object3D | null;
  /** Close-up shot on the dog for bond mode — same shape as a watcher focus. */
  characterFocus: (azimuthDeg: number) => WatcherFocus | null;
  /** Turns the robot to face the camera, in radians. */
  setCharacterFacing: (azimuthRad: number) => void;
  /** The row buffers a tap ray is tested against, one per bay and terrace. */
  cellTargets: () => Object3D[];
  /** Turns a ray hit into the cell it landed on, or `null` for a miss. */
  cellAt: (object: Object3D, faceIndex: number) => SceneCell | null;
  /** Picks one cell out of its row, or clears the pick with `null`. */
  selectCell: (cell: SceneCell | null) => void;
  /**
   * Starts the hold-to-enter fill on a cell — a translucent block that will rise with
   * `setCellHoldProgress` so the child sees the press is landing.
   */
  beginCellHold: (cell: SceneCell) => void;
  /** `0…1` how full the hold fill is. */
  setCellHoldProgress: (progress: number) => void;
  /** Hides the hold fill and clears the selection ring. */
  endCellHold: () => void;
  /** Refreshes availability colour and the lesson number on each cell. */
  setCellAccess: (completedLessonIds: readonly string[], level: number) => void;
  /**
   * Which numbers show: on the tile tops for the map, on the cell fronts for a bay — each is
   * the face the camera there actually sees.
   */
  setNumberFace: (face: NumberFace) => void;
  /** Lights up the cells whose lesson has been passed; the rest go back to their locked or open look. */
  setCellsDone: (doneKeys: readonly string[]) => void;
  /** Same, for one of the two screens overhead. */
  watcherRoot: (watcher: WatcherId) => Object3D | null;
  /** Where the camera stands to talk to a screen, and what it looks at. */
  watcherFocus: (watcher: WatcherId) => WatcherFocus | null;
  /** Puts one of the screens into a state — talking, idling, reacting. */
  playWatcher: (watcher: WatcherId, action: WatcherAction) => void;
  /** Raises the focused watcher so the terminal panel fits under the face. */
  setWatcherLifted: (watcher: WatcherId | null) => void;
  /** Shows or hides the watcher models */
  setWatchersVisible: (isVisible: boolean) => void;
  /** The three map boards (coins / tier / battery). */
  setMapHudVisible: (isVisible: boolean) => void;
  setMapHudStats: (stats: MapHudStats) => void;
  /** Moves the arena under the look-at point (camera-rig knob). */
  setPlatformY: (y: number) => void;
  /**
   * Settles when the dog and both watchers have loaded or failed — the boot
   * cover waits on this so models do not pop in over an empty pit.
   */
  whenReady: Promise<void>;
  /** Frees every buffer the GL context is holding. */
  dispose: () => void;
}

interface Slice {
  /** The merged buffer the slice lives in. */
  geometry: BufferGeometry;
  /** First float of the slice. */
  from: number;
  /** One past its last float. */
  to: number;
}

interface CellRecord {
  /** Stable cell key — what the game stores and the done list is keyed by. */
  key: string;
  /** Where it is on the arena. */
  cell: SceneCell;
  /** Arena ordinal, `0 … ARENA_LAYOUT.count - 1` — which lesson it hosts. */
  ordinal: number;
  /** The block of ring it occupies — the hold fill and the number follow it. */
  arc: RingArc;
  /** Availability — drives the number colour and the tile tint. */
  status: LessonStatus;
  outline: BufferGeometry;
  /** Its slice of the row's tile buffer — what the tint is painted on. */
  tile: Slice;
  frame: Slice;
  /** Whether its lesson is passed — it lights up green. */
  isDone: boolean;
  /**
   * How far the slices are pushed down so a passed tile stays on the disc when its
   * terrace rises out of the map flatten (`0` = built pose).
   */
  diskPin: number;
}

interface RowRecord {
  /** Bay index — the numbers fade with their bay. */
  segment: number;
  /** Step index — once the step is flush with the floor, its front is gone. */
  step: number;
  /**
   * The row's numbers lying on the tile tops, turned to the map camera, as one buffer — what
   * the overhead shot reads.
   */
  numbers: Mesh;
  /**
   * The same numbers on the tops, turned to the camera of the row's own bay: what that bay
   * reads once the step has gone flush and has no front.
   */
  flats: Mesh;
  /**
   * The same numbers standing on the cell fronts — what a bay camera reads from across the
   * pit, where a tile top is a sliver.
   */
  fronts: Mesh;
  cells: CellRecord[];
}

/** Where the cell numbers are shown: on the tops (map) or the fronts (bay). */
type NumberFace = 'top' | 'front';

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/** How dark a locked tile reads against its bay. */
const LOCKED_CELL_TINT = 0.28;

/** How much a passed tile brightens against its bay. */
const DONE_CELL_TINT = 1.18;

/**
 * Bond-mode close-up: ~0.38 of the segment shot, so the dog fills the frame without
 * clipping the platform under its paws.
 */
const CHARACTER_FOCUS_DISTANCE = SCENE_SEGMENT_DISTANCE * 0.38;

/** A touch above eye-level so the muzzle sits in the upper third. */
const CHARACTER_FOCUS_ELEVATION = 22;

/** Opacity of the hold-to-enter fill at full charge. */
const HOLD_FILL_OPACITY = 0.62;

/** The hold fill never grows shorter than this, so it shows at once. */
const HOLD_MIN_HEIGHT = 0.02;

const KEY_LIGHT_POSITION = [0.6, 1, 0.45];

/** Fill comes from the opposite side at a third of the strength. */
const FILL_LIGHT_POSITION = [-0.7, 0.35, -0.6];

/**
 * Cinematic pit light: warm sodium key, cool fill, low ambient so concrete emissive and
 * amber haze read as glow — Blade Runner, not a bright corridor.
 */
const KEY_LIGHT_INTENSITY = 1.95;
const FILL_LIGHT_INTENSITY = 1.25;
const AMBIENT_INTENSITY = 0.65;
const HEMISPHERE_INTENSITY = 1.05;
const CENTRE_POINT_INTENSITY = 3.2;

/** Soft self-glow on platform slabs — stand-in for bloom on mid-range GL. */
const PLATFORM_EMISSIVE = 0.26;
/** How high above the dropped platform the neon lamps sit. */
const POINT_LIGHT_HEIGHT = 220;

/** Longer falloff — covers the whole arena without a black rim. */
const POINT_LIGHT_DISTANCE = 1200;
const POINT_LIGHT_DECAY = 1;

/** World units the outline floats above its tile, to settle the z-fighting. */
const CELL_FRAME_LIFT = 1;

/** World units a number floats above its tile — clear of the frame too. */
const CELL_NUMBER_LIFT = 3;

/** How solid a resting frame is drawn; the selected one is opaque. */
const CELL_FRAME_OPACITY = 0.5;

const HIGHLIGHT_SMOOTHING = 0.002;

/** Below this a faded piece is dropped from the draw and the raycast. */
const HIGHLIGHT_EPSILON = 0.02;

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

/** White vertex colours so a locked cell can be tinted later without splitting the row into a mesh per cell. */
const fillVertexColors = (geometry: BufferGeometry) => {
  const count = geometry.getAttribute('position').count;
  const colors = new Float32Array(count * 3);
  colors.fill(1);
  geometry.setAttribute('color', new BufferAttribute(colors, 3));
};

/** Bakes model nodes into one buffer (position + normals + white colour). */
const mergeNodes = (nodes: SceneNode[]): BufferGeometry => {
  const total = nodes.reduce(
    (sum, node) => sum + SCENE_SOURCE.geometries[node.geometry].position.length,
    0,
  );

  const position = new Float32Array(total);
  const normal = new Float32Array(total);
  const point = new Vector3();
  const matrix = new Matrix4();
  const normalMatrix = new Matrix3();

  let at = 0;
  for (const node of nodes) {
    const geometry = SCENE_SOURCE.geometries[node.geometry];
    matrix.fromArray(node.matrix);
    normalMatrix.getNormalMatrix(matrix);

    for (let i = 0; i < geometry.position.length; i += 3) {
      point
        .set(
          geometry.position[i],
          geometry.position[i + 1],
          geometry.position[i + 2],
        )
        .applyMatrix4(matrix)
        .toArray(position, at + i);

      point
        .set(geometry.normal[i], geometry.normal[i + 1], geometry.normal[i + 2])
        .applyMatrix3(normalMatrix)
        .normalize()
        .toArray(normal, at + i);
    }

    at += geometry.position.length;
  }

  const merged = new BufferGeometry();
  merged.setAttribute('position', new BufferAttribute(position, 3));
  merged.setAttribute('normal', new BufferAttribute(normal, 3));
  fillVertexColors(merged);
  return merged;
};

const nodesOf = (segment: number, step: number): SceneNode[] =>
  SCENE_SOURCE.nodes.filter(
    (node) => node.segment === segment && node.step === step,
  );

/** Paints one slice's vertices: a grey factor, or one factor per channel. */
const tintSlice = (
  part: Slice,
  tint: number | readonly [number, number, number],
) => {
  if (part.to <= part.from) return;
  const colors = part.geometry.getAttribute('color');
  if (!colors) return;
  const values = colors.array as Float32Array;
  const [r, g, b] = typeof tint === 'number' ? [tint, tint, tint] : tint;
  for (let i = part.from; i < part.to; i += 3) {
    values[i] = r;
    values[i + 1] = g;
    values[i + 2] = b;
  }
  colors.needsUpdate = true;
};

/**
 * Nudges every Y in a slice. Used to keep a passed cell on the disc when its terrace
 * rises out of the map flatten — the row stays one draw call.
 */
const shiftSlice = (part: Slice, delta: number) => {
  if (delta === 0 || part.to <= part.from) return;
  const attribute = part.geometry.getAttribute('position');
  if (!attribute) return;
  const values = attribute.array as Float32Array;
  for (let i = part.from + 1; i < part.to; i += 3) {
    values[i] += delta;
  }
  attribute.needsUpdate = true;
};

/** A hex colour as the linear triple a vertex colour wants. */
const rgbOf = (hex: string): [number, number, number] => {
  const color = new Color(hex);
  return [color.r, color.g, color.b];
};

/** Whether a fading material goes through the transparent pass. */
const setFade = (material: Material, presence: number) => {
  const isFading = presence < 1 - HIGHLIGHT_EPSILON;
  material.opacity = presence;
  if (material.transparent === isFading) return;
  material.transparent = isFading;
  // Transparent shells with depthWrite still punch holes while they fade.
  material.depthWrite = !isFading;
  material.needsUpdate = true;
};

const roomMaterial = (hex: string): MeshPhongMaterial =>
  new MeshPhongMaterial({
    color: new Color(hex),
    emissive: new Color(hex),
    // Soft — locked tiles darken via vertex colours, and a strong emissive would light them
    // back up through the tint.
    emissiveIntensity: PLATFORM_EMISSIVE,
    shininess: 28,
    specular: new Color(SCENE_PALETTE.specular),
    // The wedges are thin shells in places; a missing back face reads as a hole in the floor.
    side: DoubleSide,
    // Opaque until a fade starts — `setFade` flips it only while it melts.
    transparent: false,
    opacity: 1,
    depthWrite: true,
    vertexColors: true,
  });

// ═══════════════════════════════════════════
// BUILDER
// ═══════════════════════════════════════════

/**
 * The whole arena as one scene: the gears and the floor from the model, the cells built
 * here, and what stands on the axis.
 */
const buildScene = (skin: RobotDogSkin, action: RobotDogAction): SceneModel => {
  const scene = new Scene();
  const root = new Group();
  // Drop the arena under the look-at point so it reads in the lower half of the frame at
  // horizon elevation, not centred on the crosshair.
  root.position.y = SCENE_PLATFORM_Y;
  scene.add(root);

  // Sky sphere owns the backdrop (gradient + animated mist).
  scene.background = null;

  const haze = createHazeBackdrop();
  scene.add(haze.mesh);

  const warnCoat = (error: unknown) => {
    console.warn('[room-scene] robot dog coat failed to load', error);
  };

  /** Dog + watchers; dispose also settles so a torn-down scene never hangs the cover. */
  let pendingAssets = 2;
  let settleReady: () => void = () => {};
  const whenReady = new Promise<void>((resolve) => {
    settleReady = resolve;
  });
  const markAssetSettled = () => {
    if (pendingAssets <= 0) return;
    pendingAssets -= 1;
    if (pendingAssets === 0) settleReady();
  };

  // Three and a half megabytes of robot dog — dynamic import so a missing or broken GLB cannot take.
  const characterMount = new Group();
  let character: CenterCharacter | null = null;
  let characterDisposed = false;
  /** Bumped on every load; a load that finishes late is dropped. */
  let characterRequest = 0;
  let characterSkin = skin;
  let characterAction = action;
  let characterAssembly = DEFAULT_ROBOT_ASSEMBLY;
  let characterStage: RobotDogStage = 'basic';

  const loadCharacter = () => {
    characterRequest += 1;
    const request = characterRequest;
    const loadingSkin = characterSkin;

    void import('./center-character')
      .then(({ attachCenterCharacter }) =>
        attachCenterCharacter(characterMount, loadingSkin, characterAction),
      )
      .then((loaded) => {
        if (characterDisposed || request !== characterRequest) {
          loaded.dispose();
          return;
        }
        character?.dispose();
        character = loaded;

        if (characterSkin !== loadingSkin) {
          void loaded.setSkin(characterSkin).catch(warnCoat);
        }
        loaded.setAssembly(characterAssembly, characterStage);
        loaded.play(characterAction);
      })
      .catch((error: unknown) => {
        console.warn('[room-scene] center character failed to load', error);
      })
      .finally(markAssetSettled);
  };

  loadCharacter();

  // The overseer and the keeper hang over the far side of the arena.
  const watcherMount = new Group();
  scene.add(watcherMount);
  let watchers: Watchers | null = null;
  let watchersDisposed = false;
  let watchersVisible = true;

  void import('./watchers')
    .then(({ attachWatchers }) => attachWatchers(watcherMount))
    .then((loaded) => {
      if (watchersDisposed) {
        loaded.dispose();
        return;
      }
      watchers = loaded;
      watchers.setVisible(watchersVisible);
    })
    .catch((error: unknown) => {
      console.warn('[room-scene] watchers failed to load', error);
    })
    .finally(markAssetSettled);
  const rooms: MeshPhongMaterial[] = [];
  const geometries: BufferGeometry[] = [];
  const frames: LineBasicMaterial[] = [];
  /** One number material per bay: colours ride on the vertices. */
  const numberMaterials: MeshBasicMaterial[] = [];
  /** The row buffers a tap ray is tested against — rows with cells only. */
  const cellMeshes: Mesh[] = [];
  /** Every row that has cells, for the number rebuild. */
  const rows: RowRecord[] = [];
  /** Every cell by key — sinks, outlines, the hold fill all look it up. */
  const cells = new Map<string, CellRecord>();
  /** Everything belonging to one segment, so a segment view can hide the rest. */
  const segmentParts: Object3D[][] = Array.from(
    { length: SCENE_SEGMENT_COUNT },
    () => [],
  );
  /** The one bright outline, moved from tile to tile as the child picks. */
  const selectionMaterial = new LineBasicMaterial({
    color: new Color(SCENE_PALETTE.cellFrameActive),
  });
  const selection = new LineSegments(new BufferGeometry(), selectionMaterial);
  selection.visible = false;
  let selected: SceneCell | null = null;

  /** Rising fill shown while the child holds a cell to open its lesson. */
  const holdMaterial = new MeshBasicMaterial({
    color: new Color(SCENE_PALETTE.cellFrameActive),
    transparent: true,
    opacity: 0,
    depthTest: false,
    depthWrite: false,
    side: DoubleSide,
  });
  const holdMesh = new Mesh(new BufferGeometry(), holdMaterial);
  holdMesh.visible = false;
  holdMesh.renderOrder = 3;
  let holdBaseY = 0;
  let holdFullHeight = 1;

  /** The three wheels standing around the bowl — the machine that lifts the floor. */
  const gears: Group[] = [];

  /** One group per terrace — the rings that merge into the floor as it rises. */
  const terraces: Group[] = [];
  for (let terrace = 0; terrace < SCENE_TERRACE_COUNT; terrace += 1) {
    const group = new Group();
    terraces.push(group);
    root.add(group);
  }

  /** The pillars between the bays — their own colour, they belong to no bay. */
  const gearMaterial = roomMaterial(SCENE_PALETTE.shared);

  /** The floor: the disc on the axis and the platform ring round it. */
  const sharedMaterial = roomMaterial(SCENE_PALETTE.shared);

  /** A ring with no cells on it, drawn whole in the floor's colour. */
  const buildPlainRing = (step: number) => {
    const ring = SCENE_TILE_RINGS[step];
    if (!ring) return;
    const arc = fullArc(ring);
    const solid = arcSolid(arc);
    const plain = mergeParts([solid]);
    solid.dispose();
    geometries.push(plain.geometry);
    if (step >= SCENE_FIRST_CELL_STEP) {
      tintSlice(
        { geometry: plain.geometry, ...plain.ranges[0] },
        LOCKED_CELL_TINT,
      );
    }
    terraces[step].add(new Mesh(plain.geometry, sharedMaterial));
  };

  /** What a cell's slices point at until its row has been merged. */
  const unmerged = new BufferGeometry();

  /** Tile, frame and number buffers of one row, merged and hung on its terrace. */
  const buildRow = (segment: number, step: number) => {
    const ring = SCENE_TILE_RINGS[step];
    if (!ring) return;
    const material = rooms[segment];
    const frameMaterial = frames[segment];
    const count = rowSize(ARENA_LAYOUT, segment, step);

    // Nothing of this bay on this ring — the whole ring was drawn plain.
    if (count === 0) return;

    const records: CellRecord[] = [];
    for (let index = 0; index < count; index += 1) {
      const cell = { segment, step, cell: index };
      const arc = cellArc(ARENA_LAYOUT, cell, ring);
      const ordinal = layoutOrdinal(ARENA_LAYOUT, cell);
      if (!arc || ordinal === null) continue;
      records.push({
        key: cellKey(cell),
        cell,
        ordinal,
        arc,
        status: 'LOCKED',
        outline: arcEdges(arc, CELL_FRAME_LIFT),
        // Pointed at the row buffers once they are merged, just below.
        tile: { geometry: unmerged, from: 0, to: 0 },
        frame: { geometry: unmerged, from: 0, to: 0 },
        isDone: false,
        diskPin: 0,
      });
    }

    const solids = records.map((record) => arcSolid(record.arc));
    const tiles = mergeParts(solids);
    const frame = mergeParts(records.map((record) => record.outline));
    for (const solid of solids) solid.dispose();
    geometries.push(tiles.geometry, frame.geometry);

    // One buffer for the row; `starts` is how a ray that comes back with a triangle number
    // turns into a cell.
    const tileMesh = new Mesh(tiles.geometry, material);
    tileMesh.userData = { segment, step, starts: tiles.starts, count };
    const frameLines = new LineSegments(frame.geometry, frameMaterial);
    const numbers = new Mesh(new BufferGeometry(), numberMaterials[segment]);
    const flats = new Mesh(new BufferGeometry(), numberMaterials[segment]);
    const fronts = new Mesh(new BufferGeometry(), numberMaterials[segment]);

    records.forEach((record, index) => {
      record.tile = { geometry: tiles.geometry, ...tiles.ranges[index] };
      record.frame = { geometry: frame.geometry, ...frame.ranges[index] };
      cells.set(record.key, record);
    });

    // The numbers are not in `segmentParts`: which set shows depends on the view and on the
    // lift as well as on the bay (`applyNumbers`).
    terraces[step].add(tileMesh, frameLines, numbers, flats, fronts);
    segmentParts[segment].push(tileMesh, frameLines);
    cellMeshes.push(tileMesh);
    rows.push({ segment, step, numbers, flats, fronts, cells: records });
  };

  for (let segment = 0; segment < SCENE_SEGMENT_COUNT; segment += 1) {
    rooms.push(roomMaterial(SCENE_PALETTE.segments[segment]));
    frames.push(
      new LineBasicMaterial({
        color: new Color(SCENE_PALETTE.cellFrame),
        transparent: true,
        opacity: CELL_FRAME_OPACITY,
        vertexColors: true,
      }),
    );
    // Opaque: ninety digits in the transparent pass depth-wrote each other away.
    numberMaterials.push(
      new MeshBasicMaterial({
        // A neutral multiplier: the colour is on the vertices.
        color: new Color(1, 1, 1),
        vertexColors: true,
        side: DoubleSide,
      }),
    );

    // The wheel: one buffer, hung on its own axle.
    const wheelGeometry = mergeNodes(nodesOf(segment, SCENE_FLAT_STEP));
    geometries.push(wheelGeometry);

    wheelGeometry.computeBoundingSphere();
    const hub = wheelGeometry.boundingSphere?.center.clone() ?? new Vector3();
    wheelGeometry.translate(-hub.x, -hub.y, -hub.z);

    const gear = new Group();
    gear.position.copy(hub);
    gear.add(new Mesh(wheelGeometry, gearMaterial));
    gears.push(gear);
    root.add(gear);

    for (let terrace = 0; terrace < SCENE_TERRACE_COUNT; terrace += 1) {
      buildRow(segment, terrace);
    }
  }

  for (let terrace = 0; terrace < SCENE_TERRACE_COUNT; terrace += 1) {
    const isBare = ARENA_LAYOUT.rows.every((bay) => (bay[terrace] ?? 0) === 0);
    if (isBare) buildPlainRing(terrace);
  }

  /** Which way the tops of the digits on the tiles point on the map: away from its camera. */
  const mapUp = new Vector3(
    -Math.sin((TOP_AZIMUTH * Math.PI) / 180),
    0,
    -Math.cos((TOP_AZIMUTH * Math.PI) / 180),
  );

  /**
   * The same for a bay's own camera, which stands across the pit from the bay's middle: away
   * from it is straight out through that middle.
   */
  const bayUp = (segment: number): Vector3 => {
    const middle =
      (((SCENE_GEAR_ANGLES[segment] ?? 0) + 180 / SCENE_SEGMENT_COUNT) *
        Math.PI) /
      180;
    return new Vector3(Math.sin(middle), 0, Math.cos(middle));
  };

  /** Which set of numbers is showing — see `setNumberFace`. */
  let numberFace: NumberFace = 'top';
  /** Steps already flush with the floor — their fronts are under it. */
  let flushCount = 0;

  /** Rebuilds a row's three sets of numbers, one buffer each. */
  const rebuildNumbers = (row: RowRecord) => {
    const labels = row.cells.map(
      (record) => displayNumberForCell(record.ordinal) - 1,
    );
    const colors = row.cells.map((record) =>
      rgbOf(colorForLabelStatus(record.status)),
    );
    const onTops = (up: Vector3) =>
      row.cells.map((record, index) =>
        cellNumberGeometry(
          labels[index] ?? 0,
          arcAnchor(record.arc, CELL_NUMBER_LIFT - record.diskPin),
          undefined,
          up,
        ),
      );
    const onFronts = row.cells.map(({ arc, diskPin }, index) =>
      cellFrontNumberGeometry(
        labels[index] ?? 0,
        (arc.from + arc.to) / 2,
        arc.ring.inner,
        (arc.ring.bottom + arc.ring.top) / 2 - diskPin,
      ),
    );

    for (const [mesh, parts] of [
      [row.numbers, onTops(mapUp)],
      [row.flats, onTops(bayUp(row.segment))],
      [row.fronts, onFronts],
    ] as const) {
      const merged = mergeParts(parts, colors);
      for (const part of parts) part.dispose();
      const previous = mesh.geometry;
      mesh.geometry = merged.geometry;
      previous.dispose();
    }
  };

  /**
   * How far above the map disc a terrace sits. Passed tiles are pushed back down by this
   * so they never rise with the wall when the bay opens.
   */
  const diskPinTarget = (step: number, progress: number): number =>
    terraceSinkY(step, progress) - terraceSinkY(step, 1);

  /** Pins every passed cell to the disc plane for the current climb. */
  const applyDiskPins = (progress: number) => {
    let didPin = false;
    for (const record of cells.values()) {
      const target = record.isDone
        ? diskPinTarget(record.cell.step, progress)
        : 0;
      const delta = target - record.diskPin;
      if (delta === 0) continue;
      shiftSlice(record.tile, -delta);
      shiftSlice(record.frame, -delta);
      record.diskPin = target;
      didPin = true;
    }
    if (!didPin) return;
    for (const row of rows) rebuildNumbers(row);
  };

  const platform = new Group();
  root.add(platform);
  platform.add(characterMount);

  const bondBursts = createBondBursts(platform);

  const mapHud = createMapHud();
  // Hang off the outer ring so the boards ride under its rim as it sinks.
  terraces[SCENE_TERRACE_COUNT - 1]?.add(mapHud.root);

  const sharedNodes = nodesOf(SCENE_SHARED_SEGMENT, SCENE_FLAT_STEP);
  if (sharedNodes.length > 0) {
    const geometry = mergeNodes(sharedNodes);
    geometries.push(geometry);
    platform.add(new Mesh(geometry, sharedMaterial));
  }

  // Mounted on the arena, not on the platform: the wheels stand out here and the dust
  // belongs to the floor the ring lands on.
  const effects: LiftEffects = createLiftEffects(
    root,
    gears.map((gear) => gear.position),
  );

  const key = new DirectionalLight(
    new Color(SCENE_PALETTE.keyLight),
    KEY_LIGHT_INTENSITY,
  );
  key.position.set(...(KEY_LIGHT_POSITION as [number, number, number]));
  key.position.multiplyScalar(SCENE_RADIUS);

  const fill = new DirectionalLight(
    new Color(SCENE_PALETTE.fillLight),
    FILL_LIGHT_INTENSITY,
  );
  fill.position.set(...(FILL_LIGHT_POSITION as [number, number, number]));
  fill.position.multiplyScalar(SCENE_RADIUS);

  const hemisphere = new HemisphereLight(
    new Color(SCENE_PALETTE.hemisphereSky),
    new Color(SCENE_PALETTE.hemisphereGround),
    HEMISPHERE_INTENSITY,
  );

  const centre = new PointLight(
    new Color(SCENE_PALETTE.centreLight),
    CENTRE_POINT_INTENSITY,
    POINT_LIGHT_DISTANCE * 1.2,
    POINT_LIGHT_DECAY,
  );
  centre.position.set(0, SCENE_PLATFORM_Y + POINT_LIGHT_HEIGHT + 40, 0);

  /** Five lights, and only one of them costs anything. */
  scene.add(key, fill, hemisphere, centre);
  scene.add(
    new AmbientLight(new Color(SCENE_PALETTE.ambientLight), AMBIENT_INTENSITY),
  );

  /** How present each bay and the gear train are: `1` solid, `0` gone. */
  const segmentPresence = Array.from({ length: SCENE_SEGMENT_COUNT }, () => 1);
  const segmentPresenceTarget = [...segmentPresence];
  let gearPresence = 1;
  let gearPresenceTarget = 1;

  const applyPresence = () => {
    rooms.forEach((material, index) => {
      const presence = segmentPresence[index];
      setFade(material, presence);
      frames[index].opacity = presence * CELL_FRAME_OPACITY;

      const isShown = presence > HIGHLIGHT_EPSILON;
      for (const part of segmentParts[index]) part.visible = isShown;
    });
    // Numbers ride with their bay — visible whenever the bay is, including the overhead map,
    // so the lesson ordinal is never a hidden gesture.
    applyNumbers();

    setFade(gearMaterial, gearPresence);
    const areGearsShown = gearPresence > HIGHLIGHT_EPSILON;
    for (const gear of gears) gear.visible = areGearsShown;
  };

  const highlight = (segment: number | null, isImmediate = false) => {
    rooms.forEach((_material, index) => {
      const isShown = segment === null || segment === index;
      segmentPresenceTarget[index] = isShown ? 1 : 0;
      // Fading in has to be drawable on the first frame of the ease.
      if (isShown) {
        for (const part of segmentParts[index]) part.visible = true;
      }
    });

    gearPresenceTarget = segment === null ? 1 : 0;
    if (gearPresenceTarget > 0) {
      for (const gear of gears) gear.visible = true;
    }

    if (!isImmediate) return;

    for (let index = 0; index < SCENE_SEGMENT_COUNT; index += 1) {
      segmentPresence[index] = segmentPresenceTarget[index];
    }
    gearPresence = gearPresenceTarget;
    applyPresence();
  };

  const tickHighlight = (deltaSec: number) => {
    let didChange = false;

    for (let index = 0; index < SCENE_SEGMENT_COUNT; index += 1) {
      const target = segmentPresenceTarget[index];
      let next = damp(
        segmentPresence[index],
        target,
        HIGHLIGHT_SMOOTHING,
        deltaSec,
      );
      if (Math.abs(next - target) < HIGHLIGHT_EPSILON) next = target;
      if (next !== segmentPresence[index]) {
        segmentPresence[index] = next;
        didChange = true;
      }
    }

    let nextGear = damp(
      gearPresence,
      gearPresenceTarget,
      HIGHLIGHT_SMOOTHING,
      deltaSec,
    );
    if (Math.abs(nextGear - gearPresenceTarget) < HIGHLIGHT_EPSILON) {
      nextGear = gearPresenceTarget;
    }
    if (nextGear !== gearPresence) {
      gearPresence = nextGear;
      didChange = true;
    }

    if (didChange) applyPresence();
  };

  /** Which cell a ray landed on. */
  const cellAt = (object: Object3D, faceIndex: number): SceneCell | null => {
    const data = object.userData as {
      segment?: number;
      step?: number;
      starts?: number[];
      count?: number;
    };
    if (data.segment === undefined || data.step === undefined) return null;
    if (!data.starts || data.count === undefined) return null;

    const cell = cellOfFace(data.starts, faceIndex);
    if (cell === null || cell >= data.count) return null;

    return { segment: data.segment, step: data.step, cell };
  };

  /** The row buffers still solid enough to mean a tap, nothing else. */
  const cellTargets = () =>
    cellMeshes.filter((mesh) => {
      const material = mesh.material;
      if (Array.isArray(material)) return mesh.visible;
      return mesh.visible && material.opacity > 0.5;
    });

  /**
   * The frame colour of a passed cell, as the factor that turns the frame material's own
   * colour into the HUD's green.
   */
  const doneFrame = (() => {
    const frameColor = new Color(SCENE_PALETTE.cellFrame);
    const doneColor = new Color(SCENE_PALETTE.cellDone);
    return [
      doneColor.r / Math.max(frameColor.r, 1e-3),
      doneColor.g / Math.max(frameColor.g, 1e-3),
      doneColor.b / Math.max(frameColor.b, 1e-3),
    ] as const;
  })();

  /** Paints a cell's tile and frame for what it is: locked, open or passed. */
  const paintCell = (record: CellRecord) => {
    if (record.isDone) {
      tintSlice(record.tile, DONE_CELL_TINT);
      tintSlice(record.frame, doneFrame);
      return;
    }
    const tint = record.status === 'LOCKED' ? LOCKED_CELL_TINT : 1;
    tintSlice(record.tile, tint);
    tintSlice(record.frame, tint);
  };

  /** Last progress written — the loop calls every frame, the rings rarely move. */
  let appliedProgress = Number.NaN;

  /** Lights up the cells whose lesson is passed; pins them to the disc if their terrace is up. */
  const setCellsDone = (doneKeys: readonly string[]) => {
    const done = new Set(doneKeys);
    for (const [cellId, record] of cells) {
      const isDone = done.has(cellId);
      if (record.isDone === isDone) continue;
      record.isDone = isDone;
      paintCell(record);
    }
    // No climb yet — leave the buffers where they were built.
    if (!Number.isFinite(appliedProgress)) return;
    applyDiskPins(appliedProgress);
  };

  /** Picks one cell out of its row, or clears the pick. */
  const selectCell = (next: SceneCell | null) => {
    if (isSameCell(next, selected)) return;
    selected = next;

    const record = next ? cells.get(cellKey(next)) : undefined;
    if (!next || !record) {
      selection.visible = false;
      return;
    }

    selection.geometry = record.outline;
    selection.visible = true;
    selection.position.y = -record.diskPin;
    terraces[next.step]?.add(selection);
  };

  const setCellHoldProgress = (progress: number) => {
    if (!holdMesh.visible) return;
    const amount = clamp(progress, 0, 1);
    holdMesh.scale.y = Math.max(HOLD_MIN_HEIGHT, holdFullHeight * amount);
    holdMesh.position.y = holdBaseY;
    holdMaterial.opacity = HOLD_FILL_OPACITY * (0.35 + 0.65 * amount);
  };

  const beginCellHold = (cell: SceneCell) => {
    const record = cells.get(cellKey(cell));
    if (!record) return;

    // Unit-tall and shaped like the cell — a box would not follow a stretched cell's curve —
    // then grown with `scale.y`.
    const previous = holdMesh.geometry;
    holdMesh.geometry = holdSolid(record.arc);
    previous.dispose();

    holdBaseY = record.arc.ring.bottom - record.diskPin;
    holdFullHeight = record.arc.ring.top - record.arc.ring.bottom;
    holdMaterial.opacity = 0;
    holdMesh.visible = true;
    terraces[cell.step]?.add(holdMesh);
    selectCell(cell);
    setCellHoldProgress(0);
  };

  const endCellHold = () => {
    holdMesh.visible = false;
    holdMaterial.opacity = 0;
    selectCell(null);
  };

  /** Shows the numbers of the face the camera reads, in the bays still shown. */
  const applyNumbers = () => {
    for (const row of rows) {
      const isShown = segmentPresence[row.segment] > HIGHLIGHT_EPSILON;
      // A step the lift has laid flush has no front above the floor, so a bay reads that row's
      // numbers off the tops, turned to its camera.
      const isFlush = row.step <= flushCount;
      row.numbers.visible = isShown && numberFace === 'top';
      row.flats.visible = isShown && numberFace === 'front' && isFlush;
      row.fronts.visible = isShown && numberFace === 'front' && !isFlush;
    }
  };

  const setNumberFace = (face: NumberFace) => {
    numberFace = face;
    applyNumbers();
  };

  const setCellAccess = (
    completedLessonIds: readonly string[],
    level: number,
  ) => {
    for (const row of rows) {
      for (const record of row.cells) {
        record.status = lessonAccess(
          record.ordinal,
          completedLessonIds,
          level,
        ).status;
        // Tile and outline take the tint; numbers carry their own colour.
        paintCell(record);
      }
      rebuildNumbers(row);
    }

    // A locked cell must not keep the selection ring — it is not a target.
    if (selected && cells.get(cellKey(selected))?.status === 'LOCKED') {
      selectCell(null);
    }
  };

  /** Axle of a wheel: horizontal and tangential, so it rolls around the bowl. */
  const axleOf = (gear: Group) => {
    const radial = new Vector3(gear.position.x, 0, gear.position.z);
    if (radial.lengthSq() === 0) return new Vector3(1, 0, 0);

    radial.normalize();
    return new Vector3(-radial.z, 0, radial.x);
  };

  const axles = gears.map(axleOf);

  const setLevelProgress = (progress: number) => {
    if (progress === appliedProgress) return;
    appliedProgress = progress;

    // The pit sinks around the robot rather than lifting them out of it: each paid lift lays
    // one more step flush with the platform.
    terraces.forEach((terrace, index) => {
      terrace.position.y = terraceSinkY(index, progress);
    });

    const flush = flushSteps(progress);
    if (flush !== flushCount) {
      flushCount = flush;
      applyNumbers();
    }

    gears.forEach((gear, index) => {
      gear.quaternion.setFromAxisAngle(
        axles[index],
        gearAngle(index, progress),
      );
    });

    // Passed tiles stay on the disc when a bay opens out of the map flatten.
    applyDiskPins(progress);
    if (selected) {
      const record = cells.get(cellKey(selected));
      if (record) {
        selection.position.y = -record.diskPin;
        if (holdMesh.visible) {
          holdBaseY = record.arc.ring.bottom - record.diskPin;
          holdMesh.position.y = holdBaseY;
        }
      }
    }
  };

  const burstLift = (level: number) => {
    // Lift `N` lays step `N` flush with the platform: its rim is where the dust has to come from.
    const landed = clamp(level, 1, SCENE_TERRACE_RADII.length - 1);

    effects.burst(SCENE_TERRACE_RADII[landed]);
  };

  // World Y: arena is offset under look-at; local platform Y would miss by that much.
  const platformHeight = () => root.position.y + platform.position.y;

  const tick = (timeSec: number, deltaSec: number) => {
    haze.tick(timeSec);
    character?.tick(deltaSec);
    watchers?.tick(deltaSec);
    effects.tick(deltaSec);
    bondBursts.tick(deltaSec);
    tickHighlight(deltaSec);
  };

  const setCharacterSkin = (next: RobotDogSkin) => {
    if (next === characterSkin) return;
    characterSkin = next;
    // A model still loading reconciles when it lands; one already standing there only needs
    // its textures changed.
    void character?.setSkin(next).catch(warnCoat);
  };

  const playCharacterAction = (next: RobotDogAction) => {
    characterAction = next;
    character?.play(next);
  };

  const reactCharacter = (next: RobotDogAction, fallback: RobotDogAction) => {
    character?.playOnce(next, fallback);
  };

  const reactBond = (
    kind: BondKind,
    mood: RobotDogMoodName | null,
    fallback: RobotDogAction,
  ) => {
    const reaction = bondReaction(mood, kind);
    character?.playOnce(reaction.action, fallback);

    const target = character?.root;
    if (!target || reaction.burst === 'none') return;
    target.updateWorldMatrix(true, false);
    const box = new Box3().setFromObject(target);
    const origin = box.getCenter(new Vector3());
    // Spawn just above the head so hearts clear the ears.
    origin.y = box.max.y + 12;
    bondBursts.burst(reaction.burst, origin);
  };

  const characterRoot = () => character?.root ?? null;

  const characterFocus = (azimuthDeg: number): WatcherFocus | null => {
    const target = character?.root;
    if (!target) return null;

    target.updateWorldMatrix(true, false);
    const box = new Box3().setFromObject(target);
    const anchor = box.getCenter(new Vector3());
    // Aim at the upper chest / muzzle, not the belly.
    anchor.y = box.min.y + (box.max.y - box.min.y) * 0.72;

    const { x, y, z } = orbitPosition(
      azimuthDeg,
      CHARACTER_FOCUS_ELEVATION,
      CHARACTER_FOCUS_DISTANCE,
    );
    // Character already rides the platform in world space — eye Y is absolute.
    const eye = new Vector3(x, y + platformHeight(), z);
    return { eye, anchor };
  };

  const setCharacterFacing = (azimuthRad: number) => {
    characterMount.rotation.y = azimuthRad + SCENE_CHARACTER_FACING;
  };

  const setPlatformY = (y: number) => {
    root.position.y = y;
  };

  const dispose = () => {
    // Unblock any boot cover waiting on this instance.
    pendingAssets = 0;
    settleReady();
    watchersDisposed = true;
    watchers?.dispose();
    watchers = null;
    characterDisposed = true;
    character?.dispose();
    character = null;
    haze.dispose();
    effects.dispose();
    bondBursts.dispose();
    mapHud.dispose();
    for (const geometry of geometries) geometry.dispose();
    for (const row of rows) {
      row.numbers.geometry.dispose();
      row.flats.geometry.dispose();
      row.fronts.geometry.dispose();
    }
    unmerged.dispose();
    for (const record of cells.values()) record.outline.dispose();
    cells.clear();
    for (const material of rooms) material.dispose();
    for (const material of frames) material.dispose();
    for (const material of numberMaterials) material.dispose();
    gearMaterial.dispose();
    selectionMaterial.dispose();
    holdMaterial.dispose();
    holdMesh.geometry.dispose();
    sharedMaterial.dispose();
  };

  return {
    scene,
    highlight,
    setLevelProgress,
    burstLift,
    platformHeight,
    tick,
    setCharacterAssembly: (assembly, stage) => {
      characterAssembly = assembly;
      characterStage = stage;
      character?.setAssembly(assembly, stage);
    },
    setCharacterSkin,
    playCharacterAction,
    reactCharacter,
    reactBond,
    characterRoot,
    characterFocus,
    setCharacterFacing,
    cellTargets,
    cellAt,
    selectCell,
    beginCellHold,
    setCellHoldProgress,
    endCellHold,
    setCellAccess,
    setNumberFace,
    setCellsDone,
    watcherRoot: (watcher) => watchers?.root(watcher) ?? null,
    watcherFocus: (watcher) => watchers?.focus(watcher) ?? null,
    playWatcher: (watcher, action) => watchers?.play(watcher, action),
    setWatcherLifted: (watcher) => watchers?.setLifted(watcher),
    setWatchersVisible: (isVisible) => {
      watchersVisible = isVisible;
      watchers?.setVisible(isVisible);
    },
    setMapHudVisible: (isVisible) => {
      mapHud.setVisible(isVisible);
    },
    setMapHudStats: (stats) => {
      mapHud.setStats(stats);
    },
    setPlatformY,
    whenReady,
    dispose,
  };
};

export type { NumberFace, SceneModel };
export { buildScene };
