const { Buffer } = require('node:buffer');
const { createHash } = require('node:crypto');
const { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } = require('node:fs');
const { join, basename } = require('node:path');
const { inflateRawSync } = require('node:zlib');
const { isIP } = require('node:net');

function assertHostedApiUrl(value) {
  let url;
  try { url = new URL(value); } catch { /* Validate below. */ }
  if (!url || url.protocol !== 'https:' || url.username || url.password || url.search || url.hash
    || url.pathname !== '/' || isIP(url.hostname) || url.hostname === 'localhost'
    || !url.hostname.includes('.') || /\.(localhost|local|internal|test|invalid|example)$/i.test(url.hostname)
    || /(^|\.)example\.(com|net|org)$/i.test(url.hostname)
    || url.hostname === 'your-hima-api.onrender.com') {
    throw new Error('An APK-only build needs EXPO_PUBLIC_API_URL set to your real public HTTPS backend origin.');
  }
  return url.origin;
}

// APKs are ZIP archives. Inspect the packaged bundle rather than a potentially stale build file.
function zipEntry(archive, wanted) {
  let end = -1;
  for (let offset = archive.length - 22; offset >= Math.max(0, archive.length - 65557); offset--) {
    if (archive.readUInt32LE(offset) === 0x06054b50
      && offset + 22 + archive.readUInt16LE(offset + 20) === archive.length) { end = offset; break; }
  }
  if (end < 0) throw new Error('The build did not produce a readable APK ZIP archive.');
  let cursor = archive.readUInt32LE(end + 16);
  const entries = archive.readUInt16LE(end + 10);
  for (let i = 0; i < entries; i++) {
    if (archive.readUInt32LE(cursor) !== 0x02014b50) throw new Error('Invalid APK ZIP directory.');
    const length = archive.readUInt16LE(cursor + 28);
    const extra = archive.readUInt16LE(cursor + 30);
    const comment = archive.readUInt16LE(cursor + 32);
    const name = archive.toString('utf8', cursor + 46, cursor + 46 + length);
    if (name === wanted) {
      const method = archive.readUInt16LE(cursor + 10);
      const size = archive.readUInt32LE(cursor + 20);
      const local = archive.readUInt32LE(cursor + 42);
      if (archive.readUInt32LE(local) !== 0x04034b50) throw new Error('Invalid APK ZIP entry.');
      const start = local + 30 + archive.readUInt16LE(local + 26) + archive.readUInt16LE(local + 28);
      const data = archive.subarray(start, start + size);
      if (method === 0) return data;
      if (method === 8) return inflateRawSync(data);
      throw new Error('Unsupported APK compression method.');
    }
    cursor += 46 + length + extra + comment;
  }
  throw new Error(`APK is missing ${wanted}.`);
}

function checkBundle(archive, apiUrl, secretValues = []) {
  const bundle = zipEntry(archive, 'assets/index.android.bundle');
  if (!bundle.includes(Buffer.from(apiUrl))) throw new Error('The packaged bundle does not contain the selected HTTPS API URL.');
  for (const { name, value } of secretValues) {
    if (value.length >= 16 && bundle.includes(Buffer.from(value))) {
      throw new Error(`The APK bundle contains server-only configuration (${name}). Do not distribute it.`);
    }
  }
}

function serverSecrets(root) {
  const file = join(root, '..', 'server', '.env');
  const secrets = [];
  const collect = (name, value) => {
    if (/(?:SECRET|TOKEN|API_KEY|DATABASE_URL)/.test(name) && value) secrets.push({ name, value });
  };
  for (const [name, value] of Object.entries(process.env)) collect(name, value);
  if (existsSync(file)) {
    for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
      const match = line.match(/^\s*(?:export\s+)?([A-Z][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
      if (match) collect(match[1], match[2].replace(/^(['"])(.*)\1$/, '$2'));
    }
  }
  return secrets;
}

function exportApk(root, { apiUrl, versionCode, version }) {
  const source = join(root, 'android/app/build/outputs/apk/release/app-release.apk');
  const archive = readFileSync(source);
  checkBundle(archive, apiUrl, serverSecrets(root));
  const manifest = zipEntry(archive, 'AndroidManifest.xml');
  if (manifest.includes(Buffer.from('networkSecurityConfig'))
    || manifest.includes(Buffer.from('networkSecurityConfig', 'utf16le'))) {
    throw new Error('The hosted APK still references the local HTTP policy. Reapply HTTPS configuration before distributing.');
  }
  const metadata = JSON.parse(readFileSync(join(root, 'android/app/build/outputs/apk/release/output-metadata.json'), 'utf8'));
  if (metadata.elements?.[0]?.versionCode !== versionCode) throw new Error('APK version code does not match the selected release version.');
  const safeVersion = version.replace(/[^\w.-]/g, '_');
  const destination = join(root, 'dist', `hima-demo-v${safeVersion}-${versionCode}.apk`);
  mkdirSync(join(root, 'dist'), { recursive: true });
  copyFileSync(source, destination);
  const digest = createHash('sha256').update(archive).digest('hex');
  writeFileSync(`${destination}.sha256`, `${digest}  ${basename(destination)}\n`);
  writeFileSync(`${destination}.json`, JSON.stringify({ version, versionCode, apiUrl, sha256: digest }, null, 2) + '\n');
  return destination;
}

module.exports = { assertHostedApiUrl, zipEntry, checkBundle, exportApk, serverSecrets };
