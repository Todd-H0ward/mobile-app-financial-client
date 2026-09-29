/** Local UV remapping keeps the artist's PNG, including its glow and scan lines. */
export const WATCHER_FACE_SHADER = /* glsl */ `
  uniform vec4 uWatcherEyes;
  uniform vec2 uWatcherMouth;
  uniform float uWatcherKind;

  vec2 watcherPatch(vec2 p, vec2 centre, vec2 halfSize, vec2 pivot, vec2 scale, vec2 offset) {
    if (all(equal(scale, vec2(1.0))) && all(equal(offset, vec2(0.0)))) return p;
    vec2 local = p - centre;
    if (abs(local.x) >= halfSize.x || abs(local.y) >= halfSize.y) return p;
    vec2 inset = halfSize - abs(local);
    float edge = smoothstep(0.0, 0.025, min(inset.x, inset.y));
    vec2 sourcePoint = pivot + (p - pivot - offset * edge) / mix(vec2(1.0), scale, edge);
    // Stretch the patch's own dark border into the gap: using another part of
    // the image would leave a rectangle in the PNG's subtle background gradient.
    if (abs(sourcePoint.y - centre.y) >= halfSize.y) {
      return vec2(p.x, centre.y - halfSize.y + 0.002);
    }
    return clamp(sourcePoint, centre - halfSize + 0.001, centre + halfSize - 0.001);
  }

  vec2 watcherFaceUv(vec2 uv) {
    // Face PNGs are uploaded with flipY; coordinates below use the PNG's top left.
    vec2 p = vec2(uv.x, 1.0 - uv.y);
    vec2 samplePoint = p;
    if (uWatcherEyes.w > 0.5) {
      vec2 halfSize = mix(vec2(0.16, 0.175), vec2(0.115, 0.16), uWatcherKind);
      float eyeX = p.x < 0.5 ? 0.32 : 0.68;
      samplePoint = watcherPatch(p, vec2(eyeX, mix(0.255, 0.3, uWatcherKind)), halfSize,
        vec2(eyeX, 0.305), vec2(1.0, uWatcherEyes.z), uWatcherEyes.xy);
    }
    if (p.y > 0.465 && p.y < 0.645 && p.x > 0.275 && p.x < 0.725) {
      // The keeper speaks from the top edge of the mouth; the overseer's waveform
      // contracts around its centre. Neither transform touches the footer or cheeks.
      float anchor = mix(0.558, 0.523, uWatcherKind);
      samplePoint = watcherPatch(p, vec2(0.5, 0.555),
        vec2(mix(0.225, 0.135, uWatcherKind), 0.09), vec2(0.5, anchor), vec2(uWatcherMouth.x, uWatcherMouth.y), vec2(0.0));
    }
    return vec2(samplePoint.x, 1.0 - samplePoint.y);
  }
`;
