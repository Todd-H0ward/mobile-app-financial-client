# 3D-сцена на главной

Главный экран — это одна 3D-модель: круглая арена из трёх секторов. Комната не
отдельная картинка, а сектор модели; переход между комнатами — поворот сцены
под камерой, а не перелистывание страниц.

## Lights are the frame budget

The scene renders at five lights and **adding a sixth can halve the frame
rate**. Measure before you add one — the camera rig panel shows the frames
per second next to the orbit readout.

It used to have nine: a key and a fill directional, a hemisphere, an ambient,
a point light over the middle, an overhead spot, and a coloured point lamp
over each of the three wedges. On the emulator's software renderer that was
**6 fps; at five lights it is 28** — the same view, the same geometry, a 4.7×
difference from lighting alone.

The reason is that the cost is per pixel, not per light. Every point and spot
light is another full lighting calculation for every pixel the arena covers,
and the arena covers the screen — which is also why a segment view (close,
d 1500) ran slower than the map (far, d 2350) before this was fixed. Timing
the loop showed where it went: `built.tick()` cost 0–6 ms a frame while
`webgl.render()` cost 17–82 ms.

What is left, and why:

- **key, fill** (directional), **hemisphere**, **ambient** — effectively free.
  They have no position, so there is nothing to attenuate from.
- **centre** (point) — the pool of light the robot stands in. The one light here
  that costs anything, and the one worth it.

What went, and why it was not missed:

- The **spot** lit the same pool as `centre`, and a cone with a penumbra and a
  falloff is the most expensive light there is.
- The **three room lamps** tinted each wedge in its own colour. They were
  built when the wedges were rooms; `highlight` already tints a segment
  through its material, which costs nothing per pixel.

Draw calls are a separate debt: the three glTF models arrive pre-split — the
robot dog alone is 111 meshes and 35 648 triangles, the keeper 60 and 19 004,
the overseer 54 and 8 746. Merging each by material would take those 225
draw calls down to about 15, but the clips animate each mesh on its own.
The arena itself is now small: 15 row buffers, 15 frame buffers, 15 number
buffers, three gears and the floor.

## Pixels are the frame budget

The other half of a frame is how many pixels get shaded, and two things
were spending it for nothing:

- **The sky ran fifteen octaves of noise per pixel.** The haze sphere sits
  behind the whole screen, so its fragment shader ran for every pixel of it
  every frame — sixty `sin` calls each — to paint soft, slow mist. It is now
  worked out per vertex (`haze-backdrop.ts`, three octaves on a 64×32
  sphere) and the fragment shader only writes the interpolated colour.
- **The arena was drawn at the phone's full density.** At 2.75–3× that is
  two and a half million Phong pixels with a point light. `room-scene.tsx`
  caps it at `MAX_RENDER_DENSITY` (1.75): the `GLView` is laid out smaller
  and scaled up with a transform — on Android it is a `TextureView`, which
  the compositor scales for free. Taps still map through the outer view,
  whose aspect the surface keeps.

Also: the bays are opaque until a highlight fade starts (`setFade`). A solid
arena in the transparent pass is sorted every frame and loses early depth
rejection, which on a fill-bound GPU is most of what it has.

## Cells: built from the content, not from the model

The FBX holds 90 discs, five rings of eighteen, with three slots cut in each
ring — one per gear, at 98.5°, 218.5° and 338.5°. The app **no longer draws
them**. The converter measures them instead (ring radii and heights, the
17.14° slot, and `slotted` — whether a gear actually stands in the ring; see
`tiles` in `scene.json`) and leaves them out, together with the ramps that
climbed through the inner slots. `lib/cell-geometry` builds the cells at
runtime from `arenaLayout(count)` in `entities/scene`:

- **Ring 0 is the platform**, level with the floor the robot stands on: one
  plain ring in the floor's colour, no cells. Lessons start on the first step.
