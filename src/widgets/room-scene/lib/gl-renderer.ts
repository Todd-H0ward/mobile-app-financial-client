import type { ExpoWebGLRenderingContext } from 'expo-gl';
import { WebGLRenderer } from 'three';

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/** Cap GL pixel density — Phong fill-bound; HUD stays native/sharp above this. */
const MAX_RENDER_DENSITY = 1.75;

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

/** Scale factor ≥1: shrink `GLView` layout so the drawing buffer has fewer pixels. */
export const renderScaleFor = (pixelRatio: number): number =>
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
export const createRenderer = (
  gl: ExpoWebGLRenderingContext,
): WebGLRenderer => {
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
