# Design system — «Выше нуля» · Терминал 2b

The source of truth is the design handoff
[`output/design_handoff_vyshe_nulya`](../output/design_handoff_vyshe_nulya/)
(`reference/UI Kit.dc.html`). Tokens live in
[`src/shared/constants/theme.ts`](../src/shared/constants/theme.ts), components
in [`src/shared/ui`](../src/shared/ui/), and every component renders with all of
its states on the UI-kit screen ([`src/screens/ui-kit`](../src/screens/ui-kit/),
opened from Settings in development builds). Its switches live in
`screens/ui-kit/model/use-playground.ts`.

The world is a concrete pit; the interface is green terminals in a dark bezel
hanging over it. The machine speaks in Martian Mono, everything the child reads
is Golos Text.

## Principles

- **One module, one thought.** A card in a 2 pt frame, radius 14.
- **Shape and word, never colour alone.** A done state is `✓` plus a word, a
  warning is amber plus `!` plus a word, "not decided yet" is a dashed line.
- **Two voices.** The Keeper is rounded, lower-case `>`, whole sentences. The
  Overseer is the cut corner (`ChamferCard`), `//`, CAPS only in the label —
  and nowhere else in the child's interface.
- **No red, no "error".** A slip is a rule named, not a failure.
- **Only machine output glows** — numbers and voice labels (`machine`,
  `number*` in phosphor). Reading text is always crisp.
- **The game stays in view.** Terminals rise from the bottom over the live
  pit: a sheet route (`Screen presentation="sheet"`), a talk with a watcher, the
  dog's diagnostics (`TerminalDock`). They are as tall as their content.
- **48 dp touch targets**; controls under 48 use `hitSlopFor`.

## Tokens

| Group | Tokens |
| --- | --- |
| Scene | `sceneLight` `sceneBase` `sceneShade` `sceneInk` |
| Terminal | `bezel` `terminalScreen` `surface` `surfaceSoft` `surfaceDeep` |
| Lines | `border` (frames) `borderStrong` (buttons) |
| Text | `text` `textSecondary` `textMuted` `textDisabled` |
| Voices and accents | `phosphor` / `primary` (Keeper, actions) · `coin` (money only) · `warning` (attention, amber) · `overseerLcd`, `overseerSurface` (Overseer only) |
| On accent | `onAccent` |
| Veils | `overlay` (under a modal sheet) · `scrim` (behind a route sheet, game readable) |
| Texture | `scanline` `glow` |
| Shape | `RADII` (10 button · 14 card · 20 screen · 26 bezel), `SPACING` (grid of 4) |

## Components

| Component | Props that matter | Covers |
| --- | --- | --- |
| `Text` | `variant`, `themeColor` | reading (`body`, `title`…) and machine (`machine`, `code`, `number*`) |
| `PixelIcon` | `name`, `size` (12/24/36/72), `tone` | the handoff's 12×12 pixel set |
| `Button` + `.Label` | `variant` (primary/secondary/ghost/icon/stepper/warning), `size` (xl/l/m/s), `isLoading`, `disabled` | one main action per screen; `ghost` is the "[ system link ]" |
| `TerminalPanel` | `variant` (keeper/overseer/adult), `size` (l/m/s), `isLampVisible` | bezel, screen, LED strip of whose terminal it is |
| `TerminalDock` | `variant`, `maxShare` | a terminal docked to the bottom of the game |
| `Screen` + `.Header` `.Heading` `.Label` `.Title` `.Back` | `presentation` (full/sheet), `terminalVariant`, `isScrollable` | a route's frame |
| `ChamferCard` | `variant` (both/topRight), `borderTone`, `fillTone` | the Overseer's trials and lines |
| `Card` + `.Title` `.Content` `.Footer` | `tone`, `isSelected`, `onPress` | a module on the screen |
| `ListGroup` + `.Item` | `title`, `subtitle`, `icon`, `trailing`, `onPress` | one framed list with hairlines |
| `ListRow` | `isSelected`, `isDone` | answers in a trial, recovery steps |
| `Segmented` | `options`, `value`, `onChange` | 2–3 tabs in a frame |
| `Chip` | `variant` (neutral/selected/success/warning/rule/locked/need/want/muted) | states as shape + word, filters |
| `ProgressBar` | `value`, `segmentCount`, `color` | countable cells — one per 10 coins or one charge |
| `Sheet` + `.Label` `.Title` `.Description` `.Actions`, `Sheet.Modal` | `variant` (default/warning), `isDismissible` | confirmations |
| `Input` | `isCounterVisible`, `maxLength`, `variant` | names |
| `Switch`, `Slider` | — | settings, playground |
| `Toast` + `toast()` / `<Toaster />` | `variant` | short feedback |
| `Coin`, `CoinBadge`, `Shape` | — | money and state glyphs |
| `RingsBackdrop` | `centerY`, `variant` | the pit's concrete rings behind a full-screen terminal |
| `SplashOverlay` | — | "terminal switching on" at launch |

Import everything from the barrel: `import { Button, Chip } from '@/shared/ui';`

## Still open

- **The world's look** (concrete colour, lighting, 3D) is still being designed;
  the white concrete in the references is a working idea, not a decision. The
  scene belongs to [scene.md](./scene.md), not to this kit.
- **App icon** — waiting for the final robodog render (handoff README).
- **Minigames vs «Смена»** — a team decision, see the handoff README.
