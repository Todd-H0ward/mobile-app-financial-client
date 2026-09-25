import { useCallback, useEffect, useRef, useState } from 'react';

import { type ExpoWebGLRenderingContext, GLView } from 'expo-gl';
import { type LayoutChangeEvent, StyleSheet, View } from 'react-native';
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

import { lessonAccess, lessonOrdinalForKey } from '@/entities/lesson';
import {
  DEFAULT_ROBOT_ASSEMBLY,
  DEFAULT_ROBOT_DOG_ACTION,
  DEFAULT_ROBOT_DOG_SKIN,
  type RobotAssembly,
  type RobotDogAction,
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

import { CONTENT_PADDING, SPACING } from '@/shared/constants';

import { buildScene, type SceneModel } from '../lib';
import { type CameraTune, DEFAULT_CAMERA_TUNE } from '../model/camera-tune';
import { type SceneView, useSceneCamera } from '../model/use-scene-camera';

import { CameraRigPanel } from './camera-rig-panel';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface RoomSceneProps {
  /** The stop the camera is heading for. Controlled by the screen. */
  view: SceneView;
  /** Raised by a climb back to the map, and by a tap on a cell. */
  onViewChange: (view: SceneView) => void;
  /**
   * How far out of the pit the game has climbed, `0 … SCENE_TERRACE_COUNT`.
   *
   * Zero parks the platform on the floor of the pit with the walls towering
   * over it; the last level lifts it clear of the rim. Raising it turns the
   * gear train and throws dust — the climb is the reward, so it is animated
   * rather than snapped.
   */
  level?: number;
  /** The coat the dog wears. Swapping it reloads the model. */
  robotSkin?: RobotDogSkin;
  /** Independent modules selected in the introduction. */
  robotAssembly?: RobotAssembly;
  /** Equipment earned by progressing through the game. */
  robotStage?: RobotDogStage;
  /** What the dog does when nothing interrupts it — its state. */
  robotAction?: RobotDogAction;
  /**
   * What a tap on the dog plays before it settles back into `robotAction`.
   * `null` leaves taps unanswered.
   */
  petTapAction?: RobotDogAction | null;
  /**
   * The screen the child is talking to, or `null` for the arena.
   *
   * Controlled by the screen the same way `view` is: the widget reports a tap
   * and the screen decides, because the panel that goes with a focused
   * watcher is the screen's to draw.
   */
  focusedWatcher?: WatcherId | null;
  /** A tap landed on a screen, or on nothing while one was focused. */
  onWatcherFocus?: (watcher: WatcherId | null) => void;
  /**
   * A cell of the room the camera is already in was pressed.
   *
   * A cell in one of the other two rooms never reaches here: that tap is the
   * child pointing at where they want to go, so it turns the world instead.
   */
  onCellPress?: (cell: SceneCell) => void;
  /**
   * Cells whose lesson has been passed, as `cellKey` strings.
   *
   * They sit one terrace lower than the rest. Passed while the scene was
   * away, they are simply there; passed just now, the tile drops in front of
   * the child — `firstDone` is what tells the two apart.
   */
  doneCells?: readonly string[];
  /** Off when the grown-up disables animations — the camera then cuts. */
  isAnimated?: boolean;
  /**
   * Framing desk at the top: dial elevations / fit / platform, then paste
   * the dump into `camera.ts`. Defaults on in `__DEV__`.
   */
  isCameraRig?: boolean;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/** Share of the distance to the target still left after a second of easing. */
const SMOOTHING = 0.002;

/** A dropped frame must not teleport the camera. Seconds. */
const MAX_DELTA = 0.1;

/**
 * Tiers climb slower than the camera turns.
 *
 * A step rising is the game telling the child something happened; at the
 * camera's pace it would be over before they looked.
 */
/**
 * Share of the climb still left after a second.
 *
 * Derived from the time a level is meant to take rather than written down as
 * a magic constant, so changing `SCENE_LIFT_SEC` changes the feel.
 */
const LIFT_SMOOTHING = 0.02 ** (1 / SCENE_LIFT_SEC);

/**
 * Share of the flight to a watcher still left after a second.
 *
 * Slower than the orbit: this one crosses the whole arena and ends a metre
 * from a face, and at the camera's usual pace it reads as a cut.
 */
const FOCUS_SMOOTHING = 0.0006;

/** Below this the camera is treated as back on the arena, and stops blending. */
const FOCUS_EPSILON = 0.002;

/** How often the dev readout samples the camera and the frame counter, in ms. */
const READOUT_MS = 500;

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

/** A `[segment][step]` table, filled by `value`. */

/**
 * A canvas that is not a canvas.
 *
 * `WebGLRenderer` wants a DOM element to size itself against and to listen for
 * context loss on. expo-gl hands us the context instead, so this is the
 * smallest object three will accept — it is why the app does not need
 * `expo-three`, which is a dependency for this shim and little else.
 */
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
 * A renderer on expo-gl's context, past three's WebGL 1 guard.
 *
 * Since r163 three refuses a WebGL 1 context, and it tells the versions apart
 * with `context instanceof WebGLRenderingContext`. expo-gl hands out a WebGL 2
 * context whose class still descends from that global, so the guard fires on a
 * context three is otherwise happy with — it renders fine once past it. The
 * global is hidden for the length of the constructor; that guard is the only
 * place three reads it.
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

/**
 * The world, as one model under a fixed camera.
 *
 * Three bays sit 120° apart around the same axis. Walking between them is a
 * trip through the overhead map — the camera does not spin while the child
 * is standing in a bay. A drag upwards is still the way back to that map;
 * a tap on a cell is the way down into a bay.
 *
 * Nothing here runs on the UI runtime. The pan gesture is `runOnJS`, because
 * everything it drives — the three.js camera, the GL context — lives on the JS
 * thread, and a worklet may only call worklets (AGENTS.md).
 *
 * The render loop is built once, inside `onContextCreate`, and Fast Refresh
 * does not rebuild it: a change to the loop needs the app relaunched to be
 * seen.
 */
export const RoomScene = ({
  view,
  onViewChange,
  level = 0,
  robotSkin = DEFAULT_ROBOT_DOG_SKIN,
  robotAssembly = DEFAULT_ROBOT_ASSEMBLY,
  robotStage = 'basic',
  robotAction = DEFAULT_ROBOT_DOG_ACTION,
  petTapAction = 'joy',
  focusedWatcher = null,
  onWatcherFocus,
  onCellPress,
  doneCells,
  isAnimated = true,
  isCameraRig = __DEV__,
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
  /**
   * Frames drawn since the readout last looked.
   *
   * Counted in the loop and drained by the sampler, rather than timed per
   * frame: the loop is the one place that knows a frame happened, and a
   * number it increments costs nothing to keep.
   */
  const frames = useRef(0);

  /**
   * The GL surface is created only once the view has been measured.
   *
   * A `GLView` mounted at zero size hands out a context whose drawing buffer
   * never reaches the screen: the loop runs, three reports its draw calls, and
   * the window stays empty. Mounting after layout — and keying the view on the
   * size, so a rotation builds a fresh surface — is what makes the scene
   * appear at all.
   */
  const [surface, setSurface] = useState<{
    width: number;
    height: number;
  } | null>(null);

  const frame = useRef<number | null>(null);
  /** Bumped whenever a new GL context owns the loop — stale RAFs exit. */
  const loopId = useRef(0);
  const model = useRef<SceneModel | null>(null);
  const renderer = useRef<WebGLRenderer | null>(null);
  /** The live camera, so a tap can cast a ray through the same lens. */
  const lensRef = useRef<PerspectiveCamera | null>(null);
  const raycaster = useRef(new Raycaster());
  const pointer = useRef(new Vector2());
  /**
   * The dog's coat and state as of this render.
   *
   * `onContextCreate` runs once and closes over what it saw; these refs are
   * how a skin chosen later still reaches a scene built earlier.
   */
  const assemblyRef = useRef({ assembly: robotAssembly, stage: robotStage });
  useEffect(() => {
    assemblyRef.current = { assembly: robotAssembly, stage: robotStage };
    model.current?.setCharacterAssembly(robotAssembly, robotStage);
  }, [robotAssembly, robotStage]);
  const robotSkinRef = useRef(robotSkin);
  const robotActionRef = useRef(robotAction);
  /** False until the sunk cells have been placed once, without animating. */
  const hasSunkOnce = useRef(false);
  /**
   * The sunk cells as of this render.
   *
   * `onContextCreate` closes over what it saw, and it runs a render after the
   * props first arrive — this is how the scene it builds learns about them.
   */
  const doneCellsRef = useRef<readonly string[]>([]);
  const levelRef = useRef(level);
  /** Which screen the loop is flying towards, `null` for back to the arena. */
  const focusRef = useRef<WatcherId | null>(focusedWatcher);
  /** `0` on the arena, `1` parked in front of a face; damped in between. */
  const focusBlend = useRef(0);
  /**
   * The shot the blend is travelling to — or the one it is travelling back
   * from, which is why it outlives `focusRef` going null.
   */
  const focusShot = useRef<{ anchor: Vector3; eye: Vector3 } | null>(null);

  /**
   * Where each tier is heading, and where it is now: `[segment][step]`.
   *
   * Same reason as the camera — a tier climbs over half a second, and driving
   * that through state would re-render the screen on every frame of it.
   */
  /** Where the platform is heading, and where it is now: `0 … 1`. */
  const liftTarget = useRef(levelProgress(level));
  const lift = useRef(levelProgress(level));

  /** Read by the loop, which outlives every render that changes them. */
  const clearColor = useRef(SCENE_PALETTE.background);
  const isAnimatedRef = useRef(isAnimated);
  const viewRef = useRef(view);
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

  useEffect(() => {
    const next = levelProgress(level);
    const isClimbing = next > liftTarget.current;
    liftTarget.current = next;

    if (!isAnimatedRef.current) {
      lift.current = next;
      model.current?.setLevelProgress(next);
      return;
    }

    // Dust on the way up only. Sliding back down is a debug knob, not an
    // event the child earned.
    if (isClimbing) model.current?.burstLift(level);
  }, [level]);

  useEffect(() => {
    if (isAnimated) camera.applyView(view);
    else camera.jumpToView(view);
    model.current?.setWatchersVisible(
      view === 'top' || focusedWatcher !== null,
    );
  }, [camera, isAnimated, view, focusedWatcher]);

  /**
   * Sinks what the child has already learnt.
   *
   * The first run puts the tiles down without the drop — those lessons were
   * passed on another day and the scene should open on their result, not
   * replay it. Every run after that animates, because by then a change means
   * a tile the child has just earned.
   */
  useEffect(() => {
    if (!doneCells) return;
    doneCellsRef.current = doneCells;
    levelRef.current = level;

    if (!model.current) return;
    model.current.setCellsDone(doneCells, !hasSunkOnce.current);
    model.current.setCellAccess(doneCells, level);
    hasSunkOnce.current = true;
  }, [doneCells, level]);

  /**
   * The loop reads a ref, and the screen it is aimed at starts talking.
   *
   * Only the one in focus changes state: the other keeps whatever it was
   * doing, so walking away from one does not reset the pair.
   */
  useEffect(() => {
    focusRef.current = focusedWatcher;
    if (!focusedWatcher) return;

    model.current?.playWatcher(focusedWatcher, WATCHER_FOCUS_ACTION);
    return () => {
      model.current?.playWatcher(focusedWatcher, DEFAULT_WATCHER_ACTION);
    };
  }, [focusedWatcher]);

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
      // Drop the scene graph only — never `renderer.dispose()` on expo-gl:
      // disposing the WebGLRenderer tears down the native surface and the
      // next context often paints a frozen first frame (or nothing at all).
      model.current?.dispose();
      model.current = null;
      renderer.current = null;
    };
  }, []);

  // The dog's coat and state arrive as props but reach a scene that was
  // built once, so they travel through the model rather than a rebuild.
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
      // The effect below has already run by now and found no scene to talk
      // to: `onContextCreate` waits for the surface to be measured, which is
      // a render later. Without this the tiles a child sank yesterday come
      // back up every time the app is opened.
      built.setCellsDone(doneCellsRef.current, true);
      built.setCellAccess(doneCellsRef.current, level);
      hasSunkOnce.current = true;
      const lens = new PerspectiveCamera(
        tuneRef.current.fov,
        gl.drawingBufferWidth / gl.drawingBufferHeight,
        CAMERA_NEAR,
        CAMERA_FAR,
      );

      lensRef.current = lens;

      // Seed the platform where the game already is, so a rebuilt context
      // does not replay the whole climb from the bottom of the pit.
      built.setLevelProgress(lift.current);
      built.setWatchersVisible(
        viewRef.current === 'top' || focusRef.current !== null,
      );

      renderer.current = webgl;
      model.current = built;
      camera.setAspect(lens.aspect);
      // Re-seat the orbit against the (possibly hot-reloaded) elevations.
      camera.jumpToView(viewRef.current);

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

        // The camera rides with the floor: the robot climbs two hundred units
        // over five levels, and a camera left at the bottom would lose it.
        const eyeY = built.platformHeight();

        orbitEye.set(x, y + eyeY, z);
        orbitAim.set(SCENE_PIVOT[0], eyeY, SCENE_PIVOT[2]);

        // The robot turns with the camera rather than with the world: from
        // whichever segment the child is standing in, it is looking at them.
        built.setCharacterFacing((state.azimuth * Math.PI) / 180);

        // Talking to a screen is not an orbit: the camera leaves the axis
        // entirely and parks in front of a face. Rather than teach the orbit
        // about a second pivot, both shots are computed every frame and the
        // lens is eased from one to the other.
        const wanted = focusRef.current;
        if (wanted) focusShot.current = built.watcherFocus(wanted);

        const blendTo = wanted && focusShot.current ? 1 : 0;
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
          // Nothing left to travel back from; drop the shot so a watcher
          // that reloads is looked up fresh.
          if (!wanted) focusShot.current = null;
        }
        lens.lookAt(orbitAim);

        frames.current += 1;
        built.tick(now / 1000, delta);
        webgl.setClearColor(clear.set(clearColor.current), 1);
        webgl.render(built.scene, lens);
        gl.endFrameEXP();
      };

      loop();
    },
    [camera, level],
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

  /**
   * A tap is answered by whatever it actually landed on.
   *
   * The ray is cast against the model, not the half of the screen a thing
   * stands in: the camera tilts and turns, and a child tapping the floor
   * beside the dog should not get a wag. The order is the order of things
   * the child means — the screens overhead, then the robot, then the floor.
   */
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

      // The screens are asked first: they hang in front of the sky where
      // nothing else is, so a ray that finds one found nothing else.
      for (const watcher of WATCHER_IDS) {
        const screen = built.watcherRoot(watcher);
        if (!screen) continue;
        if (raycaster.current.intersectObject(screen, true).length === 0) {
          continue;
        }

        onWatcherFocus?.(focusedWatcher === watcher ? null : watcher);
        return;
      }

      // Standing in front of one, a tap anywhere else is the way back —
      // the child should not have to find the button.
      if (focusedWatcher) {
        onWatcherFocus?.(null);
        return;
      }

      const root = built.characterRoot();
      if (
        petTapAction !== null &&
        root &&
        raycaster.current.intersectObject(root, true).length > 0
      ) {
        built.reactCharacter(petTapAction, robotActionRef.current);
        return;
      }

      // The floor last, and only the tile buffers: a ray through the arena
      // also finds the sky sphere and the ramps, and neither is a cell.
      const hit = raycaster.current.intersectObjects(
        built.cellTargets(),
        false,
      )[0];
      if (hit?.faceIndex === undefined || hit.faceIndex === null) return;

      const cell = built.cellAt(hit.object, hit.faceIndex);
      if (!cell) return;

      // A tap on another segment from inside a bay is the child asking for
      // the map, not a free turn of the world — the camera does not spin
      // between bays anymore. From the map, the same tap walks in.
      if (view === 'top') {
        built.selectCell(null);
        onViewChange(cell.segment);
        return;
      }

      if (view !== cell.segment) {
        built.selectCell(null);
        onViewChange('top');
        return;
      }

      const ordinal = lessonOrdinalForKey(cellKey(cell));
      if (
        ordinal === null ||
        lessonAccess(ordinal, doneCellsRef.current, levelRef.current).status ===
          'LOCKED'
      ) {
        built.selectCell(null);
        return;
      }

      built.selectCell(cell);
      onCellPress?.(cell);
    });

  // The map does not turn, and neither does a bay: azimuth is locked once
  // the child is standing in one. The only drag left is the climb back to
  // the overhead map; picking another bay means going there first.
  const pan = Gesture.Pan()
    .runOnJS(true)
    .enabled(focusedWatcher === null && view !== 'top')
    .onBegin(camera.beginDrag)
    .onUpdate((event) => camera.dragBy(0, event.translationY))
    .onEnd(() => onViewChange(camera.endDrag()))
    .onFinalize((_event, success) => {
      if (!success) onViewChange(camera.endDrag());
    });

  return (
    <View style={styles.root} onLayout={onLayout}>
      <GestureDetector gesture={Gesture.Exclusive(pan, tap)}>
        <View style={styles.canvas}>
          {surface && (
            <GLView
              key={`${surface.width}x${surface.height}`}
              style={styles.canvas}
              onContextCreate={onContextCreate}
            />
          )}
        </View>
      </GestureDetector>

      {isCameraRig ? (
        <View
          pointerEvents="box-none"
          style={[styles.rig, { paddingTop: insets.top + SPACING.two }]}
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
});

export type { RoomSceneProps };
