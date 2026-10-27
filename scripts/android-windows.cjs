/* global __dirname */
const { spawn } = require('node:child_process');
const { copyFileSync, existsSync, mkdirSync, openSync, closeSync, readFileSync, readdirSync, unlinkSync, writeFileSync } = require('node:fs');
const { join, resolve } = require('node:path');
const { connectUsb, getUsbDeviceName } = require('./usb-windows.cjs');
const { assertHostedApiUrl, exportApk } = require('./apk-artifact.cjs');

if (process.platform !== 'win32') {
  console.error('Run this local Android launcher from Windows PowerShell or CMD.');
  process.exit(1);
}

const microsoft = join(process.env.ProgramFiles || 'C:\\Program Files', 'Microsoft');
const installedJdks = existsSync(microsoft)
  ? readdirSync(microsoft).filter((name) => name.startsWith('jdk-17'))
    .sort().reverse().map((name) => join(microsoft, name))
  : [];
const javaHome = [process.env.HIMA_JAVA_HOME, ...installedJdks, process.env.JAVA_HOME]
  .filter(Boolean).find((directory) => {
    const release = join(directory, 'release');
    return existsSync(join(directory, 'bin', 'java.exe')) && existsSync(release)
      && /^JAVA_VERSION="17(?:\.|\")/m.test(readFileSync(release, 'utf8'));
  });
const sdkHome = process.env.HIMA_ANDROID_SDK || process.env.ANDROID_HOME
  || join(process.env.LOCALAPPDATA || '', 'Android', 'Sdk');

if (!javaHome) {
  console.error('Java 17 was not found. Set HIMA_JAVA_HOME to your JDK 17 installation folder.');
  process.exit(1);
}

console.log(`Java 17: ${javaHome}`);
console.log(`Android SDK: ${sdkHome}`);

const required = [
  ['platforms/android-36/android.jar', 'Android SDK Platform 36 (Android 16)'],
  ['build-tools/36.0.0/aapt2.exe', 'Android SDK Build-Tools 36.0.0'],
  ['platform-tools/adb.exe', 'Android SDK Platform-Tools'],
  ['cmdline-tools/latest/bin/sdkmanager.bat', 'Android SDK Command-line Tools (latest)'],
];
const missing = required.filter(([path]) => !existsSync(join(sdkHome, path)));
if (missing.length) {
  console.error('Install these components in Android Studio > SDK Manager:');
  for (const [, label] of missing) console.error(`  - ${label}`);
  console.error('Expo SDK 57 uses Platform 36; the installed Platform 37 can remain alongside it.');
  process.exit(1);
}

if (process.argv.includes('--check')) {
  console.log('Windows Java and Android SDK checks passed.');
  process.exit(0);
}

// Configure only this child process. Do not change Windows user/system settings.
const env = { ...process.env };
const currentPath = env.Path || env.PATH || '';
for (const key of Object.keys(env)) {
  if (['PATH', 'JAVA_HOME', 'ANDROID_HOME', 'ANDROID_SDK_ROOT'].includes(key.toUpperCase())) delete env[key];
}
Object.assign(env, {
  JAVA_HOME: javaHome,
  ANDROID_HOME: sdkHome,
  ANDROID_SDK_ROOT: sdkHome,
  Path: `${join(javaHome, 'bin')};${join(sdkHome, 'platform-tools')};${currentPath}`,
});
const root = resolve(__dirname, '..');
const usb = process.argv.includes('--usb');
const apkOnly = process.argv.includes('--apk-only');
const args = process.argv.slice(2).filter((arg) => !['--usb', '--apk-only'].includes(arg));
if (apkOnly && usb) {
  console.error('Use --apk-only for the hosted backend or --usb for local development.');
  process.exit(1);
}
if (usb) env.EXPO_PUBLIC_API_URL = 'http://127.0.0.1:3001';
const variantIndex = args.indexOf('--variant');
const variant = args.find((arg) => arg.startsWith('--variant='))?.split('=')[1]
  || (variantIndex >= 0 ? args[variantIndex + 1] : 'debug');
const release = !['debug', 'debugOptimized'].includes(variant);
if (apkOnly && variant !== 'release') {
  console.error('APK-only builds require --variant release. Use npm.cmd run apk:windows.');
  process.exit(1);
}
if (release && !env.EXPO_PUBLIC_API_URL) {
  console.error('Set EXPO_PUBLIC_API_URL before building an APK with embedded JavaScript.');
  console.error('For a USB phone: npm.cmd run android:windows -- --usb --variant release');
  console.error('The Android default (10.0.2.2) only works in an emulator.');
  process.exit(1);
}
if (env.EXPO_PUBLIC_API_URL) {
  let api;
  try { api = new URL(env.EXPO_PUBLIC_API_URL); } catch { /* Report below. */ }
  if (!api || !['http:', 'https:'].includes(api.protocol) || api.username || api.password || api.search || api.hash) {
    console.error('EXPO_PUBLIC_API_URL must be an HTTP(S) base URL without credentials, query or fragment.');
    process.exit(1);
  }
  console.log(`Hima backend baked into this build: ${env.EXPO_PUBLIC_API_URL}`);
}

