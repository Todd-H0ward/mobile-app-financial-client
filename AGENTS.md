# AGENTS.md

Working agreement for this repository. Read it before writing code, then follow it
exactly — it describes how this template is structured and why.

## Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before
writing any code. Do not rely on memory for Expo / expo-router APIs: this project
runs Expo SDK 57, React 19, React Native 0.86 and expo-router 57
(`Keyframe` animations from `react-native-reanimated` 4,
`react-native-worklets`). Native tabs are **not** used — see below.

## The game and the brief

The game is a robot dog climbing out of a pit — story, rules and open
decisions are in [docs/concept.md](docs/concept.md). The competition's
requirements are in `output/planning/tz-finni-brief.md` (with the full text in
`tz-finni-full.md`). **Never delete or rewrite those files**: every feature is
checked against them, and where the concept and the brief disagree, the brief
wins.

## Stack

| Area | Choice |
| --- | --- |
| Runtime | Expo SDK 57, React Native 0.86, React 19 |
| Routing | expo-router (file-based, `src/app`) |
| Server state | **нет** — офлайн-игра, сейв локальный; axios / TanStack Query убраны |
| Client state | zustand + `persist` поверх `expo-sqlite/kv-store`, синхронно (`@/entities/*/model`) |
| Game loop | game periods, not real time — [docs/game-period.md](docs/game-period.md) |
| 3D | `three` on `expo-gl`, model baked to JSON — [docs/scene.md](docs/scene.md) |
| i18n | i18next + react-i18next (`@/shared/i18n`) |
| Lint / format | Biome (`pnpm lint` / `pnpm format`) |
| Types | TypeScript strict (`npx tsc --noEmit`) |

## Architecture: Feature-Sliced Design

Layers, from top to bottom. **Imports may only go downwards.**

```
src/
├── app/        # expo-router routes ONLY — thin re-exports, no UI
├── _app/       # FSD "app" layer: providers, global init
├── screens/    # screen slices (FSD "pages")
├── widgets/    # composite blocks reused by several screens
├── features/   # user actions that cross slices (feedback, demo-mode, …)
├── entities/   # business entities: model + api + ui
└── shared/     # framework-agnostic reusable code
```

Rules:

1. **`src/app` holds routes, not code.** A route file re-exports a screen and
   nothing else: `export default HomeScreen;`. Layout files only compose
   providers and navigation.
2. **A slice is a folder with a public API.** `screens/home/index.ts` is the only
   entry point; nobody imports `screens/home/ui/home-screen` from the outside.
   In `shared/ui` a component is a single flat file — `button.tsx` —
   re-exported from `src/shared/ui/index.ts`. Import components from
   `@/shared/ui`, never by file path.
   Should an entity ever own a component, its `ui/` segment gets an entry
   point of its own (`@/entities/<slice>/ui`) and the slice barrel stays free
   of React: entities are read inside `vitest`'s node environment, where
   importing a component would drag react-native in and fail the suite.
3. **Segments inside a slice:** `ui/` (components), `model/` (state, stores,
   selectors, types), `lib/` (pure helpers), `api/` (requests). Create a segment
   only when it has content — do not scaffold empty folders.
4. **A module with a test is a folder.** As soon as `foo.ts` gains
   `foo.test.ts`, both move into `foo/` next to an `index.ts` that re-exports
   the module's public API. Everyone else imports the folder (`../lib/decay`),
   never the file inside it, so adding a test never rewrites call sites and the
   folder makes the tested surface obvious.

```
entities/budget/lib/compare/
├── compare.ts
├── compare.test.ts
└── index.ts
```
5. **Inside a slice** import relatively (`../lib`, `./text`); **across slices and
   layers** import through the alias public API (`@/shared/ui`, `@/screens/home`).
6. **Never import upwards or sideways** between slices of the same layer. If two
   screens need the same block, it belongs in `widgets/` or `shared/ui`.
   The one carve-out is inside `entities/`: a slice may import another entity's
   public API when that entity is a **leaf** — no state, no store, no imports of
   its own from the layer. `entities/economy` (the balance table),
   `entities/goal` / `entities/task` / `entities/catalogue` / `entities/glossary`
   / `entities/hint` (validated content), `entities/robot-dog` (the character's
   coats, clips, stages and mood rules) and `entities/settings` (parent-gate
   math only — `SettingsSave` switches live on `entities/user`) are those
   leaves. The rule that does not bend: a slice never
   **re-exports** another slice's API. `STARTING_BALANCE` is imported from
   `@/entities/economy` by everyone who needs it, never through `@/entities/user`.
