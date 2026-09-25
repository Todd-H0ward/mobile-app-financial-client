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

Draw calls are a separate and still-unpaid debt: roughly 260 against the 50 in
`docs/design-brief-3d.md`, and 68 800 triangles against 50 000. Most of it is
three glTF models that arrive pre-split — the robot dog alone is 111 meshes
and 35 648 triangles, the keeper 60 and 19 004, the overseer 54 and 8 746.
Merging each by material would take those 225 draw calls down to about 15.
That is worth doing, but it was not what was costing the frames.


## Cells: the ninety pressable tiles

The FBX holds 90 discs: five terraces of eighteen tiles. Each ring has three
slots cut in it, one per gear, at 98.5°, 218.5° and 338.5° — measured off the
vertices, and the gear sits in the slot. Between two slots run six unbroken
tiles, and **those six are a segment's row**. Five rows, six cells, ninety
tiles, three bays.

Do not trust `node.segment` from the converter for this. It buckets each tile
by its nearest gear, which cuts every bay down the middle and leaves a gear
standing in the centre of it. `cellsOf` regroups by angle instead. Nor can a
tile's position be read off `matrix[12..14]`: the tiles are clones and their
transforms carry rotation and scale with the translation left at zero, so
every one of them looks like it is standing on the axis. `nodeAngle` averages
the transformed vertices, the same trap the converter had to work around.

Each cell is framed and pressable.

The six cells of a terrace are **merged into one buffer**. Ninety separate
meshes would be ninety draw calls for a floor, and the arena is already well
over the draw-call budget in `docs/design-brief-3d.md`. The price of merging
is that a ray comes back with a triangle index and no idea whose it is, so
`build-scene` writes the first triangle of each cell onto the mesh
(`userData.starts`) and `cellOfFace` turns a hit back into a cell. The frames
are merged the same way: one `LineSegments` per terrace per segment, fifteen
in all, plus one bright outline that moves to whichever cell is selected.

Two things to know before touching them:

- **Cell order is angular, not file order.** `cellsOf` sorts by the angle
  around the axis so `cell` means a place on the arc. The game will store
  cell indices; a modelling accident must not move them.
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
| `geometries` | 33 уникальные геометрии, плоские массивы `position` / `normal` |
| `nodes` | 95 инстансов: индекс геометрии, номер сектора, матрица 4×4 |
| `segmentAngles` | Азимуты трёх секторов: 98.5° / 218.5° / 338.5° |
| `bounds` | Габариты и `sphereRadius` — по нему кадрируется камера |
| `camera` | Угол и дистанция камеры, оставленной художником в сцене |

Геометрия шарится: 90 из 95 нод — один и тот же диск из 12 треугольников.
Поэтому `scene.json` весит ~180 КБ при 5403 треугольниках.

**Сектор считается по центроиду меша, а не по трансформу клона.** Клонер в C4D
поворачивает клоны, оставляя трансляцию нулевой, — по трансформу все 90 дисков
попадали бы в одну комнату.

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

Главная механика сцены — **подъём уровня**. Чаша модели это ступенчатый конус:
**пять террас**, каждая на 40 единиц выше и шире предыдущей (радиусы
133 → 400). Робопёс стоит в центре на платформе.

- **Уровень 0** — платформа внизу, ребёнок видит все пять террас.
- **Каждый подъём** поднимает платформу ровно на одну террасу, и вместе с ней
  поднимаются **все пройденные террасы** — они встают вровень с полом.
- Две террасы на одной высоте читаются как одна ступень, поэтому уровней
  видно всё меньше: 5 → 4 → 3 → 2 → 1.
- **Уровень 5** — вся чаша сошлась в одну плоскость.

Террасы обязаны подниматься вместе с платформой: иначе платформа уезжает
вверх одна и робопёс висит в воздухе.

Вся математика — в `entities/scene/lib/pit`, чистая и покрытая тестами:
`platformLiftY`, `terraceLiftY`, `terracesInView`, `gearAngle`.

## Три шестерни

Вокруг чаши стоят **три вертикальных колеса** (в модели это `Loft_0…2`) на
радиусе 410, высотой 319 единиц. Это не декор, а механизм, который поднимает
пол: они крутятся, пока платформа едет, и замирают вместе с ней.

Ось у колеса **горизонтальная и касательная** — оно катится вокруг чаши, а не
вращается как юла. Меш сдвигается на центр собственной ограничивающей сферы,
иначе колесо вращалось бы вокруг центра всей арены и улетало по кругу.

Соседние колёса крутятся в разные стороны, как сцепленные зубья.

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
