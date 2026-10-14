/* global __dirname */
const { spawn } = require('node:child_process');
const { existsSync, readFileSync, readdirSync } = require('node:fs');
const { join, resolve } = require('node:path');
const { connectUsb, getUsbDeviceName } = require('./usb-windows.cjs');

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
const args = process.argv.slice(2).filter((arg) => arg !== '--usb');
if (usb) env.EXPO_PUBLIC_API_URL = 'http://127.0.0.1:3001';
const variantIndex = args.indexOf('--variant');
const variant = args.find((arg) => arg.startsWith('--variant='))?.split('=')[1]
  || (variantIndex >= 0 ? args[variantIndex + 1] : 'debug');
const release = !['debug', 'debugOptimized'].includes(variant);
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

function runExpo(command, next) {
  const child = spawn(process.execPath, [
    join(root, 'node_modules', 'expo', 'bin', 'cli'), ...command,
  ], { cwd: root, env, stdio: 'inherit' });
  child.once('error', (error) => {
    console.error(`Could not launch Expo (${error.code || 'unknown error'}).`);
    process.exitCode = 1;
  });
  child.once('exit', (code, signal) => {
    if (code === 0 && next) next();
    else process.exitCode = code ?? (signal === 'SIGINT' ? 0 : 1);
  });
}

// run:android skips prebuild when android/ already exists. Apply config plugins
// explicitly so a rebuilt APK cannot retain the old native HTTP policy.
async function build() {
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
  runExpo(['prebuild', '--platform', 'android', '--no-install'], () => {
    runExpo(['run:android', ...args]);
  });
}

build().catch((error) => { console.error(error.message); process.exitCode = 1; });
