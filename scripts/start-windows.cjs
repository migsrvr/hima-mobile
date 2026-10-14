/* global __dirname */
const { spawn } = require('node:child_process');
const { createServer, isIP } = require('node:net');
const { networkInterfaces } = require('node:os');
const { resolve } = require('node:path');

if (process.platform !== 'win32') {
  console.error('Run this launcher in native Windows PowerShell or CMD, not WSL.');
  console.error('From C:\\Users\\Miggy\\Documents\\Paiflow\\mobile: npm run start:windows -- <Windows-Wi-Fi-IPv4>');
  process.exit(1);
}

const host = process.argv[2];
const addresses = Object.entries(networkInterfaces()).flatMap(([name, entries]) =>
  (entries || []).filter((entry) => entry.family === 'IPv4' && !entry.internal)
    .map((entry) => ({ name, address: entry.address })));

if (isIP(host || '') !== 4 || !addresses.some((entry) => entry.address === host)) {
  console.error('Pass the IPv4 address of your Windows Wi-Fi adapter. Check ipconfig if it changed.');
  console.error('Usage: npm run start:windows -- 192.168.1.38');
  for (const entry of addresses) console.error(`  ${entry.name}: ${entry.address}`);
  process.exit(1);
}

for (const dependency of ['lightningcss', 'unrs-resolver']) {
  try {
    require(dependency);
  } catch {
    console.error(`The Windows native binary for ${dependency} is missing or cannot load.`);
    console.error('In this Windows terminal, run: npm install --include=optional');
    process.exit(1);
  }
}

// Do not silently switch ports: the QR URL and phone instructions use 8081.
const probe = createServer();
probe.once('error', (error) => {
  console.error(error.code === 'EADDRINUSE'
    ? 'Port 8081 is in use. Stop the existing Metro terminal with Ctrl+C, then retry.'
    : `Cannot listen on port 8081 (${error.code || 'unknown error'}).`);
  process.exitCode = 1;
});
probe.listen(8081, '0.0.0.0', () => probe.close(() => {
  const root = resolve(__dirname, '..');
  const apiUrl = `http://${host}:3001`;
  console.log(`Phone reachability check: http://${host}:8081/status`);
  console.log(`Hima AI backend: ${apiUrl}`);
  console.log('Install the Hima development APK on your phone, then scan the Metro QR code.');
  const child = spawn(process.execPath, [
    resolve(root, 'node_modules/expo/bin/cli'),
    'start', '--dev-client', '--lan', '--port', '8081', '--clear',
  ], {
    cwd: root,
    stdio: 'inherit',
    env: {
      ...process.env,
      REACT_NATIVE_PACKAGER_HOSTNAME: host,
      EXPO_PACKAGER_PROXY_URL: `http://${host}:8081`,
      EXPO_PUBLIC_API_URL: apiUrl,
    },
  });
  child.once('error', (error) => {
    console.error(`Could not launch Windows Expo (${error.code || 'unknown error'}).`);
    process.exitCode = 1;
  });
  child.once('exit', (code, signal) => { process.exitCode = code ?? (signal === 'SIGINT' ? 0 : 1); });
}));