7. `shared/` knows nothing about the domain. No entity types, no feature logic.

## Component file conventions

Every component file — in `shared/ui`, `widgets`, `screens/*/ui` — follows the
same shape and section banners, so files stay scannable:

```tsx
import type { ReactNode } from 'react';

import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { SPACING } from '@/shared/constants';

import { Text, type TextProps } from './text';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface BadgeRootProps {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

type BadgeTextProps = TextProps;

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

const BadgeText = ({ children, variant = 'body', ...props }: BadgeTextProps) => {
  return (
    <Text variant={variant} {...props}>
      {children}
    </Text>
  );
};

const BadgeRoot = ({ children, style }: BadgeRootProps) => {
  return <View style={[styles.root, style]}>{children}</View>;
};

// ═══════════════════════════════════════════
// COMPOUND EXPORT
// ═══════════════════════════════════════════

export const Badge = Object.assign(BadgeRoot, {
  Text: BadgeText,
});

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    borderRadius: 20,
    flexDirection: 'row',
    gap: SPACING.two,
  },
});

export type { BadgeRootProps, BadgeTextProps };
```

Checklist:

- Section banners in this order, omitting the ones that do not apply:
  `TYPES` → `CONSTANTS` → `ANIMATIONS` → `HELPERS` → `COMPONENTS` →
  `MAIN COMPONENT` → `COMPOUND EXPORT` → `STYLES`.
  `MAIN COMPONENT` separates the root of a compound component from the parts
  assembled onto it, so the entry point of the file is findable at a glance.
- Arrow-function components, props destructured in the signature, `...props`
  spread last.
- **Values are exported inline** (`export const Badge = …`). Only the parts of a
  compound component that are re-assembled below stay unexported.
- **Types are exported at the bottom** of the file, in one
  `export type { … };` statement — never inline `export interface`.
- **Props are `interface`s** (`interface BadgeRootProps { … }`), extending the
  underlying primitive's props where applicable
  (`interface TextProps extends RNTextProps { … }`). Use a `type` alias only
  when nothing is added — `type BadgeTextProps = TextProps;` — or for unions
  and mapped types (`type TextVariant = 'body' | 'title';`).
- Styles live at the bottom in a single `StyleSheet.create`, keys sorted
  alphabetically, the outermost style named `root`.
- Variants are a `variant` prop backed by named style keys — never a boolean per
  look, never inline magic numbers. Spacing comes from `SPACING`, colors from
  `useTheme()` / `COLORS`. Fixed sizes are plain design points — there is no
  scaling layer, see [docs/layout.md](docs/layout.md).
- **Boolean props start with `is`** (`isSelected`, `isDone`, `isVisible`).
  Inherited React Native prop names keep their own spelling (`disabled` on
  `Pressable`, `visible` on `Modal`, the `selected` key of `accessibilityState`)
  — renaming those breaks the prop.
- Multi-part components use the compound pattern (`Object.assign`) instead of
  `renderX` props or long prop lists.
- Comments explain *why*, in English, and only where the code is not obvious.

## The arcade

Five games live behind `/games`, reached from the chores screen — not from a tab
of their own. `entities/minigame` owns the rules, `widgets/minigame` the scenes,
`screens/games` the sitting.

- **Chores pay more than games.** Rewards live in `BALANCE.games.rewards` and
  sit under a medium chore on purpose. A game that out-earns the housework
  quietly ends the housework.
- **Three paid sittings a day**, then the games stay open and stop paying, and
  the screen says so. Silence would read as a bug. The weekly game is capped by
  its own calendar as well.
- **Nothing can be failed.** A wrong answer opens `DebriefSheet` — the numbers
  side by side and the rule named — and the round still pays
  `wrongRoundShare` of its coins. `payoutFor` can never return zero.
- **No timers.** Progress is "раунд 2 из 3", never a countdown.
- **A round is fixed for the day**: the seed is the game plus the day, so
  backing out of a hard sum and returning hands back the same one.
- Adding a game is a scene plus a row in the catalogue. `GameShell` owns the
  back button, the title, the round dots and the single bottom action, which is
  what keeps the five looking like one arcade.

