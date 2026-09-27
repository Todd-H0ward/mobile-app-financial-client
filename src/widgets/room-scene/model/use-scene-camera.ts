import { type MutableRefObject, useCallback, useMemo, useRef } from 'react';

import {
  alignAngle,
  fitDistance,
  MIN_ELEVATION,
  nearestSegment,
  SCENE_GEAR_ANGLES,
  SCENE_RADIUS,
  SCENE_SEGMENT_DISTANCE,
} from '@/entities/scene';

import { clamp } from '@/shared/utils';

import { type CameraTune, DEFAULT_CAMERA_TUNE } from './camera-tune';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

/** Straight over the model, or standing over one of its segments. */
type SceneView = 'top' | number;

interface OrbitState {
  /** Heading around Y, in degrees. Unwrapped: a drag may pass 360 freely. */
  azimuth: number;
  /** Degrees above the floor, `MIN_ELEVATION … topElevation`. */
  elevation: number;
  /** Distance from the axis, in world units. */
  distance: number;
}

interface SceneFit {
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

/** Degrees of turn per point dragged. */
const DEGREES_PER_POINT = 0.42;

/** Vertical drag is slower: the whole arc from floor to top fits one screen. */
const TILT_PER_POINT = 0.22;

/** Until the surface reports its shape, assume a phone held upright. */
const DEFAULT_ASPECT = 9 / 16;

/**
 * Camera stands opposite the bay middle: 60° past the gear + 180° across.
 * Measured from `SCENE_GEAR_ANGLES`, never `SCENE_VIEW_ANGLES` (those already
 * include a half turn).
 */
const SEGMENT_CAMERA_OFFSET = 240;

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

const fitFor = (aspect: number, tune: CameraTune): SceneFit => ({
  // Cap here — `distanceAt` interpolates off `fit.room` on every drag/resize.
  room: Math.min(
    fitDistance(SCENE_RADIUS, tune.fov, aspect, tune.roomFit),
    SCENE_SEGMENT_DISTANCE,
  ),
  top: fitDistance(SCENE_RADIUS, tune.fov, aspect, tune.topFit),
});

/**
 * Where the camera stands to look at a segment: opposite the middle of its bay, with the
 * bay's six cells facing it across the pit.
 */
const viewAngleOf = (segment: number): number =>
  (SCENE_GEAR_ANGLES[segment] ?? 0) + SEGMENT_CAMERA_OFFSET;

const climbOf = (elevation: number, tune: CameraTune): number =>
  clamp(
    (elevation - tune.roomElevation) / (tune.topElevation - tune.roomElevation),
    0,
    1,
  );

const topThreshold = (tune: CameraTune): number =>
  (tune.roomElevation + tune.topElevation) / 2;

const viewAt = (
  state: OrbitState,
  tune: CameraTune = DEFAULT_CAMERA_TUNE,
): SceneView => {
  if (state.elevation >= topThreshold(tune)) return 'top';

  // Read back against the gears the camera was placed relative to.
  return nearestSegment(
    state.azimuth - SEGMENT_CAMERA_OFFSET,
    SCENE_GEAR_ANGLES,
  );
};

const stateFor = (
  view: SceneView,
  azimuth: number,
  fit: SceneFit,
  tune: CameraTune,
): OrbitState => {
  if (view === 'top') {
    // A fixed heading: the map view is a composed shot, and coming to it from three different
    // rooms would otherwise give three different pictures.
    return {
      azimuth: alignAngle(azimuth, tune.topAzimuth),
      elevation: tune.topElevation,
      distance: fit.top,
    };
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

/** Camera in refs — drag at 60fps must not re-render React / rebuild the graph. */
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
      viewAngleOf(0),
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

  // Stable: the loop closes over this once; re-applying on every render would snap a drag.
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
