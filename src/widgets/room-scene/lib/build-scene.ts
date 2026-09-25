import {
  AmbientLight,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  Color,
  DirectionalLight,
  DoubleSide,
  EdgesGeometry,
  Group,
  HemisphereLight,
  LineBasicMaterial,
  LineSegments,
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

import { type LessonStatus, lessonAccess } from '@/entities/lesson';
import {
  DEFAULT_ROBOT_ASSEMBLY,
  type RobotAssembly,
  type RobotDogAction,
  type RobotDogSkin,
  type RobotDogStage,
} from '@/entities/robot-dog';
import {
  cellKey,
  cellOfFace,
  damp,
  gearAngle,
  isSameCell,
  SCENE_CELLS_PER_STEP,
  SCENE_CHARACTER_FACING,
  SCENE_FLAT_STEP,
  SCENE_GEAR_ANGLES,
  SCENE_PALETTE,
  SCENE_PLATFORM_Y,
  SCENE_RADIUS,
  SCENE_SEGMENT_COUNT,
  SCENE_SHARED_SEGMENT,
  SCENE_SOURCE,
  SCENE_TERRACE_COUNT,
  SCENE_TERRACE_RADII,
  SCENE_TERRACE_RISE,
  type SceneCell,
  type SceneNode,
  terraceSinkY,
} from '@/entities/scene';
import type { WatcherAction, WatcherId } from '@/entities/watcher';

import { clamp } from '@/shared/utils';

import { cellNumberLines, colorForLabelStatus } from './cell-number-marker';
import type { CenterCharacter } from './center-character';
import { createHazeBackdrop } from './haze-backdrop';
import { createLiftEffects, type LiftEffects } from './lift-effects';
import { createMapHud } from './map-hud';
import type { WatcherFocus, Watchers } from './watchers';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface SceneModel {
  /** Ready to render — lights included. */
  scene: Scene;
  /** Highlights one bay; the others and the gears ease out. `null` shows all. */
  highlight: (segment: number | null, isImmediate?: boolean) => void;
  /**
   * Where the platform stands on its way out of the pit: `0` on the floor,
   * `1` clear of the rim. Turns the gear train to match.
   */
  setLevelProgress: (progress: number) => void;
  /** Throws dust and sparks for one level-up: the ring landing and the gears. */
  burstLift: (level: number) => void;
  /** Platform height in world units, for the camera to follow. */
  platformHeight: () => number;
  /** Drifts the sky haze and advances the center character. */
  tick: (timeSec: number, deltaSec: number) => void;
  /**
   * Swaps the dog's coat. Every skin is the same mesh and the same clips, but
   * each lives in its own GLB, so this reloads and remounts the character.
   */
  /** Current module assembly and earned visual growth stage. */
  setCharacterAssembly: (assembly: RobotAssembly, stage: RobotDogStage) => void;
  setCharacterSkin: (skin: RobotDogSkin) => void;
  /** What the dog settles into whenever nothing interrupts it. */
  playCharacterAction: (action: RobotDogAction) => void;
  /** One-shot reaction to a tap; the dog returns to its state afterwards. */
  reactCharacter: (action: RobotDogAction, fallback: RobotDogAction) => void;
  /** What a tap ray is tested against — `null` until the model has loaded. */
  characterRoot: () => Object3D | null;
  /**
   * Turns the robot to face the camera, in radians.
   *
   * It stands on the axis with three segments around it, so there is no
   * direction it could face that is right from all of them: it faces the
   * child instead, wherever the child has walked to.
   */
  setCharacterFacing: (azimuthRad: number) => void;
  /** The tile buffers a tap ray is tested against, one per room and terrace. */
  cellTargets: () => Object3D[];
  /** Turns a ray hit into the cell it landed on, or `null` for a miss. */
  cellAt: (object: Object3D, faceIndex: number) => SceneCell | null;
  /** Picks one cell out of its row, or clears the pick with `null`. */
  selectCell: (cell: SceneCell | null) => void;
  /**
   * Starts the hold-to-enter fill on a cell — a translucent block that will
   * rise with `setCellHoldProgress` so the child sees the press is landing.
   */
  beginCellHold: (cell: SceneCell) => void;
  /** `0…1` how full the hold fill is. */
  setCellHoldProgress: (progress: number) => void;
  /** Hides the hold fill and clears the selection ring. */
  endCellHold: () => void;
  /**
   * Sinks the cells whose lesson has been passed, and raises the rest.
   *
   * `isImmediate` puts them where they belong without the drop — which is
   * what a scene being built for a child who learnt this yesterday needs,
   * against a tile sinking in front of them, which is the reward.
   */
  /** Refreshes availability colour for each cell's top-face caption. */
  setCellAccess: (doneKeys: readonly string[], level: number) => void;
  setCellsDone: (doneKeys: readonly string[], isImmediate?: boolean) => void;
  /** Same, for one of the two screens overhead. */
  watcherRoot: (watcher: WatcherId) => Object3D | null;
  /** Where the camera stands to talk to a screen, and what it looks at. */
  watcherFocus: (watcher: WatcherId) => WatcherFocus | null;
  /** Puts one of the screens into a state — talking, idling, reacting. */
  playWatcher: (watcher: WatcherId, action: WatcherAction) => void;
  /** Shows or hides the watcher models */
  setWatchersVisible: (isVisible: boolean) => void;
  /**
   * The three map boards (coins / tier / battery). Visible only on the
   * overhead shot — `setMapHudVisible` and `setMapHudStats` keep them in sync.
   */
  setMapHudVisible: (isVisible: boolean) => void;
  setMapHudStats: (stats: {
    balance: number;
    tier: number;
    tierTotal: number;
    charge: number;
  }) => void;
  /** Moves the arena under the look-at point (camera-rig knob). */
  setPlatformY: (y: number) => void;
  /** Frees every buffer the GL context is holding. */
  dispose: () => void;
}

interface CellSink {
  /** The buffers this cell owns a slice of, and where that slice is. */
  parts: { geometry: BufferGeometry; from: number; to: number }[];
  /** How far the slice is currently pushed down, in world units. */
  offset: number;
  /** How far it is heading. `tick` walks `offset` to meet it. */
  target: number;
}

interface CellLabelRecord {
  /** Stable cell key — sinkables look the number buffer up by this. */
  key: string;
  /** Bay index — presence hides numbers with their bay. */
  segment: number;
  /** Arena ordinal `0…89`. */
  ordinal: number;
  /** Availability — drives the number colour. */
  status: LessonStatus;
  /** Stroke mesh for the lesson number. */
  mesh: LineSegments;
  /** Own material so status colour does not share state with frames. */
  material: LineBasicMaterial;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/**
 * How far a cell drops once its lesson is passed, in world units.
 *
 * One terrace rise, so a passed cell comes down level with the ring below
 * it. Six passed cells leave the terrace flat, which is the same shape the
 * level mechanic makes — the pit fills in as the child learns, one tile at a
 * time rather than one ring at a time.
 */
const CELL_SINK_DROP = SCENE_TERRACE_RISE;

/** Share of a cell's drop still left after a second. Slow: it is a reward. */
const CELL_SINK_SMOOTHING = 0.004;

/** Below this the drop is over and the cell stops being written to. */
const CELL_SINK_EPSILON = 0.05;

/**
 * How dark a locked tile reads against its bay.
 *
 * Multiplies the vertex colour; diffuse takes the hit, emissive stays soft
 * so the locked tiles sink without going black.
 */
const LOCKED_CELL_TINT = 0.28;

/** Opacity of the hold-to-enter fill at full charge. */
const HOLD_FILL_OPACITY = 0.62;

/** Key light sits above and in front, so the wedges keep a readable top face. */
const KEY_LIGHT_POSITION = [0.6, 1, 0.45];

/** Fill comes from the opposite side at a third of the strength. */
const FILL_LIGHT_POSITION = [-0.7, 0.35, -0.6];

/**
 * Soft corridor light: warm key, cool fill, bright ambient — Smash Hit, not
 * neon alley. Flat Phong colour + mild emissive; no textures.
 */
const KEY_LIGHT_INTENSITY = 1.8;
const FILL_LIGHT_INTENSITY = 1.2;
const AMBIENT_INTENSITY = 0.85;
const HEMISPHERE_INTENSITY = 1.2;
const CENTRE_POINT_INTENSITY = 3.2;
/** How high above the dropped platform the neon lamps sit. */
const POINT_LIGHT_HEIGHT = 220;

/** Longer falloff — covers the whole arena without a black rim. */
const POINT_LIGHT_DISTANCE = 1200;
const POINT_LIGHT_DECAY = 1;

/**
 * Crease angle, in degrees, above which an edge is drawn.
 *
 * The tiles are low prisms: twenty keeps the rim and drops the triangulation
 * running across the top face, which is the difference between a frame and a
 * cobweb.
 */
const CELL_EDGE_ANGLE = 20;

/** Degrees of arc one bay covers — a third of the ring, gear to gear. */
const SEGMENT_ARC = 360 / SCENE_SEGMENT_COUNT;

/** World units the outline floats above its tile, to settle the z-fighting. */
const CELL_FRAME_LIFT = 1;

/** How solid a resting frame is drawn; the selected one is opaque. */
const CELL_FRAME_OPACITY = 0.5;

/**
 * Share of a highlight fade still left after a second.
 *
 * Matched to the camera ease so the unused bays and gears melt out while the
 * orbit is still settling, rather than popping or lingering after the shot.
 */
const HIGHLIGHT_SMOOTHING = 0.002;

/** Below this a faded piece is dropped from the draw and the raycast. */
const HIGHLIGHT_EPSILON = 0.02;

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

/** Bakes a room's nodes into one buffer (position + normals only). */
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

/**
 * Where a node sits in the world, as a heading in degrees.
 *
 * Averaged over its vertices, not read off the matrix: the ninety tiles are
 * clones, and a clone's transform in this FBX carries rotation and scale but
 * leaves the translation at zero. Reading `matrix[12..14]` puts every tile on
 * the axis — the converter hit the same trap, which is why it assigns
 * segments by centroid too (docs/scene.md).
 */
const nodeAngle = (node: SceneNode): number => {
  const matrix = new Matrix4().fromArray(node.matrix);
  const geometry = SCENE_SOURCE.geometries[node.geometry];
  const point = new Vector3();
  let x = 0;
  let z = 0;

  for (let i = 0; i < geometry.position.length; i += 3) {
    point
      .set(
        geometry.position[i],
        geometry.position[i + 1],
        geometry.position[i + 2],
      )
      .applyMatrix4(matrix);
    x += point.x;
    z += point.z;
  }

  return (Math.atan2(x, z) * 180) / Math.PI;
};

/**
 * The six cells of one terrace of one segment, left to right.
 *
 * A **segment is the bay between two gears**, and that is not how the FBX
 * groups its discs. The artist laid eighteen tiles round each terrace in
 * three arcs of six, each arc centred on a gear — so the converter's
 * `node.segment` cuts the ring straight through the middle of a bay. Read
 * that way the child faces a gear with three cells either side of it, which
 * is not a wall of anything.
 *
 * Cut instead **at** the gears: bay `s` runs from gear `s` to gear `s + 1`,
 * taking the far three cells of one arc, the gap the ramp climbs, and the
 * near three of the next. Six again, and this time with the gears standing
 * at its edges like pillars.
 *
 * Sorted by angle within the bay, so `cell` is a place on the arc rather
 * than an accident of the export — the game stores these.
 */
const cellsOf = (segment: number, step: number): SceneNode[] => {
  const from = SCENE_GEAR_ANGLES[segment] ?? 0;

  return SCENE_SOURCE.nodes
    .filter((node) => node.step === step && node.segment >= 0)
    .map((node) => ({
      node,
      offset: (((nodeAngle(node) - from) % 360) + 360) % 360,
    }))
    .filter((entry) => entry.offset < SEGMENT_ARC)
    .sort((a, b) => a.offset - b.offset)
    .map((entry) => entry.node);
};

/**
 * Where each part lands inside a buffer they were laid into end to end.
 *
 * Both merges — the tiles and their outlines — put one part after another in
 * a single array, so a part's own vertices are a slice of it. These are the
 * slices, in floats, which is what a sinking cell has to move.
 */
/**
 * Pushes one cell's slice down by `delta`, in place.
 *
 * Every third float from the start of the slice is a Y, and nothing else in
 * the buffer is touched — the five cells beside it keep their vertices and
 * the terrace keeps its single draw call.
 */
const shiftSlice = (
  part: { geometry: BufferGeometry; from: number; to: number },
  delta: number,
) => {
  const attribute = part.geometry.getAttribute('position');
  const array = attribute.array as Float32Array;

  for (let i = part.from + 1; i < part.to; i += 3) {
    array[i] += delta;
  }

  attribute.needsUpdate = true;
};

const rangesOf = (lengths: number[]): { from: number; to: number }[] => {
  const ranges: { from: number; to: number }[] = [];
  let at = 0;
  for (const length of lengths) {
    ranges.push({ from: at, to: at + length });
    at += length;
  }
  return ranges;
};

/**
 * The first triangle of each node inside a merged buffer.
 *
 * `mergeNodes` lays the nodes down back to back, so a node's triangles start
 * where the ones before it ended — this counts them out without walking the
 * vertices again.
 */
const faceStarts = (nodes: SceneNode[]): number[] => {
  const starts: number[] = [];
  let at = 0;
  for (const node of nodes) {
    starts.push(at);
    at += SCENE_SOURCE.geometries[node.geometry].position.length / 9;
  }
  return starts;
};

/**
 * Where a lesson number sits on a cell: top centre, same spot the old status
 * markers used. `cellNumberLines` then lays the strokes flat on that plane.
 */
const frontAnchorOf = (edges: BufferGeometry): Vector3 => {
  edges.computeBoundingBox();
  const box = edges.boundingBox;
  if (!box) return new Vector3();

  const center = box.getCenter(new Vector3());
  // Lift clear of the tile — same daylight gap the cell frames use — so the
  // strokes do not z-fight the floor into a dashed crawl.
  center.y = box.max.y + 3;
  return center;
};

/**
 * The outline of one cell, lifted clear of the tile it traces.
 *
 * An edge sits exactly on the surface it came from, which on a phone GPU is a
 * coin toss per pixel between the line and the floor — the frame comes out
 * dashed and crawling. A single unit of daylight settles it.
 */
const cellEdges = (node: SceneNode): BufferGeometry => {
  const solid = mergeNodes([node]);
  const edges = new EdgesGeometry(solid, CELL_EDGE_ANGLE);
  solid.dispose();
  edges.translate(0, CELL_FRAME_LIFT, 0);
  return edges;
};

/** The six outlines of a terrace as one buffer — one line per draw call. */
const mergeEdges = (parts: BufferGeometry[]): BufferGeometry => {
  const total = parts.reduce(
    (sum, part) => sum + part.getAttribute('position').array.length,
    0,
  );

  const position = new Float32Array(total);
  let at = 0;
  for (const part of parts) {
    position.set(part.getAttribute('position').array as Float32Array, at);
    at += part.getAttribute('position').array.length;
  }

  const merged = new BufferGeometry();
  merged.setAttribute('position', new BufferAttribute(position, 3));
  fillVertexColors(merged);
  return merged;
};

/**
 * White vertex colours so a locked cell can be tinted later without splitting
 * the terrace into six meshes.
 */
const fillVertexColors = (geometry: BufferGeometry) => {
  const count = geometry.getAttribute('position').count;
  const colors = new Float32Array(count * 3);
  colors.fill(1);
  geometry.setAttribute('color', new BufferAttribute(colors, 3));
};

/** Paints one sink slice's vertices a uniform grey factor. */
const tintSlice = (
  part: { geometry: BufferGeometry; from: number; to: number },
  tint: number,
) => {
  const colors = part.geometry.getAttribute('color');
  if (!colors) return;
  const values = colors.array as Float32Array;
  for (let i = part.from; i < part.to; i += 1) {
    values[i] = tint;
  }
  colors.needsUpdate = true;
};

const roomMaterial = (hex: string): MeshPhongMaterial =>
  new MeshPhongMaterial({
    color: new Color(hex),
    emissive: new Color(hex),
    // Soft — locked tiles darken via vertex colours, and a strong emissive
    // would light them back up through the tint.
    emissiveIntensity: 0.08,
    shininess: 40,
    specular: new Color(SCENE_PALETTE.specular),
    // The wedges are thin shells in places; a missing back face reads as a
    // hole in the floor.
    side: DoubleSide,
    // Segment and gear fades write opacity every frame; without this the
    // material ignores it and pops instead of melting.
    transparent: true,
    opacity: 1,
    depthWrite: true,
    vertexColors: true,
  });

// ═══════════════════════════════════════════
// BUILDER
// ═══════════════════════════════════════════

/**
 * The whole model as one scene: a mesh per room, plus what stands on the axis.
 *
 * Built once per GL context. Nothing here reads React state — the component
 * only moves the camera, so a re-render never rebuilds a buffer.
 */
const buildScene = (skin: RobotDogSkin, action: RobotDogAction): SceneModel => {
  const scene = new Scene();
  const root = new Group();
  // Drop the arena under the look-at point so it reads in the lower half of
  // the frame at horizon elevation, not centred on the crosshair.
  root.position.y = SCENE_PLATFORM_Y;
  scene.add(root);

  // Sky sphere owns the backdrop (gradient + animated mist). No scene.fog —
  // that would wash the arena itself; haze stays on the background only.
  scene.background = null;

  const haze = createHazeBackdrop();
  scene.add(haze.mesh);

  const warnCoat = (error: unknown) => {
    console.warn('[room-scene] robot dog coat failed to load', error);
  };

  // Three and a half megabytes of robot dog — dynamic import so a missing or broken GLB
  // cannot take down the arena bundle, and so the arena paints first.
  // Parented to the platform further down, once the platform exists.
  const characterMount = new Group();
  let character: CenterCharacter | null = null;
  let characterDisposed = false;
  /** Bumped on every skin swap; a load that finishes late is dropped. */
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

        // The coat and the state can both change while five megabytes of dog
        // are in flight — the profile finishes loading, or the child taps a
        // tile. Whatever they settled on wins over what this load started
        // with.
        if (characterSkin !== loadingSkin) {
          void loaded.setSkin(characterSkin).catch(warnCoat);
        }
        loaded.setAssembly(characterAssembly, characterStage);
        loaded.play(characterAction);
      })
      .catch((error: unknown) => {
        console.warn('[room-scene] center character failed to load', error);
      });
  };

  loadCharacter();

  // The overseer and the keeper, hung off the camera rig rather than the
  // arena: their own file carries the ceiling they are bolted to.
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
    });

  const rooms: MeshPhongMaterial[] = [];
  const geometries: BufferGeometry[] = [];
  /** One outline material per room, so a muted room's frames mute with it. */
  const frames: LineBasicMaterial[] = [];
  /** The fifteen tile buffers a tap ray is tested against. */
  const cellMeshes: Mesh[] = [];
  /** Top-face lesson captions, one per cell. */
  const cellLabelRecords: CellLabelRecord[] = [];
  /** Everything belonging to one segment, so a segment view can hide the rest. */
  const segmentParts: Object3D[][] = [[], [], []];
  /** Every cell's own outline, kept for the selection to borrow. */
  const cellOutlines = new Map<string, BufferGeometry>();
  /**
   * How to sink one cell without giving it a mesh of its own.
   *
   * Six cells share one buffer and one draw call, so a tile cannot simply be
   * moved — what moves is its slice of the vertices, in the tile buffer and
   * in the outline buffer together. `offset` is where the slice sits now and
   * `target` where it is heading; `tick` walks one to the other.
   */
  const sinkables = new Map<string, CellSink>();
  /** The one bright outline, moved from tile to tile as the child picks. */
  const selectionMaterial = new LineBasicMaterial({
    color: new Color(SCENE_PALETTE.cellFrameActive),
  });
  const selection = new LineSegments(new BufferGeometry(), selectionMaterial);
  selection.visible = false;
  let selected: SceneCell | null = null;

  /**
   * Rising fill shown while the child holds a cell to open its lesson.
   *
   * A short tap on a crowded bay is too easy to miss; the block growing
   * inside the tile is what tells them the press is counting.
   */
  const holdMaterial = new MeshBasicMaterial({
    color: new Color(SCENE_PALETTE.cellFrameActive),
    transparent: true,
    opacity: 0,
    depthTest: false,
    depthWrite: false,
    side: DoubleSide,
  });
  const holdMesh = new Mesh(new BoxGeometry(1, 1, 1), holdMaterial);
  holdMesh.visible = false;
  holdMesh.renderOrder = 3;
  let holdBaseY = 0;
  let holdFullHeight = 1;
  let holdWidth = 1;
  let holdDepth = 1;

  /**
   * The three wheels standing around the bowl — the machine that lifts the
   * floor.
   *
   * Each is its own group so it can turn about its own axle. The mesh is
   * shifted back by the wheel's centre, because a wheel turning about the
   * middle of the whole arena would swing around the bowl instead of
   * spinning where it stands.
   */
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

  for (let segment = 0; segment < SCENE_SEGMENT_COUNT; segment += 1) {
    const material = roomMaterial(SCENE_PALETTE.segments[segment]);
    rooms.push(material);
    frames.push(
      new LineBasicMaterial({
        color: new Color(SCENE_PALETTE.cellFrame),
        transparent: true,
        opacity: CELL_FRAME_OPACITY,
        vertexColors: true,
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

    // A terrace is a full ring across all three rooms, so it belongs to a
    // group of its own: the floor takes the rings it passes up with it, and a
    // ring split per room would be torn into three arcs at different heights.
    for (let terrace = 0; terrace < SCENE_TERRACE_COUNT; terrace += 1) {
      const cells = cellsOf(segment, terrace);
      const geometry = mergeNodes(cells);
      geometries.push(geometry);

      // The six cells share one buffer and one draw call; `starts` is how a
      // ray that comes back with a triangle number turns into a cell.
      const tiles = new Mesh(geometry, material);
      tiles.userData = { segment, step: terrace, starts: faceStarts(cells) };
      terraces[terrace].add(tiles);
      cellMeshes.push(tiles);
      segmentParts[segment].push(tiles);

      // Every cell keeps its own outline, so the selected one can be picked
      // out of the row without rebuilding anything. Lesson numbers are drawn
      // as line strokes on the cell top — the same path the old status
      // markers used, which this GL stack actually shows.
      const outlines = cells.map((node) => cellEdges(node));
      const numberGeometries: BufferGeometry[] = [];
      outlines.forEach((edges, cell) => {
        const key = cellKey({ segment, step: terrace, cell });
        cellOutlines.set(key, edges);
        const ordinal = segment * 30 + terrace * 6 + cell;
        const status = lessonAccess(ordinal, [], 0).status;
        const floats = cellNumberLines(ordinal, frontAnchorOf(edges));
        const numberGeometry = new BufferGeometry();
        numberGeometry.setAttribute(
          'position',
          new BufferAttribute(new Float32Array(floats), 3),
        );
        geometries.push(numberGeometry);
        numberGeometries.push(numberGeometry);

        const numberMaterial = new LineBasicMaterial({
          color: new Color(colorForLabelStatus(status)),
          transparent: true,
          opacity: 1,
          depthTest: false,
        });
        const numberLines = new LineSegments(numberGeometry, numberMaterial);
        numberLines.renderOrder = 2;
        terraces[terrace].add(numberLines);
        segmentParts[segment].push(numberLines);

        cellLabelRecords.push({
          key,
          segment,
          ordinal,
          status,
          mesh: numberLines,
          material: numberMaterial,
        });
      });

      const frame = mergeEdges(outlines);

      geometries.push(frame);

      // A sunk cell takes its outline and number down with it, so both
      // buffers are sliced the same way and moved together.
      const tileRanges = rangesOf(
        cells.map(
          (node) => SCENE_SOURCE.geometries[node.geometry].position.length,
        ),
      );
      const frameRanges = rangesOf(
        outlines.map((edges) => edges.getAttribute('position').array.length),
      );
      cells.forEach((_node, cell) => {
        const numberGeometry = numberGeometries[cell];
        sinkables.set(cellKey({ segment, step: terrace, cell }), {
          parts: [
            { geometry, ...tileRanges[cell] },
            { geometry: frame, ...frameRanges[cell] },
            {
              geometry: numberGeometry,
              from: 0,
              to: numberGeometry.getAttribute('position').array.length,
            },
          ],
          offset: 0,
          target: 0,
        });
      });

      const frameLines = new LineSegments(frame, frames[segment]);
      terraces[terrace].add(frameLines);
      segmentParts[segment].push(frameLines);
    }
  }

  /**
   * The platform: the floor the robot stands on.
   *
   * The character and the dust hang off it rather than off the arena, so the
   * whole cargo climbs together and nothing has to be moved twice.
   */
  const platform = new Group();
  root.add(platform);
  // The floor of the bowl is a flat disc at zero — the ramps around it are
  // what reach 46, not the ground the robot walks on.
  platform.add(characterMount);

  const mapHud = createMapHud();
  // Hang off the outer ring so the boards ride under its rim as it sinks.
  terraces[SCENE_TERRACE_COUNT - 1]?.add(mapHud.root);

  const sharedNodes = nodesOf(SCENE_SHARED_SEGMENT, SCENE_FLAT_STEP);
  const sharedMaterial = roomMaterial(SCENE_PALETTE.shared);
  if (sharedNodes.length > 0) {
    const geometry = mergeNodes(sharedNodes);
    geometries.push(geometry);
    platform.add(new Mesh(geometry, sharedMaterial));
  }

  // Mounted on the arena, not on the platform: the wheels stand out here and
  // the dust belongs to the floor the ring lands on.
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

  /*
   * Five lights, and only one of them costs anything.
   *
   * There were nine: these five plus an overhead spot and a coloured point
   * lamp over each of the three wedges. On the emulator's software renderer
   * that was six frames a second against twenty with them gone — a 3.3×
   * difference from lighting alone, because every extra point or spot light
   * is another full lighting calculation for every pixel the arena covers,
   * and the arena covers the screen.
   *
   * What went:
   *
   * - The **spot** did the same job as `centre` — a pool of light on the
   *   floor — and a cone with a penumbra and a distance falloff is the most
   *   expensive light there is.
   * - The **three room lamps** tinted each wedge in its own colour. They were
   *   built when the wedges were a street, a living room and a kitchen; the
   *   rooms are gone, and `highlight` already tints a segment through its
   *   material, which costs nothing per pixel.
   *
   * Directional, hemisphere and ambient are effectively free — they have no
   * position to attenuate from. Adding a point light back is the one change
   * here that can halve the frame rate, so measure it: the camera rig panel
   * shows the frames.
   */
  scene.add(key, fill, hemisphere, centre);
  scene.add(
    new AmbientLight(new Color(SCENE_PALETTE.ambientLight), AMBIENT_INTENSITY),
  );

  /**
   * How present each bay and the gear train are: `1` solid, `0` gone.
   *
   * `highlight` only writes the targets; `tick` walks the live values so a
   * cut between map and bay melts instead of popping.
   */
  const segmentPresence = [1, 1, 1];
  const segmentPresenceTarget = [1, 1, 1];
  let gearPresence = 1;
  let gearPresenceTarget = 1;

  const applyPresence = () => {
    rooms.forEach((material, index) => {
      const presence = segmentPresence[index];
      material.opacity = presence;
      // Transparent shells with depthWrite still punch holes while they fade;
      // drop it once they are see-through so the kept bay reads cleanly.
      material.depthWrite = presence > 1 - HIGHLIGHT_EPSILON;
      frames[index].opacity = presence * CELL_FRAME_OPACITY;

      const isShown = presence > HIGHLIGHT_EPSILON;
      for (const part of segmentParts[index]) part.visible = isShown;
    });

    // Numbers ride with their bay — visible whenever the bay is, including
    // the overhead map, so the lesson ordinal is never a hidden gesture.
    for (const record of cellLabelRecords) {
      const isShown = segmentPresence[record.segment] > HIGHLIGHT_EPSILON;
      record.mesh.visible = isShown;
      record.material.opacity = isShown ? 1 : 0;
    }

    gearMaterial.opacity = gearPresence;
    gearMaterial.depthWrite = gearPresence > 1 - HIGHLIGHT_EPSILON;
    const areGearsShown = gearPresence > HIGHLIGHT_EPSILON;
    for (const gear of gears) gear.visible = areGearsShown;
  };

  const highlight = (segment: number | null, isImmediate = false) => {
    rooms.forEach((material, index) => {
      const isShown = segment === null || segment === index;
      // Keep each bay on its own colour while it fades — muting then melting
      // read as two different transitions stacked on top of each other.
      const hex = SCENE_PALETTE.segments[index];
      material.color.set(hex);
      material.emissive.set(hex);
      material.emissiveIntensity = 0.08;
      segmentPresenceTarget[index] = isShown ? 1 : 0;
      frames[index].color.set(SCENE_PALETTE.cellFrame);
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

  /**
   * Which cell a ray landed on.
   *
   * The six cells of a terrace share one mesh, so the hit alone says nothing:
   * what identifies the tile is the triangle number, checked against the
   * ranges written onto the mesh when it was merged.
   */
  const cellAt = (object: Object3D, faceIndex: number): SceneCell | null => {
    const data = object.userData as {
      segment?: number;
      step?: number;
      starts?: number[];
    };
    if (data.segment === undefined || data.step === undefined) return null;
    if (!data.starts) return null;

    const cell = cellOfFace(data.starts, faceIndex);
    if (cell === null || cell >= SCENE_CELLS_PER_STEP) return null;

    return { segment: data.segment, step: data.step, cell };
  };

  /** The tile buffers still solid enough to mean a tap, nothing else. */
  const cellTargets = () =>
    cellMeshes.filter((mesh) => {
      const material = mesh.material;
      if (Array.isArray(material)) return mesh.visible;
      return mesh.visible && material.opacity > 0.5;
    });

  /**
   * Picks one cell out of its row, or clears the pick.
   *
   * The outline is one object that borrows the chosen cell's edges and moves
   * into its terrace, so the arena carries a single extra draw call however
   * many cells there turn out to be.
   */
  const setCellsDone = (doneKeys: readonly string[], isImmediate = false) => {
    const done = new Set(doneKeys);

    for (const [key, sink] of sinkables) {
      sink.target = done.has(key) ? CELL_SINK_DROP : 0;
      if (!isImmediate) continue;

      const delta = sink.target - sink.offset;
      if (delta === 0) continue;

      for (const part of sink.parts) shiftSlice(part, -delta);
      sink.offset = sink.target;
    }
  };

  /** Walks every cell that is still on its way down, or back up. */
  const tickCellSinks = (deltaSec: number) => {
    for (const sink of sinkables.values()) {
      const gap = sink.target - sink.offset;
      if (Math.abs(gap) < CELL_SINK_EPSILON) {
        if (gap !== 0) {
          for (const part of sink.parts) shiftSlice(part, -gap);
          sink.offset = sink.target;
        }
        continue;
      }

      const next = damp(
        sink.offset,
        sink.target,
        CELL_SINK_SMOOTHING,
        deltaSec,
      );
      for (const part of sink.parts) shiftSlice(part, -(next - sink.offset));
      sink.offset = next;
    }
  };

  const selectCell = (next: SceneCell | null) => {
    if (isSameCell(next, selected)) return;
    selected = next;

    if (!next) {
      selection.visible = false;
      return;
    }

    const edges = cellOutlines.get(cellKey(next));
    if (!edges) {
      selection.visible = false;
      return;
    }

    selection.geometry = edges;
    selection.visible = true;
    terraces[next.step]?.add(selection);
  };

  const beginCellHold = (cell: SceneCell) => {
    const edges = cellOutlines.get(cellKey(cell));
    if (!edges) return;

    edges.computeBoundingBox();
    const box = edges.boundingBox;
    if (!box) return;

    holdWidth = Math.max(box.max.x - box.min.x, 1) * 0.9;
    holdDepth = Math.max(box.max.z - box.min.z, 1) * 0.9;
    holdFullHeight = Math.max(box.max.y - box.min.y, 12);
    holdBaseY = box.min.y;
    holdMesh.position.set(
      (box.min.x + box.max.x) / 2,
      holdBaseY,
      (box.min.z + box.max.z) / 2,
    );
    holdMesh.scale.set(holdWidth, 0.02, holdDepth);
    holdMaterial.opacity = 0;
    holdMesh.visible = true;
    terraces[cell.step]?.add(holdMesh);
    selectCell(cell);
    setCellHoldProgress(0);
  };

  const setCellHoldProgress = (progress: number) => {
    if (!holdMesh.visible) return;
    const amount = clamp(progress, 0, 1);
    const height = Math.max(0.02, holdFullHeight * amount);
    holdMesh.scale.set(holdWidth, height, holdDepth);
    // BoxGeometry is centred — sit the block on the cell floor as it grows.
    holdMesh.position.y = holdBaseY + height / 2;
    holdMaterial.opacity = HOLD_FILL_OPACITY * (0.35 + 0.65 * amount);
  };

  const endCellHold = () => {
    holdMesh.visible = false;
    holdMaterial.opacity = 0;
    selectCell(null);
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
    // The pit sinks around the robot rather than lifting them out of it: each
    // paid stage lowers the rim; the fifth stage finally flattens the bowl.
    terraces.forEach((terrace, index) => {
      terrace.position.y = terraceSinkY(index, progress);
    });

    gears.forEach((gear, index) => {
      gear.quaternion.setFromAxisAngle(
        axles[index],
        gearAngle(index, progress),
      );
    });
  };

  const burstLift = (level: number) => {
    // The ring that just landed is the one the level number names, and its
    // radius is where the dust has to come from.
    const landed = clamp(level - 1, 0, SCENE_TERRACE_RADII.length - 1);

    effects.burst(SCENE_TERRACE_RADII[landed]);
  };

  // World height, not the platform's own: the whole arena is offset under the
  // look-at point, and a camera aimed at the local value misses by that much.
  const platformHeight = () => root.position.y + platform.position.y;

  const tick = (timeSec: number, deltaSec: number) => {
    haze.tick(timeSec);
    character?.tick(deltaSec);
    watchers?.tick(deltaSec);
    effects.tick(deltaSec);
    tickCellSinks(deltaSec);
    tickHighlight(deltaSec);
  };

  const setCharacterSkin = (next: RobotDogSkin) => {
    if (next === characterSkin) return;
    characterSkin = next;
    // A model still loading reconciles when it lands; one already standing
    // there only needs its textures changed.
    void character?.setSkin(next).catch(warnCoat);
  };

  const playCharacterAction = (next: RobotDogAction) => {
    characterAction = next;
    character?.play(next);
  };

  const reactCharacter = (next: RobotDogAction, fallback: RobotDogAction) => {
    character?.playOnce(next, fallback);
  };

  const characterRoot = () => character?.root ?? null;

  const setCharacterFacing = (azimuthRad: number) => {
    characterMount.rotation.y = azimuthRad + SCENE_CHARACTER_FACING;
  };

  const setPlatformY = (y: number) => {
    root.position.y = y;
  };

  const dispose = () => {
    watchersDisposed = true;
    watchers?.dispose();
    watchers = null;
    characterDisposed = true;
    character?.dispose();
    character = null;
    haze.dispose();
    effects.dispose();
    mapHud.dispose();
    for (const geometry of geometries) geometry.dispose();
    for (const material of rooms) material.dispose();
    gearMaterial.dispose();
    for (const material of frames) material.dispose();
    for (const record of cellLabelRecords) record.material.dispose();
    for (const edges of cellOutlines.values()) edges.dispose();
    cellOutlines.clear();
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
    characterRoot,
    setCharacterFacing,
    cellTargets,
    cellAt,
    selectCell,
    beginCellHold,
    setCellHoldProgress,
    endCellHold,
    setCellAccess: (doneKeys, level) => {
      for (const record of cellLabelRecords) {
        record.status = lessonAccess(record.ordinal, doneKeys, level).status;
        record.material.color.set(colorForLabelStatus(record.status));
        record.material.opacity = record.status === 'LOCKED' ? 0.45 : 1;

        const sink = sinkables.get(record.key);
        if (!sink) continue;
        const tint = record.status === 'LOCKED' ? LOCKED_CELL_TINT : 1;
        // Tile + outline share the sink; numbers keep their own material tint.
        tintSlice(sink.parts[0], tint);
        tintSlice(sink.parts[1], tint);
      }

      // A locked cell must not keep the selection ring — it is not a target.
      if (selected) {
        const key = cellKey(selected);
        if (
          cellLabelRecords.some(
            (record) => record.key === key && record.status === 'LOCKED',
          )
        ) {
          selectCell(null);
        }
      }
    },
    setCellsDone,
    watcherRoot: (watcher) => watchers?.root(watcher) ?? null,
    watcherFocus: (watcher) => watchers?.focus(watcher) ?? null,
    playWatcher: (watcher, action) => watchers?.play(watcher, action),
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
    dispose,
  };
};

export type { SceneModel };
export { buildScene };
