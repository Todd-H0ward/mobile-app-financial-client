import { useCallback, useMemo, useRef } from 'react';

import { ROOM_IDS, type RoomId, roomIndex } from '@/entities/room';
import {
  alignAngle,
  CAMERA_FOV,
  fitDistance,
  MIN_ELEVATION,
  nearestSegment,
  ROOM_ELEVATION,
  ROOM_FIT,
  SCENE_RADIUS,
  SCENE_VIEW_ANGLES,
  TOP_ELEVATION,
  TOP_FIT,
} from '@/entities/scene';

import { clamp } from '@/shared/utils';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

/** Straight over the model, or standing in front of one room. */
type SceneView = 'top' | RoomId;

interface OrbitState {
  /** Heading around Y, in degrees. Unwrapped: a drag may pass 360 freely. */
  azimuth: number;
  /** Degrees above the floor, `MIN_ELEVATION … TOP_ELEVATION`. */
  elevation: number;
  /** Distance from the axis, in world units. */
  distance: number;
}

interface SceneFit {
  /** Distance that frames one room on this screen. */
  room: number;
  /** Distance that frames the whole model on this screen. */
  top: number;
}

interface SceneCamera {
  /** Where the camera is this frame. The render loop eases it towards `target`. */
  current: { current: OrbitState };
  /** Where it is heading. Buttons and drags write here, nothing else. */
  target: { current: OrbitState };
  /** Re-frames both for a new viewport shape; call it when the surface resizes. */
  setAspect: (aspect: number) => void;
  /** Parks the camera on a view; the loop does the travelling. */
  applyView: (view: SceneView) => void;
  /** Snaps both to a view at once — used when animations are off. */
  jumpToView: (view: SceneView) => void;
  beginDrag: () => void;
  dragBy: (dx: number, dy: number) => void;
  /** Settles on the nearest view and reports it back. */
  endDrag: () => SceneView;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/**
 * Degrees of turn per point dragged.
 *
 * A room is 120° away, so walking to the next one costs about a third of a
 * phone screen — short enough to feel like a flick, long enough that a tap
 * that slips does not move the world.
 */
const DEGREES_PER_POINT = 0.42;

/** Vertical drag is slower: the whole arc from floor to top fits one screen. */
const TILT_PER_POINT = 0.22;

/** Above this the drag lets go into the top view instead of a room. */
const TOP_THRESHOLD = (ROOM_ELEVATION + TOP_ELEVATION) / 2;

/** Until the surface reports its shape, assume a phone held upright. */
const DEFAULT_ASPECT = 9 / 16;

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

const fitFor = (aspect: number): SceneFit => ({
  room: fitDistance(SCENE_RADIUS, CAMERA_FOV, aspect, ROOM_FIT),
  top: fitDistance(SCENE_RADIUS, CAMERA_FOV, aspect, TOP_FIT),
});

const viewAngleOf = (room: RoomId): number =>
  SCENE_VIEW_ANGLES[roomIndex(room)];

/**
 * How far along the climb from a room to the top view an elevation sits.
 *
 * The camera pulls back as it rises: at a room's own height the arena fills
 * the screen, overhead the whole circle has to.
 */
const climbOf = (elevation: number): number =>
  clamp((elevation - ROOM_ELEVATION) / (TOP_ELEVATION - ROOM_ELEVATION), 0, 1);

/**
 * The view for a settled camera.
 *
 * Elevation decides first — a camera pulled overhead is looking at the whole
 * model, whichever wedge happens to be under it.
 */
const viewAt = (state: OrbitState): SceneView => {
  if (state.elevation >= TOP_THRESHOLD) return 'top';

  const segment = nearestSegment(state.azimuth, SCENE_VIEW_ANGLES);
  return ROOM_IDS[segment] ?? ROOM_IDS[0];
};

const stateFor = (
  view: SceneView,
  azimuth: number,
  fit: SceneFit,
): OrbitState => {
  if (view === 'top') {
    // The top view keeps the heading it arrived with, so leaving and coming
    // back does not spin the model under the child.
    return { azimuth, elevation: TOP_ELEVATION, distance: fit.top };
  }

  return {
    azimuth: alignAngle(azimuth, viewAngleOf(view)),
    elevation: ROOM_ELEVATION,
    distance: fit.room,
  };
};

// ═══════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════

/**
 * The camera's whole state, in refs.
 *
 * A drag moves the camera sixty times a second; through `useState` that is
 * sixty React renders and a rebuilt scene graph behind them. The GL loop reads
 * these refs directly and React only hears about a change when the camera
 * settles on a new room.
 */
const useSceneCamera = (initialView: SceneView): SceneCamera => {
  const fit = useRef<SceneFit>(fitFor(DEFAULT_ASPECT));
  const initial = useRef(
    stateFor(initialView, viewAngleOf(ROOM_IDS[0]), fit.current),
  ).current;

  const current = useRef<OrbitState>({ ...initial });
  const target = useRef<OrbitState>({ ...initial });
  /** Where the camera stood when the finger went down. */
  const grab = useRef<OrbitState>({ ...initial });

  /** Distance for a given height above the floor, on this screen. */
  const distanceAt = useCallback(
    (elevation: number) =>
      fit.current.room +
      (fit.current.top - fit.current.room) * climbOf(elevation),
    [],
  );

  const setAspect = useCallback(
    (aspect: number) => {
      fit.current = fitFor(aspect);
      target.current.distance = distanceAt(target.current.elevation);
      current.current.distance = distanceAt(current.current.elevation);
    },
    [distanceAt],
  );

  const applyView = useCallback((view: SceneView) => {
    target.current = stateFor(view, target.current.azimuth, fit.current);
  }, []);

  const jumpToView = useCallback((view: SceneView) => {
    target.current = stateFor(view, target.current.azimuth, fit.current);
    current.current = { ...target.current };
  }, []);

  const beginDrag = useCallback(() => {
    grab.current = { ...current.current };
  }, []);

  const dragBy = useCallback(
    (dx: number, dy: number) => {
      const elevation = clamp(
        grab.current.elevation + dy * TILT_PER_POINT,
        MIN_ELEVATION,
        TOP_ELEVATION,
      );

      target.current = {
        // Dragging left turns the model left: the camera goes the other way.
        azimuth: grab.current.azimuth - dx * DEGREES_PER_POINT,
        elevation,
        distance: distanceAt(elevation),
      };
    },
    [distanceAt],
  );

  const endDrag = useCallback(() => {
    const view = viewAt(target.current);
    applyView(view);
    return view;
  }, [applyView]);

  // Stable: the render loop closes over this object once, and an effect that
  // re-applied the view on every parent render would snap a drag in progress.
  return useMemo(
    () => ({
      current,
      target,
      setAspect,
      applyView,
      jumpToView,
      beginDrag,
      dragBy,
      endDrag,
    }),
    [applyView, beginDrag, dragBy, endDrag, jumpToView, setAspect],
  );
};

export type { OrbitState, SceneCamera, SceneFit, SceneView };
export { useSceneCamera, viewAt };