## Store state: every field carries a comment

In a store — the `*Save` type, the `*Store` interface and anything they hold —
**every field gets a doc comment**, even an obvious one. A save is read by
whoever debugs it a year from now, and a bare `bestStreak: number` does not say
whether it resets, what a missed day does to it, or which screen depends on it.

```ts
interface ChoresSave {
  /** Today's list and this week's, together. */
  chores: Chore[];
  /** Streak, best streak and the freezes left. */
  streak: StreakState;
  /** Day the current list was generated for. */
  generatedFor: number;
}
```

Say the unit (`Epoch ms`, `°C`, `0…1`), the invariant (`never below zero`) or
what depends on it (`the robot's stage is counted from this`). Elsewhere in the codebase the
usual rule still holds: a comment earns its place by explaining *why*.

## The UI-kit screen — mandatory for UI components

**Every component in `shared/ui` is shown on the UI-kit screen. A new or changed
component that is not there is unfinished work** — it is the only place where a
component is checked against all of its states at once.

- Screen: [`src/screens/ui-kit`](src/screens/ui-kit/), pushed from the
  development card at the bottom of the room screen (`/ui-kit`). It is not a
  tab: the bar holds the five destinations of the game itself.
- Add a `<KitSection title="Badge" caption="…">` with the component next to the
  others, and wire any switchable state into
  `screens/ui-kit/model/use-playground.ts` instead of hardcoding it.
- There is **no Storybook and no story files** in the project: the kit lives
  inside the app, so it costs no dependency and runs on the real device.

What the screen must show for a component:

1. **Every `variant` and `size`.**
2. **Every state**: default, pressed, disabled, loading, selected, done, empty —
   whichever the component has. `loading` and `disabled` are already driven by
   the switches at the top of the screen.
3. **The interaction itself** when the component reacts to touch or gestures —
   a real press, a real drag, not a screenshot of one.
4. **Edge content**: long text, zero and maximum values, missing optional slots.

## Navigation: one model, three segments on it

There are **no rooms**. `entities/room` is gone, and with it the street, the
living room and the kitchen: the arena has three wedges, the model numbers
them `0 … 2`, and a view is `'top' | number` (`SceneView`). The names went
because the wedges outlived them — what a wedge holds is now decided by its
thirty cells, not by a label over the door.

The three segments are the three sectors of **one 3D model** (`assets/scene`),
rendered on `/home` by `widgets/room-scene`. Walking to another segment turns
the model under the camera instead of sliding a page, so the child never loses
sight of where the others are. The camera opens standing at a segment; the
overhead map is a drag upwards away. Everything that is not the world —
settings, the grown-ups' section, the UI kit — is pushed over it by the root
stack.

**The map does not turn.** The overhead view is a composed shot on a fixed
heading (`TOP_AZIMUTH`), so that the child arrives at the same picture
whichever segment they left, and the pan gesture is disabled there. The way
down is a tap on a cell, which walks into that cell's segment — so the map is
a place you read and point at, not one you fiddle with. The same freeze
applies in front of a watcher.

**Cells are the second way to walk.** Each wedge carries five terraces of six
cells, ninety in all, and every one is framed and pressable. A tap on a cell
of another segment turns the world to that segment instead of selecting the
cell; a tap on a cell of the segment you are standing in selects it. That tap
is what keeps 3.6 satisfied now the labelled buttons are gone: a gesture is
invisible to a child who has never been taught it, and must never be the only
way through. **Do not leave the swipe as the only way across.**

**A segment is the bay between two gears**, and that is not how the FBX
groups its discs. Each terrace is a ring of eighteen tiles with three slots
cut in it, one per gear, at 98.5°, 218.5° and 338.5° — the gear stands in the
slot. Between two slots run six tiles with nothing between them, and those
six by five terraces are a segment. The converter's `node.segment` instead
buckets tiles by their nearest gear, which cuts a bay in half and puts a gear
in the middle of it; `cellsOf` in `build-scene` regroups by angle and is the
only grouping the game should use.

The camera stands **opposite** the middle of the bay, at eye level. Three
things make that shot work and none of them are optional:

- `SEGMENT_CAMERA_OFFSET` is 240° from the gear — 60° to the bay's middle,
  then 180° to the far side. Standing *in* the bay wraps its six cells around
  the lens as two wings with sky between them.
