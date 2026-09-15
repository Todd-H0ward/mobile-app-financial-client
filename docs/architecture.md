# Architecture

The template follows [Feature-Sliced Design](https://feature-sliced.design) adapted
to expo-router: `src/app` is reserved by the router, so the FSD *app* layer lives
in `src/_app`, and FSD *pages* are called `screens`.

## Layers

```
src/
├── app/                    # expo-router routes (thin re-exports)
│   ├── _layout.tsx         # providers + navigation
│   ├── index.tsx           # → screens/home
│   └── explore.tsx         # → screens/explore
├── _app/
│   └── providers/          # ThemeProvider, QueryProvider, global init
├── screens/
│   ├── entry/              # куда пускать на старте: /home или /onboarding
│   ├── onboarding/         # цель игры, профиль, создание питомца
│   ├── budget-plan/        # план по трём направлениям (2.5.5)
│   ├── period-summary/     # план vs факт (2.5.5)
│   ├── shop/               # каталог покупок (2.5.6)
│   ├── savings/            # цели и копилка (2.5.7)
│   ├── tasks/              # задания (2.5.8)
│   ├── history/            # история и итоги (2.5.11)
│   ├── parents/            # раздел для взрослого (2.5.12)
│   ├── ui-kit/             # витрина дизайн-системы
│   ├── home/
│   │   ├── index.ts        # public API
│   │   ├── ui/home-screen.tsx
│   │   └── lib/get-dev-menu-hint.tsx
│   └── explore/
│       ├── index.ts
│       └── ui/explore-screen.tsx
├── widgets/
│   └── app-tabs.tsx        # native bottom tabs
├── features/
│   ├── demo-mode/          # тестовый профиль + 5 периодов подряд (2.5.13)
│   └── feedback/           # «что изменилось и почему» после действия (2.5.9)
├── entities/
│   ├── user/               # сейв целиком, миграции, сброс и удаление
│   ├── period/             # конечный автомат периода + TimeSource
│   ├── budget/             # план, факт, сравнение
│   ├── wallet/             # баланс, история, запрет минуса
│   ├── savings/            # цели и копилка
│   ├── catalogue/          # каталог покупок из content/
│   ├── task/               # движок заданий из content/
│   ├── pet/                # внешность, черты, состояния, рост
│   ├── home/               # отопление, квитанция, утепление
│   └── settings/           # что настраивает взрослый
└── shared/
    ├── api/                # axios instance + react-query client
    ├── constants/          # theme tokens, storage keys, app version
    ├── hooks/              # useTheme, useColorScheme, useAppLanguage, …
    ├── utils/              # чистые хелперы (clamp, formatMoney)
    ├── i18n/               # i18next config + locales
    ├── model/              # device preferences (theme, language)
    ├── types/              # cross-cutting types
    └── ui/                 # design-system components
```

Import direction is strictly downwards:
`app → _app → screens → widgets → features → entities → shared`.
Biome's `organizeImports` groups imports in exactly that order, so a misplaced
import is visible in the diff.

## Adding a screen

1. `src/screens/<name>/ui/<name>-screen.tsx` — the component.
2. `src/screens/<name>/index.ts` — `export { <Name>Screen } from './ui/<name>-screen';`
3. `src/app/<name>.tsx` — `import { <Name>Screen } from '@/screens/<name>'; export default <Name>Screen;`
4. Register the tab in [`src/widgets/app-tabs.tsx`](../src/widgets/app-tabs.tsx) if
   it belongs to the tab bar (`name` must match the route file name).

A module that has a test is a folder: `rules.ts` and `rules.test.ts` live in
`rules/` beside an `index.ts` that re-exports the public API, and callers import
the folder. Adding a test then never touches a single call site.

Screen-local state goes to `model/` (a zustand store or hooks), screen-local pure
helpers to `lib/`, screen-local requests to `api/`. Anything a second screen needs
moves down a layer.

## Adding a shared UI component

One file, `src/shared/ui/<name>.tsx`, re-exported by name from
[`src/shared/ui/index.ts`](../src/shared/ui/index.ts), and an entry on the
UI-kit screen ([`src/screens/ui-kit`](../src/screens/ui-kit/)) — mandatory.
Follow the file layout in [ui-conventions.md](./ui-conventions.md).

## Theming

`shared/constants/theme.ts` holds the palette (`COLORS.light` / `COLORS.dark`),
`SPACING`, `FONTS`, and layout constants. Components never hardcode colors:

```tsx
const theme = useTheme();          // palette for the active color scheme
<ThemedView variant="backgroundElement" />
<Text variant="small" themeColor="textSecondary" />
```

`useTheme()` reads `useColorScheme()`, which obeys the saved preference and
falls back to the device. Both device preferences — `themePreference` and
`languagePreference` — live in
[`shared/model/preferences`](../src/shared/model/preferences.ts), next to the
code that obeys them (`useColorScheme`, `useAppLanguage`), and not in an entity:
`shared` cannot import upwards, so a preference stored above it could only be
read by copying it, which is how two sources of truth start.
`entities/settings` holds what the grown-ups control — pin, difficulty,
confirmation, chat, notifications.

## Вёрстка под разные размеры

Слоя адаптивного масштабирования в проекте нет: размеры — обычные точки
дизайна, а разницу между телефоном и планшетом решают flex и
`MAX_CONTENT_WIDTH`. Подробно — в [layout.md](./layout.md).

## Data

- Профиль, сохранение и абстракция времени — в
  [game-state.md](./game-state.md); игровой период — в
  [game-period.md](./game-period.md). Носитель — `expo-sqlite/kv-store`,
  читается синхронно, поэтому сейв доступен уже на первом кадре;
  единственное место, где носитель выбирается, — `shared/model/persist-storage`.
- Учебный контент лежит в `content/*.json` и отделён от кода — требование
  2.5.14, см. [content.md](./content.md). Импортируется по алиасу
  `@/content/*` (`tsconfig.json`), сейв хранит только id позиций
  (прогресс заданий появится позже; тексты остаются в JSON).
- Числа экономики — в `entities/economy` (`balance.ts`): стартовый кошелёк,
  награды за задания, бонус регулярности, лимит истории. Экраны числа не
  правят.
- Каталог заданий читает `entities/task` из `content/tasks.json` по типу
  механики; седьмое задание того же типа — строка в JSON без правки `.tsx`.
- `shared/api/api-client.ts` — axios instance, base URL from
  `EXPO_PUBLIC_API_URL`, 40s timeout.
- `shared/api/query-client.ts` — TanStack Query defaults (60s `staleTime`,
  one retry, no refetch on focus).
- Requests belong to the slice that owns the data: `entities/<entity>/api/*` for
  entity CRUD, `screens/<screen>/api/*` for screen-specific queries.
- `_app/providers` mounts `QueryClientProvider`; add new providers there.

## i18n

`shared/i18n` initializes i18next with `en` / `ru` bundles and resolves the
language from the device locale unless the user picked one
(`entities/settings` → `languagePreference`, persisted under
`STORAGE_KEYS.LANGUAGE`). Use `useTranslation()` in components; keep keys in
`shared/i18n/locales/*.json`.

## Navigation

The tabs live in `src/app/(tabs)/` behind a `Stack` in the root layout, so the
parents' section can be pushed over them. `widgets/app-tabs.tsx` uses the stable
`Tabs` navigator — the native one crashes the app on iOS, see
[AGENTS.md](../AGENTS.md#native-tabs-are-off--the-stable-navigator-is-used-instead).

## React Compiler

Disabled in `app.json` (`experiments.reactCompiler: false`). It breaks
Reanimated worklets in this project — the details and the symptom are in
[AGENTS.md](../AGENTS.md#react-compiler-is-off--and-must-stay-off).

## Checks

```bash
npx tsc --noEmit          # types
npx biome check --write src   # lint + format + import order
pnpm test                 # vitest, чистая логика и сторы
npx expo start            # run
```

Тесты бегут в node, без React Native: `vitest.config.mts` повторяет алиасы
`tsconfig.json` и больше ничего не делает. Всё, что тянет RN, подменяется
`vi.mock` в самом тесте — нативные модули вроде `expo-sqlite/kv-store` и баррель
`@/shared/constants`, который через `theme.ts` тянет `react-native`
(Flow-исходники, которые node не парсит).
