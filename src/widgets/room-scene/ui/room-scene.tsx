import { useCallback, useEffect, useRef, useState } from 'react';

import { type ExpoWebGLRenderingContext, GLView } from 'expo-gl';
import { useFocusEffect } from 'expo-router';
import {
  type LayoutChangeEvent,
  PixelRatio,
  StyleSheet,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Color,
  PerspectiveCamera,
  Raycaster,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three';

import { isLessonPlayable, lessonOrdinalForKey } from '@/entities/lesson';
import {
  bondReaction,
  DEFAULT_ROBOT_ASSEMBLY,
  DEFAULT_ROBOT_DOG_ACTION,
  DEFAULT_ROBOT_DOG_SKIN,
  ROBOT_DOG_REACTION_SEC,
  type RobotAssembly,
  type RobotDogAction,
  type RobotDogMoodName,
  type RobotDogSkin,
  type RobotDogStage,
} from '@/entities/robot-dog';
import {
  CAMERA_FAR,
  CAMERA_NEAR,
  cellKey,
  damp,
  levelProgress,
  orbitPosition,
  SCENE_LIFT_SEC,
  SCENE_PALETTE,
  SCENE_PIVOT,
  type SceneCell,
} from '@/entities/scene';
import {
  DEFAULT_WATCHER_ACTION,
  WATCHER_FOCUS_ACTION,
  WATCHER_IDS,
  type WatcherId,
} from '@/entities/watcher';

import { CONTENT_PADDING, SOUNDS, SPACING } from '@/shared/constants';
import { hapticLight, playSfx } from '@/shared/lib';

import { buildScene, type SceneModel } from '../lib';
import { type CameraTune, DEFAULT_CAMERA_TUNE } from '../model/camera-tune';
import { type SceneView, useSceneCamera } from '../model/use-scene-camera';

import { CameraRigPanel } from './camera-rig-panel';
import { SceneBootOverlay } from './scene-boot-overlay';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface RoomSceneProps {
  /** The stop the camera is heading for. Controlled by the screen. */
  view: SceneView;
  /** Raised by a climb back to the map, and by a tap on a cell. */
  onViewChange: (view: SceneView) => void;
  /** How far out of the pit the game has climbed, `0 … SCENE_TERRACE_COUNT`. */
  level?: number;
  /** The coat the dog wears. Swapping it reloads the model. */
  robotSkin?: RobotDogSkin;
  /** Independent modules selected in the introduction. */
  robotAssembly?: RobotAssembly;
  /** Equipment earned by progressing through the game. */
  robotStage?: RobotDogStage;
  /** What the dog does when nothing interrupts it — its state. */
  robotAction?: RobotDogAction;
  /** Mood that picks the bond-mode clip and particle burst. */
  bondMood?: RobotDogMoodName | null;
  /** Close-up on the dog — controlled by the screen like `focusedWatcher`. */
  isBonding?: boolean;
  /** Tap on the dog entered bond, or a tap away / flick exited it. */
  onBondChange?: (isBonding: boolean) => void;
  /**
   * Host override for pausing the loop. Translucent sheets take focus but leave
   * the arena visible — leave undefined to pause only on focus loss.
   */
  isCovered?: boolean;
  /** The screen the child is talking to, or `null` for the arena. */
  focusedWatcher?: WatcherId | null;
  /** A tap landed on a screen, or on nothing while one was focused. */
  onWatcherFocus?: (watcher: WatcherId | null) => void;
  /** A cell of the room the camera is already in was held long enough. */
  onCellPress?: (cell: SceneCell) => void;
  /** Cells whose lesson has been passed, as `cellKey` strings. */
  doneCells?: readonly string[];
  /** Lesson ids finished on the arena. */
  doneLessonIds?: readonly string[];
  /** Coins / tier / charge for the three boards on the overhead map. */
  mapHud?: {
    balance: number;
    tier: number;
    tierTotal: number;
    charge: number;
  } | null;
  /** Off when the grown-up disables animations — the camera then cuts. */
  isAnimated?: boolean;
  /** Framing desk at the top: dial elevations / fit / platform, then paste the dump into `camera.ts`. */
  isCameraRig?: boolean;
  /** Fired when the boot cover should show or hide — home gates the HUD on this. */
  onReadyChange?: (isReady: boolean) => void;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/** Share of the distance to the target still left after a second of easing. */
const SMOOTHING = 0.002;

/** A dropped frame must not teleport the camera. Seconds. */
const MAX_DELTA = 0.1;

/** Tiers climb slower than the camera turns. */
/** Share of the climb still left after a second. */
const LIFT_SMOOTHING = 0.02 ** (1 / SCENE_LIFT_SEC);

/** How long a cell must be held before its lesson opens, in ms. */
const CELL_HOLD_MS = 520;

/** Finger travel, in view points, that cancels an in-progress cell hold. */
const CELL_HOLD_SLOP = 18;

/** Share of the flight to a watcher still left after a second. */
const FOCUS_SMOOTHING = 0.0006;

/** Below this the camera is treated as back on the arena, and stops blending. */
const FOCUS_EPSILON = 0.002;

/** Finger speed (points / sec) above which a bond-mode pan counts as a kick. */
const BOND_KICK_VELOCITY = 920;

/** Minimum travel before a bond pan counts as anything. */
const BOND_STROKE_MIN = 28;

/** How often the dev readout samples the camera and the frame counter, in ms. */
const READOUT_MS = 500;

/** Cap GL pixel density — Phong fill-bound; HUD stays native/sharp above this. */
const MAX_RENDER_DENSITY = 1.75;

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

/** Scale factor ≥1: shrink `GLView` layout so the drawing buffer has fewer pixels. */
const renderScaleFor = (pixelRatio: number): number =>
  Math.max(1, pixelRatio / MAX_RENDER_DENSITY);

/** Shim canvas for three — expo-gl gives a context, not a DOM node (avoids expo-three). */
const canvasFor = (gl: ExpoWebGLRenderingContext) =>
  ({
    width: gl.drawingBufferWidth,
    height: gl.drawingBufferHeight,
    clientWidth: gl.drawingBufferWidth,
    clientHeight: gl.drawingBufferHeight,
    style: {},
    addEventListener: () => {},
    removeEventListener: () => {},
    getContext: () => gl,
  }) as unknown as HTMLCanvasElement;

/**
 * Past three's WebGL 1 guard: expo-gl's WebGL 2 context still `instanceof`
 * `WebGLRenderingContext`, so hide that global for the constructor only.
 */
const createRenderer = (gl: ExpoWebGLRenderingContext): WebGLRenderer => {
  const scope = globalThis as { WebGLRenderingContext?: unknown };
  const guard = scope.WebGLRenderingContext;
  scope.WebGLRenderingContext = undefined;

  try {
    return new WebGLRenderer({
      canvas: canvasFor(gl),
      context: gl,
      antialias: true,
    });
  } finally {
    scope.WebGLRenderingContext = guard;
  }
};

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

/** The world, as one model under a fixed camera. Three bays sit 120° apart around the same axis. */
export const RoomScene = ({
  view,
  onViewChange,
  level = 0,
  robotSkin = DEFAULT_ROBOT_DOG_SKIN,
  robotAssembly = DEFAULT_ROBOT_ASSEMBLY,
  robotStage = 'basic',
  robotAction = DEFAULT_ROBOT_DOG_ACTION,
  bondMood = null,
  isBonding = false,
  onBondChange,
  isCovered,
  focusedWatcher = null,
  onWatcherFocus,
  onCellPress,
  doneCells,
  doneLessonIds = [],
  mapHud = null,
  isAnimated = true,
  isCameraRig = false,
  onReadyChange,
}: RoomSceneProps) => {
  const insets = useSafeAreaInsets();
  const [tune, setTune] = useState<CameraTune>(DEFAULT_CAMERA_TUNE);
  const tuneRef = useRef(tune);
  tuneRef.current = tune;
  const camera = useSceneCamera(view, tuneRef);
  const [liveOrbit, setLiveOrbit] = useState({
    azimuth: 0,
    elevation: DEFAULT_CAMERA_TUNE.roomElevation,
    distance: 0,
    fps: 0,
  });
  const frames = useRef(0);

  /** Mount GLView only after layout — zero-size contexts never paint. */
  const [surface, setSurface] = useState<{
    width: number;
    height: number;
  } | null>(null);
  /** False until dog + watchers settle (or fail) for the live GL context. */
  const [isSceneReady, setSceneReady] = useState(false);
  const readyGeneration = useRef(0);
  const onReadyChangeRef = useRef(onReadyChange);
  onReadyChangeRef.current = onReadyChange;

  const reportReady = useCallback((isReady: boolean) => {
    setSceneReady(isReady);
    onReadyChangeRef.current?.(isReady);
  }, []);

  const frame = useRef<number | null>(null);
  /** Bumped whenever a new GL context owns the loop — stale RAFs exit. */
  const loopId = useRef(0);
  const model = useRef<SceneModel | null>(null);
  const renderer = useRef<WebGLRenderer | null>(null);
  /** The live camera, so a tap can cast a ray through the same lens. */
  const lensRef = useRef<PerspectiveCamera | null>(null);
  const raycaster = useRef(new Raycaster());
  const pointer = useRef(new Vector2());
  /** The dog's coat and state as of this render. */
  const assemblyRef = useRef({ assembly: robotAssembly, stage: robotStage });
  useEffect(() => {
    assemblyRef.current = { assembly: robotAssembly, stage: robotStage };
    model.current?.setCharacterAssembly(robotAssembly, robotStage);
  }, [robotAssembly, robotStage]);
  const robotSkinRef = useRef(robotSkin);
  const robotActionRef = useRef(robotAction);
  const doneCellsRef = useRef<readonly string[]>([]);
  const doneLessonIdsRef = useRef<readonly string[]>([]);
  const levelRef = useRef(level);
  const mapHudRef = useRef(mapHud);
  mapHudRef.current = mapHud;
  /** Which screen the loop is flying towards, `null` for back to the arena. */
  const focusRef = useRef<WatcherId | null>(focusedWatcher);
  /** Bond close-up — mutually exclusive with a watcher focus. */
  const isBondingRef = useRef(isBonding);
  const bondMoodRef = useRef(bondMood);
  /** Last bond reaction clock, so strokes cannot spam the mixer. */
  const lastBondReactMs = useRef(0);
  /** `0` on the arena, `1` parked in front of a face / the dog; damped in between. */
  const focusBlend = useRef(0);
  /**
   * The shot the blend is travelling to — or the one it is travelling back from, which is
   * why it outlives `focusRef` / bonding going null.
   */
  const focusShot = useRef<{ anchor: Vector3; eye: Vector3 } | null>(null);
  /** The close-up on the dog is measured once, when it starts. */
  const isBondShotHeld = useRef(false);

  /** Where each tier is heading, and where it is now: `[segment][step]`. */
  /** Where the platform is heading, and where it is now: `0 … 1`. */
  const liftTarget = useRef(levelProgress(level));
  const lift = useRef(levelProgress(level));

  /** Read by the loop, which outlives every render that changes them. */
  const clearColor = useRef(SCENE_PALETTE.background);
  const isAnimatedRef = useRef(isAnimated);
  const viewRef = useRef(view);

  /** `true` while another screen is stacked over the home screen. */
  const pausedRef = useRef(false);
  /** Kicks the rAF loop after a pause — stored by `onContextCreate`. */
  const resumeLoop = useRef<(() => void) | null>(null);
  const highlight = useRef<number | null>(null);
  const appliedHighlight = useRef<number | null | undefined>(undefined);

  useEffect(() => {
    if (!isCameraRig) return;
    const id = setInterval(() => {
      const state = camera.current.current;
      const drawn = frames.current;
      frames.current = 0;

      setLiveOrbit({
        fps: drawn * (1000 / READOUT_MS),
        azimuth: state.azimuth,
        elevation: state.elevation,
        distance: state.distance,
      });
    }, READOUT_MS);
    return () => clearInterval(id);
  }, [camera, isCameraRig]);

  useEffect(() => {
    clearColor.current = SCENE_PALETTE.background;
    isAnimatedRef.current = isAnimated;
    viewRef.current = view;
    highlight.current = view === 'top' ? null : view;
  }, [isAnimated, view]);

  /** Coming back from a lesson (or any pushed screen) the GL context may have been rebuilt while. */
  useFocusEffect(
    useCallback(() => {
      const segment = viewRef.current === 'top' ? null : viewRef.current;
      highlight.current = segment;
      const built = model.current;
      if (!built) {
        appliedHighlight.current = undefined;
        return;
      }
      built.highlight(segment, true);
      appliedHighlight.current = segment;
      built.setWatchersVisible(
        viewRef.current === 'top' || focusRef.current !== null,
      );
    }, []),
  );

  // Pause the render loop when a screen is pushed over the home screen, resume it when focus returns.
  const isCoveredRef = useRef(isCovered);
  isCoveredRef.current = isCovered;

  const pauseLoop = useCallback(() => {
    pausedRef.current = true;
    if (frame.current !== null) {
      cancelAnimationFrame(frame.current);
      frame.current = null;
    }
  }, []);

  const resume = useCallback(() => {
    pausedRef.current = false;
    // Restart the loop if it was stopped while we were away.
    if (frame.current === null && resumeLoop.current) {
      resumeLoop.current();
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (isCoveredRef.current !== undefined) return;
      resume();
      return () => {
        if (isCoveredRef.current === undefined) pauseLoop();
      };
    }, [pauseLoop, resume]),
  );

  // The host says when the arena is really hidden: an opaque route pushed over it, but not a
  // translucent sheet that only took focus.
  useEffect(() => {
    if (isCovered === undefined) return;
    if (isCovered) pauseLoop();
    else resume();
  }, [isCovered, pauseLoop, resume]);

  useEffect(() => {
    const next = levelProgress(level);
    const isClimbing = next > liftTarget.current;
    liftTarget.current = next;

    if (!isAnimatedRef.current) {
      lift.current = next;
      model.current?.setLevelProgress(next);
      return;
    }

    // Dust on the way up only.
    if (isClimbing) model.current?.burstLift(level);
  }, [level]);

  useEffect(() => {
    if (isAnimated) camera.applyView(view);
    else camera.jumpToView(view);
    // The map reads the numbers on the tile tops; a bay, on the cell fronts.
    model.current?.setNumberFace(view === 'top' ? 'top' : 'front');
    // Bond freezes the orbit the same way a watcher does — no pan while close.
    model.current?.setWatchersVisible(
      view === 'top' || focusedWatcher !== null,
    );
  }, [camera, isAnimated, view, focusedWatcher]);

  useEffect(() => {
    focusRef.current = focusedWatcher;
    isBondingRef.current = isBonding;
    bondMoodRef.current = bondMood ?? null;
    model.current?.setWatcherLifted(focusedWatcher);
    if (!focusedWatcher) return;

    model.current?.playWatcher(focusedWatcher, WATCHER_FOCUS_ACTION);
    return () => {
      model.current?.playWatcher(focusedWatcher, DEFAULT_WATCHER_ACTION);
      model.current?.setWatcherLifted(null);
    };
  }, [focusedWatcher, isBonding, bondMood]);

  /** Lights up what the child has already learnt, and what is open. */
  useEffect(() => {
    if (!doneCells) return;
    doneCellsRef.current = doneCells;
    doneLessonIdsRef.current = doneLessonIds;
    levelRef.current = level;

    if (!model.current) return;
    model.current.setCellsDone(doneCells);
    model.current.setCellAccess(doneLessonIds, level);
  }, [doneCells, doneLessonIds, level]);

  useEffect(() => {
    const built = model.current;
    if (!built) return;
    const isMap = mapHud !== null && view === 'top' && focusedWatcher === null;
    built.setMapHudVisible(isMap);
    if (mapHud) built.setMapHudStats(mapHud);
  }, [view, focusedWatcher, mapHud]);

  // Rig knobs rewrite fit / elevation / platform without rebuilding GL.
  useEffect(() => {
    camera.reframe();
    model.current?.setPlatformY(tune.platformY);
  }, [camera, tune]);

  useEffect(() => {
    return () => {
      loopId.current += 1;
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      frame.current = null;
      // Drop the graph only — never `renderer.dispose()` on expo-gl (kills the native surface).
      model.current?.dispose();
      model.current = null;
      renderer.current = null;
    };
  }, []);

  // The dog's coat and state arrive as props but reach a scene that was built once, so they
  // travel through the model rather than a rebuild.
  useEffect(() => {
    robotSkinRef.current = robotSkin;
    model.current?.setCharacterSkin(robotSkin);
  }, [robotSkin]);

  useEffect(() => {
    robotActionRef.current = robotAction;
    model.current?.playCharacterAction(robotAction);
  }, [robotAction]);

  const onContextCreate = useCallback(
    (gl: ExpoWebGLRenderingContext) => {
      loopId.current += 1;
      const id = loopId.current;
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      frame.current = null;
      model.current?.dispose();
      model.current = null;
      renderer.current = null;

      readyGeneration.current += 1;
      const readyId = readyGeneration.current;
      reportReady(false);

      const webgl = createRenderer(gl);
      // expo-gl already hands us a buffer in device pixels.
      webgl.setPixelRatio(1);
      webgl.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight, false);

      const built = buildScene(robotSkinRef.current, robotActionRef.current);
      built.setCharacterAssembly(
        assemblyRef.current.assembly,
        assemblyRef.current.stage,
      );
      built.setPlatformY(tuneRef.current.platformY);
      built.setCellsDone(doneCellsRef.current);
      built.setCellAccess(doneLessonIdsRef.current, levelRef.current);
      const lens = new PerspectiveCamera(
        tuneRef.current.fov,
        gl.drawingBufferWidth / gl.drawingBufferHeight,
        CAMERA_NEAR,
        CAMERA_FAR,
      );

      lensRef.current = lens;

      // Seed the platform where the game already is, so a rebuilt context does not replay the
      // whole climb from the bottom of the pit.
      built.setLevelProgress(lift.current);
      built.setWatchersVisible(
        viewRef.current === 'top' || focusRef.current !== null,
      );
      // A rebuilt context starts with every bay solid — snap the highlight to the live view so
      // returning from a lesson does not flash all three.
      const segment =
        viewRef.current === 'top' || typeof viewRef.current !== 'number'
          ? null
          : viewRef.current;
      built.highlight(segment, true);
      appliedHighlight.current = segment;
      const isMap =
        mapHudRef.current !== null &&
        viewRef.current === 'top' &&
        focusRef.current === null;
      built.setMapHudVisible(isMap);
      if (mapHudRef.current) built.setMapHudStats(mapHudRef.current);

      renderer.current = webgl;
      model.current = built;
      camera.setAspect(lens.aspect);
      // Re-seat the orbit against the (possibly hot-reloaded) elevations.
      camera.jumpToView(viewRef.current);
      built.setNumberFace(viewRef.current === 'top' ? 'top' : 'front');

      void built.whenReady.then(() => {
        if (readyGeneration.current !== readyId) return;
        reportReady(true);
      });

      // Reused every frame: a fresh Color sixty times a second is litter.
      const clear = new Color(clearColor.current);
      /** Same reason: where the orbit would put the lens, before any focus. */
      const orbitEye = new Vector3();
      const orbitAim = new Vector3();

      let width = gl.drawingBufferWidth;
      let height = gl.drawingBufferHeight;
      let last = Date.now();

      const loop = () => {
        if (loopId.current !== id) return;

        // A pushed screen stole focus — stop scheduling frames until it returns.
        if (pausedRef.current) {
          frame.current = null;
          return;
        }

        frame.current = requestAnimationFrame(loop);

        // The native surface resizes on rotation without telling us.
        if (
          gl.drawingBufferWidth !== width ||
          gl.drawingBufferHeight !== height
        ) {
          width = gl.drawingBufferWidth;
          height = gl.drawingBufferHeight;
          webgl.setSize(width, height, false);
          lens.aspect = width / height;
          lens.updateProjectionMatrix();
          camera.setAspect(lens.aspect);
        }

        if (appliedHighlight.current !== highlight.current) {
          appliedHighlight.current = highlight.current;
          built.highlight(highlight.current, !isAnimatedRef.current);
        }

        const fov = tuneRef.current.fov;
        if (lens.fov !== fov) {
          lens.fov = fov;
          lens.updateProjectionMatrix();
        }

        const now = Date.now();
        const delta = Math.min((now - last) / 1000, MAX_DELTA);
        last = now;

        const target = camera.target.current;
        const state = camera.current.current;

        if (isAnimatedRef.current) {
          state.azimuth = damp(state.azimuth, target.azimuth, SMOOTHING, delta);
          state.elevation = damp(
            state.elevation,
            target.elevation,
            SMOOTHING,
            delta,
          );
          state.distance = damp(
            state.distance,
            target.distance,
            SMOOTHING,
            delta,
          );
        } else {
          state.azimuth = target.azimuth;
          state.elevation = target.elevation;
          state.distance = target.distance;
        }

        lift.current = isAnimatedRef.current
          ? damp(lift.current, liftTarget.current, LIFT_SMOOTHING, delta)
          : liftTarget.current;
        built.setLevelProgress(lift.current);

        const { x, y, z } = orbitPosition(
          state.azimuth,
          state.elevation,
          state.distance,
        );

        // The camera rides with the floor: the robot climbs two hundred units over five levels,
        // and a camera left at the bottom would lose it.
        const eyeY = built.platformHeight();

        orbitEye.set(x, y + eyeY, z);
        orbitAim.set(SCENE_PIVOT[0], eyeY, SCENE_PIVOT[2]);

        // The robot turns with the camera rather than with the world: from whichever segment the
        // child is standing in, it is looking at them.
        built.setCharacterFacing((state.azimuth * Math.PI) / 180);

        const wantedWatcher = focusRef.current;
        const wantedBond = isBondingRef.current;
        if (wantedWatcher) {
          focusShot.current = built.watcherFocus(wantedWatcher);
          isBondShotHeld.current = false;
        } else if (wantedBond) {
          if (!isBondShotHeld.current || !focusShot.current) {
            focusShot.current = built.characterFocus(state.azimuth);
            isBondShotHeld.current = focusShot.current !== null;
          }
        } else {
          isBondShotHeld.current = false;
        }

        const blendTo = wantedWatcher || wantedBond ? 1 : 0;
        focusBlend.current = isAnimatedRef.current
          ? damp(focusBlend.current, blendTo, FOCUS_SMOOTHING, delta)
          : blendTo;

        const shot = focusShot.current;
        if (shot && focusBlend.current > FOCUS_EPSILON) {
          const blend = focusBlend.current;
          lens.position.lerpVectors(orbitEye, shot.eye, blend);
          orbitAim.lerp(shot.anchor, blend);
        } else {
          lens.position.copy(orbitEye);
          // Nothing left to travel back from; drop the shot so a watcher that reloads is looked up fresh.
          if (!wantedWatcher && !wantedBond) focusShot.current = null;
        }
        lens.lookAt(orbitAim);

        frames.current += 1;
        built.tick(now / 1000, delta);
        webgl.setClearColor(clear.set(clearColor.current), 1);
        webgl.render(built.scene, lens);
        gl.endFrameEXP();
      };

      // Let the focus effect restart the loop after a pause.
      resumeLoop.current = () => {
        last = Date.now();
        loop();
      };

      loop();
    },
    [camera, reportReady],
  );

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width <= 0 || height <= 0) return;

    setSurface((current) =>
      current?.width === width && current.height === height
        ? current
        : { width, height },
    );
  };

  /** A tap is answered by whatever it actually landed on. */
  const hitCellAt = (x: number, y: number): SceneCell | null => {
    const built = model.current;
    const size = surface;
    const lens = lensRef.current;
    if (!built || !size || !lens) return null;

    pointer.current.set((x / size.width) * 2 - 1, -(y / size.height) * 2 + 1);
    raycaster.current.setFromCamera(pointer.current, lens);

    const hit = raycaster.current.intersectObjects(
      built.cellTargets(),
      false,
    )[0];
    if (hit?.faceIndex === undefined || hit.faceIndex === null) return null;
    return built.cellAt(hit.object, hit.faceIndex);
  };

  const isHoldableCell = (cell: SceneCell | null): cell is SceneCell => {
    if (!cell) return false;
    if (view === 'top' || view !== cell.segment) return false;
    const ordinal = lessonOrdinalForKey(cellKey(cell));
    if (ordinal === null) return false;
    return isLessonPlayable(
      ordinal,
      doneLessonIdsRef.current,
      levelRef.current,
    );
  };

  const holdRef = useRef<{
    cell: SceneCell;
    startMs: number;
    frame: number | null;
    isDone: boolean;
  } | null>(null);

  const clearCellHold = () => {
    const hold = holdRef.current;
    if (hold?.frame !== null && hold?.frame !== undefined) {
      cancelAnimationFrame(hold.frame);
    }
    holdRef.current = null;
    model.current?.endCellHold();
  };

  const tickCellHold = () => {
    const hold = holdRef.current;
    const built = model.current;
    if (!hold || !built) return;

    const progress = Math.min(1, (Date.now() - hold.startMs) / CELL_HOLD_MS);
    built.setCellHoldProgress(progress);
    if (progress >= 1) return;
    hold.frame = requestAnimationFrame(tickCellHold);
  };

  useEffect(
    () => () => {
      const hold = holdRef.current;
      if (hold?.frame !== null && hold?.frame !== undefined) {
        cancelAnimationFrame(hold.frame);
      }
      holdRef.current = null;
      model.current?.endCellHold();
    },
    [],
  );

  const fireBondReaction = (kind: 'stroke' | 'kick') => {
    const built = model.current;
    if (!built) return;
    const now = Date.now();
    if (now - lastBondReactMs.current < ROBOT_DOG_REACTION_SEC * 1000) return;
    lastBondReactMs.current = now;
    const mood = bondMoodRef.current;
    const reaction = bondReaction(mood, kind);
    built.reactBond(kind, mood, robotActionRef.current);
    hapticLight();
    if (kind === 'kick') {
      playSfx(
        reaction.action === 'joy'
          ? SOUNDS.DOG_KICK_PLAY
          : SOUNDS.DOG_KICK_FLINCH,
      );
    } else {
      playSfx(
        reaction.burst === 'steam' || reaction.action === 'sad'
          ? SOUNDS.DOG_STROKE_SOFT
          : SOUNDS.DOG_STROKE_JOY,
      );
    }
  };

  const tap = Gesture.Tap()
    .runOnJS(true)
    .maxDistance(12)
    .onEnd((event) => {
      const built = model.current;
      const size = surface;
      const lens = lensRef.current;
      if (!built || !size || !lens) return;

      pointer.current.set(
        (event.x / size.width) * 2 - 1,
        -(event.y / size.height) * 2 + 1,
      );
      raycaster.current.setFromCamera(pointer.current, lens);

      // Bond mode first: a tap on the dog is a soft stroke; anywhere else walks the camera back to the bay.
      if (isBonding) {
        const root = built.characterRoot();
        if (root && raycaster.current.intersectObject(root, true).length > 0) {
          fireBondReaction('stroke');
          return;
        }
        onBondChange?.(false);
        return;
      }

      // The screens are asked first: they hang in front of the sky where nothing else is, so a
      // ray that finds one found nothing else.
      for (const watcher of WATCHER_IDS) {
        const screen = built.watcherRoot(watcher);
        if (!screen) continue;
        if (raycaster.current.intersectObject(screen, true).length === 0) {
          continue;
        }

        onWatcherFocus?.(focusedWatcher === watcher ? null : watcher);
        return;
      }

      // Standing in front of one, a tap anywhere else is the way back — the child should not
      // have to find the button.
      if (focusedWatcher) {
        onWatcherFocus?.(null);
        return;
      }

      const root = built.characterRoot();
      if (
        root &&
        view !== 'top' &&
        raycaster.current.intersectObject(root, true).length > 0
      ) {
        // Enter bond from a bay only — on the map the dog is too small and the same tap should
        // walk into a cell's segment.
        onBondChange?.(true);
        return;
      }

      // The floor last, and only the tile buffers: a ray through the arena also finds the sky
      // sphere and the ramps, and neither is a cell.
      const cell = hitCellAt(event.x, event.y);
      if (!cell) return;

      if (view === 'top') {
        built.selectCell(null);
        playSfx(SOUNDS.NAV_WHOOSH);
        onViewChange(cell.segment);
        return;
      }

      if (view !== cell.segment) {
        built.selectCell(null);
        playSfx(SOUNDS.NAV_WHOOSH);
        onViewChange('top');
      }
      // Same-segment cell: lesson entry is the hold gesture, not a tap.
    });

  // Azimuth locked in a bay — drag climbs to the map (or stroke/kick in bond).
  // `activeOffsetY` leaves still presses for the cell-hold gesture.
  const pan = Gesture.Pan()
    .runOnJS(true)
    .enabled(focusedWatcher === null && (isBonding || view !== 'top'))
    .activeOffsetY([-14, 14])
    .onBegin(() => {
      if (!isBonding) camera.beginDrag();
    })
    .onUpdate((event) => {
      clearCellHold();
      if (isBonding) return;
      camera.dragBy(0, event.translationY);
    })
    .onEnd((event) => {
      if (isBonding) {
        const travel = Math.hypot(event.translationX, event.translationY);
        if (travel < BOND_STROKE_MIN) return;
        const velocity = Math.hypot(event.velocityX, event.velocityY);
        fireBondReaction(velocity >= BOND_KICK_VELOCITY ? 'kick' : 'stroke');
        return;
      }
      playSfx(SOUNDS.NAV_WHOOSH);
      onViewChange(camera.endDrag());
    })
    .onFinalize((_event, success) => {
      if (isBonding) return;
      if (!success) onViewChange(camera.endDrag());
    });

  const cellHold = Gesture.LongPress()
    .runOnJS(true)
    .enabled(!isBonding && focusedWatcher === null)
    .minDuration(CELL_HOLD_MS)
    .maxDistance(CELL_HOLD_SLOP)
    .onBegin((event) => {
      const cell = hitCellAt(event.x, event.y);
      if (!isHoldableCell(cell)) return;

      clearCellHold();
      holdRef.current = {
        cell,
        startMs: Date.now(),
        frame: null,
        isDone: false,
      };
      model.current?.beginCellHold(cell);
      holdRef.current.frame = requestAnimationFrame(tickCellHold);
      playSfx(SOUNDS.CELL_HOLD);
    })
    .onStart(() => {
      const hold = holdRef.current;
      if (!hold) return;
      hold.isDone = true;
      const cell = hold.cell;
      clearCellHold();
      hapticLight();
      playSfx(SOUNDS.CELL_OPEN);
      onCellPress?.(cell);
    })
    .onFinalize(() => {
      if (holdRef.current && !holdRef.current.isDone) clearCellHold();
    });

  // Taps are measured against the outer view, which never scales: only the aspect of the
  // surface has to match it, and scaling keeps that.
  const renderScale = renderScaleFor(PixelRatio.get());
  const surfaceStyle = surface && {
    height: surface.height / renderScale,
    left: (surface.width - surface.width / renderScale) / 2,
    top: (surface.height - surface.height / renderScale) / 2,
    transform: [{ scale: renderScale }],
    width: surface.width / renderScale,
  };

  return (
    <View style={styles.root} onLayout={onLayout}>
      <GestureDetector gesture={Gesture.Exclusive(pan, cellHold, tap)}>
        <View style={styles.canvas}>
          {surface && (
            <GLView
              key={`${surface.width}x${surface.height}@${renderScale}`}
              style={[styles.surface, surfaceStyle]}
              onContextCreate={onContextCreate}
            />
          )}
        </View>
      </GestureDetector>

      <SceneBootOverlay isReady={isSceneReady} />

      {isCameraRig ? (
        <View
          pointerEvents="box-none"
          style={[styles.rig, { paddingTop: insets.top + SPACING.TWO }]}
        >
          <CameraRigPanel tune={tune} onTuneChange={setTune} live={liveOrbit} />
        </View>
      ) : null}
    </View>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  canvas: {
    flex: 1,
    overflow: 'hidden',
  },
  rig: {
    left: 0,
    paddingHorizontal: CONTENT_PADDING,
    pointerEvents: 'box-none',
    position: 'absolute',
    right: 80,
    top: 0,
  },
  root: {
    flex: 1,
  },
  surface: {
    position: 'absolute',
  },
});

export type { RoomSceneProps };