- `SCENE_GEAR_ANGLES` is what all of this is measured from — never
  `SCENE_VIEW_ANGLES`, which already carries a half turn of its own. Mixing
  them up is what put a gear in the middle of every segment and stood the
  camera inside the bay it was meant to be facing.
- Nothing is hidden: all three bays and all three gears stay on screen, so
  the child can see where they came from. What keeps the near rim out of the
  way is `ROOM_ELEVATION` (24°) — the rim is 160 units tall at a radius of
  400, a slope of 21.8°, and anything flatter is a view of the back of a wall
  with the robot behind it.
- Distance flattens the arc. Six cells wrap 120°, and from close in the ends
  loom while the middle falls away; `SCENE_SEGMENT_DISTANCE` (1500) is where
  the bay stops being a bowl and starts being a board.

The robot turns to face the camera wherever it goes (`setCharacterFacing`): it
stands on the axis with three bays around it, so there is no direction that
is right from all of them.

Three.js draws the scene on `expo-gl`. `expo-three` and `@react-three/fiber`
are deliberately absent, the FBX is converted to JSON at build time by
`scripts/fbx-to-scene.mjs`, and the camera lives in refs rather than state —
the reasons for all three are in [docs/scene.md](docs/scene.md), which is
required reading before touching the scene.

The robot dog stands at the centre of the arena: seven coats and four clips,
driven by its mood (`entities/robot-dog`, `actionForMood`) and answering a
tap. Its textures live as loose
files rather than inside the GLB, and that is not a style choice — expo-gl can
only upload a texture from a `file://` path. See
[docs/scene.md](docs/scene.md) before touching it.

The flat rooms that preceded this are **deleted**, not parked:
`widgets/room-pager`, `screens/home/ui/rooms`, `entities/room` and the
`SceneControls` tab strip all went when the rooms did.

**The pet concept is gone too.** The game is about climbing out of a pit, not
about looking after a pet in a house: `entities/pet` (species, coats,
patterns, traits, the 2D rig), `entities/onboarding`, the onboarding,
pet-create and pet-grew screens, `widgets/pet-box`, the 2D HUD companion and
the whole house — thermostat, insulation, heating bill, furniture — are
deleted, not parked. What the new game still needs moved to
`entities/robot-dog`: the three build stages, the charge / spirit mood and the
name rules. A first launch makes a guest profile and drops straight into the
pit; the introduction is to be built inside the game. The HUD data
(`useHomeHud`) is still computed for when the coins, the goal and the task
get a place on the 3D world; until then the home screen deliberately shows
the model, the level card and nothing else.

## Native tabs are off — do not bring them back

There is **no tab bar and no `app-tabs` widget**. Navigation is a root `Stack`
plus the 3D scene on `/home` (see above).

`expo-router/unstable-native-tabs` was tried earlier and aborted the process on
iOS in Expo Go: a throw inside the worklets runtime
(`AnimationFrameBatchinator::flush` → `WorkletRuntime::runSync`) with no red
screen and no JS stack. From the outside it looks like a hung simulator —
`simctl openurl … exited with non-zero code: 60`. It was isolated by bisecting
the tree: `Providers` + `<Slot />` was stable, `Providers` + native tabs
crashed every launch.

Revisit only when native tabs leave "unstable". If you try them again, watch
`~/Library/Logs/DiagnosticReports` rather than the Metro output — and do not
reintroduce a tab bar as the child's main map; rooms stay the map.

## React Compiler is off — and must stay off

`app.json → experiments.reactCompiler` is `false` on purpose.

With it on, the app died on iOS with `SIGABRT` a few seconds after render. The
crash report pointed at `AnimationFrameBatchinator::flush` →
`WorkletRuntime::runSync` → a JS throw: React Compiler rewrites and hoists
closures before the worklets plugin transforms them, so a Reanimated worklet
threw inside the UI runtime. That is not a red screen — it is a native abort,
which surfaces as `simctl openurl … exited with non-zero code: 60` and looks
exactly like a hung simulator.

This app leans on Reanimated everywhere (the robot, sheets, slider,
toasts), so the compiler stays off until it is verified against
`react-native-worklets`. If you turn it on, check for new reports in
`~/Library/Logs/DiagnosticReports` before believing it works.

