# Build-time artwork

The renderer preserves the approved concept's toon shading, outlines, poses,
lighting and cameras. It is **not imported by the app**. Three.js 0.160.0 is pinned
here to reproduce the concept; this does not change the game's Three.js version.

From the repository root run `python3 -m http.server 8770 --bind 127.0.0.1`, then
open `/scripts/art/comic.html` or `/scripts/art/creator.html` on that local server.
The development tool loads the pinned rendering libraries from esm.sh; shipped
images and the installed game require no connection. Click a finished image to
save it. Images have the same names as the asset catalogue.

- Comic: 768 × 1024 JPEG, quality .82, eight frames × 63 appearances, ~22 MB.
- Creator: 960 × 600 JPEG, quality .86, 63 appearances, ~2.7 MB.
- `launch-duo`: 1440 × 900 JPEG; `splash-duo`: transparent 1024 × 1024 PNG
  (installed as `assets/images/splash-icon.png`).
- Comic finale depicts the completed assembly. The introductory frames depict
  the starting assembly. Free cosmetic choices persist in both.

`scene.mjs` is the retained art source; exported Claude pages and debugging
viewers are not required. Captions are app text, not baked into the JPEGs.