- **The content cuts the rows.** Each lesson names its theme (`sector`,
  the bay) and its step (`level`); `placeLessons` counts them into
  `counts[segment][step]` and `arenaLayoutOf` turns that into arcs. A row is
  spread over the whole of its bay's arc, however many cells it has, up to
  `rowCapacity` (7 / 11 / 12 / 14 — a cell no shorter than
  `SCENE_MIN_CELL_LENGTH`). The shipped content is 5 / 7 / 8 / 10 per theme.
- **Numbering is per theme**, row by row up the steps, each row against the
  heading so that from in front of its bay it reads left to right.
- **A ring keeps its slots only where a gear stands in it.** Only the two
  outer rings do; on the inner ones the bays meet gear line to gear line, so
  the slot that had nothing in it — a bald patch — is gone.
- A row opens as a whole: platform at its step, the row below it in the same
  bay done. `ARENA_LAYOUT` (`entities/lesson`) is the one cut the game uses;
  never compute keys or ordinals by arithmetic — ask `layoutOrdinal`,
  `layoutCell`, `rowCells` or `cellFromKey(key, layout)`.
- A step left bare by short content is drawn whole and dimmed. Past ninety
  lessons extra ones stack on the same cells (`lessonIndicesForCell`).

**Two sets of numbers.** On the map they lie on the tile tops, turned to read
upright from the map's fixed heading (`TOP_AZIMUTH`) — radially outward they
were upside down on the near rim. In a bay they stand on the cell fronts, the
wall that faces the axis: from a camera at eye level a tile top is a sliver.
`setNumberFace` picks one. A third set lies on the tops turned to the bay's
own camera: a step the lift has laid flush has no front left, so a bay reads
that row off its tops instead.

Each row — the cells of one step in one bay — is **one buffer**, and so
are its frames and its numbers: 36 draw calls for the whole floor, where the
numbers alone used to be ninety meshes with a material each. A ray comes
back with a triangle index, so the row mesh carries the first triangle of
each cell (`userData.starts`) and `cellOfFace` turns a hit back into a cell.
Numbers are rebuilt per row when access changes; their colour rides on the
vertices, so one opaque material serves every status.

Things to know before touching them:

- **A passed cell stays where it is** and lights up: the number and the frame
  turn the HUD's green, the tile brightens (`setCellsDone`). It used to drop
  a step, and a hole in the floor read as a bug rather than a reward. What
  takes steps away is the lift, below.
- **The outlines are lifted one unit.** An edge sitting exactly on the face it
  came from is a coin toss per pixel on a phone GPU, and the frame comes out
  dashed and crawling.

## Откуда берётся геометрия

Исходник — `assets/scene/сцена.fbx` (экспорт из Cinema 4D, FBX 7700, бинарный).
В рантайме его никто не читает: FBX-лоадер из `three/examples` тянет за собой
`fflate`, NURBS и парсер, который весит больше самой сцены.

Вместо этого есть конвертер:

```bash
node scripts/fbx-to-scene.mjs
```

Он разбирает бинарный FBX, считает мировые матрицы (включая `PreRotation` и
`GeometricTranslation`), триангулирует полигоны и кладёт результат в
`assets/scene/scene.json` — его и импортирует приложение.

Что внутри JSON:

| Поле | Что это |
| --- | --- |
| `geometries` | 2 геометрии (шестерня, диск пола), `position` / `normal` |
| `nodes` | 4 инстанса: три шестерни и пол — индекс геометрии, сектор, матрица 4×4 |
| `tiles` | Замеры 90 дисков: кольца (радиусы, высоты), дуга диска и прорези |
| `segmentAngles` | Азимуты трёх секторов: 98.5° / 218.5° / 338.5° |
| `bounds` | Габариты и `sphereRadius` — по нему кадрируется камера |
| `camera` | Угол и дистанция камеры, оставленной художником в сцене |

