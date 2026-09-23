import { type MutableRefObject, useCallback, useMemo, useRef } from 'react';

import { ROOM_IDS, type RoomId, roomIndex } from '@/entities/room';
import {
  alignAngle,
  fitDistance,
  MIN_ELEVATION,
  nearestSegment,
  SCENE_RADIUS,
  SCENE_VIEW_ANGLES,
} from '@/entities/scene';

import { clamp } from '@/shared/utils';

import { type CameraTune, DEFAULT_CAMERA_TUNE } from './camera-tune';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

/** Straight over the model, or standing in front of one room. */
type SceneView = 'top' | RoomId;

interface OrbitState {
  /** Heading around Y, in degrees. Unwrapped: a drag may pass 360 freely. */
  azimuth: number;
  /** Degrees above the floor, `MIN_ELEVATION … topElevation`. */
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
  /** Re-applies the current view after the rig knobs move. */
  reframe: () => void;
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

/** Until the surface reports its shape, assume a phone held upright. */
const DEFAULT_ASPECT = 9 / 16;

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

const fitFor = (aspect: number, tune: CameraTune): SceneFit => ({
  room: fitDistance(SCENE_RADIUS, tune.fov, aspect, tune.roomFit),
  top: fitDistance(SCENE_RADIUS, tune.fov, aspect, tune.topFit),
});

const viewAngleOf = (room: RoomId): number =>
  SCENE_VIEW_ANGLES[roomIndex(room)];

const climbOf = (elevation: number, tune: CameraTune): number =>
  clamp(
    (elevation - tune.roomElevation) / (tune.topElevation - tune.roomElevation),
    0,
    1,
  );

const topThreshold = (tune: CameraTune): number =>
  (tune.roomElevation + tune.topElevation) / 2;

/**
 * The view for a settled camera.
 *
 * Elevation decides first — a camera pulled overhead is looking at the whole
 * model, whichever wedge happens to be under it.
 */
const viewAt = (
  state: OrbitState,
  tune: CameraTune = DEFAULT_CAMERA_TUNE,
): SceneView => {
  if (state.elevation >= topThreshold(tune)) return 'top';

  const segment = nearestSegment(state.azimuth, SCENE_VIEW_ANGLES);
  return ROOM_IDS[segment] ?? ROOM_IDS[0];
};

const stateFor = (
  view: SceneView,
  azimuth: number,
  fit: SceneFit,
  tune: CameraTune,
): OrbitState => {
  if (view === 'top') {
    // The top view keeps the heading it arrived with, so leaving and coming
    // back does not spin the model under the child.
    return { azimuth, elevation: tune.topElevation, distance: fit.top };
  }

  return {
    azimuth: alignAngle(azimuth, viewAngleOf(view)),
    elevation: tune.roomElevation,
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
 *
 * `tuneRef` lets the framing desk rewrite elevations / fit without remounting
 * the GL context — call `reframe()` after changing it.
 */
const useSceneCamera = (
  initialView: SceneView,
  tuneRef?: MutableRefObject<CameraTune>,
): SceneCamera => {
  const aspectRef = useRef(DEFAULT_ASPECT);
  const fit = useRef<SceneFit>(
    fitFor(DEFAULT_ASPECT, tuneRef?.current ?? DEFAULT_CAMERA_TUNE),
  );
  const viewRef = useRef<SceneView>(initialView);
  const initial = useRef(
    stateFor(
      initialView,
      viewAngleOf(ROOM_IDS[0]),
      fit.current,
      tuneRef?.current ?? DEFAULT_CAMERA_TUNE,
    ),
  ).current;

  const current = useRef<OrbitState>({ ...initial });
  const target = useRef<OrbitState>({ ...initial });
  /** Where the camera stood when the finger went down. */
  const grab = useRef<OrbitState>({ ...initial });

  /** Distance for a given height above the floor, on this screen. */
  const distanceAt = useCallback(
    (elevation: number) => {
      const tune = tuneRef?.current ?? DEFAULT_CAMERA_TUNE;
      return (
        fit.current.room +
        (fit.current.top - fit.current.room) * climbOf(elevation, tune)
      );
    },
    [tuneRef],
  );

  const setAspect = useCallback(
    (aspect: number) => {
      aspectRef.current = aspect;
      fit.current = fitFor(aspect, tuneRef?.current ?? DEFAULT_CAMERA_TUNE);
      target.current.distance = distanceAt(target.current.elevation);
      current.current.distance = distanceAt(current.current.elevation);
    },
    [distanceAt, tuneRef],
  );

  const applyView = useCallback(
    (view: SceneView) => {
      viewRef.current = view;
      target.current = stateFor(
        view,
        target.current.azimuth,
        fit.current,
        tuneRef?.current ?? DEFAULT_CAMERA_TUNE,
      );
    },
    [tuneRef],
  );

  const jumpToView = useCallback(
    (view: SceneView) => {
      viewRef.current = view;
      target.current = stateFor(
        view,
        target.current.azimuth,
        fit.current,
        tuneRef?.current ?? DEFAULT_CAMERA_TUNE,
      );
      current.current = { ...target.current };
    },
    [tuneRef],
  );

  const reframe = useCallback(() => {
    fit.current = fitFor(
      aspectRef.current,
      tuneRef?.current ?? DEFAULT_CAMERA_TUNE,
    );
    jumpToView(viewRef.current);
  }, [jumpToView, tuneRef]);

  const beginDrag = useCallback(() => {
    grab.current = { ...current.current };
  }, []);

  const dragBy = useCallback(
    (dx: number, dy: number) => {
      const tune = tuneRef?.current ?? DEFAULT_CAMERA_TUNE;
      const elevation = clamp(
        grab.current.elevation + dy * TILT_PER_POINT,
        MIN_ELEVATION,
        tune.topElevation,
      );

      target.current = {
        // Dragging left turns the model left: the camera goes the other way.
        azimuth: grab.current.azimuth - dx * DEGREES_PER_POINT,
        elevation,
        distance: distanceAt(elevation),
      };
    },
    [distanceAt, tuneRef],
  );

  const endDrag = useCallback(() => {
    const view = viewAt(
      target.current,
      tuneRef?.current ?? DEFAULT_CAMERA_TUNE,
    );
    applyView(view);
    return view;
  }, [applyView, tuneRef]);

  // Stable: the render loop closes over this object once, and an effect that
  // re-applied the view on every parent render would snap a drag in progress.
  return useMemo(
    () => ({
      current,
      target,
      setAspect,
      applyView,
      jumpToView,
      reframe,
      beginDrag,
      dragBy,
      endDrag,
    }),
    [applyView, beginDrag, dragBy, endDrag, jumpToView, reframe, setAspect],
  );
};

export type { OrbitState, SceneCamera, SceneFit, SceneView };
export { useSceneCamera, viewAt };
