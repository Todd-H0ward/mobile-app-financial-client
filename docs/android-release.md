# Релизный APK для Android

Сборка подписанного APK, который ставится на физический телефон без Metro,
без Expo Go и вообще без среды разработки: JS-бандл и ассеты зашиты внутрь.

## Что нужно один раз

| Требование | Проверка |
| --- | --- |
| JDK 17 | `/usr/libexec/java_home -v 17` |
| Android SDK (platform 36, build-tools 36+) | `ls $ANDROID_HOME` или `~/Library/Android/sdk` |
| Зависимости | `pnpm install` |

Android Studio нужен только как удобный способ поставить SDK — сборка идёт
через gradle wrapper из `android/`.

## 1. Ключ подписи

```sh
npm run keystore          # спросит пароль
```

Создаёт (обе вне git, см. `.gitignore`):

- `credentials/release.keystore` — ключ (RSA 2048, срок 10 000 дней);
- `credentials/android-release.env` — путь, алиас и пароли для сборки.

Ключ нужно **сохранить**: APK, подписанный другим ключом, не встанет
поверх уже установленного — телефон потребует удалить приложение.

Чужой ключ (CI, другой разработчик) подключается теми же переменными:
`ANDROID_KEYSTORE_PATH`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`,
`ANDROID_KEY_PASSWORD` — env перекрывает файл.

## 2. Сборка

```sh
npm run build:apk           # инкрементально
npm run build:apk -- --clean  # пересоздать android/ с нуля
```

Скрипт [scripts/build-apk.sh](../scripts/build-apk.sh):

1. загружает `credentials/android-release.env`;
2. фиксирует JDK 17 и `ANDROID_HOME`;
3. `expo prebuild --platform android` — генерирует нативный проект;
4. `./gradlew app:assembleRelease`;
5. кладёт результат в `build/mobile-hackathon-<version>.apk`.

Первая сборка занимает 10–20 минут (CMake для reanimated, worklets, screens),
последующие — 2–3 минуты. Нужно около 10 ГБ свободного места: нативные объекты
живут в `node_modules/**/.cxx` и `android/app/.cxx`.

Две сборки в одной папке одновременно (в том числе «убитая» сборка, чей
gradle-демон ещё жив) затирают промежуточные файлы друг друга — это выглядит
как случайные `No such file or directory`. Перед перезапуском:
`cd android && ./gradlew --stop`.

## 3. Установка на телефон

```sh
adb install -r build/mobile-hackathon-1.0.0.apk
```

Без кабеля: перекинуть файл на телефон (диск, мессенджер) и открыть его,
разрешив «установку из неизвестных источников» для приложения-проводника.

В APK лежат нативные библиотеки под `arm64-v8a` и `armeabi-v7a` — это все
физические Android-телефоны. Эмуляторные x86/x86_64 из релиза исключены
([plugins/with-android-abis.js](../plugins/with-android-abis.js)): они удваивают
время сборки и занимают лишние гигабайты, а для эмулятора есть отладочная
сборка `npm run run:android`. Если релиз всё же нужен под x86, соберите с
`ANDROID_RELEASE_ABIS_ALL=1 npm run build:apk`.

## CI

[`.github/workflows/build-apk.yml`](../.github/workflows/build-apk.yml) гоняет
тот же `scripts/build-apk.sh`, только берёт ключ не с диска разработчика, а из
секретов репозитория. Запускается пушем ветки `release/*` (например
`release/20.09.2026`, обычно отрезанной от `develop`, когда сборка готова к
выдаче) — не по каждому пушу в `main` или `develop`, чтобы не жечь минуты CI на
коммиты, которые никто не выпускает. APK кладётся и в артефакт прогона, и в
GitHub Release с именем ветки; повторный пуш той же ветки обновляет тот же
релиз, а не падает на дубликате.

Одноразовая настройка, репозиторий → Settings → Secrets and variables →
Actions:

| Секрет | Значение |
| --- | --- |
| `ANDROID_KEYSTORE_BASE64` | `base64 -i credentials/release.keystore \| pbcopy` (macOS) |
| `ANDROID_KEYSTORE_PASSWORD` | из `credentials/android-release.env` |
| `ANDROID_KEY_ALIAS` | `mobile-hackathon`, если ключ не переименовывали |
| `ANDROID_KEY_PASSWORD` | тот же пароль, что и у стораджа (скрипт задаёт оба одинаковыми) |

Ключ для CI — тот же самый `credentials/release.keystore`, что и для локальной
сборки, просто закодированный: два разных ключа означают, что сборка из CI не
встанет поверх сборки, собранной руками, и наоборот (см. «Ключ подписи» выше).
Без `ANDROID_KEYSTORE_BASE64` шаг сборки падает явной ошибкой, а не откатывается
на отладочный ключ.

Второй workflow, [`ci.yml`](../.github/workflows/ci.yml), проверяет каждый PR
без Android SDK и без секретов: `tsc --noEmit`, `vitest run`, `biome check` —
то же самое, что перечислено в разделе Workflow в AGENTS.md.

## Почему подпись живёт в конфиг-плагине

`android/` генерируется `expo prebuild` и не коммитится — правка
`android/app/build.gradle` руками исчезнет при следующем prebuild. Поэтому
[plugins/with-android-release-signing.js](../plugins/with-android-release-signing.js)
на каждом prebuild:

- добавляет `signingConfigs.release`, читающий gradle-свойства;
- переключает `buildTypes.release` с отладочного ключа на релизный;
- записывает свойства в `android/gradle.properties` из env.

Без переменных окружения плагин не делает ничего — `expo prebuild` и
`expo run:android` продолжают работать у того, кому релиз не нужен.

## Версии

`app.json → expo.version` — то, что видит пользователь;
`expo.android.versionCode` — целое, которое Android сравнивает при обновлении.
Перед новой раздачей билда поднимайте `versionCode`, иначе установка поверх
старой версии не пройдёт.

## Если сборка падает

| Симптом | Причина |
| --- | --- |
| `Unsupported class file major version` | взят JDK не 17 — снимите `JAVA_HOME` или поставьте `export JAVA_HOME=$(/usr/libexec/java_home -v 17)` |
| `SDK location not found` | нет `ANDROID_HOME`; скрипт подставляет `~/Library/Android/sdk` |
| `No such file or directory` в aapt2 / hermesc / cxx | мусор от прерванной или параллельной сборки. `cd android && ./gradlew --stop`, затем `rm -rf android/app/build android/app/.cxx` и `npm run build:apk` |
| `CMAKE_C_COMPILER not set` / `ninja: error: loading 'build.ninja'` | испорченный кеш CMake или кончилось место на диске: `rm -rf android/app/.cxx`, проверьте `df -h` (полная сборка требует ~10 ГБ) |
| `INSTALL_FAILED_UPDATE_INCOMPATIBLE` | на телефоне лежит сборка с другим ключом — удалить приложение |
