# Architecture

The app follows [Feature-Sliced Design](https://feature-sliced.design) adapted
to expo-router: `src/app` is reserved by the router, so the FSD *app* layer lives
in `src/_app`, and FSD *pages* are called `screens`.

Working rules for agents and contributors live in [AGENTS.md](../AGENTS.md).
This file is the map of what is actually in the tree.

## Layers

```
src/
├── app/                      # expo-router routes ONLY — thin re-exports
│   ├── _layout.tsx           # Providers + root Stack
│   ├── index.tsx             # → screens/entry
│   ├── home.tsx
│   ├── heating.tsx
│   ├── onboarding.tsx
│   ├── pet-create.tsx
│   ├── pet-grew.tsx
│   ├── budget-plan.tsx
│   ├── end-period.tsx
│   ├── period-summary.tsx
│   ├── recovery.tsx
│   ├── shop/ · savings/ · tasks/ · games/
│   ├── history.tsx · glossary.tsx
│   ├── settings.tsx · parents.tsx · ui-kit.tsx
│   └── …
├── _app/
│   └── providers/            # Theme, Query, i18n, feedback, time, …
├── screens/
│   ├── entry/                # / → /home or /onboarding
│   ├── home/                 # три комнаты + HUD (2.5.3)
│   ├── heating/              # термостат, квитанция, утепление (house.md)
│   ├── onboarding/           # знакомство, три типа решений (2.5.1)
│   ├── pet-create/           # встреча с питомцем (2.5.2)
│   ├── pet-grew/             # разовая сцена роста (2.5.10)
│   ├── budget-plan/          # план по трём направлениям (2.5.5)
│   ├── end-period/           # мягкое подтверждение конца дня
│   ├── period-summary/       # план vs факт (2.5.5)
│   ├── recovery/             # путь после периода (2.5.9)
│   ├── shop/                 # каталог покупок (2.5.6)
│   ├── savings/              # цели и копилка (2.5.7)
│   ├── tasks/                # задания (2.5.8)
│   ├── games/                # аркада за chores
│   ├── history/ · glossary/  # 2.5.11
│   ├── settings/ · parents/  # ребёнок / взрослый (2.5.12)
│   └── ui-kit/               # витрина дизайн-системы
├── widgets/
│   ├── room-pager/           # street ↔ living ↔ kitchen
│   ├── hint-button/          # «?» в шапке (2.5.1)
│   ├── pet-box/ · plan-fact-bars/ · direction-look/
│   └── minigame/             # сцены аркады
├── features/
│   ├── demo-mode/            # тестовый профиль + 5 периодов (2.5.13)
│   ├── profile-restart/      # удаление профиля (2.5.12)
│   ├── feedback/             # «что изменилось и почему» (2.5.9)
│   ├── change-language/
│   └── games/                # вход в аркаду / лимиты сидений
├── entities/
│   ├── user/                 # сейв целиком, кошелёк, период, покупки, демо
│   ├── pet/                  # внешность, mood, рост, traits, ui/
│   ├── economy/              # таблица баланса (лист)
│   ├── budget/               # план, факт, compare, recovery tips
│   ├── catalogue/ · goal/ · task/ · glossary/ · onboarding/ · hint/
│   ├── room/                 # ROOM_IDS, слоты мебели
│   ├── savings/              # прогресс копилки, explain withdraw
│   ├── settings/             # арифметический барьер взрослых
│   └── minigame/             # правила аркады
└── shared/
    ├── constants/            # theme, routes, storage keys
    ├── hooks/ · utils/ · lib/
    ├── i18n/ · model/ · types/
    └── ui/                   # design-system components
```

Import direction is strictly downwards:
`app → _app → screens → widgets → features → entities → shared`.
Biome's `organizeImports` groups imports in that order (`biome.json`), so a
misplaced import is visible in the diff.

Wallet, period machine and heating bill live under `entities/user/lib/`
(`wallet`, `period`, `purchase`, …) — there is no separate `entities/wallet` or
`entities/heating`. Heating *UI* is `screens/heating`.

## Adding a screen

1. `src/screens/<name>/ui/<name>-screen.tsx` — the component.
2. `src/screens/<name>/index.ts` — `export { <Name>Screen } from './ui/<name>-screen';`
3. `src/app/<name>.tsx` — `import { <Name>Screen } from '@/screens/<name>'; export default <Name>Screen;`
4. Add a row to `STATIC_ROUTES` / `DYNAMIC_ROUTES` when the screen is reached by
   name, and a hint id in `HINT_SCREENS` + `content/hints.json` (2.5.1).

There is **no tab bar**. Navigation is a root `Stack`: `/home` holds the three
rooms (`widgets/room-pager`); everything else is pushed over the world. See
[AGENTS.md](../AGENTS.md#navigation-three-rooms-everything-else-on-the-stack).

A module that has a test is a folder: `rules.ts` and `rules.test.ts` live in
`rules/` beside an `index.ts` that re-exports the public API, and callers import
the folder. Adding a test then never touches a single call site.

Screen-local state goes to `model/` (hooks or a zustand store), screen-local
pure helpers to `lib/`, screen-local requests to `api/`. Anything a second
screen needs moves down a layer.

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
`entities/settings` holds what the grown-ups control (arithmetic gate, …).
Child-facing sound / motion switches live on `/settings` and on the user save.

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
  `@/content/*` (`tsconfig.json`); сейв хранит только id позиций.
- Числа экономики — в `entities/economy` (`balance.ts`): стартовый кошелёк,
  награды за задания, бонус регулярности, отопление (`HEATING`), лимит
  истории. Экраны числа не правят. Там же `directions.ts` — три направления
  бюджета (листовая сущность).
- Контентные сущности валидируют JSON при загрузке модуля:
  `onboarding`, `hint`, `task`, `goal`, `catalogue`, `glossary`. Битая строка
  падает в тестах, а не на первом экране ребёнка.
- Сетевого слоя нет: игровой цикл офлайн ([privacy.md](./privacy.md)).
  `shared/api`, axios и TanStack Query удалены — не заготовка, а сознательный
  отказ. Если появится синхронизация, слой поднимают заново вместе с бумагами
  по 152-ФЗ.
- `_app/providers` монтирует жесты, safe area, TimeSource, feedback и a11y.

## i18n

`shared/i18n` initializes i18next with `en` / `ru` bundles and resolves the
language from the device locale unless the user picked one
(`shared/model/preferences` → `languagePreference`). Use `useTranslation()` in
components; keep keys in `shared/i18n/locales/*.json`.

## Navigation

Root layout is a `Stack` (`src/app/_layout.tsx`). There is no `(tabs)` group and
no `app-tabs` widget: the world is `/home` + `widgets/room-pager`. Native tabs
were tried and abandoned — they abort iOS in Expo Go; details in
[AGENTS.md](../AGENTS.md#native-tabs-are-off--do-not-bring-them-back).

## React Compiler

Disabled in `app.json` (`experiments.reactCompiler: false`). It breaks
Reanimated worklets in this project — the details and the symptom are in
[AGENTS.md](../AGENTS.md#react-compiler-is-off--and-must-stay-off).

## Checks

```bash
pnpm lint                 # biome check (src + plugins)
pnpm format               # biome check --write
pnpm typecheck            # tsc --noEmit
pnpm test                 # vitest
pnpm test:coverage        # vitest + thresholds on economy / minigame
npx expo start            # run
```

Lint **is** Biome — `package.json` → `"lint": "biome check"`, scope in
`biome.json` → `files.includes` (`src/**`, `plugins/**`). Import groups follow
FSD: `app` → `_app` → `screens` → `widgets` → `features` → `entities` →
`shared` (no `@/pages`). There is no ESLint / `expo lint` / `reset-project`.

CI (`.github/workflows/ci.yml`) runs typecheck, `pnpm test:coverage` (economy +
minigame thresholds and i18n en↔ru key parity), and `pnpm lint` with
`contents: read`. A separate `autofix` job has `contents: write` only on
same-repo PRs to push Biome fixes.

Тесты бегут в node, без React Native: `vitest.config.mts` повторяет алиасы
`tsconfig.json` и больше ничего не делает. Всё, что тянет RN, подменяется
`vi.mock` в самом тесте — нативные модули вроде `expo-sqlite/kv-store` и баррель
`@/shared/constants`, который через `theme.ts` тянет `react-native`
(Flow-исходники, которые node не парсит).
