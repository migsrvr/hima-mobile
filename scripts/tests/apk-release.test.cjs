/* global __dirname */
const { Buffer } = require('node:buffer');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');
const { deflateRawSync } = require('node:zlib');
const { assertHostedApiUrl, checkBundle, exportApk } = require('../apk-artifact.cjs');

function zip(files) {
  const locals = [], directory = [];
  let offset = 0;
  for (const [name, input] of Object.entries(files)) {
    const filename = Buffer.from(name), data = deflateRawSync(Buffer.from(input));
    const local = Buffer.alloc(30), central = Buffer.alloc(46);
    local.writeUInt32LE(0x04034b50); local.writeUInt16LE(8, 8);
    local.writeUInt32LE(data.length, 18); local.writeUInt16LE(filename.length, 26);
    central.writeUInt32LE(0x02014b50); central.writeUInt16LE(8, 10);
    central.writeUInt32LE(data.length, 20); central.writeUInt16LE(filename.length, 28);
    central.writeUInt32LE(offset, 42);
    locals.push(local, filename, data); directory.push(central, filename);
    offset += local.length + filename.length + data.length;
  }
  const centralData = Buffer.concat(directory), end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50); end.writeUInt16LE(directory.length / 2, 10);
  end.writeUInt32LE(centralData.length, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, centralData, end]);
}

test('hosted builds reject emulator, local, HTTP and placeholder URLs', () => {
  for (const url of ['http://10.0.2.2:3001', 'https://127.0.0.1:3001', 'https://localhost',
    'https://[::1]', 'https://api.internal', 'https://your-hima-api.onrender.com',
    'https://example.com', 'https://api.onrender.com/api', 'https://user:password@api.onrender.com']) {
    assert.throws(() => assertHostedApiUrl(url), /real public HTTPS/);
  }
  assert.equal(assertHostedApiUrl('https://hima-test.onrender.com/'), 'https://hima-test.onrender.com');
});

test('packaged bundle detects stale URLs and server-only secrets', () => {
  const url = 'https://hima-test.onrender.com';
  const archive = zip({ 'assets/index.android.bundle': `${url} server-secret-long-value` });
  checkBundle(archive, url);
  assert.throws(() => checkBundle(archive, 'https://another.onrender.com'), /selected HTTPS/);
  assert.throws(() => checkBundle(archive, url, [{ name: 'GROQ_API_KEY', value: 'server-secret-long-value' }]), /server-only/);
});

