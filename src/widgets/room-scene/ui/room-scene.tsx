import { useCallback, useEffect, useRef, useState } from 'react';

import { type ExpoWebGLRenderingContext, GLView } from 'expo-gl';
import { type LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Color, PerspectiveCamera, WebGLRenderer } from 'three';

import { ROOM_IDS, type RoomId, roomIndex } from '@/entities/room';
import {
  CAMERA_FAR,
  CAMERA_FOV,
  CAMERA_NEAR,
  damp,
  liftFor,
  orbitPosition,
  SCENE_PIVOT,
  SCENE_SEGMENT_COUNT,
  SCENE_STEP_COUNT,
} from '@/entities/scene';

import { CONTENT_PADDING, SPACING } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';

import { buildScene, type SceneModel } from '../lib';
import { type SceneView, useSceneCamera } from '../model';

import { SceneControls } from './scene-controls';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface RoomSceneProps {
  /** The stop the camera is heading for. Controlled by the screen. */
  view: SceneView;
  /** Raised by a button and by a settled swipe alike. */
  onViewChange: (view: SceneView) => void;
  /**
   * How many tiers of discs stand raised in each room, `0 … SCENE_STEP_COUNT`.
   *
   * The staircase grows out of the floor one tier at a time, so raising the
   * next one is a single increment here. A room left out keeps all of its
   * tiers up — that is the model as the artist built it.
   */
  raisedSteps?: Partial<Record<RoomId, number>>;
  /**
   * Same ladder for every room. Prefer this over `raisedSteps` when the
   * control is a single slider — a number dependency cannot go stale the way
   * a freshly allocated object sometimes does under Fast Refresh.
   */
  raisedStepCount?: number;
  /** Off when the grown-up disables animations — the camera then cuts. */
  isAnimated?: boolean;
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
const STEP_SMOOTHING = 0.02;

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

/** A `[segment][step]` table, filled by `value`. */
const everyStep = (value: () => number): number[][] =>
  Array.from({ length: SCENE_SEGMENT_COUNT }, () =>
    Array.from({ length: SCENE_STEP_COUNT }, value),
  );

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
 * The world, as one model on a turntable.
 *
 * Three rooms sit 120° apart around the same axis, so walking between them is
 * the model turning rather than a page sliding: the child keeps seeing where
 * the other rooms are while they travel to one. The camera opens on the
 * horizon in front of a room; the overhead stop is still one swipe or button
 * away.
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
  raisedSteps,
  raisedStepCount,
  isAnimated = true,
}: RoomSceneProps) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const camera = useSceneCamera(view);

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

  /**
   * Where each tier is heading, and where it is now: `[segment][step]`.
   *
   * Same reason as the camera — a tier climbs over half a second, and driving
   * that through state would re-render the screen on every frame of it.
   */
  const stepTargets = useRef(everyStep(() => 1));
  const stepLifts = useRef(everyStep(() => 1));

  /** Read by the loop, which outlives every render that changes them. */
  const clearColor = useRef(theme.background);
  const isAnimatedRef = useRef(isAnimated);
  const viewRef = useRef(view);
  const highlight = useRef<number | null>(null);
  const appliedHighlight = useRef<number | null | undefined>(undefined);

  useEffect(() => {
    clearColor.current = theme.background;
    isAnimatedRef.current = isAnimated;
    viewRef.current = view;
    highlight.current = view === 'top' ? null : roomIndex(view);
  }, [isAnimated, theme.background, view]);

  useEffect(() => {
    ROOM_IDS.forEach((room, segment) => {
      const raised =
        raisedStepCount ?? raisedSteps?.[room] ?? SCENE_STEP_COUNT;

      for (let step = 0; step < SCENE_STEP_COUNT; step += 1) {
        const lift = liftFor(step, raised);
        stepTargets.current[segment][step] = lift;
        // Snap the live pose too: the slider (and any future game raise) must
        // move the mesh even if the RAF loop is between frames or was rebuilt
        // by a Fast Refresh that left an orphaned callback.
        stepLifts.current[segment][step] = lift;
        model.current?.liftStep(segment, step, lift);
      }
    });
  }, [raisedStepCount, raisedSteps]);

  useEffect(() => {
    if (isAnimated) camera.applyView(view);
    else camera.jumpToView(view);
  }, [camera, isAnimated, view]);

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

  const onContextCreate = useCallback(
    (gl: ExpoWebGLRenderingContext) => {
      const id = (loopId.current += 1);
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      frame.current = null;
      model.current?.dispose();
      model.current = null;
      renderer.current = null;

      const webgl = createRenderer(gl);
      // expo-gl already hands us a buffer in device pixels.
      webgl.setPixelRatio(1);
      webgl.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight, false);

      const built = buildScene();
      const lens = new PerspectiveCamera(
        CAMERA_FOV,
        gl.drawingBufferWidth / gl.drawingBufferHeight,
        CAMERA_NEAR,
        CAMERA_FAR,
      );

      // Seed the mesh to whatever the slider already asked for, so the first
      // frame is not a full staircase that then drops a second later.
      for (let segment = 0; segment < SCENE_SEGMENT_COUNT; segment += 1) {
        for (let step = 0; step < SCENE_STEP_COUNT; step += 1) {
          built.liftStep(segment, step, stepLifts.current[segment][step]);
        }
      }

      renderer.current = webgl;
      model.current = built;
      camera.setAspect(lens.aspect);
      // Re-seat the orbit against the (possibly hot-reloaded) elevations.
      camera.jumpToView(viewRef.current);

      // Reused every frame: a fresh Color sixty times a second is litter.
      const clear = new Color(clearColor.current);

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
          built.highlight(highlight.current);
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

        for (let segment = 0; segment < SCENE_SEGMENT_COUNT; segment += 1) {
          for (let step = 0; step < SCENE_STEP_COUNT; step += 1) {
            const stepTarget = stepTargets.current[segment][step];
            const lift = isAnimatedRef.current
              ? damp(
                  stepLifts.current[segment][step],
                  stepTarget,
                  STEP_SMOOTHING,
                  delta,
                )
              : stepTarget;

            stepLifts.current[segment][step] = lift;
            built.liftStep(segment, step, lift);
          }
        }

        const { x, y, z } = orbitPosition(
          state.azimuth,
          state.elevation,
          state.distance,
        );
        lens.position.set(x, y, z);
        lens.lookAt(...SCENE_PIVOT);

        webgl.setClearColor(clear.set(clearColor.current), 1);
        webgl.render(built.scene, lens);
        gl.endFrameEXP();
      };

      loop();
    },
    [camera],
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

  const pan = Gesture.Pan()
    // Everything this touches is JS-thread only: three.js and the GL context.
    .runOnJS(true)
    .onBegin(camera.beginDrag)
    .onUpdate((event) => camera.dragBy(event.translationX, event.translationY))
    .onEnd(() => onViewChange(camera.endDrag()))
    .onFinalize((_event, success) => {
      if (!success) onViewChange(camera.endDrag());
    });

  return (
    <View style={styles.root} onLayout={onLayout}>
      <GestureDetector gesture={pan}>
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

      <View
        pointerEvents="box-none"
        style={[
          styles.controls,
          { paddingBottom: insets.bottom + SPACING.two },
        ]}
      >
        <SceneControls view={view} onSelect={onViewChange} />
      </View>
    </View>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  canvas: {
    flex: 1,
  },
  controls: {
    bottom: 0,
    left: 0,
    paddingHorizontal: CONTENT_PADDING,
    position: 'absolute',
    right: 0,
  },
});

export type { RoomSceneProps };