Диски в файл не попадают — приложение строит ячейки само (см. выше), поэтому
`scene.json` весит ~140 КБ при 4323 треугольниках.

**Сектор считается по центроиду меша, а не по трансформу клона.** Клонер в C4D
поворачивает клоны, оставляя трансляцию нулевой, — по трансформу все 90 дисков
попадали бы в одну комнату. По той же причине замеры дисков берутся по их
вершинам.

Если модель поменялась — перезапустите конвертер и закоммитьте оба файла.

## Кто что знает

- `entities/scene` — данные модели, палитра (единственный файл со цветами в
  слайсе, это проверяет тест) и чистая математика орбиты: `orbitPosition`,
  `fitDistance`, `nearestSegment`, `damp`. Всё это тестируется в node, без GL.
- `widgets/room-scene` — сборка сцены `three` из JSON, `GLView`, цикл рендера,
  жест и кнопки.
- `screens/home` — только состояние «какой вид сейчас».

## Камера

Камера всегда смотрит в центр арены и живёт в сферических координатах:
азимут, подъём, дистанция.

- **Стартовый вид — сверху** (`TOP_ELEVATION = 82°`): видна вся карта сразу.
  Не 90° — на полюсе направление взгляда совпадает с вектором «вверх», и
  картинка начинает крутиться вокруг своей оси.
- **Вид комнаты** — угол камеры художника, с **противоположной стороны круга**
  (`SCENE_VIEW_ANGLES = segmentAngles + 180°`). Если встать на азимут самого
  сектора, смотришь ему в спину.
- **Дистанция считается от пропорций экрана** (`fitDistance`), а не берётся
  константой: телефон в портрете намного уже, чем выше, и кадрирование решает
  ширина. Слоя масштабирования в проекте нет — см. [layout.md](layout.md).

Свайп крутит модель, на отпускании камера примагничивается к ближайшему
сектору; свайп вверх выводит на вид сверху. Кнопки внизу — второй способ
попасть туда же: жест не может быть единственным путём (3.6).

## Подъём из ямы

Главная механика сцены — **подъём уровня**, оплаченный из копилки. Чаша —
ступенчатый конус: площадка под псом (кольцо 0) и **четыре ступени с уроками**,
каждая на 40 единиц выше и шире предыдущей. Робопёс не поднимается — яма
опускается вокруг него, **по одной ступени за подъём**:

| Подъём | Что происходит | Что открывается |
| --- | --- | --- |
| 0 | Видны все четыре ступени | Ступень 1 во всех трёх темах |
| 1 | Ступень 1 встаёт вровень с площадкой, крутятся шестерни, летит пыль | Ступень 2 — она теперь стена перед псом |
| 2 | Ступень 2 вровень с площадкой | Ступень 3 |
| 3 | Ступень 3 вровень с площадкой | Ступень 4 |
| 4 | Ступень 4 (край) вровень — яма плоская | — |
| 5 | Выход из ямы: шестерни докручиваются, играет финал (`story/finale`) | — |

- Каждый подъём опускает **все** кольца на одну высоту ступени, и каждое
  останавливается, когда встаёт вровень с полом. Поэтому после подъёма `N`
  ступень `N` лежит на полу, а ступень `N + 1` стоит ровно на одну ступень
  выше — новая стена, ряд которой только что открылся (`lessonAccess`).
- Пройденные уроки ступени не опускают: их ячейки светятся зелёным. Ступени
  убирает только подъём — так картинка, уровень платформы и открытый ряд
  всегда совпадают.
- У ступени, ушедшей на пол, нет передней грани, поэтому в виде сектора её
  номера переезжают на верх плиток (`flushSteps`, `applyNumbers`).

### Подъём виден ребёнку

Подъём покупают в терминале Хранителя, пока камера смотрит на него, а экран
копилки закрывает сцену. Раньше анимация проигрывалась сразу и целиком
уходила за этот экран: ребёнок возвращался в яму, которая уже сдвинулась.
Теперь так:

