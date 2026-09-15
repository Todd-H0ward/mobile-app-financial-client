# UI conventions

Every component file — `shared/ui`, `widgets`, `screens/*/ui` — has the same
shape. The banners are load-bearing: they make a 200-line component scannable and
tell you where new code goes.

## File layout

```
imports
// TYPES              props (interfaces) and local types
// CONSTANTS          durations, sizes, magic numbers with a name
// ANIMATIONS         reanimated Keyframe / shared values defined once
// LIB                pure helpers used only by this file
// COMPONENTS         the components, leaves first, root last
// COMPOUND EXPORT    Object.assign(Root, { Part })
// STYLES             a single StyleSheet.create
export type { ... }  values are exported inline, types only here
```

Omit any section that has no content.

```tsx
// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════
```

## Rules

**Components** are arrow functions with destructured props and `...props` spread
last onto the underlying primitive:

```tsx
const Text = ({ style, variant = 'body', themeColor, ...props }: TextProps) => {
  const theme = useTheme();

  return (
    <RNText
      style={[{ color: theme[themeColor ?? 'text'] }, styles[variant], style]}
      {...props}
    />
  );
};
```

**Exports**: values inline, types at the bottom in a single statement.

```tsx
export const Text = ({ ... }: TextProps) => { ... };

// … end of file
export type { TextProps, TextVariant };
```

**Props are interfaces**, extending the props of the primitive they wrap:

```tsx
interface TextProps extends RNTextProps {
  variant?: TextVariant;
  themeColor?: ThemeColor;
}
```

A `type` alias is used only when the props add nothing
(`type HintRowTitleProps = TextProps;`) or when the shape is not an object —
unions, mapped and utility types (`type TextVariant = 'body' | 'title';`).

**Styles** live in one `StyleSheet.create` at the bottom, keys sorted
alphabetically inside each rule, outermost element named `root`. A component
always accepts `style` and merges it last so callers can adjust spacing.

**Variants over booleans.** A look is a `variant` prop whose values map 1:1 to
style keys (`styles[variant]`), not `isLarge` / `isPrimary` flags.

**Tokens over literals.** `SPACING.three`, `theme.backgroundElement`,
`FONTS.mono`. Raw hex is allowed only for brand-fixed surfaces (e.g. the splash
background). Fixed sizes go through `()` so they follow the device —
see [layout.md](./layout.md).

**Compound components** for multi-part UI, so markup stays declarative:

```tsx
<HintRow>
  <HintRow.Title>Try editing</HintRow.Title>
  <HintRow.Hint>
    <Text variant="code">src/screens/home/ui/home-screen.tsx</Text>
  </HintRow.Hint>
</HintRow>
```

Built with `Object.assign(HintRowRoot, { Title, Hint })` under the
`COMPOUND EXPORT` banner.

**Animations** are declared at module scope, not inside the component body — a
`Keyframe` recreated on every render is a bug (see
[`shared/ui/animated-icon.tsx`](../src/shared/ui/animated-icon.tsx)).

**Platform code** uses `Platform.select` / `Platform.OS` inline rather than
`.web.tsx` / `.native.tsx` twins, so a component stays one file.

## File layout of a component

One file per component — flat, no folder per component, since there are no CSS
modules or assets to co-locate:

```
src/shared/ui/
├── button.tsx
├── card.tsx
└── index.ts   # re-exports every component by name, never `export *`
```

Screens import from `@/shared/ui`; inside the layer a component imports its
neighbours directly (`import { Text } from './text';`).

## Where components are checked

There is no Storybook and no story files: the kit lives on the UI-kit screen
inside the app ([`src/screens/ui-kit`](../src/screens/ui-kit/), second tab).
A component that is not on that screen is incomplete work — the rule and the
required coverage live in
[AGENTS.md](../AGENTS.md#the-ui-kit-screen--mandatory-for-ui-components).
Switchable state (`loading`, `disabled`, meter levels) belongs to
`screens/ui-kit/model/use-playground.ts`, so one tap changes every example.

## Current kit

The kit is the «Лапка» design system — components, tokens and the principles
behind them are documented in [design-system.md](./design-system.md), and the
live gallery is the second tab of the app
([`src/screens/ui-kit`](../src/screens/ui-kit/)).

Import from the barrel: `import { Button, Text } from '@/shared/ui';`

## Подсказка — всегда в одном углу

Требование 2.5.1 «подсказка доступна в любой момент» выполняется только тогда,
когда её не приходится искать. `HintButton` из `@/widgets/hint-button` живёт в
слоте `trailing` у `Screen.Header` и больше нигде:

```tsx
<Screen.Header title="Лапка" trailing={<HintButton screen="home" />} />
```

Текста компонент не содержит: он берёт заголовок и абзацы из
`content/hints.json` через `entities/hint`. Новый экран — строка в JSON и id в
`HINT_SCREENS`; забытый экран роняет `content.test.ts`, а не показывает ребёнку
пустую шторку.
