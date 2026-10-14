const { execFile } = require('node:child_process');
const { existsSync } = require('node:fs');
const { join } = require('node:path');
const { promisify } = require('node:util');

const execute = promisify(execFile);

function adbPath(sdkHome) {
  const sdk = sdkHome || process.env.HIMA_ANDROID_SDK || process.env.ANDROID_HOME
    || join(process.env.LOCALAPPDATA || '', 'Android', 'Sdk');
  const adb = join(sdk, 'platform-tools', 'adb.exe');
  if (!existsSync(adb)) throw new Error('Android Platform-Tools not found. Set HIMA_ANDROID_SDK to your Android SDK folder.');
  return adb;
}

async function getUsbDeviceName(serial, sdkHome) {
  const { stdout } = await execute(adbPath(sdkHome), ['devices', '-l'], { timeout: 15000 });
  const devices = stdout.split(/\r?\n/).map((line) => line.trim().split(/\s+/))
    .filter((parts) => parts[1] === 'device');
  const nameFor = (parts) => parts.find((part) => part.startsWith('model:'))?.slice(6) || `Device ${parts[0]}`;
  const device = devices.find((parts) => parts[0] === serial);
  if (!device) throw new Error('The USB phone disconnected before Expo device selection. Reconnect and retry.');
  const name = nameFor(device);
  if (devices.filter((parts) => nameFor(parts) === name).length > 1) {
    throw new Error(`Expo sees multiple devices named ${name}. Disconnect the other matching device and retry.`);
  }
  return name;
}

async function connectUsb(sdkHome) {
  const adb = adbPath(sdkHome);
  const run = async (args) => (await execute(adb, args, { timeout: 15000 })).stdout.trim();
  // -d selects a USB transport, even when emulators or wireless ADB are also present.
  // Windows devices -l does not consistently include the Linux-style usb: field.
  let serial;
  try {
    if (await run(['-d', 'get-state']) !== 'device') throw new Error('Phone is not ready.');
    serial = await run(['-d', 'get-serialno']);
  } catch {
    throw new Error('USB phone is not ready. Connect exactly one USB phone with a data cable, enable USB debugging, and accept the prompt on the unlocked phone.');
  }
  for (const port of [3001, 8081]) {
    await run(['-s', serial, 'reverse', `tcp:${port}`, `tcp:${port}`]);
  }
  console.log(`USB phone: ${serial}`);
  console.log('USB forwarding ready: phone localhost:3001 → PC backend; localhost:8081 → Metro.');
  console.log('Phone browser check: http://127.0.0.1:3001/health');
  return serial;
}

async function checkBackend() {
  try {
    const response = await fetch('http://127.0.0.1:3001/health', { signal: AbortSignal.timeout(5000) });
    const health = await response.json();
    if (!response.ok || health.status !== 'ok') throw new Error('Unexpected health response.');
    console.log('Hima backend is reachable from Windows on port 3001.');
  } catch {
    throw new Error('Hima backend is not ready on PC localhost:3001. In a Windows terminal in server/, run npm.cmd run build then npm.cmd start.');
  }
}

module.exports = { connectUsb, checkBackend, getUsbDeviceName };

if (require.main === module) {
  if (process.platform !== 'win32') {
    console.error('Run npm.cmd run usb:windows in Windows PowerShell, not WSL.');
    process.exit(1);
  }
  connectUsb().then(checkBackend).catch((error) => { console.error(error.message); process.exitCode = 1; });
}