- `confirmLift` уводит на `DYNAMIC_ROUTES.liftedHome(level)`. Главный экран
  по параметру `lifted` закрывает терминал и переводит камеру на карту.
- `RoomScene` держит подъём, пока камера не вернулась на арену
  (`CLIMB_FOCUS_GATE`), и только тогда запускает пыль и движение.
- **Механизм — отдельно от ямы.** На карте яма всегда разложена в диск
  (`liftProgressFor`), поэтому ступени там не двигаются. Колёса и колонны
  идут за настоящим ярусом через `setClimbProgress`, а не через
  `setLevelProgress`. Карта — единственный вид, где они на экране, и подъём
  читается именно по ним.

Кнопка «Запустить подъёмник» видна всегда, когда копилка яруса полна: на
странице копилки в терминале она заменяет «Положить». Правило сущности не
меняется, `applyPlatformUpgrade` по-прежнему требует идущий период. Если
плана ещё нет, кнопка открывает «Сначала план» со своим текстом про подъём,
а не прячется.

Вся математика — в `entities/scene/lib/pit`, чистая и покрытая тестами:
`sinkBudget`, `terraceSinkY`, `flushSteps`, `terracesInView`, `gearAngle`.

## Три шестерни

Вокруг чаши стоят **три вертикальных колеса** (в модели это `Loft_0…2`) на
радиусе 410, высотой 319 единиц. Это не декор, а механизм, который поднимает
пол: они крутятся, пока платформа едет, и замирают вместе с ней.

Ось у колеса **горизонтальная и касательная** — оно катится вокруг чаши, а не
вращается как юла. Меш сдвигается на центр собственной ограничивающей сферы,
иначе колесо вращалось бы вокруг центра всей арены и улетало по кругу.

### Колонны

За каждым колесом, снаружи от ямы, стоит **бетонная колонна** 290×260 с
**пазом по центру** той грани, что смотрит в яму. Обод колеса заходит в паз, а
на дне паза лежит ржавая **зубчатая рейка**, и колесо катится по ней. Всё
строится в приложении (`lib/column-geometry.ts`), в FBX этого нет, так что
модель и скрипт конвертации не трогались.

- **Иллюзия подъёма.** Колонна закреплена в мире, а платформа с колёсами
  «едет» вверх. Камера при этом стоит на месте, поэтому на экране колонна
  скользит **вниз** (`columnTravel`), а колесо катится по рейке без
  проскальзывания: `gearAngle = −columnTravel / SCENE_GEAR_PITCH_RADIUS`. Все
  три колеса крутятся в одну сторону, каждое по своей рейке.
- **Зубья совпадают.** Шаг рейки берётся из колеса (13 зубьев, радиус 150), а
  впадина стоит там, где в покое стоит зуб колеса (`SCENE_GEAR_TOOTH_PHASE`).
  Все три числа сняты с модели. Если художник поменяет колесо, их нужно
  перемерить.
- **Бетон, а не пластик.** У колонны свой матовый материал (Lambert, без
  блика) с текстурой `concrete` в крупном масштабе (`COLUMN_TEX_SCALE`),
  иначе на расстоянии пятна сливаются в серое. Каждые 300 единиц идёт
  утопленный шов опалубки, и соседние заливки чуть разного тона. Швы заодно
  показывают, что столб едет. Рейка носит ржавчину колёс и висит на колонне
  дочерним объектом, поэтому едет и гаснет вместе с ней.
- **Колонна без концов.** Она уходит на 2200 единиц вниз и на 3000 вверх:
  концов не видно ни с одной камеры, а запас сверху покрывает весь ход за игру.

## Пыль и искры

Подъём сопровождается выбросом с края платформы — `lib/lift-effects.ts`.

