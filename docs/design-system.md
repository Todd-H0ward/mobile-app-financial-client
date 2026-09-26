# Design system — «Лапка»

Tokens live in [`src/shared/constants/theme.ts`](../src/shared/constants/theme.ts),
components in [`src/shared/ui`](../src/shared/ui/), and the whole kit renders on the
second tab ([`src/screens/ui-kit`](../src/screens/ui-kit/)): `isLoading`,
`disabled`, meter levels, selection and the sheet are switches on the screen, so
states are checked by tapping instead of by editing props. Its own state lives
in `screens/ui-kit/model/use-playground.ts`.

Булевы пропсы по всему киту начинаются с `is` (`isSelected`, `isDone`,
`isVisible`); унаследованные имена React Native — `disabled` у `Pressable`,
`visible` у `Modal` — остаются как есть.

## Principles carried into the code

- **No alarming red.** A low meter is `tone="low"`: it keeps the warm color and
  gains a border plus a darker caption. Worry is expressed by the robot's clip
  and words, not by the palette.
- **State reads by shape and text, not by color alone.** Needs are a blue
  circle, wants an orange diamond — see `Chip` and `Shape`.
- **One press mechanic.** Every pressable drops onto its own shadow
  (`Button`, 4 / 3 / 0 px by size); nothing dims to 50%.
- **16px is the floor for content.** `body` / `bodyBold` / links are 16.
  13px (`small`) is a caption or chip filter; 10px (`label`) only labels
  navigation and icons. Actionable copy (`Button`, `Toast`, meter names) stays
  at 16+.
- **48dp touch targets.** Controls under 48 use `hitSlopFor` from
  `@/shared/utils` (or a ≥48 gesture row) — see [accessibility.md](./accessibility.md).

## Tokens

| Group | Tokens |
| --- | --- |
| Surfaces | `background` `backgroundAlt` `surface` `surfaceSoft` `surfaceDeep` |
| Text | `text` `textSecondary` `textMuted` `textDisabled` |
| Roles | `primary` (needs, navigation), `accent` (wants), `success` (savings), `warning` (bills, low meters) — each with `*Soft`, `*Strong`, `*Pressed`, `*Shadow` |
| Money | `coin` `coinBorder` `coinSoft` |
| Parents' area | `parent` `parentBackground` `parentSurface` `parentBorder` `parentText` `parentTextSecondary` |
| System | `border` `borderStrong` `disabled` `onDisabled` `overlay` `inverseSurface` `inverseText` |
| Shape | `RADII.xs…xxxl`, `RADII.pill`, `SPACING`, `HIT_SLOP_SIZE` |

All of it is theme-aware: read colors through `useTheme()`, never as literals.
The dark set exists so nothing crashes at night, but the night-room theme from
the mockups is still to be designed.

## Components

| Component | Props that matter | Covers |
| --- | --- | --- |
| `Text` | `variant`, `themeColor` | display 32/900 → label 10/700 |
| `Button` | `variant` (primary/accent/success/secondary/ghost), `size` (l/m/s), `isLoading`, `disabled`, `isFullWidth` | all four states, shadow-drop press |
| `Card` | `tone`, `isSelected`, `onPress` | content cards, selectable options |
| `Chip` | `variant` (neutral/selected/need/want/muted) | filters, category tags |
| `CoinBadge` | `amount`, `variant` (balance/delta/plain), `label` | balance pill, `+15` reward |
| `ProgressBar` | `value`, `color`, `height` | goals, meters, weekly budget |
| `MeterCard` | `label`, `value`, `color`, `tone` (default/low/idle), `icon` | the five needs row |
| `ListRow` + `ListRow.Icon` | `title`, `subtitle`, `icon`, `trailing`, `isSelected`, `isDone` | chores and shop rows |
| `Toast` | `variant` (dark/warning), `icon`, `onPress` | "coins saved", offline banner |
| `toast()` + `<Toaster />` | `toast(message, { variant, duration })`, `dismissToast`, `clearToasts` | queue, stacking, swipe-up and tap to dismiss — mechanics from `sonner-native`, the card is our own `Toast` passed through `toast.custom`; the host is mounted once in `_app/providers` |
| `Sheet` + `.Title` `.Description` `.Actions` | `isGrabberVisible` | the sheet card itself |
| `Sheet.Modal` | `isVisible`, `onClose`, `isDismissible` | the sheet over a scrim: scrim fades and card slides on separate timelines, drag the handle down (or flick) to dismiss |
| `Shape` | `variant` (circle/square/diamond/pill/leaf/dome), `size`, `color`, `isOutlined` | icon placeholders |
| `Card` + `.Title` `.Content` `.Footer` | `isSpread` в футере | карточка со слотами вместо длинного списка пропсов |
| `Button.Label` | — | иконка рядом с подписью: строка оборачивается сама, элементы идут в ряд |
| `Collapsible` + `.Trigger` `.Content` | `isOpen` / `isDefaultOpen`, `onOpenChange` | управляемый и неуправляемый режимы |
| `Slider` | `value`, `min`, `max`, `step`, `onChange` | терморегулятор, уровни |
| `Switch` | `isChecked`, `onChange`, `isDisabled` | переключатели раздела для взрослого |
| `Input` | `hint`, `isCounterVisible`, `maxLength` | имя робота и игровое имя |
| `HintRow` + `.Title` `.Hint` | — | «заголовок слева, значение справа» |
| `Screen` + `.Header` `.Back` | `variant`, `gap`, `isScrollable` | рамка экрана: фон, safe area, скролл, колонка |

Import everything from the barrel: `import { Button, Chip } from '@/shared/ui';`

## Where the kit is checked

The UI-kit screen ([`src/screens/ui-kit`](../src/screens/ui-kit/), second tab of
the app) renders every component with all of its states; `isLoading`, `disabled`
and the meter levels are switches at the top of the screen. There is no
Storybook — the kit runs inside the app on a real device. Adding a component
without putting it on that screen is incomplete work, see
[ui-conventions.md](./ui-conventions.md#where-components-are-checked).

## Still open

- **Nunito** is not bundled yet — the type scale runs on the system font. Add
  `@expo-google-fonts/nunito`, load it in `_app/providers`, then point
  `FONTS.sans` / `FONTS.rounded` at it.
- **Icons** are geometric placeholders (`Shape`). The final set is 24×24, 2px
  stroke, always with a text label.
- **Робопёс** живёт на 3D-сцене, не в ките: окрасы, клипы и стадии — см.
  [robot-dog.md](./robot-dog.md) и [scene.md](./scene.md).
- **`SpeechBubble`** удалён из кита; реплики персонажей будут собраны заново
  вместе со знакомством.
- **Night theme** and the parents' neutral screens use the tokens above but have
  no dedicated components yet.