function run(executable, command, cwd = root) {
  return new Promise((resolveRun, reject) => {
    const child = spawn(executable, command, { cwd, env, stdio: 'inherit' });
    child.once('error', (error) => reject(new Error(`Could not start the build tool (${error.code || 'unknown error'}).`)));
    child.once('exit', (code, signal) => {
      if (code === 0) resolveRun();
      else reject(new Error(signal ? `Build interrupted (${signal}).` : `Build tool exited with code ${code}.`));
    });
  });
}

const runExpo = (command) => run(process.execPath, [join(root, 'node_modules', 'expo', 'bin', 'cli'), ...command]);

function preserveSigningKey() {
  const backup = join(root, '.credentials/hima-demo.keystore');
  const native = join(root, 'android/app/debug.keystore');
  mkdirSync(join(root, '.credentials'), { recursive: true });
  if (!existsSync(backup) && existsSync(native)) copyFileSync(native, backup);
  return () => {
    if (existsSync(backup)) copyFileSync(backup, native);
    else if (existsSync(native)) copyFileSync(native, backup);
    else throw new Error('The Android signing key is missing. Do not distribute an unsigned APK.');
  };
}

// run:android skips prebuild when android/ already exists. Apply config plugins
// explicitly so a rebuilt APK cannot retain the old native HTTP policy.
async function build() {
  let lock;
  let releaseCode;
  const statePath = join(root, '.release/version-code.json');
  const lockPath = join(root, '.release/build.lock');
  const app = JSON.parse(readFileSync(join(root, 'app.json'), 'utf8')).expo;
  if (apkOnly) {
    env.EXPO_PUBLIC_API_URL = assertHostedApiUrl(env.EXPO_PUBLIC_API_URL);
    mkdirSync(join(root, '.release'), { recursive: true });
    try { lock = openSync(lockPath, 'wx'); } catch {
      throw new Error('An APK-only build is already reserved. If no build is running, remove .release/build.lock and retry.');
    }
  }
  try {
    if (apkOnly) {
      const previous = existsSync(statePath) ? JSON.parse(readFileSync(statePath, 'utf8')).versionCode : 0;
      const nativeMeta = join(root, 'android/app/build/outputs/apk/release/output-metadata.json');
      const nativeCode = existsSync(nativeMeta) ? JSON.parse(readFileSync(nativeMeta, 'utf8')).elements?.[0]?.versionCode ?? 0 : 0;
      if (!Number.isInteger(previous) || previous < 0 || !Number.isInteger(nativeCode)) throw new Error('Invalid saved release version code.');
      releaseCode = Math.max(app.android.versionCode ?? 1, previous + 1, nativeCode + 1);
      if (env.HIMA_APK_VERSION_CODE) {
        const explicit = Number(env.HIMA_APK_VERSION_CODE);
        if (!/^[1-9]\d*$/.test(env.HIMA_APK_VERSION_CODE) || explicit < releaseCode) {
          throw new Error(`HIMA_APK_VERSION_CODE must be at least ${releaseCode} for this release.`);
        }
        releaseCode = explicit;
      }
      if (releaseCode > 2100000000) throw new Error('Android version code limit exceeded.');
      env.HIMA_APK_VERSION_CODE = String(releaseCode);
      console.log(`Hosted APK version: ${app.version} (${releaseCode})`);
    }
  if (usb) {
    const serial = await connectUsb(sdkHome);
    env.ANDROID_SERIAL = serial;
    if (!args.includes('--device') && !args.some((arg) => arg.startsWith('--device='))) {
      // Expo SDK 57 resolves --device by model name, not the ADB serial.
      const name = await getUsbDeviceName(serial, sdkHome);
      console.log(`Expo device: ${name}`);
      args.push('--device', name);
    }
    env.REACT_NATIVE_PACKAGER_HOSTNAME = '127.0.0.1';
    env.EXPO_PACKAGER_PROXY_URL = 'http://127.0.0.1:8081';
  }
    const restoreKey = preserveSigningKey();
    await runExpo(['prebuild', '--platform', 'android', '--no-install']);
    restoreKey();
    if (apkOnly) {
      await run('cmd.exe', ['/d', '/s', '/c', '.\\gradlew.bat app:assembleRelease --build-cache'], join(root, 'android'));
      const destination = exportApk(root, { apiUrl: env.EXPO_PUBLIC_API_URL, versionCode: releaseCode, version: app.version });
      writeFileSync(statePath, JSON.stringify({ versionCode: releaseCode }, null, 2) + '\n');
      console.log(`Downloadable APK: ${destination}`);
      console.log(`Checksum: ${destination}.sha256`);
    } else {
      await runExpo(['run:android', ...args]);
    }
  } finally {
    if (lock !== undefined) { closeSync(lock); unlinkSync(lockPath); }
  }
}

module.exports = build().catch((error) => { console.error(error.message); process.exitCode = 1; });
