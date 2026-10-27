const { withAppBuildGradle } = require('expo/config-plugins');

const snippet = `
// @hima/api-url-input: the public API origin affects embedded JavaScript.
tasks.withType(com.facebook.react.tasks.BundleHermesCTask).configureEach {
    inputs.property("himaApiUrl", System.getenv("EXPO_PUBLIC_API_URL") ?: "")
}
`;

module.exports = function withApiBundleInput(config) {
  return withAppBuildGradle(config, (mod) => {
    if (mod.modResults.language !== 'groovy') throw new Error('Hima expects the Expo Groovy Android build template.');
    if (!mod.modResults.contents.includes('// @hima/api-url-input:')) mod.modResults.contents += snippet;
    return mod;
  });
};
