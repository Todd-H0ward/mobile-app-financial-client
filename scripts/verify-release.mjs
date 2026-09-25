import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const config = JSON.parse(fs.readFileSync('app.json', 'utf8')).expo;
const sdk = process.env.ANDROID_HOME ?? path.join(os.homedir(), 'Library/Android/sdk');
const tools = path.join(sdk, 'build-tools/36.0.0');
const apk = `build/mobile-hackathon-${config.version}.apk`;
const aab = `build/mobile-hackathon-${config.version}.aab`;
const run = (command, args) => execFileSync(command, args, { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const signing = run(path.join(tools, 'apksigner'), ['verify', '--verbose', '--print-certs', apk]);
run(path.join(tools, 'zipalign'), ['-c', '-P', '16', '4', apk]);
const badging = run(path.join(tools, 'aapt'), ['dump', 'badging', apk]);
const permissions = run(path.join(tools, 'aapt'), ['dump', 'permissions', apk]);
const files = run('unzip', ['-Z1', apk]).split('\n');
assert(badging.includes(`name='${config.android.package}'`), 'Wrong package identity');
assert(badging.includes(`versionName='${config.version}'`), 'Wrong version name');
assert(badging.includes(`versionCode='${config.android.versionCode}'`), 'Wrong version code');
assert(badging.includes(`application-label:'${config.name}'`), 'Wrong launcher name');
assert(!badging.includes('application-debuggable'), 'Release must not be debuggable');
assert(!signing.includes('Android Debug'), 'APK is signed with a debug certificate');
assert(files.includes('assets/index.android.bundle'), 'Embedded offline JS bundle missing');
assert(files.some((file) => file.endsWith('.glb')), 'Embedded robot/scene models missing');
assert(files.filter((file) => file.endsWith('.wav')).length >= 2, 'Offline sound cues missing');
for (const permission of ['android.permission.RECORD_AUDIO', 'android.permission.FOREGROUND_SERVICE_MICROPHONE', 'android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK']) {
  assert(!permissions.includes(`name='${permission}'`), `Unexpected audio permission: ${permission}`);
}
for (const permission of config.android.blockedPermissions ?? []) {
  assert(!permissions.includes(`name='${permission}'`), `Forbidden permission remains: ${permission}`);
}
const bundleSignature = run('jarsigner', ['-verify', '-J-Duser.language=en', aab]);
assert(bundleSignature.includes('jar verified.'), 'AAB signature verification failed');
const bundleFiles = run('unzip', ['-Z1', aab]).split('\n');
assert(bundleFiles.includes('base/assets/index.android.bundle'), 'AAB offline bundle missing');
const fingerprint = (file) => ({ path: file, bytes: fs.statSync(file).size, sha256: createHash('sha256').update(fs.readFileSync(file)).digest('hex') });
const report = {
  status: 'artifact-checks-passed',
  limitation: 'Build and archive checks only. Does not certify device behaviour, visual quality or completion of product requirements.',
  applicationName: config.name, package: config.android.package,
  version: config.version, versionCode: config.android.versionCode,
  apk: fingerprint(apk), aab: fingerprint(aab),
  certificateSha256: signing.match(/certificate SHA-256 digest: (\S+)/)?.[1],
  minSdk: badging.match(/sdkVersion:'([^']+)'/)?.[1],
  targetSdk: badging.match(/targetSdkVersion:'([^']+)'/)?.[1],
  nativeCode: badging.match(/native-code: (.+)/)?.[1],
  permissions: [...permissions.matchAll(/uses-permission: name='([^']+)'/g)].map((match) => match[1]),
};
fs.writeFileSync('build/release-verification.json', `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
