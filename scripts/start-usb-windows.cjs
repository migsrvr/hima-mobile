/* global __dirname */
const { spawn } = require('node:child_process');
const { resolve } = require('node:path');
const { connectUsb, checkBackend } = require('./usb-windows.cjs');

if (process.platform !== 'win32') {
  console.error('Run npm.cmd run start:usb:windows in Windows PowerShell, not WSL.');
  process.exit(1);
}

async function start() {
  const serial = await connectUsb();
  await checkBackend();
  const root = resolve(__dirname, '..');
  const child = spawn(process.execPath, [
    resolve(root, 'node_modules/expo/bin/cli'),
    'start', '--dev-client', '--localhost', '--port', '8081', '--clear',
  ], {
    cwd: root,
    stdio: 'inherit',
    env: {
      ...process.env,
      ANDROID_SERIAL: serial,
      EXPO_PUBLIC_API_URL: 'http://127.0.0.1:3001',
      REACT_NATIVE_PACKAGER_HOSTNAME: '127.0.0.1',
      EXPO_PACKAGER_PROXY_URL: 'http://127.0.0.1:8081',
    },
  });
  child.once('error', (error) => {
    console.error(`Could not launch Metro (${error.code || 'unknown error'}).`);
    process.exitCode = 1;
  });
  child.once('exit', (code, signal) => { process.exitCode = code ?? (signal === 'SIGINT' ? 0 : 1); });
}

start().catch((error) => { console.error(error.message); process.exitCode = 1; });
