#!/usr/bin/env bash
# Build the signed APK and Android App Bundle from the same checkout and key.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export NODE_ENV=production
./scripts/build-apk.sh "$@"
if [ -z "${JAVA_HOME:-}" ] && /usr/libexec/java_home -v 17 >/dev/null 2>&1; then
  export JAVA_HOME="$(/usr/libexec/java_home -v 17)"
fi
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
(cd android && ./gradlew --console=plain app:bundleRelease)
VERSION="$(node -p "require('./app.json').expo.version")"
BUNDLE="build/mobile-hackathon-$VERSION.aab"
cp android/app/build/outputs/bundle/release/app-release.aab "$BUNDLE"
jarsigner -verify "$BUNDLE"
shasum -a 256 "$BUNDLE" > "$BUNDLE.sha256"
echo "AAB: $BUNDLE"