Две системы частиц на `ShaderMaterial`: медленная широкая **пыль** (220 частиц,
вес платформы) и короткие яркие **искры** (90 частиц, аддитивный блендинг,
механизм под нагрузкой). Обе смонтированы на платформе, поэтому летят с той
высоты, где событие и произошло.

Вся симуляция — в вершинном шейдере: позиция, скорость и время жизни, а
JS-поток каждый кадр меняет **одно** число `uTime`. Цикл рендера здесь и так
на JS-потоке, и триста частиц, пересчитанных на нём, стоили бы кадра.

## Два ИИ над ареной

За ареной наблюдают два экрана — `assets/scene/watchers/`:

- **Смотритель** (`overseer`) — строгий ИИ, левитирующий телевизор. Клипы
  `Watch_Nablyudenie`, `Talk_Rech`, `Anger_Gnev`, `Scan_Skanirovanie`.
- **Хранитель** (`keeper`) — добрый ИИ на потолочном кронштейне. Клипы
  `Idle_Pokoy`, `Talk_Rech`, `Joy_Radost`, `Sleep_Son`.

Игра говорит о них одним словарём — `idle` / `talk` / `react` / `rest`, —
а `WATCHER_CLIPS` переводит его в имена художника: у строгого «react» это
гнев, у доброго — радость.

**Они висят на камере, а не в мире.** В сцене нет своего потолка, а ИИ,
которого надо искать за спиной, ничего не сторожит. Группа поворачивается
вслед за азимутом камеры, поэтому строгий всегда слева кадра, добрый справа —
на любом из трёх видов комнат.

Координаты в `WATCHER_PLACEMENT` намеренно небольшие: камера стоит в ~2200
единицах, объектив 45°, экран вертикальный — на полуширину кадра остаётся
около 400 единиц. Повесишь шире — уедут за край.

Из поставки скрыты `Ceiling` (плита потолка у хранителя) и `FX_Field` /
`FX_FloorGlow` (гало левитации у смотрителя): README обеих моделей это
разрешает, а плита потолка выше, чем арена шириной.

Лицо на экране — отдельный PNG, положенный в `emissiveMap` материала
`Screen`, по той же причине, что и шкуры пса: expo-gl читает текстуру только
из файла. Кадры `idle` / `talk` / `react` / `rest` меняют эмоцию лица.
**Слова и меню живут не в текстуре**, а в React-панели
`widgets/watcher-terminal` под лицом (зелёный Хранитель / красный Смотритель):
expo-gl не умеет произвольный текст без записи файла на диск. При фокусе
модель поднимается на `WATCHER_FOCUS_LIFT`, чтобы под экраном осталось место
под терминал.

За ареной наблюдают два экрана — `assets/scene/watchers/`:

- **Смотритель** (`overseer`) — строгий ИИ, левитирующий телевизор. Клипы
  `Watch_Nablyudenie`, `Talk_Rech`, `Anger_Gnev`, `Scan_Skanirovanie`.
- **Хранитель** (`keeper`) — добрый ИИ на потолочном кронштейне. Клипы
  `Idle_Pokoy`, `Talk_Rech`, `Joy_Radost`, `Sleep_Son`.

Игра говорит о них одним словарём — `idle` / `talk` / `react` / `rest`, —
а `WATCHER_CLIPS` переводит его в имена художника: у строгого «react» это
гнев, у доброго — радость.

**Они висят на камере, а не в мире.** В сцене нет своего потолка, а ИИ,
которого надо искать за спиной, ничего не сторожит. Группа поворачивается
вслед за азимутом камеры, поэтому строгий всегда слева кадра, добрый справа —
на любом из трёх видов комнат.

Координаты в `WATCHER_PLACEMENT` намеренно небольшие: камера стоит в ~2200
единицах, объектив 45°, экран вертикальный — на полуширину кадра остаётся
около 400 единиц. Повесишь шире — уедут за край.

