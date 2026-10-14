const { mkdir, writeFile } = require('node:fs/promises');
const { join } = require('node:path');
const { AndroidConfig, withAndroidManifest, withDangerousMod } = require('expo/config-plugins');

// The embedded JS and native HTTP policy must use the same build-time API URL.
// Keep cleartext restricted to the selected demo backend; HTTPS remains allowed.
module.exports = function withLocalApi(config) {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;
  const url = apiUrl ? new URL(apiUrl) : null;
  if (url && (!['http:', 'https:'].includes(url.protocol) || url.username || url.password)) {
    throw new Error('EXPO_PUBLIC_API_URL must be an HTTP(S) URL without credentials.');
  }
  const resource = 'hima_api_network_security';
  config = withAndroidManifest(config, (mod) => {
    const application = AndroidConfig.Manifest.getMainApplicationOrThrow(mod.modResults);
    if (url?.protocol === 'http:') {
      application.$['android:networkSecurityConfig'] = `@xml/${resource}`;
    } else if (application.$['android:networkSecurityConfig'] === `@xml/${resource}`) {
      delete application.$['android:networkSecurityConfig'];
    }
    return mod;
  });
  if (url?.protocol !== 'http:') return config;
  return withDangerousMod(config, ['android', async (mod) => {
    const directory = join(mod.modRequest.platformProjectRoot, 'app/src/main/res/xml');
    const host = url.hostname.replace(/[<>&"']/g, (character) => ({
      '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;',
    })[character]);
    await mkdir(directory, { recursive: true });
    await writeFile(join(directory, `${resource}.xml`), `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
  <base-config cleartextTrafficPermitted="false" />
  <domain-config cleartextTrafficPermitted="true">
    <domain includeSubdomains="false">${host}</domain>
  </domain-config>
</network-security-config>
`);
    return mod;
  }]);
};
