# Story cutscenes

Drop the real videos here when they are ready:

| File | Cutscene | Story beat |
| --- | --- | --- |
| `intro.mp4` | `intro` | Walk with the companion → the accident → fall into the pit |
| `finale.mp4` | `finale` | Climb out → reunion at the rim |

Until the files exist, `/story/[cutsceneId]` shows the caption beats from
`content/story.json` as a skippable placeholder. Do **not** `require()` the
mp4s from the catalogue until Metro can resolve them — a missing asset fails
the bundle.

When wiring video:

1. Add `expo-video` (Expo SDK 57 docs).
2. Point `ASSET_MODULES` in `entities/story` at `require('./intro.mp4')` etc.
3. Replace the placeholder frame in `screens/story` with the player.
