/* global __dirname */
// npm run web:demo
// Builds the public web demo: a static export pointed at the hosted backend, with demo mode on
// (simulated tap, in-app PIN). Output: dist-web/, ready for `npx vercel deploy dist-web --prod`.
// Refuses local or HTTP backends and any bundle that contains server-only configuration.
const { spawnSync } = require('node:child_process');
const { readdirSync, readFileSync, rmSync, statSync, writeFileSync } = require('node:fs');
const { join, resolve } = require('node:path');
const { assertHostedApiUrl, serverSecrets } = require('./apk-artifact.cjs');

const root = resolve(__dirname, '..');
const out = join(root, 'dist-web');

let apiUrl;
try {
  apiUrl = assertHostedApiUrl(process.env.EXPO_PUBLIC_API_URL ?? '');
} catch {
  console.error('Set EXPO_PUBLIC_API_URL to your public HTTPS backend origin (for example your Render service).');
  process.exit(1);
}

const env = { ...process.env, EXPO_PUBLIC_API_URL: apiUrl, EXPO_PUBLIC_DEMO: '1', NODE_ENV: 'production' };
// Real testnet payments only: never ship the simulated processor.
delete env.EXPO_PUBLIC_PAYMENTS;

console.log(`Hima backend baked into the web demo: ${apiUrl}`);
rmSync(out, { recursive: true, force: true });
const result = spawnSync('npx expo export --platform web --output-dir dist-web --clear', { cwd: root, env, stdio: 'inherit', shell: true });
if (result.status !== 0) process.exit(result.status ?? 1);

const files = (dir) => readdirSync(dir).flatMap((name) => {
  const path = join(dir, name);
  return statSync(path).isDirectory() ? files(path) : [path];
});
const scripts = files(out).filter((path) => path.endsWith('.js'));
const bundle = scripts.map((path) => readFileSync(path, 'utf8')).join('\n');
if (!bundle.includes(apiUrl)) {
  console.error('The web bundle does not contain the selected backend URL. Nothing to deploy.');
  process.exit(1);
}
for (const { name, value } of serverSecrets(root)) {
  if (value.length >= 16 && bundle.includes(value)) {
    rmSync(out, { recursive: true, force: true });
    console.error(`The web bundle contained server-only configuration (${name}); the output was deleted.`);
    process.exit(1);
  }
}

// Single-page app: unknown paths (deep links like /home) load index.html; files are served first.
writeFileSync(join(out, 'vercel.json'), JSON.stringify({
  rewrites: [{ source: '/(.*)', destination: '/index.html' }],
  headers: [{ source: '/_expo/(.*)', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] }],
}, null, 2) + '\n');

console.log(`\nWeb demo ready in dist-web/ (${scripts.length} script files, backend ${apiUrl}).`);
console.log('Deploy:  npx vercel deploy dist-web --prod');
console.log('Then add the Vercel origin to CORS_ORIGINS on the backend.');