Из поставки скрыты `Ceiling` (плита потолка у хранителя) и `FX_Field` /
`FX_FloorGlow` (гало левитации у смотрителя): README обеих моделей это
разрешает, а плита потолка выше, чем арена шириной.

## Живые лица ИИ

`widgets/room-scene/lib/watcher-face` оживляет исходные PNG локальным
смещением UV: глаза моргают и немного смотрят по сторонам, рот в состоянии
`talk` движется короткими группами с паузами. У Хранителя в `react` / `rest`
глаза уже закрыты на рисунке, поэтому их не деформируем. Это стилизованная
речь, не синхронизация с фонемами аудиозаписи.

Новых текстур, мешей, проходов отрисовки и перезаписей текстуры каждый кадр
нет. Используются прежние `map` и `emissiveMap` одного материала экрана,
а цикл меняет только числовые параметры. Области рта и глаз ограничены,
чтобы подписи и щёки оставались неподвижными. Явные градиенты `textureGrad`
сохраняют выбор mip-уровня при сжатии век: разрыв UV иначе даёт светлую рамку.
Это WebGL2-путь существующего Three.js-рендера.

Когда модели скрыты, их цикл останавливается. При `isAnimated=false` лицо
возвращается к исходному PNG, а клипы корпуса не продвигаются. Ресурсы
освобождает прежний `watchers.dispose`; анимация не владеет отдельными
текстурами. Четыре эмоции каждого ИИ по-прежнему загружаются один раз;
плавность на слабом Android нужно измерять на устройстве, отдельно от
браузерной проверки шейдера.

## Робопёс в центре арены

В центре стоит робопёс (`assets/robot-dog/`). Это отдельная
модель, не часть арены: `widgets/room-scene/lib/center-character.ts` грузит её
асинхронно, чтобы арена успела отрисоваться раньше.

### Текстуры лежат файлами, а не внутри GLB

**Это главное ограничение, и оно не обходится.** expo-gl загружает текстуру,
передавая нативной стороне путь `file://` — он читает пиксели через `stb_image`
(`EXGLImageUtils.cpp`). Картинка, упакованная внутрь GLB, — это байты в памяти,
файла у неё нет, и `GLTFLoader` честно пишет
`Couldn't load texture`, а модель остаётся белой.

Поэтому:

- геометрия и клипы — один `robot-dog.glb` (3.4 МБ) **без встроенных картинок**;
- окрасы — обычные PNG в `assets/robot-dog/skins/<скин>/`, которые
  `expo-asset` кладёт на диск (`downloadAsync`), а `Texture.image` получает
  `{ localUri, width, height }`;
- **в релизной сборке ни `require`, ни `fetch` напрямую не работают.** На
  Android модель резолвится в голое имя ресурса (`assets_robotdog_robotdog`),
  которое `fetch` открыть не может, а картинка помечается «скачанной» с тем же
  именем вместо пути — `downloadAsync` пропускается, и expo-gl получает имя, а
  не файл. Так в APK не грузились ни пёс, ни оба ИИ. Всё, что грузит сцена,
  идёт через `lib/local-asset` (`localFileOf`, `readAssetBytes`,
  `loadGlTexture`): он копирует ресурс из APK в кэш и отдаёт `file://`.
  Проверять — только сборкой со встроенным бандлом: в dev файлы приходят с
  Metro по http, и ошибка не видна;
- вырезает картинки из GLB скрипт:

```bash
node scripts/strip-glb-textures.mjs исходник.glb assets/robot-dog/robot-dog.glb
```

Все семь окрасов — одна и та же сетка и одни и те же клипы, поэтому смена
окраса не перезагружает модель: меняются три текстуры. Семь файлов по 5 МБ
превратились в один на 3.4 МБ плюс 4.6 МБ albedo.

### Материалы