## A worklet may only call worklets

The body of `useAnimatedStyle`, `useDerivedValue` or a gesture callback runs on
the UI runtime. It may read shared values and call Reanimated's own helpers.
It may **not** call our plain helpers — `formatMoney` and anything else without
a `'worklet'` directive. (`clamp` in `@/shared/utils` *is* marked as a worklet,
which is why the slider may call it on the UI thread.) Compute the rest on the
JS thread and capture the number:

```ts
// module scope, evaluated once on the JS thread
const TRAVEL = TRACK_WIDTH - KNOB - PADDING * 2;

const knobStyle = useAnimatedStyle(() => ({
  transform: [{ translateX: progress.value * TRAVEL }],
}));
```

`switch.tsx` once called `scale(6)` inside its animated style. That throws in the
UI runtime, and on iOS the throw is not a red screen but `SIGABRT` — the app
vanishes with no JS stack and no Metro output. It looked like "the app crashes
when I open the parents' screen", because that screen and the UI kit are the only
places the switch is used. The scaling layer is gone now, but the rule that
produced the crash still applies to any helper.

Start animations from the JS thread too — an event handler or a `useEffect`,
the way `button.tsx` and `switch.tsx` do it.

Symptom to recognise: no red screen, no Metro error, a fresh report in
`~/Library/Logs/DiagnosticReports` whose stack ends in
`WorkletRuntime::runSync` → `HermesRuntimeImpl::throwPendingError`.

## Layout across screen sizes

The app must look right on phones **and** tablets. There is **no scaling layer**:
`scale()`, `fontSize()`, `vw()`, `select()` and `useResponsive()` were removed on
purpose: there is no scaling layer and no `vw` / `moderateScale` primitives
anywhere. `@/shared/utils` holds the pure helpers (`clamp`, `formatMoney`,
`hitSlopFor`); `@/shared/lib` holds framework-aware infrastructure and today
contains exactly one thing, `time-source`.

- `SPACING`, `CONTENT_PADDING` and `MAX_CONTENT_WIDTH` from `@/shared/constants`
  are the layout tokens — reach for these first.
- Fixed sizes (icon, radius, tile height) are plain numbers in design points.
- Flexible layout comes from `flex`, `flexWrap` and `width: '100%'`, not from a
  coefficient applied to every number.
- A component whose structure must follow the window uses `useWindowDimensions()`
  from `react-native` — never `Dimensions.get()` at module level, which does not
  survive rotation or split view.
- `Screen` already caps the content column at `MAX_CONTENT_WIDTH` and centres it.

Full rationale: [docs/layout.md](docs/layout.md).

## Naming

- Files and folders: `kebab-case` (`home-screen.tsx`, `get-dev-menu-hint.tsx`).
- Components: `PascalCase`; hooks `useCamelCase`; constants `SCREAMING_SNAKE`.
- Screens end with `Screen`, stores with `Store`, selectors with `use*`.
- Barrels are named `index.ts` and only re-export — no logic inside.

## Workflow

1. Check the versioned Expo docs for any API you touch.
2. Put the code in the lowest layer that can own it (`shared` → `entities` →
   `features` → `widgets` → `screens`).
3. Export it through the slice `index.ts`.
4. Run `pnpm typecheck`, `pnpm test` and `pnpm format` before finishing.
5. Never edit `src/app/*` to add UI — add a screen and re-export it.
6. Do not resurrect `reset-project` or switch lint back to `expo lint` / ESLint
   — lint is Biome (`pnpm lint`), scoped to `src/**` and `plugins/**`.

## Do not

- Do not add a UI kit or styling library (NativeWind, Tamagui, …) — this template
  is plain `StyleSheet` + theme tokens.
- Do not create `src/components`; that folder is gone on purpose.
- Do not hardcode colors outside `shared/constants/theme.ts`. The one exception
  is an entity's own art data — the arena's colours belong to the world, not
  the design system, and `shared/` may not know about them (rule 7). Such
  colors live in a **single** palette file inside that entity
  (`entities/scene/model/palette`), nothing else in the slice writes a hex,
  and a test asserts it.
- Do not add barrels that re-export a whole layer (`src/screens/index.ts`);
  import the slice.
- Do not use `export *` in a barrel — list every export by name, values and
  types on separate statements, so the public API of a module is readable in
  one file.
