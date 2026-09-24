# Лапка

Мобильная игра про карманные деньги: ребёнок ведёт бюджет игрового периода,
выполняет задания, копит и помогает робособаке выбраться из ямы. Expo SDK 57 / React Native,
Android — целевая платформа, сборка релизного APK описана ниже.

## Быстрый старт

```sh
pnpm install
npx expo start        # затем «a» — Android, «i» — iOS
```

Скрипты:

| Команда | Что делает |
| --- | --- |
| `npm start` | Metro + Expo Dev Tools |
| `npm run android` / `npm run ios` | открыть на эмуляторе/симуляторе |
| `npm run run:android` | нативная отладочная сборка на устройство |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | `biome check` (`src` + `plugins`) |
| `npm run format` | `biome check --write` |
| `npm run test` | vitest |
| `npm run test:coverage` | vitest + coverage gates (economy / minigame) |
| `npm run keystore` | одноразовая генерация ключа подписи |
| `npm run build:apk` | подписанный релизный APK в `build/` |

## Релизный APK

```sh
npm run keystore      # один раз: ключ в credentials/ (вне git)
npm run build:apk     # build/mobile-hackathon-1.0.0.apk
adb install -r build/mobile-hackathon-1.0.0.apk
```

APK собран под arm64-v8a и armeabi-v7a (все физические телефоны), JS-бандл внутри —
на телефоне не нужны ни Metro, ни Expo Go, ни Android Studio.
Требования к машине сборщика, работа с ключом, версии и разбор типичных
ошибок: [docs/android-release.md](docs/android-release.md).

## Структура

```
src/
├── app/        # маршруты expo-router — только реэкспорт экранов
├── _app/       # провайдеры и глобальная инициализация
├── screens/    # экраны
├── widgets/    # составные блоки для нескольких экранов
├── features/   # пользовательские действия
├── entities/   # бизнес-сущности: model + api + ui
└── shared/     # переиспользуемый код без знания о домене
plugins/        # конфиг-плагины Expo (подпись релиза)
scripts/        # ключ подписи, сборка APK
docs/           # спецификация и регламенты
```

Импорты идут только вниз по слоям. Правила — в
[AGENTS.md](AGENTS.md) и [docs/architecture.md](docs/architecture.md).

## Документация

Точка входа — [docs/README.md](docs/README.md): дорожная карта, экономика,
игровой период, робопёс, доступность, матрица соответствия ТЗ.
