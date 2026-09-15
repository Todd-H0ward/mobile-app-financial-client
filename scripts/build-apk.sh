#!/usr/bin/env bash
# Builds a signed release APK that installs on a physical device with no Metro
# and no development environment: the JS bundle is baked in.
#
#   ./scripts/build-apk.sh            # prebuild (if needed) + assembleRelease
#   ./scripts/build-apk.sh --clean    # regenerate android/ from scratch
#
# Output: build/mobile-hackathon-<version>.apk
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

ENV_FILE="credentials/android-release.env"
if [ -f "$ENV_FILE" ]; then
  set -a
  # shellcheck disable=SC1090
  . "$ENV_FILE"
  set +a
fi

if [ -z "${ANDROID_KEYSTORE_PATH:-}" ]; then
  echo "No release credentials found. Run ./scripts/generate-keystore.sh first." >&2
  echo "(Without them the APK would be signed with the throwaway debug key.)" >&2
  exit 1
fi

# Gradle for React Native 0.86 runs on JDK 17; a newer default JDK fails at
# configuration time, so pin it when one is installed.
if [ -z "${JAVA_HOME:-}" ] && /usr/libexec/java_home -v 17 >/dev/null 2>&1; then
  JAVA_HOME="$(/usr/libexec/java_home -v 17)"
  export JAVA_HOME
fi

export ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"

if [ "${1:-}" = "--clean" ] || [ ! -d android ]; then
  npx expo prebuild --platform android --clean
else
  # Re-runs the config plugins so the signing config matches the current env.
  npx expo prebuild --platform android
fi

(cd android && ./gradlew --console=plain app:assembleRelease)

VERSION="$(node -p "require('./app.json').expo.version")"
mkdir -p build
cp android/app/build/outputs/apk/release/app-release.apk "build/mobile-hackathon-$VERSION.apk"

echo
echo "APK: build/mobile-hackathon-$VERSION.apk"
echo "Install: adb install -r build/mobile-hackathon-$VERSION.apk"
