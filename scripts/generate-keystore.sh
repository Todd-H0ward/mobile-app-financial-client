#!/usr/bin/env bash
# Creates the release keystore used to sign the APK, plus the env file the
# build script loads. Both live in credentials/ and are never committed.
#
#   ./scripts/generate-keystore.sh [password]
#
# Losing this keystore means the next build can no longer upgrade an installed
# app — back up credentials/ somewhere safe.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
KEYSTORE="$ROOT/credentials/release.keystore"
ENV_FILE="$ROOT/credentials/android-release.env"
ALIAS="mobile-hackathon"
PASSWORD="${1:-${ANDROID_KEYSTORE_PASSWORD:-}}"

if [ -f "$KEYSTORE" ]; then
  echo "credentials/release.keystore already exists — delete it first to regenerate." >&2
  exit 1
fi

if [ -z "$PASSWORD" ]; then
  read -rsp "Keystore password (min 6 chars): " PASSWORD
  echo
fi

mkdir -p "$ROOT/credentials"

keytool -genkeypair -v \
  -keystore "$KEYSTORE" \
  -alias "$ALIAS" \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -storepass "$PASSWORD" -keypass "$PASSWORD" \
  -dname "CN=mobile-hackathon, OU=Mobile, O=mobile-hackathon, L=-, S=-, C=RU"

cat > "$ENV_FILE" <<ENV
ANDROID_KEYSTORE_PATH=$KEYSTORE
ANDROID_KEYSTORE_PASSWORD=$PASSWORD
ANDROID_KEY_ALIAS=$ALIAS
ANDROID_KEY_PASSWORD=$PASSWORD
ENV
chmod 600 "$ENV_FILE" "$KEYSTORE"

echo
echo "Keystore:  credentials/release.keystore"
echo "Env file:  credentials/android-release.env"
echo "Next:      npm run build:apk"