test('APK export produces checksum and rejects old HTTP policy and version mismatch', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hima-apk-export-'));
  const dir = path.join(root, 'android/app/build/outputs/apk/release');
  const apiUrl = 'https://hima-test.onrender.com';
  const write = (manifest) => {
    fs.writeFileSync(path.join(dir, 'app-release.apk'), zip({
      'assets/index.android.bundle': apiUrl, 'AndroidManifest.xml': manifest,
    }));
    fs.writeFileSync(path.join(dir, 'output-metadata.json'), JSON.stringify({ elements: [{ versionCode: 2 }] }));
  };
  try {
    fs.mkdirSync(dir, { recursive: true }); write('manifest');
    const artifact = exportApk(root, { apiUrl, versionCode: 2, version: '1.0.1' });
    assert.match(fs.readFileSync(`${artifact}.sha256`, 'utf8'), /^[a-f0-9]{64}  hima-demo-v1\.0\.1-2\.apk\n$/);
    assert.equal(JSON.parse(fs.readFileSync(`${artifact}.json`, 'utf8')).apiUrl, apiUrl);
    assert.throws(() => exportApk(root, { apiUrl, versionCode: 3, version: '1.0.1' }), /version code/);
    write(Buffer.from('networkSecurityConfig', 'utf16le'));
    assert.throws(() => exportApk(root, { apiUrl, versionCode: 2, version: '1.0.1' }), /HTTP policy/);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('APK-only builds preserve signing, increment versions and never connect ADB', async () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'hima-apk-build-'));
  const root = path.join(base, 'mobile'), sdk = path.join(base, 'sdk'), jdk = path.join(base, 'jdk');
  const touch = (file, value = '') => { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, value); };
  const apiUrl = 'https://hima-test.onrender.com';
  const source = fs.readFileSync(path.join(__dirname, '../android-windows.cjs'), 'utf8');
  let usbCalls = 0;
  try {
    touch(path.join(jdk, 'release'), 'JAVA_VERSION="17.0.20"'); touch(path.join(jdk, 'bin/java.exe'));
    for (const file of ['platforms/android-36/android.jar', 'build-tools/36.0.0/aapt2.exe',
      'platform-tools/adb.exe', 'cmdline-tools/latest/bin/sdkmanager.bat']) touch(path.join(sdk, file));
    touch(path.join(root, 'app.json'), JSON.stringify({ expo: { version: '1.0.1', android: { versionCode: 2 } } }));
    touch(path.join(root, 'android/app/debug.keystore'), 'original-signing-key');
    for (const expectedCode of [2, 3]) {
      const calls = [], module = { exports: {} };
      const processStub = { platform: 'win32', argv: ['node', 'script', '--apk-only', '--variant', 'release'],
        env: { HIMA_JAVA_HOME: jdk, HIMA_ANDROID_SDK: sdk, EXPO_PUBLIC_API_URL: apiUrl }, execPath: 'node',
        exit(code) { throw new Error(`Unexpected exit ${code}`); } };
      vm.runInNewContext(source, { module, process: processStub, __dirname: path.join(root, 'scripts'), URL,
        console: { log() {}, error(message) { throw new Error(message); } },
        require(name) {
          if (name === './usb-windows.cjs') return { connectUsb() { usbCalls++; }, getUsbDeviceName() { usbCalls++; } };
          if (name === './apk-artifact.cjs') return require('../apk-artifact.cjs');
          if (name === 'node:child_process') return { spawn(exe, args, options) {
            calls.push([exe, Array.from(args)]);
            const child = new EventEmitter();
            queueMicrotask(() => {
              if (args.includes('prebuild')) touch(path.join(root, 'android/app/debug.keystore'), 'regenerated-key');
              else {
                assert.equal(exe, 'cmd.exe'); assert.match(args.at(-1), /app:assembleRelease/);
                assert.equal(fs.readFileSync(path.join(root, 'android/app/debug.keystore'), 'utf8'), 'original-signing-key');
                assert.equal(options.env.HIMA_APK_VERSION_CODE, String(expectedCode));
                const dir = path.join(root, 'android/app/build/outputs/apk/release');
                touch(path.join(dir, 'output-metadata.json'), JSON.stringify({ elements: [{ versionCode: expectedCode }] }));
                touch(path.join(dir, 'app-release.apk'), zip({ 'assets/index.android.bundle': apiUrl, 'AndroidManifest.xml': 'manifest' }));
              }
              child.emit('exit', 0, null);
            });
            return child;
          } };
          return require(name);
        },
      });
      await module.exports;
      assert.equal(processStub.exitCode, undefined);
      assert.equal(calls.length, 2);
      assert.equal(JSON.parse(fs.readFileSync(path.join(root, '.release/version-code.json'), 'utf8')).versionCode, expectedCode);
      assert.equal(fs.existsSync(path.join(root, '.release/build.lock')), false);
    }
    assert.equal(usbCalls, 0);
  } finally { fs.rmSync(base, { recursive: true, force: true }); }
});

test('Gradle API cache input plugin remains idempotent', () => {
  let action;
  const module = { exports: {} };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../../plugins/withApiBundleInput.cjs'), 'utf8'), {
    module, require: () => ({ withAppBuildGradle: (config, callback) => { action = callback; return config; } }),
  });
  module.exports({});
  const config = { modResults: { language: 'groovy', contents: 'apply plugin: "com.facebook.react"\n' } };
  action(config); action(config);
  assert.equal(config.modResults.contents.match(/inputs\.property\("himaApiUrl"/g).length, 1);
});

test('local HTTP policy declares exact hostname matching and HTTPS removes its binding', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hima-http-policy-'));
  const source = fs.readFileSync(path.join(__dirname, '../../plugins/withLocalApi.cjs'), 'utf8');
  try {
    for (const apiUrl of ['http://127.0.0.1:3001', 'https://hima-test.onrender.com']) {
      let manifestAction, resourceAction;
      const module = { exports: {} };
      vm.runInNewContext(source, { module, process: { env: { EXPO_PUBLIC_API_URL: apiUrl } }, URL,
        require(name) {
          if (name !== 'expo/config-plugins') return require(name);
          return {
            AndroidConfig: { Manifest: { getMainApplicationOrThrow: (manifest) => manifest.application } },
            withAndroidManifest: (config, action) => { manifestAction = action; return config; },
            withDangerousMod: (config, [, action]) => { resourceAction = action; return config; },
          };
        },
      });
      module.exports({});
      const application = { $: { 'android:networkSecurityConfig': '@xml/hima_api_network_security' } };
      manifestAction({ modResults: { application } });
      if (apiUrl.startsWith('http:')) {
        await resourceAction({ modRequest: { platformProjectRoot: root } });
        const xml = fs.readFileSync(path.join(root, 'app/src/main/res/xml/hima_api_network_security.xml'), 'utf8');
        assert.match(xml, /<domain includeSubdomains="false">127\.0\.0\.1<\/domain>/);
        assert.match(xml, /base-config cleartextTrafficPermitted="false"/);
      } else {
        assert.equal(application.$['android:networkSecurityConfig'], undefined);
        assert.equal(resourceAction, undefined);
      }
    }
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
