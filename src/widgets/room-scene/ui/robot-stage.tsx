import { useCallback, useEffect, useRef, useState } from 'react';

import { type ExpoWebGLRenderingContext, GLView } from 'expo-gl';
import {
  type LayoutChangeEvent,
  PixelRatio,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import type { RobotAssembly, RobotDogSkin } from '@/entities/robot-dog';
import { damp } from '@/entities/scene';

import { hapticLight } from '@/shared/lib';

import {
  buildRobotStage,
  createRenderer,
  type RobotStageModel,
  renderScaleFor,
} from '../lib';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface RobotStageProps {
  skin: RobotDogSkin;
  assembly: RobotAssembly;
  /** Off when the grown-up disables animations — no bounce on a choice. */
  isAnimated?: boolean;
  /** The band the dog is framed in, in points from the top — what overlays leave open. */
  band?: { top: number; bottom: number } | null;
  /** Read out instead of the canvas, which a screen reader cannot see. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/** Radians of turn per point of finger travel. */
const YAW_PER_POINT = 0.012;

/** Share of the turn still left after a second — quick, but never a snap. */
const YAW_SMOOTHING = 0.0005;

/** The idle clip reads the same at half the rate; a drag gets every frame. */
const IDLE_FPS = 30;
const IDLE_SLACK_MS = 4;
const MAX_DELTA = 0.1;

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

/** The dog alone on a patch of concrete: turns under a finger, bounces at a poke or a new look. */
export const RobotStage = ({
  skin,
  assembly,
  isAnimated = true,
  band = null,
  accessibilityLabel,
  style,
}: RobotStageProps) => {
  const [surface, setSurface] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [isReady, setReady] = useState(false);

  const model = useRef<RobotStageModel | null>(null);
  const frame = useRef<number | null>(null);
  /** Bumped whenever a new GL context owns the loop — stale RAFs exit. */
  const loopId = useRef(0);
  const skinRef = useRef(skin);
  const assemblyRef = useRef(assembly);
  const isAnimatedRef = useRef(isAnimated);
  isAnimatedRef.current = isAnimated;
  const yaw = useRef(0);
  const yawTarget = useRef(0);
  const yawAtGrab = useRef(0);
  const isDragging = useRef(false);

  const cheer = useCallback(() => {
    if (isAnimatedRef.current) model.current?.cheer();
  }, []);

  // A choice the child makes gets an answer from the dog — the first render is not a choice.
  const lastLook = useRef({ skin, assembly });
  useEffect(() => {
    skinRef.current = skin;
    assemblyRef.current = assembly;
    const built = model.current;
    if (!built) return;
    built.setSkin(skin);
    built.setAssembly(assembly);
    const previous = lastLook.current;
    lastLook.current = { skin, assembly };
    if (
      previous.skin !== skin ||
      previous.assembly.ears !== assembly.ears ||
      previous.assembly.face !== assembly.face
    ) {
      cheer();
    }
  }, [skin, assembly, cheer]);

  // Shares of the surface the dog is framed in; read again whenever a context is rebuilt.
  const bandShare = useRef<{ top: number; bottom: number } | null>(null);
  bandShare.current =
    band && surface
      ? {
          top: band.top / surface.height,
          bottom: band.bottom / surface.height,
        }
      : null;
  const bandTop = bandShare.current?.top;
  const bandBottom = bandShare.current?.bottom;
  useEffect(() => {
    if (bandTop === undefined || bandBottom === undefined) return;
    model.current?.setFrame(bandTop, bandBottom);
  }, [bandTop, bandBottom]);

  useEffect(
    () => () => {
      loopId.current += 1;
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      frame.current = null;
      model.current?.dispose();
      model.current = null;
    },
    [],
  );

  const onContextCreate = useCallback((gl: ExpoWebGLRenderingContext) => {
    loopId.current += 1;
    const id = loopId.current;
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    model.current?.dispose();

    const webgl = createRenderer(gl);
    webgl.setPixelRatio(1);
    webgl.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight, false);

    const built = buildRobotStage(skinRef.current, assemblyRef.current);
    built.setViewport(gl.drawingBufferWidth, gl.drawingBufferHeight);
    if (bandShare.current) {
      built.setFrame(bandShare.current.top, bandShare.current.bottom);
    }
    model.current = built;
    lastLook.current = {
      skin: skinRef.current,
      assembly: assemblyRef.current,
    };
    void built.whenReady.then(() => {
      if (loopId.current !== id) return;
      // Whatever was picked while the model loaded.
      built.setSkin(skinRef.current);
      built.setAssembly(assemblyRef.current);
      setReady(true);
    });

    let width = gl.drawingBufferWidth;
    let height = gl.drawingBufferHeight;
    let last = Date.now();

    const loop = () => {
      if (loopId.current !== id) return;
      frame.current = requestAnimationFrame(loop);

      const now = Date.now();
      if (!isDragging.current && now - last < 1000 / IDLE_FPS - IDLE_SLACK_MS) {
        return;
      }
      const delta = Math.min((now - last) / 1000, MAX_DELTA);
      last = now;

      if (
        gl.drawingBufferWidth !== width ||
        gl.drawingBufferHeight !== height
      ) {
        width = gl.drawingBufferWidth;
        height = gl.drawingBufferHeight;
        webgl.setSize(width, height, false);
        built.setViewport(width, height);
      }

      yaw.current = isAnimatedRef.current
        ? damp(yaw.current, yawTarget.current, YAW_SMOOTHING, delta)
        : yawTarget.current;
      built.setYaw(yaw.current);
      built.tick(delta);
      webgl.render(built.scene, built.lens);
      gl.endFrameEXP();
    };
    loop();
  }, []);

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width <= 0 || height <= 0) return;
    // Only a new width (rotation) re-keys the canvas. A keyboard that shortens the window must not
    // rebuild the context and reload the dog — the surface keeps its height and gets clipped.
    setSurface((current) =>
      current?.width === width ? current : { width, height },
    );
  };

  const turn = Gesture.Pan()
    .runOnJS(true)
    .activeOffsetX([-8, 8])
    .failOffsetY([-14, 14])
    .onBegin(() => {
      yawAtGrab.current = yawTarget.current;
    })
    .onStart(() => {
      isDragging.current = true;
    })
    .onUpdate((event) => {
      yawTarget.current =
        yawAtGrab.current + event.translationX * YAW_PER_POINT;
    })
    .onFinalize(() => {
      isDragging.current = false;
    });

  const poke = Gesture.Tap()
    .runOnJS(true)
    .onEnd(() => {
      hapticLight();
      cheer();
    });

  const renderScale = renderScaleFor(PixelRatio.get());
  const surfaceStyle = surface && {
    height: surface.height / renderScale,
    left: (surface.width - surface.width / renderScale) / 2,
    top: (surface.height - surface.height / renderScale) / 2,
    transform: [{ scale: renderScale }],
    width: surface.width / renderScale,
  };

  return (
    <GestureDetector gesture={Gesture.Exclusive(turn, poke)}>
      <View
        accessible
        accessibilityRole="image"
        accessibilityLabel={accessibilityLabel}
        style={[styles.root, style]}
        onLayout={onLayout}
      >
        {surface && (
          <GLView
            key={`${surface.width}x${surface.height}@${renderScale}`}
            style={[styles.surface, surfaceStyle, { opacity: isReady ? 1 : 0 }]}
            onContextCreate={onContextCreate}
          />
        )}
      </View>
    </GestureDetector>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: 'hidden',
  },
  surface: {
    position: 'absolute',
  },
});

export type { RobotStageProps };
