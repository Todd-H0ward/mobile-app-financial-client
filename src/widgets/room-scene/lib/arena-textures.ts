/** Bundled albedo modules — require stays out of `build-scene` so vitest can mock it. */

const ARENA_TEXTURES = {
  concrete: require('../../../../assets/scene/textures/concrete.png') as number,
  rust: require('../../../../assets/scene/textures/rust.png') as number,
} as const;

export { ARENA_TEXTURES };