Из семи материалов текстуру носят три: `Body`, `Dark` и `Metal` (последний —
карту, которую художник назвал `mid`). `Glow` и `Accent` — плоские цвета.
Normal / roughness / metalness сняты намеренно: они стоят вдвое-вчетверо
больше памяти и выведены за рамки первого этапа
([design-brief-3d.md](design-brief-3d.md)). Металличность зажата: в сцене нет
environment map, и `metalness = 1` рисуется чёрным силуэтом.

### Состояния

В модели четыре клипа — `Idle_Pokoy`, `Walk_Hodba`, `Joy_Radost`, `Sad_Grust`.
Имена живут в одном месте, `entities/robot-dog`, там же идентификаторы окрасов.

- **Настроение робота решает, что пёс делает.** Таблица — `actionForMood` в
  `entities/robot-dog`: гордый радуется, скучающий ходит, обоим несчастным
  настроениям достаётся грусть. Пока профиля нет, работает переключатель из
  настроек. Подробнее — [robot-dog.md](./robot-dog.md).
- **Тап по псу** — разовая реакция с возвратом в своё состояние. Луч
  проверяется по самой модели, а не по половине экрана: камера крутится, и тап
  по полу рядом не должен вызывать виляние.
- Переходы между клипами — кроссфейд, никогда не резкая склейка.

### Чего модель не соблюдает

111 мешей (≈ столько же draw call'ов при лимите 50) и 35 648 треугольников при
рабочем максимуме 30 000. Уложиться можно только переделкой модели: анимация
двигает каждый меш отдельно, поэтому слить их нельзя.

## Почему не `expo-three` и не `@react-three/fiber`

Нужен был ровно один кусок `expo-three` — объект-заглушка «канваса» для
`WebGLRenderer`. Он занимает десяток строк в `room-scene.tsx` и не тянет
зависимость, которая отстаёт от версий SDK.

`@react-three/fiber` здесь тоже лишний: сцена строится один раз и не зависит от
React-состояния — меняется только положение камеры, и оно живёт в рефах.

## Правила, которые здесь легко нарушить

- **Цикл рендера — это JS-поток.** Жест объявлен как `Gesture.Pan().runOnJS(true)`:
  всё, чего он касается (`three`, GL-контекст), живёт на JS-потоке, а ворклет
  может звать только ворклеты — см. AGENTS.md.
- **Камера не в стейте.** Драг двигает её 60 раз в секунду; через `useState`
  это 60 ре-рендеров. React узнаёт о смене вида только когда камера встала.
- **Размер поверхности меняется без события.** Цикл сам сверяет
  `gl.drawingBufferWidth` с прошлым кадром и пересобирает проекцию.

## Если сцена не видна

Проверено на симуляторе: пайплайн рабочий — three компилирует программу и
рисует все 5403 треугольника (`renderer.info.render.triangles`), камера стоит
на месте, буфер совпадает с экраном. При этом бывает, что GL-поверхность не
доезжает до экрана и окно остаётся цвета фона приложения. Что известно:

- **Fast Refresh не пересоздаёт цикл рендера.** Он живёт в замыкании
  `onContextCreate`, а контекст создаётся один раз. Любая правка внутри цикла
  видна только после **полного перезапуска приложения** — не после
  сохранения файла. Половина «правка не работает» — про это.
- **Заливка — не фон приложения.** Если залить GL заведомо ярким цветом
  (`setClearColor(new Color('#ff00ff'), 1)`), сразу видно, выводится
  поверхность вообще или нет. Цвет фона темы совпадает с фоном экрана, и по
  нему это не отличить.
- **Диагностика без Metro-терминала.** `console.*` из приложения до симулятора
  по `log stream` не доходит, а инспектор Metro отдаёт 401. Рабочий способ —
  временный `<Text>` поверх сцены, в который пишутся
  `renderer.info.render.calls`, позиция камеры и `gl.getError()`.
- `GLView` монтируется только после `onLayout` и пересоздаётся при смене
  размера: контекст, выданный на нулевом размере, рисует в буфер, который
  никогда не показывается.
