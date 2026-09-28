# Лицензии

Реестр прав на контент и зависимости прототипа. Обязательный пункт пакета
документации (п. 8 сдачи / проверка по 8.2). Обновлено **27.09.2026**.

## Правило

Ассет попадает в репозиторий **только вместе со строкой в таблице ниже**.
Строка заполняется в том же PR, что и файл. Пустая колонка «Лицензия / права»
— повод не мержить.

## Итог для пакета сдачи

| Категория | Право на использование в прототипе | Где подтверждение |
| --- | --- | --- |
| 3D-модели и текстуры сцены | да — оригинальные работы команды / поставка для проекта | раздел [3D](#3d-модели-и-текстуры) + `assets/*/AUTHORSHIP.md` |
| Шрифты UI | да — SIL OFL 1.1 | `assets/fonts/*-OFL.txt` |
| Шрифт глифов на клетках | да — MgOpen / Magenta | `helvetiker-bold.typeface.json` |
| Звуки | да — синтез скриптом проекта, без чужих семплов | `scripts/generate-game-audio.py` |
| Бренд, иконки, 2D-арт | да — создано для проекта | таблицы ниже |
| npm runtime-граф | да — декларации SPDX; копилефт-GPL в прямых зависимостях нет | `pnpm audit:licenses` → `build/runtime-dependencies.json` |

## 3D-модели и текстуры

В бинарниках **не найдено** сторонних меток Sketchfab / Poly Pizza / Kenney /
Mixamo и т.п. Метаданные указывают на пайплайн команды (Cinema 4D, экспорт
через `THREE.GLTFExporter`). Права на использование в составе прототипа и
пакета сдачи принадлежат **команде прототипа Finni** (`mobile-hackathon`).

| Ассет | Источник / авторство | Лицензия / права | Статус |
| --- | --- | --- | --- |
| `assets/scene/сцена.fbx` | Оригинальная арена; экспорт Maxon Cinema 4D 2026.1.0 | © команда Finni; использование в прототипе разрешено | подтверждено |
| `assets/scene/scene.json` | Производная арены (`scripts/fbx-to-scene.mjs`) | то же, производная работа | подтверждено |
| `assets/scene/textures/concrete.png` | Текстура бетона для ячеек; поставлена для прототипа | © команда Finni; использование в прототипе разрешено | подтверждено |
| `assets/scene/textures/rust.png` | Процедурная ржавчина для шестерён (`scripts/generate-rust-texture.py`) | © команда Finni; синтез без сторонних семплов | подтверждено |
| `assets/scene/watchers/keeper.glb` + `screens/keeper/*` | Оригинальная поставка художника для проекта (рабочее имя `Hranitel_kind_AI`); README — техническая инструкция | © команда Finni / художник проекта; использование в прототипе разрешено | подтверждено |
| `assets/scene/watchers/overseer.glb` + `screens/overseer/*` | Оригинальная поставка (`Smotritel_evil_AI`) | то же | подтверждено |
| `assets/robot-dog/robot-dog.glb` | Оригинальная модель робопса для проекта | © команда Finni; внесена в репозиторий участницей команды (Ekaterina Bulgakova) | подтверждено |
| `assets/robot-dog/skins/*`, `previews/*` | Оригинальные окрасы и превью (7 наборов) | то же | подтверждено |
| Геометрия модулей в рантайме | Код `widgets/room-scene/lib/robot-modules` | код проекта (MIT репозитория шаблона не распространяется на арт; модули — часть прототипа) | подтверждено |

Краткие заявления об авторстве лежат рядом с ассетами:

- [`assets/scene/AUTHORSHIP.md`](../assets/scene/AUTHORSHIP.md)
- [`assets/robot-dog/AUTHORSHIP.md`](../assets/robot-dog/AUTHORSHIP.md)
- [`assets/scene/watchers/keeper.README.txt`](../assets/scene/watchers/keeper.README.txt) /
  [`overseer.README.txt`](../assets/scene/watchers/overseer.README.txt) — технические
  заметки поставки (не стоковые лицензии).

## Шрифты

| Шрифт | Файлы | Лицензия | Автор / источник | Статус |
| --- | --- | --- | --- | --- |
| Golos Text | `assets/fonts/GolosText-*.ttf` | SIL OFL 1.1 | The Golos Text Project Authors — [googlefonts/golos-text](https://github.com/googlefonts/golos-text); текст лицензии `GolosText-OFL.txt` | в бандле |
| Martian Mono | `assets/fonts/MartianMono-*.ttf` | SIL OFL 1.1 | The Martian Mono Project Authors — [evilmartians/mono](https://github.com/evilmartians/mono); `MartianMono-OFL.txt` | в бандле |
| Helvetiker Bold (typeface.js) | `src/widgets/room-scene/lib/scene-glyphs/helvetiker-bold.typeface.json` | MgOpen / разрешение Magenta Ltd (2004) | встроено в JSON (`license_url`, `license_description`); используется только для номеров клеток на 3D-сцене | в бандле |

Кандидаты Inter / Nunito / Onest из раннего черновика **не используются**.

## Изображения и бренд

| Ассет | Источник | Лицензия / права | Статус |
| --- | --- | --- | --- |
| `assets/branding/finni.svg` | команда проекта | © команда Finni | готово |
| `assets/images/icon.png`, `splash-icon.png`, `favicon.png`, `android-icon-*.png` | производные от бренда / сборка иконки | © команда Finni | готово |
| `assets/expo.icon/**` | конфиг иконки Expo Icon Composer + бренд | бренд — свой; шаблон Expo — MIT | готово |
| `assets/images/games/*` | арт аркады (консоль, Spacewar) | © команда Finni | готово |
| `assets/images/rooms/living.webp` | остаток старого концепта, сгенерировано командой | © команда Finni | готово (не используется как карта комнат) |

Логотипы шаблона Expo из стартового шаблона удалены: заставка — терминал на
кольцах ямы.

## Звуки

| Ассет | Источник | Лицензия / права | Статус |
| --- | --- | --- | --- |
| `assets/audio/*.wav` | синтез `scripts/generate-game-audio.py` (без сторонних записей и сэмплов) | © команда Finni | готово |

Выключение звука — настройка `isSoundEnabled` (требование 3.6,
[accessibility.md](./accessibility.md)).

## Контент JSON

Файлы в `content/` (уроки, задания, каталог, цели, сюжет, глоссарий) —
оригинальный текст команды прототипа. © команда Finni.

## Библиотеки (npm)

Проверка установленного графа из `package.json → dependencies`:

```bash
pnpm audit:licenses
```

Пишет машиночитаемый отчёт в `build/runtime-dependencies.json` (каталог
`build/` в git не хранится — отчёт генерируется перед сдачей и кладётся в
пакет). Нативные Maven/Gradle-артефакты Android этим отчётом **не** покрыты.

Снимок **27.09.2026**: **584** пакета, не найденных — 0, без декларации
лицензии — 0. Распределение деклараций (не юридическое заключение):

| SPDX / выражение | ≈ кол-во |
| --- | --- |
| MIT | 507 |
| ISC | 25 |
| Apache-2.0 | 11 |
| BSD-2-Clause / BSD-3-Clause | 21 |
| BlueOak-1.0.0 | 6 |
| прочие (MPL-2.0, CC-BY-4.0, CC0-1.0, Unlicense, Python-2.0, dual) | < 20 |

Прямых зависимостей с жёстким копилефтом GPL/AGPL в корневом `package.json`
нет. Dual `BSD-3-Clause OR GPL-2.0` у транзитивного `node-forge` — допустимый
выбор BSD-ветки для прототипа.

Ключевые прямые зависимости приложения:

| Библиотека | Лицензия |
| --- | --- |
| expo, expo-router и модули Expo | MIT |
| react, react-native | MIT |
| three, expo-gl, expo-asset, expo-audio, expo-sqlite | MIT |
| react-native-reanimated, gesture-handler, screens, safe-area-context | MIT |
| zustand | MIT |
| i18next, react-i18next | MIT |
| sonner-native | MIT |
| biome, typescript, vitest (dev) | MIT / Apache-2.0 |

Таблицу прямых зависимостей сверять с `package.json` при каждом добавлении;
полный граф — через `pnpm audit:licenses`.

## Код приложения

Исходники в `src/`, `scripts/`, `plugins/` — работа команды прототипа поверх
шаблона Expo. Корневой [`LICENSE`](../LICENSE) — MIT шаблона Expo (© 650
Industries); это не заменяет таблицы ассетов выше.
